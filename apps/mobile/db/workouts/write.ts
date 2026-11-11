import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { parseClock, parseNumber } from '@/lib/format/setFormat';
import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import { remove } from '@/db/appState/appState';
import { ensureGym } from '@/db/gym/gym';
import { STORAGE_KEYS } from '@/constants/storage';
import { elapsedSeconds } from '@/lib/workout/activeWorkout';
import { setRpe } from '@/lib/training/rpe';
import type { GymChoice } from '@/types/gym';
import type { ActiveWorkout } from '@/types/workout';
import type { WorkoutDraftExercise } from '@/types/workoutEdit';
import { INSERT_SET, INSERT_WORKOUT, INSERT_WORKOUT_EXERCISE, INSERT_WORKOUT_MEDIA } from './queries';

// Write a workout's exercises and their sets, in order. The caller runs it
// inside a transaction.
export async function insertWorkoutExercises(
  db: SQLiteDatabase,
  workoutId: string,
  exercises: WorkoutDraftExercise[]
): Promise<void> {
  for (const [orderIndex, e] of exercises.entries()) {
    const workoutExerciseId = Crypto.randomUUID();
    await db.runAsync(INSERT_WORKOUT_EXERCISE, [workoutExerciseId, workoutId, e.exerciseId, orderIndex, e.notes]);
    for (const [setIndex, s] of e.sets.entries()) {
      await db.runAsync(INSERT_SET, [
        Crypto.randomUUID(),
        workoutExerciseId,
        setIndex,
        s.setType,
        s.weightKg,
        s.reps,
        s.distanceKm,
        s.durationSeconds,
        s.rpe ?? null,
      ]);
    }
  }
}

// The completed sets of a live workout, as they are saved; exercises with none are left out.
function completedExercises(workout: ActiveWorkout): WorkoutDraftExercise[] {
  return workout.exercises
    .map((e) => ({
      exerciseId: e.exerciseId,
      notes: e.notes.trim() || null,
      sets: e.sets
        .filter((s) => s.done)
        .map((s) => ({
          setType: s.setType,
          weightKg: parseNumber(s.weight),
          reps: parseNumber(s.reps),
          distanceKm: parseNumber(s.km),
          durationSeconds: parseClock(s.time),
          rpe: setRpe(e.name, s),
        })),
    }))
    .filter((e) => e.sets.length > 0);
}

// Saves the completed sets as a workout in the history and clears the draft.
// visit: the gym of a one-off visit, created in the same transaction.
export async function finishWorkout(workout: ActiveWorkout, now = new Date(), visit: GymChoice | null = null): Promise<string> {
  const db = await getDb();
  const workoutId = Crypto.randomUUID();
  await runInTransaction(db, async () => {
    const visitGymId = visit ? await ensureGym(visit) : null;
    await db.runAsync(INSERT_WORKOUT, [
      workoutId,
      workout.title.trim() || 'Workout',
      workout.startTime,
      // Paused time left out, so the saved duration is what Duration showed.
      new Date(Date.parse(workout.startTime) + elapsedSeconds(workout, now.getTime()) * 1000).toISOString(),
      workout.description?.trim() || null,
      visitGymId,
    ]);
    for (const [position, m] of (workout.media ?? []).entries()) {
      await db.runAsync(INSERT_WORKOUT_MEDIA, [Crypto.randomUUID(), workoutId, m.file, m.kind, position]);
    }
    await insertWorkoutExercises(db, workoutId, completedExercises(workout));
    await remove(STORAGE_KEYS.activeWorkout, db);
  }).finally(invalidateHistory); // also after a rollback: a load may have read the undone rows
  return workoutId;
}
