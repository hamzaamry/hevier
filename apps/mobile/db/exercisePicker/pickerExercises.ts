import { getDb } from '@/db/client';
import { mediaFromColumns } from '@/lib/domain/exerciseInput';
import { equipmentGroup, pickerMuscleGroup } from '@/lib/domain/muscles';
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
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    catalogueId: r.catalogue_id,
    muscle: pickerMuscleGroup(r.target_muscle, r.body_part),
    equipment: equipmentGroup(r.equipment),
    media: mediaFromColumns(r.media_file, r.media_kind),
    timesDone: r.times_done,
    lastDone: r.last_done,
  }));
}
