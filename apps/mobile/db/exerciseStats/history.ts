import { getDb } from '@/db/client';
import type { Workout, WorkoutSet } from '@/types/workout';
import { SELECT_EXERCISE_HISTORY } from './queries';
import type { ExerciseHistoryRow } from './rows';

// One query for the whole history (it was 1 + 2 per workout). Rows come per
// workout_exercise in table order, as the old lookups did, then the same stable
// sort by start time. gymId: the one-off visit, if the workout was one.
export async function getExerciseHistory(exerciseId: string): Promise<{ workout: Workout; sets: WorkoutSet[]; gymId: string | null }[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<ExerciseHistoryRow>(SELECT_EXERCISE_HISTORY, [exerciseId]);
  const results: { workout: Workout; sets: WorkoutSet[]; gymId: string | null }[] = [];
  let last: string | null = null;
  for (const r of rows) {
    if (r.workout_exercise_id !== last) {
      last = r.workout_exercise_id;
      results.push({
        workout: { id: r.workout_id, title: r.title, startTime: r.start_time, endTime: r.end_time, description: r.description },
        sets: [],
        gymId: r.gym_id,
      });
    }
    if (r.set_id === null) continue;
    results[results.length - 1].sets.push({
      id: r.set_id, workoutExerciseId: r.workout_exercise_id, setIndex: r.set_index, setType: r.set_type,
      weightKg: r.weight_kg, reps: r.reps, distanceKm: r.distance_km, durationSeconds: r.duration_seconds, rpe: r.rpe,
    });
  }
  results.sort((a, b) => a.workout.startTime.localeCompare(b.workout.startTime));
  return results;
}
