import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// edit.ts on an in-memory sql.js database, as in routines.test.ts.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
let nextId = 0;
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));

const { getWorkoutForEdit, saveWorkoutEdit } = await import('./edit');

beforeEach(async () => {
  await freshDb();
  raw.exec(`
    INSERT INTO exercises (id, name, type) VALUES ('squat', 'Squat', 'weight_reps'), ('warm', 'Warm Up', 'duration');
    INSERT INTO workouts (id, title, start_time, end_time, description) VALUES
      ('w1', 'LOWER B', '2026-10-13T17:44:00.000Z', '2026-10-13T18:28:00.000Z', NULL),
      ('w2', 'LOWER A', '2026-10-06T17:00:00.000Z', '2026-10-06T18:00:00.000Z', NULL);
    INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, notes) VALUES
      ('we1', 'w1', 'warm', 0, NULL), ('we2', 'w1', 'squat', 1, 'Seat 4'), ('we3', 'w2', 'squat', 0, NULL);
    INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe) VALUES
      ('s1', 'we1', 0, 'normal', NULL, NULL, NULL, 252, NULL),
      ('s2', 'we2', 0, 'normal', 120, 10, NULL, NULL, NULL),
      ('s3', 'we2', 1, 'failure', 120, 9, NULL, NULL, 10),
      ('s4', 'we3', 0, 'normal', 100, 10, NULL, NULL, NULL);
  `);
});

describe('workout editing', () => {
  it('loads a workout with its exercises, notes and sets in order', async () => {
    const w = await getWorkoutForEdit('w1');
    expect(w).toMatchObject({ title: 'LOWER B', startTime: '2026-10-13T17:44:00.000Z' });
    expect(w!.exercises.map((e) => [e.name, e.notes, e.sets.length])).toEqual([
      ['Warm Up', null, 1],
      ['Squat', 'Seat 4', 2],
    ]);
    expect(w!.exercises[1].sets[1]).toEqual({ setType: 'failure', weightKg: 120, reps: 9, distanceKm: null, durationSeconds: null, rpe: 10 });
    expect(await getWorkoutForEdit('nope')).toBeNull();
  });

  it('saves over the workout and leaves the others alone', async () => {
    await saveWorkoutEdit({
      id: 'w1',
      title: 'LOWER B (fixed)',
      description: 'Felt strong',
      startTime: '2026-10-13T17:30:00.000Z',
      endTime: '2026-10-13T18:30:00.000Z',
      exercises: [{ exerciseId: 'squat', notes: null, supersetId: null, sets: [{ setType: 'normal', weightKg: 125, reps: 8, distanceKm: null, durationSeconds: null, rpe: 8 }] }],
    });
    const w = await getWorkoutForEdit('w1');
    expect(w).toMatchObject({ title: 'LOWER B (fixed)', description: 'Felt strong', endTime: '2026-10-13T18:30:00.000Z' });
    expect(w!.exercises.map((e) => [e.name, e.sets.map((s) => [s.weightKg, s.reps, s.rpe])])).toEqual([['Squat', [[125, 8, 8]]]]); // reps left kept
    // No orphans left behind, and the other workout is untouched.
    expect(rows<{ n: number }>("SELECT COUNT(*) AS n FROM workout_exercises WHERE workout_id = 'w1'")[0].n).toBe(1);
    expect(rows<{ n: number }>('SELECT COUNT(*) AS n FROM sets')[0].n).toBe(2);
    expect((await getWorkoutForEdit('w2'))!.exercises[0].sets[0].weightKg).toBe(100);
  });

  it('replaces the media in order and returns the files no longer used; no media in the draft leaves them', async () => {
    raw.exec(`INSERT INTO workout_media (id, workout_id, file, kind, position) VALUES
      ('m1', 'w1', 'a.jpg', 'photo', 0), ('m2', 'w1', 'b.mp4', 'video', 1), ('m3', 'w2', 'z.jpg', 'photo', 0)`);
    const draft = {
      id: 'w1',
      title: 'LOWER B',
      description: null,
      startTime: '2026-10-13T17:44:00.000Z',
      endTime: '2026-10-13T18:28:00.000Z',
      exercises: [],
    };
    const files = (id: string) => rows<{ file: string }>(`SELECT file FROM workout_media WHERE workout_id = '${id}' ORDER BY position`).map((r) => r.file);

    expect(await saveWorkoutEdit(draft)).toEqual([]);
    expect(files('w1')).toEqual(['a.jpg', 'b.mp4']);

    const unused = await saveWorkoutEdit({ ...draft, media: [{ file: 'new.jpg', kind: 'photo' }, { file: 'b.mp4', kind: 'video' }] });
    expect(unused).toEqual(['a.jpg']);
    expect(files('w1')).toEqual(['new.jpg', 'b.mp4']);
    expect(files('w2')).toEqual(['z.jpg']);
  });
});
