import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// The routine code talks to expo-sqlite through getDb(); here the same calls run on
// an in-memory sql.js database.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
let nextId = 0;
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));

const { createFolder, deleteFolder, getRoutineOverview, moveRoutine, renameFolder, reorderFolders } = await import('@/db/routines/folders');
const { deleteRoutine, duplicateRoutine, saveRoutine } = await import('@/db/routines/write');
const { getRoutineForEdit } = await import('@/db/routines/editor');
const { getRoutinePage } = await import('@/db/routines/page');
const { movedOverview } = await import('@/lib/workout/routineOverview');

beforeEach(async () => {
  await freshDb();
  raw.exec(`
    INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps'), ('curl', 'Leg Curl', 'weight_reps');
    INSERT INTO routine_folders (id, name, position) VALUES ('f1', 'My routine', 0);
    INSERT INTO routines (id, name, folder_id, position) VALUES
      ('a', 'LOWER A', 'f1', 0), ('b', 'UPPER A', 'f1', 1), ('c', 'LOWER B', 'f1', 2), ('u', 'Loose', NULL, 0);
    INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES
      ('ra1', 'a', 'squat', 0), ('ra2', 'a', 'curl', 1);
    UPDATE routine_exercises SET rest_seconds = 165 WHERE id = 'ra1';
    INSERT INTO routine_sets (id, routine_exercise_id, set_index, weight_kg, reps) VALUES
      ('s1', 'ra1', 0, 100, 10), ('s2', 'ra1', 1, 120, 6), ('s3', 'ra2', 0, 40, 12);
  `);
});

describe('duplicateRoutine', () => {
  it('puts the copy right under the original, in the same folder', async () => {
    await duplicateRoutine('a');
    const { folders, unfiled } = await getRoutineOverview();
    expect(folders[0].routines.map((r) => r.name)).toEqual(['LOWER A', 'LOWER A (Copy)', 'UPPER A', 'LOWER B']);
    expect(unfiled.map((r) => r.name)).toEqual(['Loose']);
  });

  it('copies the exercises in order without touching the original', async () => {
    const copy = await duplicateRoutine('a');
    const { folders } = await getRoutineOverview();
    const byId = new Map(folders[0].routines.map((r) => [r.id, r]));
    expect(byId.get(copy.id)?.exerciseNames).toEqual(['Squat', 'Leg Curl']);
    expect(byId.get('a')?.exerciseNames).toEqual(['Squat', 'Leg Curl']);
    expect(rows('SELECT id FROM routine_exercises')).toHaveLength(4);
  });

  it('copies the planned sets and rest timers', async () => {
    const copy = await duplicateRoutine('a');
    const sets = rows<{ weight_kg: number; reps: number; rest_seconds: number | null }>(
      `SELECT rs.weight_kg, rs.reps, re.rest_seconds FROM routine_sets rs
       JOIN routine_exercises re ON re.id = rs.routine_exercise_id
       WHERE re.routine_id = ? ORDER BY re.order_index, rs.set_index`,
      [copy.id]
    );
    expect(sets).toEqual([
      { weight_kg: 100, reps: 10, rest_seconds: 165 },
      { weight_kg: 120, reps: 6, rest_seconds: 165 },
      { weight_kg: 40, reps: 12, rest_seconds: null },
    ]);
  });

  it('works for a routine outside any folder', async () => {
    await duplicateRoutine('u');
    const { unfiled } = await getRoutineOverview();
    expect(unfiled.map((r) => r.name)).toEqual(['Loose', 'Loose (Copy)']);
  });
});

describe('deleteRoutine', () => {
  it('removes its exercises and planned sets', async () => {
    await deleteRoutine('a');
    expect(rows('SELECT id FROM routine_exercises')).toEqual([]);
    expect(rows('SELECT id FROM routine_sets')).toEqual([]);
  });
});

describe('folders', () => {
  it('creates a new folder above the existing ones', async () => {
    await createFolder('Push');
    const { folders } = await getRoutineOverview();
    expect(folders.map((f) => f.name)).toEqual(['Push', 'My routine']);
    expect(folders[0].routines).toEqual([]);
  });

  it('renames a folder', async () => {
    await renameFolder('f1', 'Legs');
    const { folders } = await getRoutineOverview();
    expect(folders.map((f) => f.name)).toEqual(['Legs']);
  });

  it('deleting a folder moves its routines, in order, to the end of My Routines', async () => {
    await deleteFolder('f1');
    const { folders, unfiled } = await getRoutineOverview();
    expect(folders).toEqual([]);
    expect(unfiled.map((r) => r.name)).toEqual(['Loose', 'LOWER A', 'UPPER A', 'LOWER B']);
  });

  it('saves a new folder order', async () => {
    const push = await createFolder('Push');
    const pull = await createFolder('Pull');
    await reorderFolders(['f1', push.id, pull.id]);
    const { folders } = await getRoutineOverview();
    expect(folders.map((f) => f.name)).toEqual(['My routine', 'Push', 'Pull']);
  });

  it('shows a dropped routine in its new place the same way it is saved', async () => {
    const test = await createFolder('Test');
    const before = await getRoutineOverview();
    const shown = movedOverview(before, 'b', test.id, 0);
    await moveRoutine('b', test.id, 0);
    expect(shown).toEqual(await getRoutineOverview());
    const last = movedOverview(shown, 'a', 'f1', 99);
    await moveRoutine('a', 'f1', 99);
    expect(last).toEqual(await getRoutineOverview());
  });

  it('moves a routine to another folder at the spot it was dropped, and within one', async () => {
    const test = await createFolder('Test');
    await moveRoutine('b', test.id, 0);
    let o = await getRoutineOverview();
    expect(o.folders.find((f) => f.id === 'f1')!.routines.map((r) => r.name)).toEqual(['LOWER A', 'LOWER B']);
    expect(o.folders.find((f) => f.id === test.id)!.routines.map((r) => r.name)).toEqual(['UPPER A']);
    // Into My Routines, before "Loose"; then back up within it.
    await moveRoutine('a', null, 0);
    o = await getRoutineOverview();
    expect(o.unfiled.map((r) => r.name)).toEqual(['LOWER A', 'Loose']);
    await moveRoutine('a', null, 5); // past the end: last
    o = await getRoutineOverview();
    expect(o.unfiled.map((r) => r.name)).toEqual(['Loose', 'LOWER A']);
  });
});

describe('getRoutinePage', () => {
  it('lists exercises with rest timers and planned sets, plus past sessions with that title', async () => {
    raw.exec(`
      INSERT INTO workouts (id, title, start_time, end_time) VALUES
        ('w2', 'LOWER A', '2026-10-06T18:56:00.000Z', '2026-10-06T19:58:00.000Z'),
        ('w1', 'LOWER A', '2026-09-23T20:10:00.000Z', '2026-09-23T21:00:00.000Z'),
        ('wx', 'UPPER A', '2026-10-01T10:00:00.000Z', '2026-10-01T11:00:00.000Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0), ('we2', 'w2', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('x1', 'we1', 0, 'normal', 100, 8), ('x2', 'we2', 0, 'normal', 100, 10), ('x3', 'we2', 1, 'normal', 120, 6);
    `);
    const page = await getRoutinePage('a');
    expect(page?.name).toBe('LOWER A');
    expect(page?.exercises.map((e) => [e.name, e.restSeconds, e.sets.map((x) => [x.weightKg, x.reps])])).toEqual([
      ['Squat', 165, [[100, 10], [120, 6]]],
      ['Leg Curl', null, [[40, 12]]],
    ]);
    expect(page?.sessions).toEqual([
      { startTime: '2026-09-23T20:10:00.000Z', volumeKg: 800, reps: 8, durationSeconds: 3000 },
      { startTime: '2026-10-06T18:56:00.000Z', volumeKg: 1720, reps: 16, durationSeconds: 3720 },
    ]);
  });

  it('returns null for a routine that no longer exists', async () => {
    expect(await getRoutinePage('nope')).toBeNull();
  });
});

describe('routine editor', () => {
  beforeEach(() => {
    raw.exec(`
      UPDATE routine_exercises SET notes = 'seat 4' WHERE id = 'ra1';
      INSERT INTO workouts (id, title, start_time) VALUES ('w1', 'Old', '2026-09-01T10:00:00.000Z'), ('w2', 'Newer', '2026-10-01T10:00:00.000Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'w1', 'squat', 0), ('we2', 'w2', 'squat', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('o1', 'we1', 0, 'normal', 90, 5), ('n1', 'we2', 0, 'normal', 120, 10), ('n2', 'we2', 1, 'normal', 120, 9);
    `);
  });

  it('loads a routine with notes, rest timers, planned sets and the last time each exercise was done', async () => {
    const r = await getRoutineForEdit('a');
    expect(r?.name).toBe('LOWER A');
    expect(r?.exercises.map((e) => [e.name, e.notes, e.restSeconds, e.sets.length])).toEqual([
      ['Squat', 'seat 4', 165, 2],
      ['Leg Curl', null, null, 1],
    ]);
    expect(r?.exercises[0].previous.map((s) => [s.weightKg, s.reps])).toEqual([
      [120, 10],
      [120, 9],
    ]);
    expect(r?.exercises[1].previous).toEqual([]);
  });

  it('saves edits: name, order, sets, notes and rest timer, replacing what was there', async () => {
    await saveRoutine({
      id: 'a',
      name: 'Legs',
      exercises: [
        { exerciseId: 'curl', notes: null, restSeconds: 90, sets: [{ setType: 'failure', weightKg: 45, reps: 10, distanceKm: null, durationSeconds: null }] },
        { exerciseId: 'squat', notes: 'deep', restSeconds: null, sets: [] },
      ],
    });
    const page = await getRoutinePage('a');
    expect(page?.name).toBe('Legs');
    expect(page?.exercises.map((e) => [e.name, e.restSeconds, e.sets.map((s) => [s.setType, s.weightKg, s.reps])])).toEqual([
      ['Leg Curl', 90, [['failure', 45, 10]]],
      ['Squat', null, []],
    ]);
    expect(rows('SELECT id FROM routine_sets')).toHaveLength(1);
    const { folders } = await getRoutineOverview();
    expect(folders[0].routines.map((r) => r.name)).toEqual(['Legs', 'UPPER A', 'LOWER B']);
  });

  it('creates a new routine at the end of the chosen folder', async () => {
    const id = await saveRoutine({ id: null, folderId: 'f1', name: 'Arms', exercises: [] });
    const { folders } = await getRoutineOverview();
    expect(folders[0].routines.map((r) => [r.id === id, r.name]).at(-1)).toEqual([true, 'Arms']);
  });
});
