import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
vi.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `id${++n}` };
});

const { addWorkoutMedia, getWorkoutMedia, removeWorkoutMedia, replaceWorkoutMedia, setWorkoutCover } = await import('./media');

// The card's cover on a workout.
const cover = (id: string) =>
  rows<{ cover_file: string | null }>('SELECT cover_file FROM workouts WHERE id = ?', [id])[0].cover_file;

describe('workout media', () => {
  beforeEach(async () => {
    await freshDb();
    raw.exec(`
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'A', '2026-11-01T10:00:00Z'), ('o', 'B', '2026-11-02T10:00:00Z');
      INSERT INTO workout_media (id, workout_id, file, kind, position) VALUES
        ('m1', 'w', 'a.jpg', 'photo', 0), ('m2', 'w', 'b.mp4', 'video', 1), ('m3', 'o', 'z.jpg', 'photo', 0);
    `);
  });

  it('adds new photos after the last one', async () => {
    await addWorkoutMedia('w', [{ file: 'c.jpg', kind: 'photo' }, { file: 'd.jpg', kind: 'photo' }]);
    expect((await getWorkoutMedia('w')).map((m) => m.file)).toEqual(['a.jpg', 'b.mp4', 'c.jpg', 'd.jpg']);
    expect((await getWorkoutMedia('o')).map((m) => m.file)).toEqual(['z.jpg']);
  });

  it('starts at the first place on a workout without photos', async () => {
    raw.exec("INSERT INTO workouts (id, title, start_time) VALUES ('n', 'C', '2026-11-03T10:00:00Z')");
    await addWorkoutMedia('n', [{ file: 'x.jpg', kind: 'photo' }]);
    expect(await getWorkoutMedia('n')).toEqual([{ file: 'x.jpg', kind: 'photo' }]);
  });

  it('removes one photo: its row, not the other workout', async () => {
    await removeWorkoutMedia('w', 'a.jpg');
    expect((await getWorkoutMedia('w')).map((m) => m.file)).toEqual(['b.mp4']);
    expect((await getWorkoutMedia('o')).map((m) => m.file)).toEqual(['z.jpg']);
  });

  it('Edit Workout: the rows become the edited list, in order, and the unused files come back', async () => {
    const unused = await replaceWorkoutMedia(fakeDb as never, 'w', [
      { file: 'new.jpg', kind: 'photo' },
      { file: 'b.mp4', kind: 'video' },
    ]);
    expect(unused).toEqual(['a.jpg']);
    expect(await getWorkoutMedia('w')).toEqual([
      { file: 'new.jpg', kind: 'photo' },
      { file: 'b.mp4', kind: 'video' },
    ]);
    expect((await getWorkoutMedia('o')).map((m) => m.file)).toEqual(['z.jpg']);
  });

  it('sets the cover to one of the workout\'s files, null back to the default', async () => {
    await setWorkoutCover('w', 'b.mp4');
    expect(cover('w')).toBe('b.mp4');
    await setWorkoutCover('w', null);
    expect(cover('w')).toBeNull();
  });

  it('refuses another workout\'s file', async () => {
    await setWorkoutCover('w', 'z.jpg');
    expect(cover('w')).toBeNull();
    expect(cover('o')).toBeNull();
  });

  it('clears the cover when that photo is removed', async () => {
    await setWorkoutCover('w', 'a.jpg');
    await removeWorkoutMedia('w', 'a.jpg');
    expect(cover('w')).toBeNull();
  });

  it('Edit Workout keeps a cover whose file stays, and clears one whose file goes', async () => {
    await setWorkoutCover('w', 'a.jpg');
    await replaceWorkoutMedia(fakeDb as never, 'w', [{ file: 'a.jpg', kind: 'photo' }, { file: 'b.mp4', kind: 'video' }]);
    expect(cover('w')).toBe('a.jpg');

    await replaceWorkoutMedia(fakeDb as never, 'w', [{ file: 'new.jpg', kind: 'photo' }]);
    expect(cover('w')).toBeNull();
  });
});
