import type { ExerciseType } from '@/types/exercise';
import type { SetType } from '@/types/workout';

// What the exercise page's queries return.

// SELECT_EXERCISE_DETAIL
export interface ExerciseDetailRow {
  id: string;
  name: string;
  type: ExerciseType;
  equipment: string | null;
  catalogue_id: string | null;
  target_muscle: string | null;
  body_part: string | null;
  secondary_muscles: string | null;
  description: string | null;
  instructions: string | null;
}

// SELECT_EXERCISE_HISTORY
export interface ExerciseHistoryRow {
  workout_exercise_id: string;
  workout_id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  description: string | null;
  gym_id: string | null;
  set_id: string | null;
  set_index: number;
  set_type: SetType;
  weight_kg: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}
