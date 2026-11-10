import type { ExerciseType } from '@/types/exercise';
import type { MediaItem, SetType } from '@/types/workout';

// What the workout cards' queries return.

// SELECT_WORKOUTS
export interface WorkoutRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
}

// SELECT_WORKOUT_SETS
export interface WorkoutSetRow {
  workout_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  name: string;
  type: ExerciseType;
  catalogue_id: string | null;
  notes: string | null;
  set_id: string | null;
  set_type: SetType | null;
  weight_kg: number | null;
  body_weight_kg: number | null; // what a body weight exercise's set counts (SET_BODY_WEIGHT)
  reps: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
  // Which gym the set counts at (lib/gym/timeline.ts recordKey).
  equipment: string | null;
  start_time: string;
  gym_id: string | null;
}

// SELECT_WORKOUT_DESCRIPTION
export interface WorkoutDescriptionRow {
  description: string | null;
}

// SELECT_WORKOUT_MEDIA: the columns are already the page's MediaItem.
export type WorkoutMediaRow = MediaItem;
