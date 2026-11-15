import type { ExerciseType } from '@/types/exercise';
import type { MediaItem } from '@/types/workout';

// What the picker's queries return.

// SELECT_PICKER_EXERCISES
export interface PickerExerciseRow {
  id: string;
  name: string;
  type: ExerciseType;
  catalogue_id: string | null;
  target_muscle: string | null;
  body_part: string | null;
  equipment: string | null;
  media_file: string | null;
  media_kind: MediaItem['kind'] | null;
  times_done: number;
  last_done: string | null;
}
