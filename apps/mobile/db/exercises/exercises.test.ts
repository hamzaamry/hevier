import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeDb, freshDb, raw, rows } from '@/db/testDb';
import type { ExerciseInput } from '@/types/exercise';

vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
vi.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: () => `id${++n}` };
});

const { archiveExercise, createExercise, findByName, isTypeLocked, NameTakenError, restoreExercise, updateExercise } =
  await import('./write');
const { getExerciseForEdit } = await import('./read');

const twist: ExerciseInput = {
  name: 'Landmine Twist',
  type: 'reps_only',
  equipment: 'Barbell',
  primary: 'Abdominals',
  secondary: ['Shoulders'],
  media: { file: 'a.mp4', kind: 'video' },
};

describe('exercises the user makes', () => {
  beforeEach(async () => {
    await freshDb();
    raw.exec("INSERT INTO exercises (id, name, type, is_custom) VALUES ('bp', 'Bench Press (Barbell)', 'weight_reps', 0)");
  });

  it('creates one that reads back the same, marked as made by the user', async () => {
    const id = await createExercise(twist);
    expect(await getExerciseForEdit(id)).toEqual({ input: twist, typeLocked: false });
    expect(rows("SELECT user_created, is_custom, catalogue_id FROM exercises WHERE id = ?", [id])).toEqual([
      { user_created: 1, is_custom: 1, catalogue_id: null },
    ]);
  });

  it('finds a taken name whatever its case or spaces, archived ones too', async () => {
    expect(await findByName(' bench press (barbell) ')).toEqual({ id: 'bp', archived: false });
    expect(await findByName('Bench Press (Barbell)', 'bp')).toBeNull();
    expect(await findByName('Bench Press')).toBeNull();
  });

  it('hands back the replaced media file, nothing when it stays', async () => {
    const id = await createExercise(twist);
    expect(await updateExercise(id, twist)).toBeNull();
    expect(await updateExercise(id, { ...twist, media: { file: 'b.jpg', kind: 'photo' } })).toBe('a.mp4');
    expect(await updateExercise(id, { ...twist, media: null })).toBe('b.jpg');
  });

  it('keeps the type once a routine uses it', async () => {
    const id = await createExercise(twist);
    raw.exec(`INSERT INTO routines (id, name) VALUES ('r', 'Core');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES ('re', 'r', '${id}', 0);`);
    expect(await isTypeLocked(id)).toBe(true);
    await updateExercise(id, { ...twist, name: 'Twist', type: 'duration' });
    expect(await getExerciseForEdit(id)).toEqual({ input: { ...twist, name: 'Twist' }, typeLocked: true });
  });

  it('archives without touching routines or past workouts, and restores', async () => {
    const id = await createExercise(twist);
    raw.exec(`INSERT INTO routines (id, name) VALUES ('r', 'Core');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES ('re', 'r', '${id}', 0);
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'Core', '2026-11-12T10:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', '${id}', 0);`);
    await archiveExercise(id);
    expect(rows<{ a: string | null }>('SELECT archived_at AS a FROM exercises WHERE id = ?', [id])[0].a).not.toBeNull();
    expect(rows('SELECT id FROM routine_exercises')).toEqual([{ id: 're' }]);
    expect(rows('SELECT id FROM workout_exercises')).toEqual([{ id: 'we' }]);
    await restoreExercise(id);
    expect(rows('SELECT archived_at FROM exercises WHERE id = ?', [id])).toEqual([{ archived_at: null }]);
  });

  it('locks the type while the workout in progress has it', async () => {
    const id = await createExercise(twist);
    raw.run("INSERT INTO app_state (key, value) VALUES ('activeWorkout', ?)", [JSON.stringify({ exercises: [{ exerciseId: id }] })]);
    expect(await isTypeLocked(id)).toBe(true);
  });

  it('refuses a taken name on save, any case, without writing', async () => {
    await expect(createExercise({ ...twist, name: 'BENCH PRESS (BARBELL)' })).rejects.toBeInstanceOf(NameTakenError);
    const id = await createExercise(twist);
    await expect(updateExercise(id, { ...twist, name: 'bench press (barbell)' })).rejects.toBeInstanceOf(NameTakenError);
    expect(rows('SELECT name FROM exercises WHERE id = ?', [id])).toEqual([{ name: 'Landmine Twist' }]);
  });

  it('finds who has a name, and whether it is archived', async () => {
    const id = await createExercise(twist);
    expect(await findByName(' landmine twist')).toEqual({ id, archived: false });
    await archiveExercise(id);
    expect(await findByName('Landmine Twist')).toEqual({ id, archived: true });
    expect(await findByName('Landmine Twist', id)).toBeNull();
  });

  it('gives nothing to edit for a missing exercise', async () => {
    expect(await getExerciseForEdit('nope')).toBeNull();
  });
});

describe('reading exercises the user makes', () => {
  beforeEach(async () => {
    await freshDb();
  });

  it('the picker leaves out archived ones and gives the media', async () => {
    const { getPickerExercises } = await import('@/db/exercisePicker/pickerExercises');
    const kept = await createExercise(twist);
    const gone = await createExercise({ ...twist, name: 'Old Twist', media: null });
    await archiveExercise(gone);
    const list = await getPickerExercises();
    expect(list.map((e) => e.id)).toContain(kept);
    expect(list.map((e) => e.id)).not.toContain(gone);
    expect(list.find((e) => e.id === kept)?.media).toEqual({ file: 'a.mp4', kind: 'video' });
  });

  it('the exercise page says made by the user, archived, and gives the media', async () => {
    const { getExerciseDetail } = await import('@/db/exerciseStats/detail');
    const id = await createExercise(twist);
    expect(await getExerciseDetail(id)).toMatchObject({ userCreated: true, archived: false, media: twist.media });
    await archiveExercise(id);
    expect(await getExerciseDetail(id)).toMatchObject({ archived: true });
  });
});
