import { getPreviousSets } from '@/db/history/previousSets';
import type { PickerExercise } from '@/types/exercise';
import { emptySet, newKey } from './draft';
import type { DraftExercise } from './types';

// An exercise picked in Add / Replace Exercise: empty sets, its previous sets.
export async function newDraftExercise(e: PickerExercise, setCount = 1): Promise<DraftExercise> {
  return {
    key: newKey(),
    exerciseId: e.id,
    catalogueId: e.catalogueId,
    name: e.name,
    type: e.type,
    notes: null,
    restSeconds: null,
    supersetId: null,
    previous: await getPreviousSets(e.id),
    sets: Array.from({ length: Math.max(1, setCount) }, emptySet),
  };
}
