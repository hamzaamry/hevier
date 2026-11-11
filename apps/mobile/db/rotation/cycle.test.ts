import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// cycle.ts on an in-memory sql.js database, as in workoutEdit.test.ts.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));

const { getCycle, getRotation, saveRotation, skipCycle } = await import('./cycle');

beforeEach(async () => {
  await freshDb();
  raw.exec(`
    INSERT INTO routines (id, name, folder_id, position) VALUES
      ('ua', 'UPPER A', NULL, 0), ('la', 'LOWER A', NULL, 1), ('ub', 'UPPER B', NULL, 2), ('fb', 'Football', NULL, 3);
  `);
});

function workout(id: string, title: string, day: string) {
  raw.run('INSERT INTO workouts (id, title, start_time) VALUES (?, ?, ?)', [id, title, `${day}T18:00:00.000Z`]);
}

describe('training cycle', () => {
  it('is off until saved, and an empty save turns it off', async () => {
    expect(await getCycle()).toBeNull();
    await saveRotation(['ua', 'la']);
    expect(await getRotation()).toEqual(['ua', 'la']);
    await saveRotation([]);
    expect(await getRotation()).toEqual([]);
    expect(rows('SELECT * FROM app_state')).toEqual([]);
  });

  it('follows the newest cycle workout and ignores the others', async () => {
    await saveRotation(['ua', 'la', 'ub']);
    expect(await getCycle()).toMatchObject({ next: 0, last: null });
    workout('w1', 'UPPER A', '2026-10-01');
    workout('w2', 'LOWER A', '2026-10-03');
    workout('w3', 'Football', '2026-10-05');
    expect(await getCycle()).toMatchObject({
      next: 2,
      last: { title: 'LOWER A', startTime: '2026-10-03T18:00:00.000Z' },
    });
    workout('w4', 'UPPER B', '2026-10-08');
    expect((await getCycle())?.next).toBe(0);
  });

  it("lists the next routine's exercises in order", async () => {
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps'), ('lc', 'Leg Curl', 'weight_reps');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES ('r2', 'ua', 'lc', 1), ('r1', 'ua', 'sq', 0);
    `);
    await saveRotation(['ua', 'la']);
    expect((await getCycle())?.nextExercises).toEqual(['Squat', 'Leg Curl']);
  });

  it('drops routines deleted since', async () => {
    await saveRotation(['ua', 'gone', 'la']);
    workout('w1', 'UPPER A', '2026-10-01');
    expect(await getCycle()).toMatchObject({
      routines: [
        { id: 'ua', name: 'UPPER A' },
        { id: 'la', name: 'LOWER A' },
      ],
      next: 1,
    });
    await saveRotation(['gone']);
    expect(await getCycle()).toBeNull();
  });

  it('skip moves next along until the next cycle workout is saved', async () => {
    await saveRotation(['ua', 'la', 'ub']);
    workout('w1', 'UPPER A', '2026-10-01');
    await skipCycle((await getCycle())!);
    expect((await getCycle())?.next).toBe(2);
    await skipCycle((await getCycle())!);
    expect((await getCycle())?.next).toBe(0); // wraps around
    workout('w2', 'Football', '2026-10-02'); // not in the cycle: skip still holds
    expect((await getCycle())?.next).toBe(0);
    workout('w3', 'LOWER A', '2026-10-03'); // a cycle workout: back to the normal order
    expect((await getCycle())?.next).toBe(2);
    await saveRotation([]);
    expect(rows('SELECT * FROM app_state')).toEqual([]);
  });
});
