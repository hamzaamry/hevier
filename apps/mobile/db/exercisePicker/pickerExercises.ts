import { getDb } from '@/db/client';
import { STRETCH_CATEGORIES } from '@/constants/exercise';
import { mediaFromColumns } from '@/lib/domain/exerciseInput';
import { equipmentGroup, parseList, pickerMuscleGroup, secondaryGroups } from '@/lib/domain/muscles';
import type { PickerExercise } from '@/types/exercise';
import { SELECT_PICKER_EXERCISES } from './queries';
import type { PickerExerciseRow } from './rows';

// Data for the Add Exercise / Replace Exercise picker.
// Every exercise (the user's and the 5,632 catalogue ones) is loaded once with
// how often and how recently it was done; search, Recent and Suggested are
// worked out from that list in memory (lib/domain/exerciseSearch.ts).

export async function getPickerExercises(): Promise<PickerExercise[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<PickerExerciseRow>(SELECT_PICKER_EXERCISES);
  return rows.map((r) => {
    const muscle = pickerMuscleGroup(r.target_muscle, r.body_part);
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      catalogueId: r.catalogue_id,
      muscle,
      secondary: secondaryGroups(parseList(r.secondary_muscles), muscle),
      stretch: STRETCH_CATEGORIES.includes(r.category ?? ''),
      equipment: equipmentGroup(r.equipment),
      media: mediaFromColumns(r.media_file, r.media_kind),
      timesDone: r.times_done,
      lastDone: r.last_done,
    };
  });
}
