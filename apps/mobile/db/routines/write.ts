import * as Crypto from 'expo-crypto';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getDb } from '@/db/client';
import { runInTransaction } from '@/db/transaction';
import type { Routine, RoutineDraft, RoutineDraftExercise } from '@/types/routine';
import {
  COPY_ROUTINE_SETS,
  DELETE_ROUTINE,
  DELETE_ROUTINE_EXERCISES,
  DELETE_ROUTINE_SETS,
  INSERT_ROUTINE,
  INSERT_ROUTINE_AT_END,
  INSERT_ROUTINE_EXERCISE,
  INSERT_ROUTINE_SET,
  SELECT_ROUTINE_EXERCISES_FOR_COPY,
  SELECT_ROUTINE_FOR_COPY,
  SHIFT_ROUTINES_BELOW,
  UPDATE_ROUTINE_NAME,
} from './queries';
import type { RoutineExerciseForCopyRow, RoutineForCopyRow } from './rows';

// Write a routine's exercises and their planned sets, in order. The caller runs
// it inside a transaction.
export async function insertRoutineExercises(
  db: SQLiteDatabase,
  routineId: string,
  exercises: RoutineDraftExercise[]
): Promise<void> {
  for (const [orderIndex, e] of exercises.entries()) {
    const routineExerciseId = Crypto.randomUUID();
    await db.runAsync(INSERT_ROUTINE_EXERCISE, [routineExerciseId, routineId, e.exerciseId, orderIndex, e.restSeconds, e.notes, e.supersetId]);
    for (const [setIndex, s] of e.sets.entries()) {
      await db.runAsync(INSERT_ROUTINE_SET, [
        Crypto.randomUUID(),
        routineExerciseId,
        setIndex,
        s.setType,
        s.weightKg,
        s.reps,
        s.distanceKm,
        s.durationSeconds,
      ]);
    }
  }
}

// The editor's Save/Update: the only place a routine is created or changed,
// so nothing is written before the user confirms. Returns the routine id.
export async function saveRoutine(draft: RoutineDraft): Promise<string> {
  const db = await getDb();
  const id = draft.id ?? Crypto.randomUUID();
  await runInTransaction(db, async () => {
    if (draft.id) {
      await db.runAsync(UPDATE_ROUTINE_NAME, [draft.name, id]);
      await db.runAsync(DELETE_ROUTINE_SETS, [id]);
      await db.runAsync(DELETE_ROUTINE_EXERCISES, [id]);
    } else {
      const folderId = draft.folderId ?? null;
      await db.runAsync(INSERT_ROUTINE_AT_END, [id, draft.name, folderId, folderId]);
    }
    await insertRoutineExercises(db, id, draft.exercises);
  });
  return id;
}

// The copy goes right under the original, in the same folder. It is made on the
// spot: tapping "Duplicate Routine" is itself the explicit request.
export async function duplicateRoutine(id: string): Promise<Routine> {
  const db = await getDb();
  const original = await db.getFirstAsync<RoutineForCopyRow>(SELECT_ROUTINE_FOR_COPY, [id]);
  if (!original) throw new Error(`Routine ${id} not found`);
  const copy = { id: Crypto.randomUUID(), name: `${original.name} (Copy)` };
  const exercises = await db.getAllAsync<RoutineExerciseForCopyRow>(SELECT_ROUTINE_EXERCISES_FOR_COPY, [id]);
  await runInTransaction(db, async () => {
    await db.runAsync(SHIFT_ROUTINES_BELOW, [original.folder_id, original.position]);
    await db.runAsync(INSERT_ROUTINE, [copy.id, copy.name, original.folder_id, original.position + 1]);
    for (const e of exercises) {
      const exerciseCopyId = Crypto.randomUUID();
      await db.runAsync(INSERT_ROUTINE_EXERCISE, [exerciseCopyId, copy.id, e.exercise_id, e.order_index, e.rest_seconds, e.notes, e.superset_id]);
      await db.runAsync(COPY_ROUTINE_SETS, [exerciseCopyId, e.id]);
    }
  });
  return copy;
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDb();
  await runInTransaction(db, async () => {
    await db.runAsync(DELETE_ROUTINE_SETS, [id]);
    await db.runAsync(DELETE_ROUTINE_EXERCISES, [id]);
    await db.runAsync(DELETE_ROUTINE, [id]);
  });
}
