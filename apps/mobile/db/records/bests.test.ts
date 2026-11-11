import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateHistory } from '@/db/historyCache';
import { fakeDb, freshDb, raw } from '@/db/testDb';

// db/records/bests.ts on an in-memory sql.js database, as in appState.test.ts.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

const { getExerciseBests, getExerciseBestsFor, getRecordsGymFor } = await import('./bests');

// A cable exercise (records per gym) and a barbell one (records everywhere).
function workout(id: string, day: string, weightLp: number, gymId: string | null = null) {
  raw.run('INSERT INTO workouts (id, title, start_time, gym_id) VALUES (?, ?, ?, ?)', [id, 'W', `${day}T12:00:00`, gymId]);
  raw.run("INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES (?, ?, 'lp', 0), (?, ?, 'bp', 1)", [`${id}l`, id, `${id}b`, id]);
  raw.run("INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES (?, ?, 0, 'normal', ?, 10), (?, ?, 0, 'normal', ?, 5)", [
    `${id}ls`, `${id}l`, weightLp, `${id}bs`, `${id}b`, weightLp + 20,
  ]);
}

function gyms(...changes: [string, string][]) {
  raw.run("INSERT INTO gyms (id, name) VALUES ('A', 'Gym A'), ('B', 'Gym B')");
  for (const [day, gym] of changes) raw.run('INSERT INTO gym_changes (id, day, gym_id) VALUES (?, ?, ?)', [`c${day}`, day, gym]);
  invalidateHistory();
}

const on = (m: number, d: number) => new Date(2026, m - 1, d, 12);

beforeEach(async () => {
  await freshDb();
  raw.run("INSERT INTO exercises (id, name, type, equipment) VALUES ('lp', 'Leg Press', 'weight_reps', 'cable'), ('bp', 'Bench', 'weight_reps', 'barbell')");
  invalidateHistory();
});

describe('bests per gym', () => {
  it('no gym change: bests are the same as before (all sets)', async () => {
    workout('w1', '2026-10-01', 100);
    workout('w2', '2026-10-08', 120);
    const bests = await getExerciseBestsFor(['lp', 'bp'], on(11, 5));
    expect(bests.get('lp')?.weightKg).toBe(120);
    expect(bests.get('bp')?.weightKg).toBe(140);
    expect((await getExerciseBests('lp'))?.weightKg).toBe(120);
  });

  it('after a change: a cable exercise has no bests at the new gym (null = no medal on the first workout)', async () => {
    workout('w1', '2026-10-01', 100);
    gyms(['2026-10-30', 'A']);
    expect(await getExerciseBests('lp', on(11, 5))).toBeNull();
    expect((await getExerciseBests('lp', on(10, 20)))?.weightKg).toBe(100); // still before the change
  });

  it('after a change: barbell bests still include the old gym', async () => {
    workout('w1', '2026-10-01', 100);
    gyms(['2026-10-30', 'A']);
    expect((await getExerciseBests('bp', on(11, 5)))?.weightKg).toBe(120);
  });

  it('going back to gym A: bests come from every A stretch and A visits', async () => {
    gyms(['2026-10-01', 'A'], ['2026-10-30', 'B'], ['2026-11-10', 'A']);
    workout('w1', '2026-10-05', 80); // at A
    workout('w2', '2026-11-01', 90); // at B
    workout('w3', '2026-11-02', 85, 'A'); // a visit to A while at B
    expect((await getExerciseBests('lp', on(11, 12)))?.weightKg).toBe(85);
    expect((await getExerciseBests('lp', on(11, 5)))?.weightKg).toBe(90); // at B: the visit doesn't count
  });

  it('getRecordsGymFor: empty map without changes; cable → gym name; barbell absent', async () => {
    workout('w1', '2026-10-01', 100);
    expect((await getRecordsGymFor(['lp', 'bp'], on(11, 5))).size).toBe(0);
    gyms(['2026-10-30', 'A']);
    expect([...(await getRecordsGymFor(['lp', 'bp'], on(11, 5)))]).toEqual([['lp', 'Gym A']]);
  });
});
