import type { SetRecord, Bests } from './records';
import type { SET_TYPES } from '@/constants/workout';
import type { ExerciseType } from './exercise';
import type { FootballRating } from './football';
import type { GymChoice } from './gym';
import type { EditorSet } from './routine';

// The kind of a set: one of SET_TYPES.
export type SetType = (typeof SET_TYPES)[number];

export interface Workout {
  id: string;
  title: string;
  startTime: string; // ISO 8601
  endTime: string | null;
  description: string | null;
}

export interface WorkoutSet {
  id: string;
  workoutExerciseId: string;
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

// The workout being logged right now (db/activeWorkout/, maths in lib/workout/activeWorkout.ts).
export interface ActiveSet {
  key: string;
  setType: SetType;
  // As typed, so half-typed values ("22,") survive.
  weight: string;
  reps: string;
  km: string;
  time: string; // "06:23"
  done: boolean;
  rir?: number | null; // reps left, asked after the last set: 0–3, 4 = "4+"
  rating?: FootballRating | null; // Football: how hard the game was (lib/training/football.ts)
}

export interface ActiveExercise {
  key: string;
  exerciseId: string;
  catalogueId: string | null;
  name: string;
  type: ExerciseType;
  notes: string;
  restSeconds: number | null;
  previous: EditorSet[];
  sets: ActiveSet[];
  // From the history, for the PR medals (db/records/bests.ts); null = never done.
  // Missing in drafts saved before PRs existed: filled in on load.
  bests?: Bests | null;
  // The gym those bests are from, for the PR toast ("at Basic-Fit Nation"). Only
  // for machine and cable exercises, and only once the user has changed gym.
  recordsGym?: string | null;
}

// A photo or video added on the Save Workout page (lib/workoutMedia.ts).
export interface MediaItem {
  file: string; // its name in the app's documents, media/
  kind: 'photo' | 'video';
}

export interface ActiveWorkout {
  title: string;
  description?: string; // written on the Save Workout page
  media?: MediaItem[];
  routineId: string | null;
  startTime: string; // ISO
  exercises: ActiveExercise[];
  // Rest timer after a completed set: when it ends and how long it was.
  restEndsAt: number | null;
  restTotal: number | null;
  restExercise?: string | null; // name shown in the pill while resting
  // ▶ on a timed set: a stopwatch from 0; ■ writes its time into TIME and completes the set.
  setTimer?: { setKey: string; startedAt: number } | null;
  // Pause Workout Timer: when the current pause began, and earlier pauses in total.
  pausedAt?: number | null;
  pausedSeconds?: number;
  // Logged afterwards for a past day (from the calendar): its clock stands
  // still (kept paused at the end), and no rest timers or notification.
  backdated?: boolean;
  // The gym picked on Save Workout's Gym row; none = the gym of the workout's day.
  gym?: GymChoice;
}

// What a new workout starts from: a routine id (its planned sets), a saved
// workout to copy (Copy Workout: its sets, none done), or nothing.
export type WorkoutSource = string | { copyOf: string } | null;

// Volume and Sets above the exercises while logging (lib/workout/activeWorkout.ts).
export interface WorkoutStats {
  volumeKg: number;
  sets: number;
}

// An exercise picked in Add Exercise / Replace Exercise (db/activeWorkout/start.ts newActiveExercise).
export interface PickedExercise {
  id: string;
  name: string;
  type: ExerciseType;
  catalogueId: string | null;
}

// A set's numbers as saved (lib/format/setFormat.ts formats them).
export interface SetValues {
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
}

// The text boxes of one set, as typed (a draft keeps text until it is saved).
export interface SetText {
  weight: string;
  reps: string;
  km: string;
  time: string;
}

// A set that beat a record, for Log Workout's toast (only shown while it is open).
export interface PrEvent {
  name: string;
  catalogueId: string | null;
  records: SetRecord[];
  gym: string | null;
}

// A past workout with its totals (db/sessions/sessions.ts): the Profile tab and
// the routine page. Volume as lib/volume.ts counts it.
export interface WorkoutSession {
  startTime: string;
  durationSeconds: number;
  volumeKg: number;
  reps: number;
}
