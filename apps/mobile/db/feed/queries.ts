import { SET_BODY_WEIGHT } from '@/db/bodyWeight/queries';

// SQL for the workout cards (Home feed, Profile "Workouts", the workout page).

// Every workout, oldest first: the cards' title, date and duration.
export const SELECT_WORKOUTS = `
  SELECT id, title, start_time, end_time
  FROM workouts
  ORDER BY start_time`;

// Every exercise of every workout with its sets (no set = one row with null set columns), in order.
export const SELECT_WORKOUT_SETS = `
  SELECT w.id AS workout_id, we.id AS workout_exercise_id, we.exercise_id, e.name, e.type, e.catalogue_id, we.notes,
         s.id AS set_id, s.set_type, s.weight_kg, s.reps, s.duration_seconds, s.distance_km,
         e.equipment, w.start_time, w.gym_id,
         ${SET_BODY_WEIGHT} AS body_weight_kg
  FROM workouts w
  JOIN workout_exercises we ON we.workout_id = w.id
  JOIN exercises e ON e.id = we.exercise_id
  LEFT JOIN sets s ON s.workout_exercise_id = we.id
  ORDER BY w.start_time, we.order_index, s.set_index`;

// One workout's description, for its page.
export const SELECT_WORKOUT_DESCRIPTION = 'SELECT description FROM workouts WHERE id = ?';

// One workout's photos and videos, in order, for its page.
export const SELECT_WORKOUT_MEDIA = 'SELECT file, kind FROM workout_media WHERE workout_id = ? ORDER BY position';
