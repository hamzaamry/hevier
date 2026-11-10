// SQL for the exercise page.

// One exercise, with what its page shows.
export const SELECT_EXERCISE_DETAIL = `
  SELECT id, name, type, equipment, catalogue_id, target_muscle, body_part, secondary_muscles, description, instructions
  FROM exercises WHERE id = ?`;

// Every set ever logged for one exercise, one row per set (or one set-less row
// per workout_exercise), in table order.
export const SELECT_EXERCISE_HISTORY = `
  SELECT we.id AS workout_exercise_id, w.id AS workout_id, w.title, w.start_time, w.end_time, w.description, w.gym_id,
         s.id AS set_id, s.set_index, s.set_type, s.weight_kg, s.reps, s.distance_km, s.duration_seconds, s.rpe
  FROM workout_exercises we
  JOIN workouts w ON w.id = we.workout_id
  LEFT JOIN sets s ON s.workout_exercise_id = we.id
  WHERE we.exercise_id = ?
  ORDER BY we.rowid, s.set_index, s.rowid`;
