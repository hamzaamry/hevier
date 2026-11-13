import { cardioActivity, ratingToRpe } from './cardio';
import { RPE_SCALE_MAX } from '@/constants/training';
import type { ActiveSet } from '@/types/workout';

// Reps left (RIR) are saved on the RPE scale (the sets.rpe column, as in
// Hevy's CSV export): 0 left = RPE 10, "4+" = RPE 6.
export function rirToRpe(rir: number | null | undefined): number | null {
  return rir === null || rir === undefined ? null : RPE_SCALE_MAX - rir;
}

// Back to reps left from a saved RPE; never below 0.
export function rpeToRir(rpe: number | null): number | null {
  return rpe === null ? null : Math.max(0, RPE_SCALE_MAX - rpe);
}

// What goes in sets.rpe: a cardio session's easy / normal / hard, else reps left on
// the RPE scale (none on a failure set marked after answering).
export function setRpe(exerciseName: string, s: Pick<ActiveSet, 'setType' | 'rir' | 'rating'>): number | null {
  if (cardioActivity(exerciseName)) return s.rating ? ratingToRpe(s.rating) : null;
  return s.setType === 'failure' ? null : rirToRpe(s.rir);
}
