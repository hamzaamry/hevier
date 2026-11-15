import { EQUIPMENT_WORD_OF } from '@/constants/equipment';
import { MUSCLE_GROUPS, SECONDARY_WORD_OF, TARGET_WORD_OF } from '@/constants/muscles';
import type { ExerciseColumns, ExerciseInput } from '@/types/exercise';
import type { MediaItem } from '@/types/workout';
import type { MuscleGroup } from '@/types/muscles';

// An exercise the user makes, from the form's groups to the exercises table's
// catalogue words (the reverse of lib/domain/muscles.ts). Use this for any
// exercise written from app code, so it files and counts like a built-in one.

export function toExerciseColumns(input: ExerciseInput): ExerciseColumns {
  const { target, bodyPart } = TARGET_WORD_OF[input.primary];
  return {
    name: input.name.trim(),
    type: input.type,
    body_part: bodyPart,
    target_muscle: target,
    secondary_muscles: JSON.stringify(input.secondary.map((g) => SECONDARY_WORD_OF[g]).filter(Boolean)),
    equipment: EQUIPMENT_WORD_OF[input.equipment],
    media_file: input.media?.file ?? null,
    media_kind: input.media?.kind ?? null,
  };
}

// The "Other muscles" choices: every muscle that can be a secondary one, but the primary.
export function secondaryOptions(primary: MuscleGroup): MuscleGroup[] {
  return MUSCLE_GROUPS.filter((g) => g !== primary && SECONDARY_WORD_OF[g]);
}

// The media_file / media_kind columns as one photo or video, or none.
export function mediaFromColumns(file: string | null, kind: MediaItem['kind'] | null): MediaItem | null {
  return file && kind ? { file, kind } : null;
}
