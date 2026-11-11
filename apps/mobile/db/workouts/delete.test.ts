import { describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// deleteWorkout on an in-memory sql.js database (as routines.test.ts).
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
const { deleteWorkout } = await import('./delete');

describe('deleteWorkout', () => {
  it('removes the workout with its sets and media, and returns the media files to delete', async () => {
    await freshDb();
    raw.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'LOWER A', '2026-10-14T18:00:00Z'), ('k', 'Kept', '2026-10-15T18:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', 'sq', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s', 'we', 0, 'normal', 100, 5);
      INSERT INTO workout_media (id, workout_id, file, kind, position) VALUES
        ('m1', 'w', 'a.jpg', 'photo', 0), ('m2', 'w', 'b.mp4', 'video', 1), ('m3', 'k', 'c.jpg', 'photo', 0);
      INSERT INTO run_feedback (workout_id, verdict_shown, legs_felt) VALUES ('w', 'easy', 'ok'), ('k', 'easy', NULL);
    `);
    expect(await deleteWorkout('w')).toEqual(['a.jpg', 'b.mp4']);
    expect(rows('SELECT id FROM workouts')).toEqual([{ id: 'k' }]);
    expect(rows('SELECT id FROM workout_media')).toEqual([{ id: 'm3' }]);
    expect(rows('SELECT id FROM sets')).toEqual([]);
    expect(rows('SELECT workout_id FROM run_feedback')).toEqual([{ workout_id: 'k' }]);
  });
});
