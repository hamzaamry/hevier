import * as Crypto from 'expo-crypto';
import { WARM_UP_EXERCISE } from '@/constants/training';
import { getExerciseBests, getRecordsGymFor } from '@/db/records/bests';
import { getPreviousSets } from '@/db/history/previousSets';
import { getRoutineForEdit } from '@/db/routines/editor';
import { getWorkoutForEdit } from '@/db/workouts/edit';
import { backdatedSeconds, backdatedStart, newSet, setFromPlan, startingRest } from '@/lib/workout/activeWorkout';
import type { ActiveExercise, ActiveWorkout, PickedExercise, WorkoutSource } from '@/types/workout';
import { fillRecords, saveActiveWorkout } from './draft';

// From a routine (its planned sets filled in, nothing done yet), a copied
// workout, or empty. With `day`, a workout logged afterwards for that day:
// as long as backdatedSeconds, fixed until changed in the Duration sheet.
export async function startWorkout(source: WorkoutSource, now = new Date(), day?: Date): Promise<ActiveWorkout> {
  const routine = typeof source === 'string' ? await getRoutineForEdit(source) : null;
  const copied = source && typeof source === 'object' ? await getWorkoutForEdit(source.copyOf) : null;
  const plan = routine ?? (copied && { name: copied.title, exercises: copied.exercises });
  const workout: ActiveWorkout = {
    title: plan?.name ?? 'Workout',
    routineId: routine ? routine.id : null,
    startTime: now.toISOString(),
    exercises: (plan?.exercises ?? []).map((e) => ({
      key: Crypto.randomUUID(),
      exerciseId: e.exerciseId,
      catalogueId: e.catalogueId,
      name: e.name,
      type: e.type,
      notes: e.notes ?? '',
      restSeconds: startingRest(e.name, e.restSeconds),
      previous: e.previous,
      sets: e.sets.length > 0 ? e.sets.map((s) => setFromPlan(s, !(routine && e.name === WARM_UP_EXERCISE))) : [newSet()],
    })),
    restEndsAt: null,
    restTotal: null,
  };
  if (day) {
    const seconds = backdatedSeconds(workout);
    const start = backdatedStart(day, now, seconds);
    Object.assign(workout, {
      startTime: new Date(start).toISOString(),
      pausedAt: start + seconds * 1000,
      pausedSeconds: 0,
      backdated: true,
    });
  }
  await fillRecords(workout);
  await saveActiveWorkout(workout);
  return workout;
}

// An exercise picked in Add Exercise / Replace Exercise: its previous sets and
// bests from the history (at the gym the workout started at), the default rest
// timer (see startingRest), empty sets to fill in.
export async function newActiveExercise(exercise: PickedExercise, workoutStart: string, setCount = 1): Promise<ActiveExercise> {
  const at = new Date(workoutStart);
  return {
    key: Crypto.randomUUID(),
    exerciseId: exercise.id,
    catalogueId: exercise.catalogueId,
    name: exercise.name,
    type: exercise.type,
    notes: '',
    restSeconds: startingRest(exercise.name, null),
    previous: await getPreviousSets(exercise.id),
    sets: Array.from({ length: Math.max(1, setCount) }, () => newSet()),
    bests: await getExerciseBests(exercise.id, at),
    recordsGym: (await getRecordsGymFor([exercise.id], at)).get(exercise.id) ?? null,
  };
}
