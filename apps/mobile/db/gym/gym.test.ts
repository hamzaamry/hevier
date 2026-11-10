import { beforeEach, describe, expect, it, vi } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { runMigrations } from '@/db/migrations';

// db/gym/gym.ts on an in-memory sql.js database, as in appState.test.ts.
let raw: Database;
let nextId = 0;

function rows<T>(sqlText: string, params: unknown[] = []): T[] {
  const stmt = raw.prepare(sqlText);
  stmt.bind(params as never);
  const out: T[] = [];
  while (stmt.step()) out.push(stmt.getAsObject() as T);
  stmt.free();
  return out;
}

const fakeDb = {
  async execAsync(sqlText: string) {
    raw.exec(sqlText);
  },
  async runAsync(sqlText: string, params: unknown[] = []) {
    raw.run(sqlText, params as never);
  },
  async getAllAsync<T>(sqlText: string, params: unknown[] = []) {
    return rows<T>(sqlText, params);
  },
  async getFirstAsync<T>(sqlText: string, params: unknown[] = []) {
    return rows<T>(sqlText, params)[0] ?? null;
  },
  async withTransactionAsync(fn: () => Promise<void>) {
    await fn();
  },
};

vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));

const { addGymChange, deleteGymChange, getGymTimeline, namePreviousGym } = await import('./gym');
const { FROM_START_DAY } = await import('@/constants/gym');

beforeEach(async () => {
  const SQL = await initSqlJs();
  raw = new SQL.Database();
  nextId = 0;
  await runMigrations(fakeDb as never);
});

describe('gym tables', () => {
  it('migration 15 creates gyms, gym_changes (day UNIQUE) and workouts.gym_id', async () => {
    const tables = rows<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'").map((r) => r.name);
    expect(tables).toContain('gyms');
    expect(tables).toContain('gym_changes');
    expect(rows<{ name: string }>('PRAGMA table_info(workouts)').map((r) => r.name)).toContain('gym_id');
    raw.run("INSERT INTO gyms (id, name) VALUES ('g', 'A')");
    raw.run("INSERT INTO gym_changes (id, day, gym_id) VALUES ('c1', '2026-10-30', 'g')");
    expect(() => raw.run("INSERT INTO gym_changes (id, day, gym_id) VALUES ('c2', '2026-10-30', 'g')")).toThrow();
  });

  it('addGymChange creates the gym and the change', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'Basic-Fit Nation' });
    const t = await getGymTimeline();
    expect([...t.gyms.values()].map((g) => g.name)).toEqual(['Basic-Fit Nation']);
    expect(t.changes).toEqual([{ id: expect.any(String), day: '2026-10-30', gymId: [...t.gyms.keys()][0] }]);
  });

  it('addGymChange reuses a gym with the same name ignoring case and spaces', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'Basic-Fit Nation' });
    await addGymChange('2026-11-05', { gymId: null, name: 'Other' });
    await addGymChange('2026-11-08', { gymId: null, name: ' basic-fit nation ' });
    const t = await getGymTimeline();
    expect(t.gyms.size).toBe(2);
    expect(t.changes).toHaveLength(3);
    expect(t.changes[2].gymId).toBe(t.changes[0].gymId);
  });

  it('addGymChange on a day that already has one replaces its gym', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'A' });
    await addGymChange('2026-10-30', { gymId: null, name: 'B' });
    const t = await getGymTimeline();
    expect(t.changes).toHaveLength(1);
    expect(t.gyms.get(t.changes[0].gymId)?.name).toBe('B');
  });

  it('addGymChange is a no-op when that gym is already in effect', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'A' });
    const gymId = (await getGymTimeline()).changes[0].gymId;
    await addGymChange('2026-11-05', { gymId, name: 'A' });
    expect((await getGymTimeline()).changes).toHaveLength(1);
  });

  it('deleteGymChange removes the gym when nothing uses it, keeps it when a visit uses it', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'A' });
    await addGymChange('2026-11-05', { gymId: null, name: 'B' });
    let t = await getGymTimeline();
    const [a, b] = t.changes;
    raw.run("INSERT INTO workouts (id, title, start_time, gym_id) VALUES ('w', 'x', '2026-11-06T10:00:00Z', ?)", [b.gymId]);
    await deleteGymChange(a.id);
    t = await getGymTimeline();
    expect([...t.gyms.values()].map((g) => g.name)).toEqual(['B']);
    await deleteGymChange(b.id);
    t = await getGymTimeline();
    expect(t.changes).toEqual([]);
    expect([...t.gyms.values()].map((g) => g.name)).toEqual(['B']); // the visit still uses B
  });

  it('namePreviousGym inserts a change at FROM_START_DAY', async () => {
    await addGymChange('2026-10-30', { gymId: null, name: 'New' });
    await namePreviousGym('Old gym');
    const t = await getGymTimeline();
    expect(t.changes.map((c) => c.day)).toEqual([FROM_START_DAY, '2026-10-30']);
    expect(t.gyms.get(t.changes[0].gymId)?.name).toBe('Old gym');
  });
});
