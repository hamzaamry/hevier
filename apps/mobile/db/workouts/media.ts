import * as Crypto from 'expo-crypto';
import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import type { MediaItem } from '@/types/workout';
import {
  DELETE_WORKOUT_MEDIA,
  DELETE_WORKOUT_MEDIA_FILE,
  INSERT_WORKOUT_MEDIA,
  SELECT_LAST_MEDIA_POSITION,
  SELECT_WORKOUT_MEDIA_FILES,
  SELECT_WORKOUT_MEDIA_FOR_EDIT,
} from './queries';

// The photos and videos of a saved workout, changed after Save Workout (the workout
// page, Edit Workout). The files are already in media/ (lib/workoutMedia.ts) when a
// row is written, and the callers delete a file only after its row is gone.

type Db = Awaited<ReturnType<typeof getDb>>;

export async function getWorkoutMedia(workoutId: string): Promise<MediaItem[]> {
  const db = await getDb();
  return db.getAllAsync<MediaItem>(SELECT_WORKOUT_MEDIA_FOR_EDIT, [workoutId]);
}

// The workout page's + Add: straight to the database, after the last one.
export async function addWorkoutMedia(workoutId: string, items: MediaItem[]): Promise<void> {
  const db = await getDb();
  await runInTransaction(db, async () => {
    const last = await db.getFirstAsync<{ position: number | null }>(SELECT_LAST_MEDIA_POSITION, [workoutId]);
    let position = (last?.position ?? -1) + 1;
    for (const m of items) {
      await db.runAsync(INSERT_WORKOUT_MEDIA, [Crypto.randomUUID(), workoutId, m.file, m.kind, position++]);
    }
  }).finally(invalidateHistory);
}

// The workout page's ✕: the row only. The caller deletes the file once the row is
// gone (lib/workoutMedia.ts deleteMediaFiles), as it does after deleteWorkout.
export async function removeWorkoutMedia(workoutId: string, file: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(DELETE_WORKOUT_MEDIA_FILE, [workoutId, file]);
  invalidateHistory();
}

// Edit Workout's Save, inside its transaction: the rows become `items`, in order.
// Returns the files that are no longer in use, for the caller to delete once it is committed.
export async function replaceWorkoutMedia(db: Db, workoutId: string, items: MediaItem[]): Promise<string[]> {
  const before = await db.getAllAsync<{ file: string }>(SELECT_WORKOUT_MEDIA_FILES, [workoutId]);
  await db.runAsync(DELETE_WORKOUT_MEDIA, [workoutId]);
  for (const [position, m] of items.entries()) {
    await db.runAsync(INSERT_WORKOUT_MEDIA, [Crypto.randomUUID(), workoutId, m.file, m.kind, position]);
  }
  const kept = new Set(items.map((m) => m.file));
  return before.map((r) => r.file).filter((file) => !kept.has(file));
}
