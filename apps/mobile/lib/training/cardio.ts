import type { MuscleGroup } from '@/types/muscles';
import {
  CARDIO_ACTIVITIES,
  CARDIO_FULL_FOR_HOURS,
  CARDIO_HALF_LIFE_HOURS,
  CARDIO_LENGTH_EXPONENT,
  FOOTBALL_EASY_MAX_RPE,
  FOOTBALL_HARD_MIN_RPE,
  FOOTBALL_RATING_RPE,
  FOOTBALL_RATING_SCALE,
  type CardioActivity,
} from '@/constants/cardio';
import type { FootballRating } from '@/types/cardio';

// Cardio (football, tennis, sprints, running, hiking, walking) in the recovery
// view. It isn't lifting near failure, so it never counts as sets (weekly sets,
// zones, distribution, push/pull), but the soreness afterwards is real, so it
// adds fatigue to the legs. The activities and their numbers are in constants/cardio.ts.

// The activity an exercise name is, or undefined for a lift.
export function cardioActivity(name: string): CardioActivity | undefined {
  return Object.hasOwn(CARDIO_ACTIVITIES, name) ? CARDIO_ACTIVITIES[name] : undefined;
}

// Saved in sets.rpe (a session RPE, out of 10); a session saved without one is normal.
export function ratingToRpe(rating: FootballRating): number {
  return FOOTBALL_RATING_RPE[rating];
}

export function rpeToRating(rpe: number | null | undefined): FootballRating {
  if (rpe === null || rpe === undefined) return 'normal';
  return rpe <= FOOTBALL_EASY_MAX_RPE ? 'easy' : rpe >= FOOTBALL_HARD_MIN_RPE ? 'hard' : 'normal';
}

// How big a session is, 1 = a normal session of the activity's referenceMinutes.
export function cardioScale(activity: CardioActivity, minutes: number, rating: FootballRating = 'normal'): number {
  const m = Math.min(Math.max(minutes, 0), activity.maxMinutes);
  return (m / activity.referenceMinutes) ** CARDIO_LENGTH_EXPONENT * FOOTBALL_RATING_SCALE[rating];
}

// What's left of a session's fatigue `hours` after it started.
export function cardioLeft(load: number, hours: number): number {
  if (hours < 0) return 0;
  return hours <= CARDIO_FULL_FOR_HOURS ? load : load * 0.5 ** ((hours - CARDIO_FULL_FOR_HOURS) / CARDIO_HALF_LIFE_HOURS);
}

// Fatigue per muscle from one session, `hours` after it started.
export function cardioFatigue(
  activity: CardioActivity,
  minutes: number,
  rating: FootballRating,
  hours: number,
): Map<MuscleGroup, number> {
  const scale = cardioScale(activity, minutes, rating);
  const result = new Map<MuscleGroup, number>();
  for (const [muscle, load] of Object.entries(activity.load) as [MuscleGroup, number][]) {
    result.set(muscle, cardioLeft(load * scale, hours));
  }
  return result;
}
