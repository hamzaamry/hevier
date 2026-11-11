import * as Crypto from 'expo-crypto';
import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import { INSERT_WORKOUT } from '@/db/workouts/queries';
import { insertWorkoutExercises } from '@/db/workouts/write';
import { MS_PER_SECOND } from '@/constants/time';
import { RUN, RUN_WORKOUT_TITLE } from '@/constants/run';
import type { LogRunInput } from '@/types/run';
import { SELECT_RUN_EXERCISE_ID, UPSERT_RUN_FEEDBACK } from './queries';
import type { RunExerciseRow } from './rows';

// Saves a run as a finished workout with one Run set (what Log Workout would have
// saved), and what the app said for that morning. Returns the workout's id.
export async function logRun(run: LogRunInput): Promise<string> {
  const db = await getDb();
  const exercise = await db.getFirstAsync<RunExerciseRow>(SELECT_RUN_EXERCISE_ID, [RUN]);
  if (!exercise) throw new Error('The Run exercise is missing');
  const workoutId = Crypto.randomUUID();
  await runInTransaction(db, async () => {
    const end = new Date(run.startMs + run.seconds * MS_PER_SECOND).toISOString();
    await db.runAsync(INSERT_WORKOUT, [workoutId, RUN_WORKOUT_TITLE, new Date(run.startMs).toISOString(), end, null, null]);
    await insertWorkoutExercises(db, workoutId, [
      {
        exerciseId: exercise.id,
        notes: null,
        sets: [{ setType: 'normal', weightKg: null, reps: null, distanceKm: run.km, durationSeconds: run.seconds, rpe: run.rpe }],
      },
    ]);
    await db.runAsync(UPSERT_RUN_FEEDBACK, [workoutId, run.verdictShown, null]);
  }).finally(invalidateHistory);
  return workoutId;
}
