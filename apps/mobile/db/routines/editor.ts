import { getDb } from '@/db/client';
import { getPreviousSetsFor } from '@/db/history/previousSets';
import type { EditorExercise, EditorRoutine } from '@/types/routine';
import { getRoutinePage } from './page';
import { SELECT_ROUTINE_EXERCISE_NOTES } from './queries';
import type { RoutineExerciseNotesRow } from './rows';

// A saved routine as the routine editor opens it, with each exercise's PREVIOUS sets.
export async function getRoutineForEdit(id: string): Promise<EditorRoutine | null> {
  const page = await getRoutinePage(id);
  if (!page) return null;
  const db = await getDb();
  const [notes, previous] = await Promise.all([
    db.getAllAsync<RoutineExerciseNotesRow>(SELECT_ROUTINE_EXERCISE_NOTES, [id]),
    getPreviousSetsFor(page.exercises.map((e) => e.exerciseId)),
  ]);
  const notesById = new Map(notes.map((n) => [n.id, n.notes]));
  const exercises: EditorExercise[] = page.exercises.map((e) => ({
    exerciseId: e.exerciseId,
    catalogueId: e.catalogueId,
    name: e.name,
    type: e.type,
    notes: notesById.get(e.id) ?? null,
    restSeconds: e.restSeconds,
    supersetId: e.supersetId,
    sets: e.sets.map(({ setIndex: _, ...s }) => s),
    previous: (previous.get(e.exerciseId) ?? []).map((s) => ({ ...s })), // own copy: an exercise can be in twice
  }));
  return { id: page.id, name: page.name, exercises };
}
