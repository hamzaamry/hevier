import { getDb } from '@/db/client';
import { invalidateHistory } from '@/db/historyCache';
import { runInTransaction } from '@/db/transaction';
import { getPreviousSetsFor } from '@/db/history/previousSets';
import type { EditorExercise } from '@/types/routine';
import type { EditableWorkout, WorkoutDraft } from '@/types/workoutEdit';
import {
  DELETE_WORKOUT_EXERCISES,
  DELETE_WORKOUT_SETS,
  SELECT_WORKOUT_EXERCISES_FOR_EDIT,
  SELECT_WORKOUT_FOR_EDIT,
  UPDATE_WORKOUT,
} from './queries';
import type { WorkoutExerciseSetRow, WorkoutForEditRow } from './rows';
import { replaceWorkoutMedia } from './media';
import { insertWorkoutExercises } from './write';

// A saved workout as the editors see it: the card ⋯ menu's Save as Routine
// (routine editor, prefilled), Copy Workout (a new live workout) and Edit
// Workout (the routine editor in workout mode, saved back over it).

export async function getWorkoutForEdit(id: string): Promise<EditableWorkout | null> {
  const db = await getDb();
  const w = await db.getFirstAsync<WorkoutForEditRow>(SELECT_WORKOUT_FOR_EDIT, [id]);
  if (!w) return null;
  const rows = await db.getAllAsync<WorkoutExerciseSetRow>(SELECT_WORKOUT_EXERCISES_FOR_EDIT, [id]);
  const exercises: (EditorExercise & { key: string })[] = [];
  for (const r of rows) {
    let e = exercises[exercises.length - 1];
    if (!e || e.key !== r.workout_exercise_id) {
      e = {
        key: r.workout_exercise_id,
        exerciseId: r.exercise_id,
        catalogueId: r.catalogue_id,
        name: r.name,
        type: r.type,
        notes: r.notes,
        restSeconds: null,
        sets: [],
        previous: [], // filled in below, all in one query
      };
      exercises.push(e);
    }
    if (r.set_id !== null) {
      e.sets.push({
        setType: r.set_type ?? 'normal',
        weightKg: r.weight_kg,
        reps: r.reps,
        distanceKm: r.distance_km,
        durationSeconds: r.duration_seconds,
        rpe: r.rpe,
      });
    }
  }
  const previous = await getPreviousSetsFor(exercises.map((e) => e.exerciseId));
  for (const e of exercises) e.previous = (previous.get(e.exerciseId) ?? []).map((s) => ({ ...s }));
  return {
    id: w.id,
    title: w.title,
    description: w.description,
    startTime: w.start_time,
    endTime: w.end_time,
    exercises: exercises.map(({ key: _key, ...e }) => e),
  };
}

// Edit Workout's Save: the workout's own fields, and its exercises, sets and
// media replaced by the edited ones, all or nothing. Returns the media files no
// longer in use, for the caller to delete (as deleteWorkout does).
export async function saveWorkoutEdit(draft: WorkoutDraft): Promise<string[]> {
  const db = await getDb();
  let unused: string[] = [];
  await runInTransaction(db, async () => {
    await db.runAsync(UPDATE_WORKOUT, [draft.title, draft.description, draft.startTime, draft.endTime, draft.id]);
    await db.runAsync(DELETE_WORKOUT_SETS, [draft.id]);
    await db.runAsync(DELETE_WORKOUT_EXERCISES, [draft.id]);
    await insertWorkoutExercises(db, draft.id, draft.exercises);
    if (draft.media) unused = await replaceWorkoutMedia(db, draft.id, draft.media);
  }).finally(invalidateHistory); // also after a rollback: a load may have read the undone rows
  return unused;
}
