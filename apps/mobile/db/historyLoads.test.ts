import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetType } from '@/types/workout';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// The one-query loads against the queries they replaced, on a random history,
// and the shared history cache dropped by every write. Same in-memory database
// setup as routines.test.ts.
vi.mock('./client', () => ({ getDb: async () => fakeDb }));
let nextId = 0;
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));

const { getExerciseHistory } = await import('@/db/exerciseStats/history');
const { getPreviousSets, getPreviousSetsFor } = await import('@/db/history/previousSets');
const { getRoutineForEdit } = await import('@/db/routines/editor');
const { duplicateRoutine } = await import('@/db/routines/write');
const { getExerciseBests, getExerciseBestsFor } = await import('@/db/records/bests');
const { getWorkoutCards, getWorkoutCard } = await import('@/db/feed/cards');
const { deleteWorkout } = await import('@/db/workouts/delete');
const { getProfile } = await import('@/db/profile/profile');
const { getProfileNames, saveProfileNames } = await import('@/db/profile/names');
const { getProfilePhoto, saveProfilePhoto } = await import('@/db/profile/photo');
const { getStatSets } = await import('@/db/stats/statSets');
const { finishWorkout } = await import('@/db/workouts/write');
const { newSet } = await import('@/lib/workout/activeWorkout');
const { saveWorkoutEdit, getWorkoutForEdit } = await import('@/db/workouts/edit');
const { invalidateHistory } = await import('./historyCache');

const EXERCISES = ['squat', 'bench', 'pull', 'curl'];

// A history with ties on purpose: workouts at the same time, an exercise twice
// in one workout, exercises without sets.
function seed(n: number) {
  let s = n;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  raw.exec(EXERCISES.map((e) => `INSERT INTO exercises (id, name, type) VALUES ('${e}', '${e}', 'weight_reps');`).join('\n'));
  for (let w = 0; w < 40; w++) {
    const day = 1 + Math.floor(rnd() * 25);
    raw.run('INSERT INTO workouts (id, title, start_time, end_time) VALUES (?, ?, ?, ?)', [
      `w${w}`,
      rnd() < 0.5 ? 'LOWER A' : 'UPPER A',
      `2026-09-${String(day).padStart(2, '0')}T18:00:00.000Z`,
      `2026-09-${String(day).padStart(2, '0')}T19:00:00.000Z`,
    ]);
    const count = Math.floor(rnd() * 4);
    for (let k = 0; k < count; k++) {
      const we = `w${w}e${k}`;
      raw.run('INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES (?, ?, ?, ?)', [
        we,
        `w${w}`,
        EXERCISES[Math.floor(rnd() * EXERCISES.length)],
        k,
      ]);
      const sets = Math.floor(rnd() * 4);
      for (let i = 0; i < sets; i++) {
        raw.run(
          'INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps, rpe) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [`${we}s${i}`, we, i, 'normal', Math.floor(rnd() * 5) * 20, Math.floor(rnd() * 12), rnd() < 0.3 ? 8 : null]
        );
      }
    }
  }
}

// --- The replaced implementations, as they were ---------------------------

async function oldExerciseHistory(exerciseId: string) {
  const weRows = rows<{ id: string; workout_id: string }>('SELECT id, workout_id FROM workout_exercises WHERE exercise_id = ?', [
    exerciseId,
  ]);
  const results = [];
  for (const we of weRows) {
    const w = rows<{ id: string; title: string; start_time: string; end_time: string | null; description: string | null; gym_id: string | null }>(
      'SELECT id, title, start_time, end_time, description, gym_id FROM workouts WHERE id = ?',
      [we.workout_id]
    )[0];
    if (!w) continue;
    const setRows = rows<{
      id: string; workout_exercise_id: string; set_index: number; set_type: SetType; weight_kg: number | null;
      reps: number | null; distance_km: number | null; duration_seconds: number | null; rpe: number | null;
    }>('SELECT * FROM sets WHERE workout_exercise_id = ? ORDER BY set_index', [we.id]);
    results.push({
      workout: { id: w.id, title: w.title, startTime: w.start_time, endTime: w.end_time, description: w.description },
      gymId: w.gym_id,
      sets: setRows.map((s) => ({
        id: s.id, workoutExerciseId: s.workout_exercise_id, setIndex: s.set_index, setType: s.set_type,
        weightKg: s.weight_kg, reps: s.reps, distanceKm: s.distance_km, durationSeconds: s.duration_seconds, rpe: s.rpe,
      })),
    });
  }
  results.sort((a, b) => a.workout.startTime.localeCompare(b.workout.startTime));
  return results;
}

function oldPreviousSets(exerciseId: string) {
  return rows<{ set_type: SetType; weight_kg: number | null; reps: number | null; distance_km: number | null; duration_seconds: number | null }>(
    `SELECT s.set_type, s.weight_kg, s.reps, s.distance_km, s.duration_seconds
     FROM sets s
     WHERE s.workout_exercise_id = (
       SELECT we.id FROM workout_exercises we JOIN workouts w ON w.id = we.workout_id
       WHERE we.exercise_id = ? ORDER BY w.start_time DESC, we.order_index DESC LIMIT 1)
     ORDER BY s.set_index`,
    [exerciseId]
  ).map((s) => ({
    setType: s.set_type,
    weightKg: s.weight_kg,
    reps: s.reps,
    distanceKm: s.distance_km,
    durationSeconds: s.duration_seconds,
  }));
}

beforeEach(async () => {
  await freshDb();
  invalidateHistory(); // a new database each test
});

describe('one-query loads give what the per-row queries gave', () => {
  it('exercise history, previous sets and bests', async () => {
    for (let n = 1; n <= 15; n++) {
      await freshDb();
      seed(n);
      const previous = await getPreviousSetsFor([...EXERCISES, 'football']);
      const bests = await getExerciseBestsFor(EXERCISES);
      for (const e of [...EXERCISES, 'football']) {
        expect(await getExerciseHistory(e), `seed ${n} ${e}`).toEqual(await oldExerciseHistory(e));
        expect(previous.get(e) ?? [], `seed ${n} ${e}`).toEqual(oldPreviousSets(e));
        expect(await getPreviousSets(e)).toEqual(oldPreviousSets(e));
        expect(bests.get(e) ?? null).toEqual(await getExerciseBests(e));
      }
    }
  });

  it('the routine editor gets every exercise\'s previous sets, an exercise in twice included', async () => {
    seed(3);
    raw.exec(`
      INSERT INTO routines (id, name, folder_id, position) VALUES ('r', 'LOWER A', NULL, 0);
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES
        ('r1', 'r', 'squat', 0), ('r2', 'r', 'bench', 1), ('r3', 'r', 'squat', 2), ('r4', 'r', 'football', 3);
    `);
    const r = await getRoutineForEdit('r');
    expect(r!.exercises.map((e) => e.previous)).toEqual(['squat', 'bench', 'squat', 'football'].map(oldPreviousSets));
    expect(r!.exercises[0].previous).not.toBe(r!.exercises[2].previous);
  });
});

describe('Duplicate Routine', () => {
  it('keeps each exercise\'s notes', async () => {
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps');
      INSERT INTO routines (id, name, folder_id, position) VALUES ('r', 'LOWER A', NULL, 0);
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index, notes) VALUES ('r1', 'r', 'squat', 0, 'seat 4');
    `);
    const copy = await duplicateRoutine('r');
    expect((await getRoutineForEdit(copy.id))!.exercises.map((e) => e.notes)).toEqual(['seat 4']);
  });
});

describe('warm-up sets', () => {
  it('a heavy warm-up is neither a stored best nor a record on the workout card', async () => {
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time, end_time) VALUES
        ('w1', 'LOWER A', '2026-10-01T18:00:00.000Z', '2026-10-01T19:00:00.000Z'),
        ('w2', 'LOWER A', '2026-10-08T18:00:00.000Z', '2026-10-08T19:00:00.000Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0), ('we2', 'w2', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('s1', 'we1', 0, 'normal', 100, 10),
        ('s2', 'we2', 0, 'warmup', 140, 3),
        ('s3', 'we2', 1, 'normal', 105, 10);
    `);

    expect((await getExerciseBests('squat'))?.weightKg).toBe(105);
    const w2 = (await getWorkoutCards()).find((c) => c.id === 'w2')!;
    expect(w2.exercises[0].sets.map((x) => x.record)).toEqual([false, true]);
    expect(w2.prs?.find((p) => p.kind === 'weight')?.value).toBe(105);
  });
});

describe('the shared history', () => {
  beforeEach(() => {
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time, end_time) VALUES ('w1', 'LOWER A', '2026-10-01T18:00:00.000Z', '2026-10-01T19:00:00.000Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s1', 'we1', 0, 'normal', 100, 10);
    `);
  });

  it('is loaded once for every screen', async () => {
    const [a, b] = await Promise.all([getWorkoutCards(), getWorkoutCards()]);
    expect(a).toBe(b);
    expect(await getStatSets()).toBe(await getStatSets());
    expect(await getProfile()).toBe(await getProfile());
    expect((await getStatSets())[0].startMs).toBe(Date.parse('2026-10-01T18:00:00.000Z'));
  });

  it('a finished workout shows everywhere', async () => {
    await Promise.all([getWorkoutCards(), getProfile(), getStatSets()]);
    const set = newSet({ weight: '110', reps: '8', done: true });
    const id = await finishWorkout(
      {
        title: 'LOWER B',
        routineId: null,
        startTime: '2026-10-08T18:00:00.000Z',
        exercises: [
          { key: 'k', exerciseId: 'squat', catalogueId: null, name: 'Squat', type: 'weight_reps', notes: '', restSeconds: null, previous: [], sets: [set] },
        ],
        restEndsAt: null,
        restTotal: null,
      },
      new Date('2026-10-08T19:00:00.000Z')
    );
    expect((await getWorkoutCards()).map((c) => c.id)).toEqual([id, 'w1']);
    expect((await getProfile()).sessions).toHaveLength(2);
    expect((await getStatSets()).map((s) => s.weightKg)).toEqual([100, 110]);
    expect((await getWorkoutCard(id))?.title).toBe('LOWER B');
  });

  it('an edited workout and a deleted one too', async () => {
    await getWorkoutCards();
    const w = (await getWorkoutForEdit('w1'))!;
    await saveWorkoutEdit({ ...w, title: 'Renamed', exercises: w.exercises.map((e) => ({ ...e, sets: [...e.sets, e.sets[0]] })) });
    expect((await getWorkoutCards())[0].title).toBe('Renamed');
    expect(await getStatSets()).toHaveLength(2);
    await deleteWorkout('w1');
    expect(await getWorkoutCards()).toEqual([]);
    expect(await getStatSets()).toEqual([]);
    expect((await getProfile()).sessions).toEqual([]);
  });

  it('new names', async () => {
    expect((await getProfile()).name).toBe('Athlete');
    await saveProfileNames('Sam', 'sam1');
    expect(await getProfile()).toMatchObject({ name: 'Sam', username: 'sam1' });
    expect(await getProfileNames()).toEqual({ name: 'Sam', username: 'sam1' });
  });

  it('profile photo: saved, replaced, removed', async () => {
    expect(await getProfilePhoto()).toBeNull();
    await saveProfilePhoto('a.jpg');
    await saveProfilePhoto('b.jpg');
    expect(await getProfilePhoto()).toBe('b.jpg');
    await saveProfilePhoto(null);
    expect(await getProfilePhoto()).toBeNull();
  });
});
