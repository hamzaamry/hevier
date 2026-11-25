import { getDb } from '@/db/client';
import { getWorkoutSessions } from '@/db/sessions/sessions';
import type { RoutinePage, RoutinePageExercise } from '@/types/routine';
import { SELECT_ROUTINE, SELECT_ROUTINE_EXERCISES_WITH_SETS } from './queries';
import type { RoutineExerciseSetRow, RoutineRow } from './rows';

// Everything the routine page shows.
export async function getRoutinePage(id: string): Promise<RoutinePage | null> {
  const db = await getDb();
  const routine = await db.getFirstAsync<RoutineRow>(SELECT_ROUTINE, [id]);
  if (!routine) return null;

  const rows = await db.getAllAsync<RoutineExerciseSetRow>(SELECT_ROUTINE_EXERCISES_WITH_SETS, [id]);
  const exercises: RoutinePageExercise[] = [];
  for (const row of rows) {
    let exercise = exercises.at(-1);
    if (exercise?.id !== row.re_id) {
      exercise = {
        id: row.re_id,
        exerciseId: row.exercise_id,
        catalogueId: row.catalogue_id,
        name: row.name,
        type: row.type,
        restSeconds: row.rest_seconds,
        supersetId: row.superset_id,
        sets: [],
      };
      exercises.push(exercise);
    }
    if (row.set_index !== null) {
      exercise.sets.push({
        setIndex: row.set_index,
        setType: row.set_type ?? 'normal',
        weightKg: row.weight_kg,
        reps: row.reps,
        distanceKm: row.distance_km,
        durationSeconds: row.duration_seconds,
      });
    }
  }

  const sessions = await getWorkoutSessions(routine.name);

  return { id: routine.id, name: routine.name, exercises, sessions };
}
