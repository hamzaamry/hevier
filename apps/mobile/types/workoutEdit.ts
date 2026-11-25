import type { EditorExercise, EditorSet } from '@/types/routine';
import type { MediaItem } from '@/types/workout';

// A saved workout as the editors see it (db/workouts/edit.ts).
export interface EditableWorkout {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  exercises: EditorExercise[];
}

// What Edit Workout's Save writes back over a saved workout.
export interface WorkoutDraft {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  exercises: WorkoutDraftExercise[];
  media?: MediaItem[]; // the photos and videos in order; left alone when missing
}

// One exercise of a workout as it is written: its sets in order
// (db/workouts/write.ts insertWorkoutExercises).
export interface WorkoutDraftExercise {
  exerciseId: string;
  notes: string | null;
  supersetId: string | null;
  sets: EditorSet[];
}
