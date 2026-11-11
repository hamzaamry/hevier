import { SET_BODY_WEIGHT } from '@/db/bodyWeight/queries';

// SQL for the Statistics screens.

// Every logged set, oldest first, with its workout and exercise.
export const SELECT_STAT_SETS = `
  SELECT w.id AS workout_id, w.title, w.start_time, w.end_time, e.id AS exercise_id, e.name, e.catalogue_id,
         e.target_muscle, e.body_part, e.secondary_muscles, s.weight_kg, s.reps, s.distance_km, s.duration_seconds, s.set_type, s.rpe,
         ${SET_BODY_WEIGHT} AS body_weight_kg
  FROM sets s
  JOIN workout_exercises we ON we.id = s.workout_exercise_id
  JOIN workouts w ON w.id = we.workout_id
  JOIN exercises e ON e.id = we.exercise_id
  ORDER BY w.start_time, we.order_index, s.set_index`;
