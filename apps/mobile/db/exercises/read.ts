import { getDb } from '@/db/client';
import { equipmentGroup, muscleGroup, parseList, secondaryGroups } from '@/lib/domain/muscles';
import type { ExerciseInput } from '@/types/exercise';
import { isTypeLocked } from './write';
import { SELECT_EXERCISE_FOR_EDIT } from './queries';
import type { ExerciseEditRow } from './rows';

// Edit Exercise: the saved exercise back in the form's groups.
export async function getExerciseForEdit(id: string): Promise<{ input: ExerciseInput; typeLocked: boolean } | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ExerciseEditRow>(SELECT_EXERCISE_FOR_EDIT, [id]);
  if (!row) return null;
  const primary = muscleGroup(row.target_muscle, row.body_part);
  return {
    input: {
      name: row.name,
      type: row.type,
      equipment: equipmentGroup(row.equipment),
      primary,
      secondary: secondaryGroups(parseList(row.secondary_muscles), primary),
      media: row.media_file && row.media_kind ? { file: row.media_file, kind: row.media_kind } : null,
    },
    typeLocked: await isTypeLocked(id),
  };
}
