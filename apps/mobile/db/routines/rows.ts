import type { ExerciseType } from '@/types/exercise';
import type { SetType } from '@/types/workout';

// What the routine queries return.

// SELECT_FOLDERS
export interface FolderRow {
  id: string;
  name: string;
  collapsed: number;
}

// SELECT_ROUTINES_WITH_EXERCISES
export interface RoutineExerciseNameRow {
  id: string;
  name: string;
  folder_id: string | null;
  exercise: string | null;
}

// SELECT_NEXT_UNFILED_POSITION
export interface NextPositionRow {
  next: number;
}

// SELECT_OTHER_ROUTINES_IN_FOLDER
export interface RoutineIdRow {
  id: string;
}

// SELECT_ROUTINE_FOR_COPY
export interface RoutineForCopyRow {
  name: string;
  folder_id: string | null;
  position: number;
}

// SELECT_ROUTINE_EXERCISES_FOR_COPY
export interface RoutineExerciseForCopyRow {
  id: string;
  exercise_id: string;
  order_index: number;
  rest_seconds: number | null;
  notes: string | null;
  superset_id: string | null;
}

// SELECT_ROUTINE
export interface RoutineRow {
  id: string;
  name: string;
}

// SELECT_ROUTINE_EXERCISES_WITH_SETS
export interface RoutineExerciseSetRow {
  re_id: string;
  exercise_id: string;
  catalogue_id: string | null;
  name: string;
  type: ExerciseType;
  rest_seconds: number | null;
  superset_id: string | null;
  set_index: number | null;
  set_type: SetType | null;
  weight_kg: number | null;
  reps: number | null;
  distance_km: number | null;
  duration_seconds: number | null;
}

// SELECT_ROUTINE_EXERCISE_NOTES
export interface RoutineExerciseNotesRow {
  id: string;
  notes: string | null;
}
