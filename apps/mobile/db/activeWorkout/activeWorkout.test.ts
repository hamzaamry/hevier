import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// Same in-memory database setup as db/routines/routines.test.ts.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
let nextId = 0;
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));

const { backdatedStart, currentExerciseName, elapsedSeconds, pauseTimer, resumeTimer, setDuration, setStartTime, workoutStats } = await import('@/lib/workout/activeWorkout');
const { clearActiveWorkout, loadActiveWorkout, saveActiveWorkout } = await import('@/db/activeWorkout/draft');
const { finishWorkout } = await import('@/db/workouts/write');
const { newActiveExercise, startWorkout } = await import('@/db/activeWorkout/start');

beforeEach(async () => {
  await freshDb({ realTransactions: true });
  raw.exec(`
    INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps'), ('warm', 'Warm Up', 'duration');
    INSERT INTO routines (id, name) VALUES ('a', 'LOWER A');
    INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index, rest_seconds) VALUES
      ('r0', 'a', 'warm', 0, NULL), ('r1', 'a', 'squat', 1, 165);
    INSERT INTO routine_sets (id, routine_exercise_id, set_index, duration_seconds) VALUES ('p0', 'r0', 0, 383);
    INSERT INTO routine_sets (id, routine_exercise_id, set_index, weight_kg, reps) VALUES ('p1', 'r1', 0, 100, 10), ('p2', 'r1', 1, 120, 6);
  `);
});

describe('active workout', () => {
  it('starts from a routine with its planned sets filled in, none done, Warm Up at 00:00', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    expect(w.title).toBe('LOWER A');
    expect(w.routineId).toBe('a');
    expect(w.exercises.map((e) => [e.name, e.restSeconds, e.sets.map((s) => [s.weight, s.reps, s.time, s.done])])).toEqual([
      ['Warm Up', null, [['', '', '', false]]],
      ['Squat', 165, [['100', '10', '', false], ['120', '6', '', false]]],
    ]);
  });

  it('Copy Workout: starts from a saved workout, its sets filled in, none done', async () => {
    raw.exec(`
      INSERT INTO workouts (id, title, start_time, end_time) VALUES ('w', 'LOWER B', '2026-10-13T17:44:00Z', '2026-10-13T18:28:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, notes) VALUES ('we', 'w', 'squat', 0, 'Seat 4');
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('s1', 'we', 0, 'normal', 120, 10), ('s2', 'we', 1, 'failure', 120, 9);
    `);
    const w = await startWorkout({ copyOf: 'w' }, new Date('2026-10-18T18:00:00Z'));
    expect(w.title).toBe('LOWER B');
    expect(w.routineId).toBeNull();
    expect(w.startTime).toBe('2026-10-18T18:00:00.000Z');
    expect(w.exercises.map((e) => [e.name, e.notes, e.sets.map((s) => [s.setType, s.weight, s.reps, s.done])])).toEqual([
      ['Squat', 'Seat 4', [['normal', '120', '10', false], ['failure', '120', '9', false]]],
    ]);
  });

  it('starts an empty workout', async () => {
    const w = await startWorkout(null, new Date('2026-10-14T18:00:00Z'));
    expect(w.title).toBe('Workout');
    expect(w.exercises).toEqual([]);
  });

  it('reads the bests again when the draft is loaded, so an older draft does not keep outdated ones', async () => {
    raw.exec(`
      INSERT INTO workouts (id, title, start_time) VALUES ('w1', 'LOWER A', '2026-10-01T18:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s1', 'we1', 0, 'normal', 100, 10);
    `);
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].bests = { ...w.exercises[1].bests!, weightKg: 150 };
    await saveActiveWorkout(w);
    expect((await loadActiveWorkout())!.exercises[1].bests?.weightKg).toBe(100);
  });

  it('survives leaving the screen: saved and loaded back', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    await saveActiveWorkout(w);
    expect(await loadActiveWorkout()).toEqual(w);
    await clearActiveWorkout();
    expect(await loadActiveWorkout()).toBeNull();
  });

  it('a set marked failure after answering reps left saves no reps left', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    Object.assign(w.exercises[1].sets[0], { done: true, rir: 2, setType: 'failure' });
    const id = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'));
    expect(rows('SELECT s.set_type, s.rpe FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = ?', [id])).toEqual([
      { set_type: 'failure', rpe: null },
    ]);
  });

  it('finishWorkout stores gym_id for a visit and null otherwise', async () => {
    raw.exec("INSERT INTO gyms (id, name) VALUES ('g', 'Gym G')");
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    Object.assign(w.exercises[1].sets[0], { done: true });
    const normal = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'));
    const visit = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'), { gymId: 'g', name: 'Gym G' });
    expect(rows<{ gym_id: string | null }>('SELECT id, gym_id FROM workouts WHERE id IN (?, ?) ORDER BY gym_id', [normal, visit]).map((r) => r.gym_id)).toEqual([null, 'g']);
  });

  it('a visit to a new gym creates the gym in the same save', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    Object.assign(w.exercises[1].sets[0], { done: true });
    const id = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'), { gymId: null, name: 'Gym New' });
    const [saved] = rows<{ name: string }>('SELECT g.name FROM workouts w JOIN gyms g ON g.id = w.gym_id WHERE w.id = ?', [id]);
    expect(saved?.name).toBe('Gym New');
  });

  it('a failed save leaves no new gym behind', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    Object.assign(w.exercises[1].sets[0], { done: true });
    w.exercises[1].exerciseId = 'missing';
    raw.exec('PRAGMA foreign_keys = ON');
    await expect(finishWorkout(w, new Date('2026-10-14T19:00:00Z'), { gymId: null, name: 'Gym Lost' })).rejects.toThrow();
    raw.exec('PRAGMA foreign_keys = OFF');
    expect(rows('SELECT id FROM gyms WHERE name = ?', ['Gym Lost'])).toEqual([]);
  });

  it('saves how hard a football game was in rpe, nothing when not picked', async () => {
    const w = await startWorkout(null, new Date('2026-10-14T18:00:00Z'));
    const football = { id: 'football', name: 'Football', type: 'duration' as const, catalogueId: null };
    w.exercises = [await newActiveExercise(football, w.startTime), await newActiveExercise(football, w.startTime)];
    expect(w.exercises[0].restSeconds).toBe(0); // rest timer OFF after a game
    Object.assign(w.exercises[0].sets[0], { done: true, time: '90:00', rating: 'hard' });
    Object.assign(w.exercises[1].sets[0], { done: true, time: '30:00' });
    const id = await finishWorkout(w, new Date('2026-10-14T19:40:00Z'));
    expect(rows('SELECT s.duration_seconds, s.rpe FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id WHERE we.workout_id = ? ORDER BY we.order_index', [id])).toEqual([
      { duration_seconds: 5400, rpe: 8 },
      { duration_seconds: 1800, rpe: null },
    ]);
  });

  it('the Football routine starts with its rest timer OFF', async () => {
    raw.exec(`
      INSERT INTO routines (id, name) VALUES ('f', 'Football');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index, rest_seconds) VALUES ('rf', 'f', 'football', 0, NULL);
      INSERT INTO routine_sets (id, routine_exercise_id, set_index, duration_seconds) VALUES ('pf', 'rf', 0, 5400);
    `);
    const w = await startWorkout('f', new Date('2026-10-14T18:00:00Z'));
    expect(w.exercises[0].restSeconds).toBe(0);
    expect(w.exercises[0].sets[0].time).toBe('90:00');
    // Other exercises keep "use the default".
    expect((await startWorkout('a')).exercises[0].restSeconds).toBeNull();
  });

  it('a past day from the calendar: 6 PM that day, a fixed hour, saved on that day', async () => {
    const now = new Date(2026, 9, 19, 23, 0);
    const w = await startWorkout('a', now, new Date(2026, 9, 15));
    expect(new Date(w.startTime)).toEqual(new Date(2026, 9, 15, 18, 0));
    expect(w.backdated).toBe(true);
    // The clock stands still, however late it gets.
    expect(elapsedSeconds(w, now.getTime())).toBe(3600);
    expect(elapsedSeconds(w, now.getTime() + 86_400_000)).toBe(3600);
    // A longer duration keeps the start and moves the end.
    const longer = setDuration(w, 5400, now.getTime());
    w.exercises[1].sets[0].done = true;
    const id = await finishWorkout({ ...w, ...longer }, now);
    expect(rows('SELECT start_time, end_time FROM workouts WHERE id = ?', [id])).toEqual([
      { start_time: new Date(2026, 9, 15, 18, 0).toISOString(), end_time: new Date(2026, 9, 15, 19, 30).toISOString() },
    ]);
  });

  it('moving a past day\'s start keeps its length', async () => {
    const now = new Date(2026, 9, 19, 23, 0);
    const w = await startWorkout(null, now, new Date(2026, 9, 15));
    const moved = setStartTime(w, new Date(2026, 9, 14, 10, 0).getTime(), now.getTime());
    expect(new Date(moved.startTime)).toEqual(new Date(2026, 9, 14, 10, 0));
    expect(elapsedSeconds(moved, now.getTime())).toBe(3600);
    // Moved to just now, it ends now, not later.
    const late = setStartTime(w, now.getTime(), now.getTime());
    expect(late.pausedAt).toBe(now.getTime());
  });

  it('a past day\'s Football routine lasts as long as the game', async () => {
    raw.exec(`
      INSERT INTO routines (id, name) VALUES ('f', 'Football');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index, rest_seconds) VALUES ('rf', 'f', 'football', 0, NULL);
      INSERT INTO routine_sets (id, routine_exercise_id, set_index, duration_seconds) VALUES ('pf', 'rf', 0, 5400);
    `);
    const now = new Date(2026, 9, 19, 23, 0);
    const w = await startWorkout('f', now, new Date(2026, 9, 15));
    expect(new Date(w.startTime)).toEqual(new Date(2026, 9, 15, 18, 0));
    expect(elapsedSeconds(w, now.getTime())).toBe(5400);
  });

  it('today before 6 PM: started an hour ago, so it never ends in the future', () => {
    const now = new Date(2026, 9, 19, 9, 30);
    expect(new Date(backdatedStart(new Date(2026, 9, 19), now))).toEqual(new Date(2026, 9, 19, 8, 30));
  });

  it('saves the title and description written on the Save Workout page', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    Object.assign(w, { title: '  Leg day  ', description: '  Felt strong. ' });
    const id = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'));
    expect(rows('SELECT title, description FROM workouts WHERE id = ?', [id])).toEqual([
      { title: 'Leg day', description: 'Felt strong.' },
    ]);
  });

  it('keeps the photos and videos added on the Save Workout page, in order', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    w.media = [
      { file: 'a.jpg', kind: 'photo' },
      { file: 'b.mp4', kind: 'video' },
    ];
    const id = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'));
    expect(rows('SELECT file, kind, position FROM workout_media WHERE workout_id = ? ORDER BY position', [id])).toEqual([
      { file: 'a.jpg', kind: 'photo', position: 0 },
      { file: 'b.mp4', kind: 'video', position: 1 },
    ]);
  });

  it('counts only completed sets', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    expect(workoutStats(w)).toEqual({ volumeKg: 1000, sets: 1 });
  });

  it('finishing keeps only completed sets and clears the draft', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    w.exercises[1].sets[0].reps = '11';
    w.exercises[1].sets[0].rir = 1; // reps left: saved as RPE 9
    await saveActiveWorkout(w);
    const id = await finishWorkout(w, new Date('2026-10-14T19:02:00Z'));
    expect(rows('SELECT title, start_time, end_time FROM workouts WHERE id = ?', [id])).toEqual([
      { title: 'LOWER A', start_time: '2026-10-14T18:00:00.000Z', end_time: '2026-10-14T19:02:00.000Z' },
    ]);
    expect(rows('SELECT e.name, s.set_index, s.weight_kg, s.reps, s.rpe FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id JOIN exercises e ON e.id = we.exercise_id')).toEqual([
      { name: 'Squat', set_index: 0, weight_kg: 100, reps: 11, rpe: 9 },
    ]);
    expect(await loadActiveWorkout()).toBeNull();
  });

  it('names the exercise to do next in the workout pill', async () => {
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    expect(currentExerciseName(w)).toBe('Warm Up');
    w.exercises[0].sets[0].done = true;
    expect(currentExerciseName(w)).toBe('Squat');
    w.exercises[1].sets.forEach((x) => (x.done = true));
    expect(currentExerciseName(w)).toBe('Squat');
  });

  it('stops the Duration while paused and leaves the paused time out', async () => {
    const t = (min: number) => Date.parse('2026-10-14T18:00:00Z') + min * 60_000;
    let w = await startWorkout(null, new Date(t(0)));
    expect(elapsedSeconds(w, t(10))).toBe(600);
    w = pauseTimer(w, t(10));
    expect(elapsedSeconds(w, t(25))).toBe(600);
    w = resumeTimer(w, t(25));
    expect(elapsedSeconds(w, t(30))).toBe(900);
    expect(w.startTime).toBe('2026-10-14T18:00:00.000Z');
  });

  it('editing the Duration moves the start time, and the other way round', async () => {
    const now = Date.parse('2026-10-14T23:08:00Z');
    let w = await startWorkout(null, new Date('2026-10-14T23:08:00Z'));
    w = setDuration(w, 7 * 60, now);
    expect(w.startTime).toBe('2026-10-14T23:01:00.000Z');
    expect(elapsedSeconds(w, now + 6_000)).toBe(426);
    w = setStartTime(w, Date.parse('2026-10-14T23:02:00Z'), now);
    expect(elapsedSeconds(w, now + 6_000)).toBe(366);
  });

  it('never starts in the future, and edits fold in earlier pauses', async () => {
    const now = Date.parse('2026-10-14T23:00:00Z');
    let w = await startWorkout(null, new Date('2026-10-14T22:00:00Z'));
    w = pauseTimer(w, now - 30 * 60_000);
    w = resumeTimer(w, now - 20 * 60_000);
    w = setStartTime(w, now + 5 * 60_000, now);
    expect(elapsedSeconds(w, now)).toBe(0);
    w = setDuration(w, 45 * 60, now);
    expect(elapsedSeconds(w, now)).toBe(45 * 60);
  });

  it('finishing saves the duration without the paused time', async () => {
    let w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    w.exercises[1].sets[0].done = true;
    w = pauseTimer(w, Date.parse('2026-10-14T18:40:00Z'));
    w = resumeTimer(w, Date.parse('2026-10-14T18:50:00Z'));
    const id = await finishWorkout(w, new Date('2026-10-14T19:00:00Z'));
    expect(rows('SELECT end_time FROM workouts WHERE id = ?', [id])).toEqual([{ end_time: '2026-10-14T18:50:00.000Z' }]);
  });

  it('starts with each exercise\'s bests from the history, for the PR medals', async () => {
    raw.exec(`
      INSERT INTO workouts (id, title, start_time) VALUES ('w1', 'LOWER A', '2026-10-01T18:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('s1', 'we1', 0, 'normal', 100, 10), ('s2', 'we1', 1, 'normal', 120, 3);
    `);
    const w = await startWorkout('a', new Date('2026-10-14T18:00:00Z'));
    expect(w.exercises[0].bests).toBeNull();
    expect(w.exercises[1].bests).toMatchObject({ weightKg: 120, volumeKg: 1000, reps: 10 });
    expect(w.exercises[1].bests?.oneRmKg).toBeCloseTo(133.33, 2);
  });

  it('an exercise picked from the list comes with its history and empty sets', async () => {
    raw.exec(`
      INSERT INTO workouts (id, title, start_time) VALUES ('w1', 'LOWER A', '2026-10-01T18:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s1', 'we1', 0, 'normal', 100, 10);
    `);
    const e = await newActiveExercise({ id: 'squat', name: 'Squat', type: 'weight_reps', catalogueId: null }, '2026-10-14T18:00:00Z', 2);
    expect(e).toMatchObject({ name: 'Squat', notes: '', restSeconds: null });
    expect(e.previous).toEqual([{ setType: 'normal', weightKg: 100, reps: 10, distanceKm: null, durationSeconds: null }]);
    expect(e.sets.map((x) => [x.weight, x.done])).toEqual([['', false], ['', false]]);
    expect(e.bests?.weightKg).toBe(100);
  });

  it('loads the picker list with how often and when each exercise was done', async () => {
    raw.exec(`
      UPDATE exercises SET target_muscle = 'quads', body_part = 'upper legs', equipment = 'leverage machine' WHERE id = 'squat';
      INSERT INTO workouts (id, title, start_time) VALUES ('w1', 'A', '2026-10-01T18:00:00Z'), ('w2', 'B', '2026-10-08T18:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0), ('we2', 'w2', 'squat', 0);
    `);
    const { getPickerExercises } = await import('@/db/exercisePicker/pickerExercises');
    // Football and Run come with every database (migrations 006, 016).
    expect(await getPickerExercises()).toEqual([
      { id: 'football', name: 'Football', type: 'duration', catalogueId: null, muscle: 'Cardio', equipment: 'None', timesDone: 0, lastDone: null },
      { id: 'run', name: 'Run', type: 'distance_duration', catalogueId: null, muscle: 'Cardio', equipment: 'None', timesDone: 0, lastDone: null },
      { id: 'squat', name: 'Squat', type: 'weight_reps', catalogueId: null, muscle: 'Quadriceps', equipment: 'Machine', timesDone: 2, lastDone: '2026-10-08T18:00:00Z' },
      { id: 'warm', name: 'Warm Up', type: 'duration', catalogueId: null, muscle: 'Other', equipment: 'Other', timesDone: 0, lastDone: null },
    ]);
  });
});
