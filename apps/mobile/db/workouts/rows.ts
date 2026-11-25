import type { ExerciseType } from '@/types/exercise';
import type { SetType } from '@/types/workout';

// What the workout edit queries return.

// SELECT_WORKOUT_FOR_EDIT
export interface WorkoutForEditRow {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
}

// SELECT_WORKOUT_EXERCISES_FOR_EDIT
export interface WorkoutExerciseSetRow {
  workout_exercise_id: string;
  exercise_id: string;
  name: string;
  type: ExerciseType;
  catalogue_id: string | null;
  notes: string | null;
  superset_id: string | null;
  set_id: string | null;
  set_type: SetType | null;
  weight_kg: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

// SELECT_WORKOUT_MEDIA_FILES
export interface MediaFileRow {
  file: string;
}
