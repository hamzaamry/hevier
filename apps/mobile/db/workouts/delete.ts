import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import { DELETE_RUN_FEEDBACK } from '@/db/run/queries';
import {
  DELETE_WORKOUT,
  DELETE_WORKOUT_EXERCISES,
  DELETE_WORKOUT_MEDIA,
  DELETE_WORKOUT_SETS,
  SELECT_WORKOUT_MEDIA_FILES,
} from './queries';
import type { MediaFileRow } from './rows';

// Returns its photos' and videos' file names, for the caller to delete the files.
export async function deleteWorkout(id: string): Promise<string[]> {
  const db = await getDb();
  const media = await db.getAllAsync<MediaFileRow>(SELECT_WORKOUT_MEDIA_FILES, [id]);
  await runInTransaction(db, async () => {
    await db.runAsync(DELETE_RUN_FEEDBACK, [id]);
    await db.runAsync(DELETE_WORKOUT_MEDIA, [id]);
    await db.runAsync(DELETE_WORKOUT_SETS, [id]);
    await db.runAsync(DELETE_WORKOUT_EXERCISES, [id]);
    await db.runAsync(DELETE_WORKOUT, [id]);
  }).finally(invalidateHistory); // also after a rollback: a load may have read the undone rows
  return media.map((m) => m.file);
}
