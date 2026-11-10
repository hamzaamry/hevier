import { STORAGE_KEYS } from '@/constants/storage';
import { getJson, remove, setJson } from '@/db/appState/appState';
import { getExerciseBestsFor, getRecordsGymFor } from '@/db/records/bests';
import { bestsOf } from '@/lib/workout/activeWorkout';
import type { ActiveWorkout } from '@/types/workout';

// The workout being logged right now. It is a draft, saved after every change
// (app_state 'activeWorkout'), so leaving the screen or closing the app never
// loses it. Only Finish (db/workouts/write.ts) turns it into a real workout,
// keeping the completed sets; Discard deletes it.

export async function loadActiveWorkout(): Promise<ActiveWorkout | null> {
  const workout = await getJson<ActiveWorkout>(STORAGE_KEYS.activeWorkout);
  if (!workout) return null;
  await fillRecords(workout);
  return workout;
}

// The bests the PR medals compare with, and the gym they are from: those of the
// gym the workout started at, so a backdated workout counts its own day's gym.
export async function fillRecords(workout: ActiveWorkout): Promise<void> {
  if (workout.exercises.length === 0) return;
  const ids = workout.exercises.map((e) => e.exerciseId);
  const at = new Date(workout.startTime);
  const [bests, gyms] = await Promise.all([getExerciseBestsFor(ids, at), getRecordsGymFor(ids, at)]);
  for (const e of workout.exercises) {
    e.bests = bestsOf(bests, e.exerciseId);
    e.recordsGym = gyms.get(e.exerciseId) ?? null;
  }
}

export async function saveActiveWorkout(workout: ActiveWorkout): Promise<void> {
  await setJson(STORAGE_KEYS.activeWorkout, workout);
}

export async function clearActiveWorkout(): Promise<void> {
  await remove(STORAGE_KEYS.activeWorkout);
}
