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
  SELECT_BY_NAME,
  UPDATE_EXERCISE,
} from './queries';
import type { ExerciseEditRow } from './rows';

// Exercises the user makes: the one place they are written. Media files are
// already in media/ (lib/workoutMedia.ts); the caller deletes a replaced file
// once the row no longer names it. Every write clears the history cache, so a
// rename shows in past workouts.

// Save with a name another exercise has (the form's check hadn't answered yet).
export class NameTakenError extends Error {
  constructor(name: string) {
    super(`An exercise is already called ${name}`);
    this.name = 'NameTakenError';
  }
}

function values(c: ExerciseColumns) {
  return [c.name, c.type, c.body_part, c.target_muscle, c.secondary_muscles, c.equipment, c.media_file, c.media_kind];
}

export async function createExercise(input: ExerciseInput): Promise<string> {
  const db = await getDb();
  const id = Crypto.randomUUID();
  const columns = toExerciseColumns(input);
  if (await findByName(columns.name)) throw new NameTakenError(columns.name);
  await db.runAsync(INSERT_EXERCISE, [id, ...values(columns)]);
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
    if (await findByName(columns.name, id)) throw new NameTakenError(columns.name);
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

// Who already has this name (trimmed, any case), and whether it is archived:
// the form offers to restore an archived one instead.
export async function findByName(name: string, exceptId = ''): Promise<{ id: string; archived: boolean } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ id: string; archived_at: string | null }>(SELECT_BY_NAME, [name.trim(), exceptId]);
  return row ? { id: row.id, archived: row.archived_at !== null } : null;
}

// Used in a workout or routine: its sets hold values of that type.
export async function isTypeLocked(id: string): Promise<boolean> {
  const db = await getDb();
  return !!(await db.getFirstAsync(SELECT_EXERCISE_USED, [id, id, id]));
}
