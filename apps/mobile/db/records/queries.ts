import { marks } from '@/db/placeholders';

// SQL for personal records.

// Every set of some exercises, with what records are measured on; one ? per id.
// The equipment, the workout's start and its one-off gym tell which gym the set
// counts at (lib/gym/timeline.ts recordKey).
export function selectSetsOfExercises(idCount: number): string {
  return `
  SELECT we.exercise_id, s.set_type, s.weight_kg, s.reps, s.distance_km, s.duration_seconds,
         e.equipment, w.start_time, w.gym_id
  FROM sets s
  JOIN workout_exercises we ON we.id = s.workout_exercise_id
  JOIN workouts w ON w.id = we.workout_id
  JOIN exercises e ON e.id = we.exercise_id
  WHERE we.exercise_id IN (${marks(idCount)})`;
}

// The equipment of some exercises; one ? per id.
export function selectEquipmentOf(idCount: number): string {
  return `SELECT id, equipment FROM exercises WHERE id IN (${marks(idCount)})`;
}
