import * as Crypto from 'expo-crypto';
import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import { toExerciseColumns } from '@/lib/domain/exerciseInput';
import type { ExerciseColumns, ExerciseInput } from '@/types/exercise';
import {
  ARCHIVE_EXERCISE,
  INSERT_EXERCISE,
  RESTORE_EXERCISE,
  SELECT_EXERCISE_FOR_EDIT,
  SELECT_EXERCISE_USED,
  SELECT_NAME_TAKEN,
  UPDATE_EXERCISE,
} from './queries';
import type { ExerciseEditRow } from './rows';

// Exercises the user makes: the one place they are written. Media files are
// already in media/ (lib/workoutMedia.ts); the caller deletes a replaced file
// once the row no longer names it. Every write clears the history cache, so a
// rename shows in past workouts.

function values(c: ExerciseColumns) {
  return [c.name, c.type, c.body_part, c.target_muscle, c.secondary_muscles, c.equipment, c.media_file, c.media_kind];
}

export async function createExercise(input: ExerciseInput): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  await db.runAsync(INSERT_EXERCISE, [id, ...values(toExerciseColumns(input))]);
  invalidateHistory();
  return id;
}

// Returns the media file the exercise no longer uses, for the caller to delete.
export async function updateExercise(id: string, input: ExerciseInput): Promise<string | null> {
  const db = await getDb();
  return runInTransaction(db, async () => {
    const old = await db.getFirstAsync<ExerciseEditRow>(SELECT_EXERCISE_FOR_EDIT, [id]);
    if (!old) return null;
    const columns = toExerciseColumns(input);
    if (await isTypeLocked(id)) columns.type = old.type;
    await db.runAsync(UPDATE_EXERCISE, [...values(columns), id]);
    return old.media_file && old.media_file !== columns.media_file ? old.media_file : null;
  }).finally(invalidateHistory);
}

export async function archiveExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(ARCHIVE_EXERCISE, [new Date().toISOString(), id]);
  invalidateHistory();
}

export async function restoreExercise(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(RESTORE_EXERCISE, [id]);
  invalidateHistory();
}

export async function isNameTaken(name: string, exceptId = ''): Promise<boolean> {
  const db = await getDb();
  return !!(await db.getFirstAsync(SELECT_NAME_TAKEN, [name.trim(), exceptId]));
}

// Used in a workout or routine: its sets hold values of that type.
export async function isTypeLocked(id: string): Promise<boolean> {
  const db = await getDb();
  return !!(await db.getFirstAsync(SELECT_EXERCISE_USED, [id, id]));
}
