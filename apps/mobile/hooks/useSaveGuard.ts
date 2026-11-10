import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';

import { discardActiveWorkout, endActiveWorkout, updateActiveWorkout } from '@/stores/activeWorkoutStore';
import type { RoutineUpdate } from '@/components/save-workout/types';
import { getRoutineForEdit } from '@/db/routines/editor';
import { addGymChange, ensureGym, getGymTimeline } from '@/db/gym/gym';
import { saveRoutine } from '@/db/routines/write';
import { finishWorkout } from '@/db/workouts/write';
import { dayKey } from '@/lib/date';
import { gymName, gymQuestion, workoutGym } from '@/lib/gym/timeline';
import { pauseTimer, resumeTimer } from '@/lib/workout/activeWorkout';
import { changesMessage, routineChanges, routineFromWorkout } from '@/lib/workout/routineUpdate';
import type { GymChoice } from '@/types/gym';
import type { EditorRoutine } from '@/types/routine';
import type { ActiveWorkout } from '@/types/workout';

// Save Workout's save (with the gym question), update-routine and discard, kept together because they
// share two refs:
// - pausedHere: the clock was paused on arrival, so leaving back to Log Workout
//   runs it on again (after Save or Discard there is no workout left to resume);
// - saving: Save is running; a second tap (or Update Routine / Keep Original
//   during it) would save twice, and a Discard would delete the photos being saved.
export function useSaveGuard(workout: ActiveWorkout | null) {
  const router = useRouter();
  // Done differently from its routine: the "Update routine" sheet first.
  const [update, setUpdate] = useState<RoutineUpdate | null>(null);
  // A gym picked that isn't the gym of the day: asks if it was a gym change or a visit.
  const [gymAsk, setGymAsk] = useState<{ choice: GymChoice; message: string } | null>(null);
  // Just This Workout: the gym of the visit, created when the workout is saved.
  const visit = useRef<GymChoice | null>(null);
  const pausedHere = useRef(false);
  const saving = useRef(false);

  // The clock stands still while here, and runs on again on the way back.
  useEffect(() => {
    updateActiveWorkout((w) => {
      if (w.pausedAt || w.backdated) return w;
      pausedHere.current = true;
      return pauseTimer(w, Date.now());
    });
    return () => {
      if (pausedHere.current) updateActiveWorkout((w) => resumeTimer(w, Date.now()));
    };
  }, []);

  // A failed save keeps the draft, and the user stays here to try again.
  async function guarded(run: () => Promise<void>) {
    if (saving.current) return;
    saving.current = true;
    try {
      await run();
    } catch (e) {
      console.warn('[save] failed', e);
    } finally {
      saving.current = false;
    }
  }

  async function finishNow(updateRoutine?: EditorRoutine) {
    if (!workout) return;
    setUpdate(null);
    if (updateRoutine) await saveRoutine(routineFromWorkout(updateRoutine, workout));
    const visitGymId = visit.current ? await ensureGym(visit.current) : null;
    const id = await finishWorkout(workout, new Date(), visitGymId);
    pausedHere.current = false;
    endActiveWorkout();
    // Back to the tabs, then the "Nice work!" cards (app/nice-work.tsx).
    router.dismissAll();
    router.push({ pathname: '/nice-work', params: { id } });
  }

  // Asks about the routine when the workout strayed from it, else saves.
  async function routineOrFinish() {
    if (!workout) return;
    const routine = workout.routineId ? await getRoutineForEdit(workout.routineId) : null;
    const message = routine && changesMessage(routineChanges(routine, workout));
    if (routine && message) {
      setUpdate({ routine, message });
      return;
    }
    await finishNow();
  }

  // Save: first the gym (a gym picked that isn't the gym of the day is asked
  // about; the first gym ever picked just becomes the gym), then the routine.
  function save() {
    return guarded(async () => {
      if (!workout) return;
      visit.current = null;
      const timeline = await getGymTimeline();
      const question = gymQuestion(timeline, workout.startTime, workout.gym);
      if (workout.gym && question === 'ask') {
        const now = gymName(timeline, workoutGym(timeline, workout.startTime, null));
        setGymAsk({ choice: workout.gym, message: `You trained at ${workout.gym.name}, not ${now}. Did you change gym?` });
        return;
      }
      if (workout.gym && question === 'firstGym') await addGymChange(dayKey(new Date(workout.startTime)), workout.gym);
      await routineOrFinish();
    });
  }

  // The answer to the gym question: I Changed Gym (from the workout's day on) or Just This Workout (a visit).
  function answerGym(changed: boolean) {
    const ask = gymAsk;
    setGymAsk(null);
    if (!workout || !ask) return Promise.resolve();
    return guarded(async () => {
      if (changed) await addGymChange(dayKey(new Date(workout.startTime)), ask.choice);
      else visit.current = ask.choice;
      await routineOrFinish();
    });
  }

  // From the sheet: Update Routine passes the routine to make what was done.
  function finish(updateRoutine?: EditorRoutine) {
    return guarded(() => finishNow(updateRoutine));
  }

  function discard() {
    // Too late once Save is running: it would delete the photos being saved.
    if (saving.current) return;
    pausedHere.current = false;
    discardActiveWorkout();
    router.dismissAll();
  }

  return { update, closeUpdate: () => setUpdate(null), save, finish, discard, gymAsk, answerGym, closeGymAsk: () => setGymAsk(null) };
}
