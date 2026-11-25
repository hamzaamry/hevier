import { updateActiveWorkout } from '@/stores/activeWorkoutStore';
import * as Crypto from 'expo-crypto';
import { parseClock } from '@/lib/format/setFormat';
import { MS_PER_SECOND } from '@/constants/time';
import { patchSet, removeByKey, updateByKey } from '@/components/set-table/draftOps';
import { nextSetLike } from '@/lib/workout/activeWorkout';
import { orderKeepingSupersets, normalizeSupersets, pairExercises, unpairExercise } from '@/lib/workout/supersets';
import type { ActiveExercise, ActiveSet } from '@/types/workout';

// Changes to the live workout, by exercise / set key. Module-level on purpose:
// the row callbacks built from them never change (see ExerciseActions).
// updateActiveWorkout never rejects (a failed draft load is logged in the
// store), so its promise is dropped with `void`.

export function updateExercise(key: string, change: (e: ActiveExercise) => ActiveExercise) {
  void updateActiveWorkout((w) => ({ ...w, exercises: updateByKey(w.exercises, key, change) }));
}

export function updateSet(exerciseKey: string, setKey: string, change: Partial<ActiveSet>) {
  updateExercise(exerciseKey, (e) => ({ ...e, sets: patchSet(e.sets, setKey, change) }));
}

export function removeSet(exerciseKey: string, setKey: string) {
  updateExercise(exerciseKey, (e) => ({ ...e, sets: removeByKey(e.sets, setKey) }));
}

// Add Set copies the set above it.
export function addSet(exerciseKey: string) {
  updateExercise(exerciseKey, (e) => ({ ...e, sets: [...e.sets, nextSetLike(e.sets)] }));
}

export function removeExercise(exerciseKey: string) {
  void updateActiveWorkout((w) => ({ ...w, exercises: normalizeSupersets(removeByKey(w.exercises, exerciseKey)) }));
}

export function reorderExercises(keys: string[]) {
  void updateActiveWorkout((w) => ({ ...w, exercises: orderKeepingSupersets(w.exercises, keys) }));
}

// Add To Superset: pair this exercise with the picked one, in a new group.
export function addToSuperset(exerciseKey: string, partnerKey: string) {
  void updateActiveWorkout((w) => ({ ...w, exercises: pairExercises(w.exercises, exerciseKey, partnerKey, Crypto.randomUUID()) }));
}

export function removeFromSuperset(exerciseKey: string) {
  void updateActiveWorkout((w) => ({ ...w, exercises: unpairExercise(w.exercises, exerciseKey) }));
}

// ▶ on a TIME box: a stopwatch that carries on from the box's time (00:00 when
// empty), so ■ then ▶ resumes rather than resets (■ is stopSetTimer in the store).
export function playSet(setKey: string, time: string) {
  const already = parseClock(time) ?? 0;
  void updateActiveWorkout((w) => ({ ...w, setTimer: { setKey, startedAt: Date.now() - already * MS_PER_SECOND } }));
}
