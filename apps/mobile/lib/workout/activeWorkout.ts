import * as Crypto from 'expo-crypto';
import { parseClock, parseNumber, setTextOf } from '@/lib/format/setFormat';
import { SECONDS_PER_HOUR } from '@/constants/time';
import { setVolumeKg } from '@/lib/volume';
import { BACKDATED_DURATION_HOURS, BACKDATED_START_HOUR } from '@/constants/training';
import { cardioActivity } from '@/lib/training/cardio';
import type { BodyWeightContext } from '@/types/bodyWeight';
import type { Bests } from '@/types/records';
import type { EditorSet } from '@/types/routine';
import type { ActiveExercise, ActiveSet, ActiveWorkout, WorkoutStats } from '@/types/workout';
import type { SetInputField } from '@/types/setFields';
import type { WorkoutSettings } from '@/types/workoutSettings';

// The maths of the workout being logged right now: its sets, timers and totals.
// The draft is saved by db/activeWorkout/, and written to the history by
// db/workouts/write.ts finishWorkout.

export function newSet(from?: Partial<ActiveSet>): ActiveSet {
  return { key: Crypto.randomUUID(), setType: 'normal', weight: '', reps: '', km: '', time: '', done: false, ...from };
}

// Add Set: a new set copying the values of the last one (empty if there is none).
export function nextSetLike(sets: ActiveSet[]): ActiveSet {
  const last = sets[sets.length - 1];
  return newSet(last ? { weight: last.weight, reps: last.reps, km: last.km, time: last.time } : {});
}

// The exercises in the order of `keys` (Reorder Exercises); unknown keys are skipped.
export function orderByKeys<T extends { key: string }>(list: T[], keys: string[]): T[] {
  const byKey = new Map(list.map((item) => [item.key, item]));
  return keys.map((k) => byKey.get(k)).filter((item): item is T => item !== undefined);
}

// Reps left, asked once the last set is ticked (lib/training/effort.ts: 4+ makes the
// set count less). Not on a failure set: that already says 0 left.
export function shouldAskRepsLeft(fields: SetInputField[], last: ActiveSet | undefined, settings: WorkoutSettings): boolean {
  return !!(settings.repsLeft && fields.some((f) => f.field === 'reps') && last?.done && last.setType !== 'failure');
}

// Cardio: how hard the session was, once it's ticked (lib/training/cardio.ts scales
// its fatigue by it). Nothing picked counts as normal.
export function shouldAskRating(exercise: ActiveExercise): boolean {
  return !!cardioActivity(exercise.name) && exercise.sets[exercise.sets.length - 1]?.done;
}

// A planned set (routine or copied workout) as a set to do.
// Warm Up starts at 00:00 from a routine, so its time can be left
// out; ▶ on the empty box still runs last session's time.
export function setFromPlan(s: EditorSet, keepTime = true): ActiveSet {
  return newSet({ setType: s.setType, ...setTextOf(s, keepTime) });
}

// When a workout logged for `day` starts: 6 PM that day, or earlier today if
// it would otherwise end in the future.
export function backdatedStart(day: Date, now: Date, seconds = BACKDATED_DURATION_HOURS * SECONDS_PER_HOUR): number {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), BACKDATED_START_HOUR).getTime();
  return Math.min(start, now.getTime() - seconds * 1000);
}

// How long a workout logged for a past day lasts until changed: the game's
// TIME when it has cardio, else an hour.
export function backdatedSeconds(workout: ActiveWorkout): number {
  const game = workout.exercises
    .filter((e) => cardioActivity(e.name))
    .flatMap((e) => e.sets)
    .reduce((total, s) => total + (parseClock(s.time) ?? 0), 0);
  return game || BACKDATED_DURATION_HOURS * SECONDS_PER_HOUR;
}

// Each exercise gets its own copy (one exercise can be in a workout twice).
export function bestsOf(bests: Map<string, Bests>, exerciseId: string): Bests | null {
  const b = bests.get(exerciseId);
  return b ? { ...b } : null;
}

// An exercise's rest timer when a workout gets it: its own, else the default,
// except cardio: OFF (nobody rests after a game or a run), from a routine too.
export function startingRest(name: string, restSeconds: number | null): number | null {
  return restSeconds ?? (cardioActivity(name) ? 0 : null);
}

// Volume and Sets above the exercises: completed sets only. Body weight
// exercises (bodyWeight.exerciseIds) count the last body weight logged.
export function workoutStats(workout: ActiveWorkout, bodyWeight: BodyWeightContext | null = null): WorkoutStats {
  let volumeKg = 0;
  let sets = 0;
  for (const e of workout.exercises) {
    const weightOfExercise = bodyWeight?.exerciseIds.has(e.exerciseId) ? bodyWeight.weightKg : null;
    for (const s of e.sets) {
      if (!s.done) continue;
      sets++;
      volumeKg += setVolumeKg(parseNumber(s.weight), parseNumber(s.reps), weightOfExercise);
    }
  }
  return { volumeKg, sets };
}

// A done set of a body weight exercise while no body weight is logged: Save
// Workout asks for it.
export function needsBodyWeight(workout: ActiveWorkout, bodyWeight: BodyWeightContext | null): boolean {
  if (!bodyWeight || bodyWeight.weightKg !== null) return false;
  return workout.exercises.some((e) => bodyWeight.exerciseIds.has(e.exerciseId) && e.sets.some((s) => s.done));
}

// The exercise named in the workout pill: the next one with a set to do
// (the first exercise when nothing is done yet), else the last one.
export function currentExerciseName(workout: ActiveWorkout): string | null {
  const next = workout.exercises.find((e) => e.sets.some((s) => !s.done));
  return (next ?? workout.exercises[workout.exercises.length - 1])?.name ?? null;
}

export function hasCompletedSets(workout: ActiveWorkout) {
  return workout.exercises.some((e) => e.sets.some((s) => s.done));
}

// The Duration: time since the start, less the time spent paused.
export function elapsedSeconds(workout: ActiveWorkout, now: number): number {
  const until = workout.pausedAt ?? now;
  const seconds = Math.floor((until - Date.parse(workout.startTime)) / 1000 - (workout.pausedSeconds ?? 0));
  return seconds > 0 ? seconds : 0;
}

export function pauseTimer(workout: ActiveWorkout, now: number): ActiveWorkout {
  return workout.pausedAt ? workout : { ...workout, pausedAt: now };
}

export function resumeTimer(workout: ActiveWorkout, now: number): ActiveWorkout {
  if (!workout.pausedAt) return workout;
  const paused = (now - workout.pausedAt) / 1000;
  return { ...workout, pausedAt: null, pausedSeconds: (workout.pausedSeconds ?? 0) + paused };
}

// The Duration sheet sets one of Duration / Start time and the other follows.
// Earlier pauses are folded into the new start, so what was picked is what shows.
// A workout logged for a past day moves whole instead: same length, new start
// (and never ending in the future).
export function setStartTime(workout: ActiveWorkout, start: number, now: number): ActiveWorkout {
  if (workout.backdated) {
    const length = elapsedSeconds(workout, now) * 1000;
    const from = Math.min(start, now - length);
    return { ...workout, startTime: new Date(from).toISOString(), pausedAt: from + length, pausedSeconds: 0 };
  }
  const until = workout.pausedAt ?? now;
  return { ...workout, startTime: new Date(Math.min(start, until)).toISOString(), pausedSeconds: 0 };
}

// For a past day: same start, new end (pulled back to now at the latest).
export function setDuration(workout: ActiveWorkout, seconds: number, now: number): ActiveWorkout {
  if (workout.backdated) {
    const end = Math.min(Date.parse(workout.startTime) + seconds * 1000, now);
    return { ...workout, startTime: new Date(end - seconds * 1000).toISOString(), pausedAt: end, pausedSeconds: 0 };
  }
  return setStartTime(workout, (workout.pausedAt ?? now) - seconds * 1000, now);
}
