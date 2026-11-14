import type { MuscleGroup } from '@/types/muscles';
import type { FootballRating } from '@/types/cardio';

// Cardio in the app (football, tennis, sprints, running, hiking, walking). A
// session is logged like any other exercise, never counts as sets, but its
// soreness adds fatigue to the legs in Recovery. The maths that uses these is
// in lib/training/cardio.ts.
//
// The model:
// - a normal session leaves the activity's `load` on each muscle (1.0 = a full session);
// - longer sessions tire less per minute (people pace themselves):
//   (minutes / referenceMinutes) ^ CARDIO_LENGTH_EXPONENT;
// - the easy / normal / hard tap scales it;
// - fatigue stays full for the first day (soreness peaks 24–48 h after),
//   then fades with a half-life.

// The exercise name that marks a game (it is logged like any other exercise).
export const FOOTBALL = 'Football';

// How hard a session was: the choices on the tap in Log Workout, in order.
// The FootballRating type (types/cardio.ts) is built from this list.
export const FOOTBALL_RATINGS = ['easy', 'normal', 'hard'] as const;

export type CardioActivity = {
  referenceMinutes: number; // a normal session of it
  maxMinutes: number; // a typo like 900 min shouldn't wipe out the legs for a week
  load: Partial<Record<MuscleGroup, number>>;
};

// By exercise name. Running, hiking and walking load the legs progressively less than
// sprints and tennis.
export const CARDIO_ACTIVITIES: Record<string, CardioActivity> = {
  [FOOTBALL]: {
    referenceMinutes: 90,
    maxMinutes: 150,
    load: {
      Hamstrings: 0.8, // sprinting, and braking the leg at the end of each stride
      Quadriceps: 0.7, // braking
      Adductors: 0.6, // cutting and side-foot passes
      Calves: 0.5,
      Glutes: 0.5,
      Abductors: 0.3,
      Abdominals: 0.2,
    },
  },
  Sprints: {
    referenceMinutes: 20,
    maxMinutes: 60,
    load: { Hamstrings: 0.8, Glutes: 0.6, Quadriceps: 0.6, Calves: 0.5 },
  },
  Tennis: {
    referenceMinutes: 90,
    maxMinutes: 180,
    load: { Quadriceps: 0.6, Calves: 0.6, Glutes: 0.5, Shoulders: 0.4 },
  },
  Running: {
    referenceMinutes: 45,
    maxMinutes: 150,
    load: { Quadriceps: 0.5, Calves: 0.5, Hamstrings: 0.4, Glutes: 0.4 },
  },
  Hiking: {
    referenceMinutes: 180,
    maxMinutes: 480,
    load: { Quadriceps: 0.4, Calves: 0.4, Glutes: 0.35, Hamstrings: 0.3 },
  },
  Walking: {
    referenceMinutes: 90,
    maxMinutes: 300,
    load: { Calves: 0.25, Quadriceps: 0.2, Glutes: 0.2, Hamstrings: 0.15 },
  },
};

export const CARDIO_LENGTH_EXPONENT = 0.7;
export const CARDIO_FULL_FOR_HOURS = 24;
export const CARDIO_HALF_LIFE_HOURS = 30;

// The easy / normal / hard tap, saved in sets.rpe as a session RPE out of 10.
export const FOOTBALL_RATING_RPE: Record<FootballRating, number> = { easy: 4, normal: 6, hard: 8 };
export const FOOTBALL_RATING_SCALE: Record<FootballRating, number> = { easy: 0.7, normal: 1, hard: 1.3 };
export const FOOTBALL_EASY_MAX_RPE = 5; // RPE 5 or less reads as easy
export const FOOTBALL_HARD_MIN_RPE = 7; // RPE 7 or more reads as hard

// Fatigue left from games on a muscle: above this = red, from the next = orange.
export const FOOTBALL_FATIGUED = 0.6;
export const FOOTBALL_RECOVERING = 0.3;
