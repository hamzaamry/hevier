import { useEffect, useState, useSyncExternalStore } from 'react';

import { clearActiveWorkout, loadActiveWorkout, saveActiveWorkout } from '@/db/activeWorkout/draft';
import { startWorkout } from '@/db/activeWorkout/start';
import { setRecords } from '@/lib/stats/records';
import { getWorkoutSettings, restOf } from '@/db/workoutSettings';
import { DEFAULT_WORKOUT_SETTINGS } from '@/constants/defaults';
import type { WorkoutSettings } from '@/types/workoutSettings';
import { celebratePr } from '@/lib/prFeedback';
import { deleteMediaFiles } from '@/lib/workoutMedia';
import { CLOCK_TICKS } from '@/constants/motion';
import { secondsSince } from '@/lib/date';
import { clock } from '@/lib/format/duration';
import type { ActiveWorkout, WorkoutSource, PrEvent } from '@/types/workout';

// One shared copy of the workout in progress, for the Log Workout screen and
// the "workout in progress" bar. Every change is written to the database
// straight away (in order), so nothing is lost if the screen or app closes.

let current: ActiveWorkout | null = null;
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
let writes = Promise.resolve();
// The write waiting its turn: later changes just replace what it will write,
// so fast typing doesn't queue one database write per keystroke.
let pending: { workout: ActiveWorkout | null } | null = null;

function emit() {
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function persist(workout: ActiveWorkout | null) {
  if (pending) {
    pending.workout = workout;
    return;
  }
  pending = { workout };
  writes = writes
    .then(() => {
      const next = pending!.workout;
      pending = null;
      return next ? saveActiveWorkout(next) : clearActiveWorkout();
    })
    .catch((e) => console.warn('[activeWorkout] save failed', e));
}

function commit(workout: ActiveWorkout | null) {
  current = workout;
  persist(workout);
  emit();
}

// One load shared by every caller, so a late one can't overwrite changes made
// meanwhile. A failed load is tried again by the next caller.
function ensureLoaded(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= loadActiveWorkout().then(
    (workout) => {
      // A workout started or ended meanwhile wins over the stored draft.
      if (loaded) return;
      current = dropOldSetTimer(workout);
      loaded = true;
      emit();
    },
    (e) => {
      console.warn('[activeWorkout] load failed', e);
      loading = null;
    }
  );
  return loading;
}

export function useActiveWorkout(): ActiveWorkout | null {
  useEffect(() => {
    ensureLoaded();
  }, []);
  return useSyncExternalStore(subscribe, () => current);
}

// Only part of the workout: re-renders when `select`'s result changes by
// `equal`, not on every keystroke. `select` and `equal` are read once, so
// pass module-level functions.
export function useActiveWorkoutSelect<T>(
  select: (workout: ActiveWorkout | null) => T,
  equal: (a: T, b: T) => boolean = Object.is
): T {
  useEffect(() => {
    ensureLoaded();
  }, []);
  const [snapshot] = useState(() => {
    let last: { source: ActiveWorkout | null; value: T } | null = null;
    return () => {
      if (last?.source === current) return last.value;
      const value = select(current);
      last = { source: current, value: last && equal(last.value, value) ? last.value : value };
      return last.value;
    };
  });
  return useSyncExternalStore(subscribe, snapshot);
}

export async function getActiveWorkout() {
  await ensureLoaded();
  return current;
}

// The workout as it is right now, for callbacks that must not re-render with it.
export function peekActiveWorkout() {
  return current;
}

// A change made before the draft has loaded (a notification button right
// after the app opens) waits for it instead of being lost.
export async function updateActiveWorkout(change: (w: ActiveWorkout) => ActiveWorkout) {
  if (!loaded) {
    await ensureLoaded().then(async () => {
      if (loaded) await updateActiveWorkout(change);
    });
    return;
  }
  if (!current) return;
  const next = change(current);
  if (next !== current) commit(next);
}

// Workout Settings, kept so ✓ can use them at once. Log Workout reads them
// again on focus (back from the Settings screen); until a read has finished,
// callers wait for it rather than use the defaults.
let settingsLoad: Promise<WorkoutSettings> | null = null;

// A failed read gives the defaults this time and is tried again next time.
export function reloadWorkoutSettings(): Promise<WorkoutSettings> {
  const load: Promise<WorkoutSettings> = getWorkoutSettings().catch((e) => {
    console.warn('[activeWorkout] settings failed', e);
    if (settingsLoad === load) settingsLoad = null;
    return DEFAULT_WORKOUT_SETTINGS;
  });
  settingsLoad = load;
  return load;
}

function workoutSettings(): Promise<WorkoutSettings> {
  return settingsLoad ?? reloadWorkoutSettings();
}

// ✓ on a set (Log Workout, or Complete Set in the notification); ticking it
// starts the exercise's rest timer. rest: seconds, null/0 = off.
function setSetDone(exerciseKey: string, setKey: string, done: boolean, rest: number | null) {
  updateActiveWorkout((w) => {
    const exercise = w.exercises.find((e) => e.key === exerciseKey);
    return {
      ...w,
      exercises: w.exercises.map((e) =>
        e.key === exerciseKey ? { ...e, sets: e.sets.map((s) => (s.key === setKey ? { ...s, done } : s)) } : e
      ),
      ...(done && rest
        ? { restEndsAt: Date.now() + rest * 1000, restTotal: rest, restExercise: exercise?.name ?? null }
        : {}),
    };
  });
}


const prListeners = new Set<(pr: PrEvent) => void>();

export function onPr(listener: (pr: PrEvent) => void) {
  prListeners.add(listener);
  return () => {
    prListeners.delete(listener);
  };
}

// What ✓ does: ticks (or unticks) the set with the real settings, then the
// rest timer (none for a workout logged for a past day) and, for a record,
// the chime and buzz (and the toast when `toast`), if PR alerts are on.
// `done`: 'toggle' flips it; true only ticks a set still open.
async function markSet(
  exerciseKey: string,
  setKey: string,
  done: boolean | 'toggle',
  toast: boolean,
  freshSettings: boolean
) {
  await ensureLoaded();
  const settings = await (freshSettings ? reloadWorkoutSettings() : workoutSettings());
  const exercise = current?.exercises.find((e) => e.key === exerciseKey);
  const set = exercise?.sets.find((s) => s.key === setKey);
  if (!current || !exercise || !set) return;
  const next = done === 'toggle' ? !set.done : done;
  if (next === set.done) return;
  const rest = current.backdated ? null : restOf(exercise.restSeconds, settings);
  if (next && settings.prAlert) {
    const sets = exercise.sets.map((s) => (s.key === set.key ? { ...s, done: true } : s));
    const records = setRecords(exercise.type, exercise.bests ?? null, sets, set.key);
    if (records.length > 0) {
      if (toast) for (const l of prListeners) l({ name: exercise.name, catalogueId: exercise.catalogueId, records, gym: exercise.recordsGym ?? null });
      celebratePr();
    }
  }
  setSetDone(exerciseKey, setKey, next, rest);
}

// ✓ in Log Workout.
export function toggleSetDone(exerciseKey: string, setKey: string) {
  return markSet(exerciseKey, setKey, 'toggle', true, false);
}

// Complete Set in the notification: settings read again, as the app may
// have been closed since they changed. The toast is only in the app.
export function completeSet(exerciseKey: string, setKey: string) {
  return markSet(exerciseKey, setKey, true, false, true);
}

// A draft saved by the old ▶ countdown ({ endsAt }) has no stopwatch to resume.
function dropOldSetTimer(workout: ActiveWorkout | null): ActiveWorkout | null {
  if (!workout?.setTimer || typeof workout.setTimer.startedAt === 'number') return workout;
  return { ...workout, setTimer: null };
}

// ■ on a timed set's ▶ stopwatch: its time goes into TIME and the set is
// completed (rest timer, record check), as ✓ does. Stopped at 0s: just ends.
export async function stopSetTimer() {
  await ensureLoaded();
  const timer = current?.setTimer;
  if (!timer) return;
  const seconds = secondsSince(timer.startedAt, Date.now());
  const exercise = current?.exercises.find((e) => e.sets.some((s) => s.key === timer.setKey));
  await updateActiveWorkout((w) => ({
    ...w,
    setTimer: null,
    exercises:
      seconds > 0
        ? w.exercises.map((e) => ({ ...e, sets: e.sets.map((s) => (s.key === timer.setKey ? { ...s, time: clock(seconds) } : s)) }))
        : w.exercises,
  }));
  if (exercise && seconds > 0) await markSet(exercise.key, timer.setKey, true, true, false);
}

// The rest timer's -15 / +15 in Log Workout. -15 past zero ends the rest, as
// Skip does (the notification's buttons follow the same rule).
export function adjustRest(seconds: number) {
  updateActiveWorkout((w) => {
    if (w.restEndsAt === null) return w;
    const restEndsAt = w.restEndsAt + seconds * 1000;
    return restEndsAt <= Date.now() + 500
      ? { ...w, restEndsAt: null, restTotal: null }
      : { ...w, restEndsAt, restTotal: Math.max(1, (w.restTotal ?? 0) + seconds) };
  });
}

// The notification's Skip / -15s / +15s: it already worked out the new rest.
export function setRest(restEndsAt: number | null, restTotal: number | null) {
  updateActiveWorkout((w) => ({ ...w, restEndsAt, restTotal }));
}

export function skipRest() {
  updateActiveWorkout((w) => ({ ...w, restEndsAt: null, restTotal: null }));
}

// `day`: logged afterwards for that past day (startWorkout). Replaces a
// workout in progress the user chose to discard.
export async function beginWorkout(source: WorkoutSource, day?: Date) {
  await ensureLoaded();
  if (current?.media?.length) deleteMediaFiles(current.media.map((m) => m.file));
  // Writes still queued for the old workout must not land on the new one.
  await writes;
  current = await startWorkout(source, new Date(), day);
  loaded = true;
  emit();
}

// After Finish (finishWorkout already cleared the stored draft).
export function endActiveWorkout() {
  loaded = true;
  commit(null);
}

// Discard Workout: also deletes the photos and videos it was given.
export function discardActiveWorkout() {
  if (current?.media?.length) deleteMediaFiles(current.media.map((m) => m.file));
  endActiveWorkout();
}

// Re-renders every second while active (Duration, rest countdown). Keep it
// in small leaf components: whatever calls it redraws every second.
export function useNow(active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // Catch up at once after a time switched off (a sheet opened again).
    const first = setTimeout(() => setNow(Date.now()), 0);
    const t = setInterval(() => setNow(Date.now()), CLOCK_TICKS.workoutTickMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [active]);
  return now;
}

// True until `endsAt` (a rest's end), re-rendering once when it passes rather
// than every second.
export function useUntil(endsAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (endsAt === null) return;
    const t = setTimeout(() => setNow(Date.now()), Math.max(0, endsAt - Date.now()) + CLOCK_TICKS.untilSlackMs);
    return () => clearTimeout(t);
  }, [endsAt]);
  return endsAt !== null && endsAt > now;
}
