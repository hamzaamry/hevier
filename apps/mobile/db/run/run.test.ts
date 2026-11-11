import { beforeEach, describe, expect, it, vi } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { runMigrations } from '@/db/migrations';

// getCheckIn, saveCheckIn and saveRunFeedback on an in-memory sql.js database, as in appState.test.ts.
let raw: Database;

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
vi.mock('expo-crypto', () => ({ randomUUID: () => 'new-id' }));

const { getCheckIn, saveCheckIn } = await import('./checkIns');
const { saveRunFeedback } = await import('./feedback');
const { logRun } = await import('./logRun');
const { getRunSettings, isRunOn, saveRunSettings } = await import('./settings');

beforeEach(async () => {
  const SQL = await initSqlJs();
  raw = new SQL.Database();
  await runMigrations(fakeDb as never);
});

describe('check-ins', () => {
  it('reads null when there is none', async () => {
    expect(await getCheckIn('2026-11-10')).toBeNull();
  });

  it('keeps one per day: saving again replaces it', async () => {
    const first = { date: '2026-11-10', feel: 'fresh', sleepHours: 7.5, legsSore: false, pain: false, sick: false } as const;
    await saveCheckIn(first, new Date(2026, 10, 10, 6, 20));
    expect(await getCheckIn('2026-11-10')).toEqual(first);
    await saveCheckIn({ ...first, feel: 'drained', sleepHours: null, legsSore: true }, new Date(2026, 10, 10, 6, 25));
    expect(await getCheckIn('2026-11-10')).toEqual({ ...first, feel: 'drained', sleepHours: null, legsSore: true });
    expect(rows('SELECT date FROM run_checkins')).toHaveLength(1);
    expect(await getCheckIn('2026-11-11')).toBeNull();
  });
});

describe('run settings', () => {
  it('start unchosen, at 06:30, and keep what was changed', async () => {
    expect(await getRunSettings()).toEqual({ enabled: null, slotMinutes: 390, disclaimerSeen: false });
    await saveRunSettings({ enabled: false, slotMinutes: 420, disclaimerSeen: true });
    expect(await getRunSettings()).toEqual({ enabled: false, slotMinutes: 420, disclaimerSeen: true });
  });

  it('are off for someone who never ran, on once a run is logged, and the choice wins', async () => {
    expect(await isRunOn()).toBe(false);
    await logRun({ startMs: Date.now(), seconds: 1800, km: null, rpe: null, verdictShown: 'easy' });
    expect(await isRunOn()).toBe(true);
    await saveRunSettings({ enabled: false, slotMinutes: 390, disclaimerSeen: false });
    expect(await isRunOn()).toBe(false);
    await saveRunSettings({ enabled: true, slotMinutes: 390, disclaimerSeen: false });
    expect(await isRunOn()).toBe(true);
  });

  it('a lifter’s sets do not turn it on', async () => {
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'Legs', '2026-11-09T20:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', 'sq', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s', 'we', 0, 'normal', 100, 5);
    `);
    expect(await isRunOn()).toBe(false);
  });
});

describe('logRun', () => {
  it('saves a finished workout with one Run set and the verdict shown', async () => {
    const start = new Date(2026, 10, 10, 6, 2).getTime();
    await logRun({ startMs: start, seconds: 1920, km: 5.2, rpe: 3, verdictShown: 'easy' });
    expect(rows('SELECT title, start_time, end_time FROM workouts')).toEqual([
      { title: 'Run', start_time: new Date(start).toISOString(), end_time: new Date(start + 1920_000).toISOString() },
    ]);
    expect(
      rows(`SELECT e.name, s.distance_km, s.duration_seconds, s.rpe FROM sets s
            JOIN workout_exercises we ON we.id = s.workout_exercise_id JOIN exercises e ON e.id = we.exercise_id`)
    ).toEqual([{ name: 'Run', distance_km: 5.2, duration_seconds: 1920, rpe: 3 }]);
    expect(rows('SELECT verdict_shown, legs_felt FROM run_feedback')).toEqual([{ verdict_shown: 'easy', legs_felt: null }]);
  });
});

describe('run feedback', () => {
  it('keeps the verdict shown and how the legs felt, one row per run', async () => {
    raw.exec("INSERT INTO workouts (id, title, start_time) VALUES ('w', 'Run', '2026-11-10T06:30:00Z')");
    await saveRunFeedback('w', 'easy', null);
    await saveRunFeedback('w', 'easy', 'heavy');
    expect(rows('SELECT workout_id, verdict_shown, legs_felt FROM run_feedback')).toEqual([
      { workout_id: 'w', verdict_shown: 'easy', legs_felt: 'heavy' },
    ]);
  });
});
