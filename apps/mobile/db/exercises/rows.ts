import type { ExerciseType } from '@/types/exercise';
import type { MediaItem } from '@/types/workout';

export interface ExerciseEditRow {
  id: string;
  name: string;
  type: ExerciseType;
  body_part: string | null;
  target_muscle: string | null;
  secondary_muscles: string | null;
  equipment: string | null;
  media_file: string | null;
  media_kind: MediaItem['kind'] | null;
}
