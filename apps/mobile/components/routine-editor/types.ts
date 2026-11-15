import type { EditorExercise } from '@/types/routine';
import type { MediaItem, SetText, SetType } from '@/types/workout';

// Props and local types of the routine editor pieces (components/routine-editor/).

// One set as the editor holds it: text until it is saved.
export interface DraftSet extends SetText {
  key: number;
  setType: SetType;
  rpe?: number | null; // not shown: kept so Edit Workout doesn't drop it
}

export interface DraftExercise extends Omit<EditorExercise, 'sets'> {
  key: number;
  sets: DraftSet[];
}

// The workout's own fields, in Edit Workout only.
export interface WorkoutMeta {
  description: string;
  startTime: number;
  durationSeconds: number;
  media: MediaItem[];
}

export interface ExerciseEditorProps {
  exercise: DraftExercise;
  onNotes: (exerciseKey: number, notes: string) => void;
  onRest?: (exerciseKey: number) => void; // none in Edit Workout: saved workouts keep no rest timers
  onMenu: (exerciseKey: number) => void;
  onSetMenu: (exerciseKey: number, setKey: number) => void;
  onSetChange: (exerciseKey: number, setKey: number, change: Partial<DraftSet>) => void;
  onAddSet: (exerciseKey: number) => void;
}

export interface WorkoutMetaFieldsProps {
  meta: WorkoutMeta;
  onTime: () => void;
  onDescription: (description: string) => void;
  onAddMedia: () => void;
  onRemoveMedia: (file: string) => void;
}

export interface EditorExerciseMenuProps {
  // The exercise whose ⋮ was tapped; null = closed.
  exerciseKey: number | null;
  onDismiss: () => void;
  onReplace: (exerciseKey: number) => void;
  onRemove: (exerciseKey: number) => void;
}
