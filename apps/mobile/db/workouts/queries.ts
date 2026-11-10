// SQL for one saved workout: writing it (Finish), editing it (Save as Routine, Copy Workout,
// Edit Workout) and deleting it.

// A workout's own fields.
export const SELECT_WORKOUT_FOR_EDIT = `
  SELECT id, title, description, start_time, end_time
  FROM workouts
  WHERE id = ?`;

// A workout's exercises and their sets in order (an exercise without sets comes once, set columns null).
export const SELECT_WORKOUT_EXERCISES_FOR_EDIT = `
  SELECT we.id AS workout_exercise_id, we.exercise_id, e.name, e.type, e.catalogue_id, we.notes,
         s.id AS set_id, s.set_type, s.weight_kg, s.reps, s.distance_km, s.duration_seconds, s.rpe
  FROM workout_exercises we
  JOIN exercises e ON e.id = we.exercise_id
  LEFT JOIN sets s ON s.workout_exercise_id = we.id
  WHERE we.workout_id = ?
  ORDER BY we.order_index, s.set_index`;

// Edit Workout's Save: the workout's own fields.
export const UPDATE_WORKOUT = `
  UPDATE workouts
  SET title = ?, description = ?, start_time = ?, end_time = ?
  WHERE id = ?`;

// Every set of a workout, before its exercises are written again (or the workout is deleted).
export const DELETE_WORKOUT_SETS = `
  DELETE FROM sets
  WHERE workout_exercise_id IN (SELECT id FROM workout_exercises WHERE workout_id = ?)`;

// Every exercise of a workout, before they are written again (or the workout is deleted).
export const DELETE_WORKOUT_EXERCISES = `
  DELETE FROM workout_exercises
  WHERE workout_id = ?`;

// One exercise of a workout.
export const INSERT_WORKOUT_EXERCISE = `
  INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index, notes)
  VALUES (?, ?, ?, ?, ?)`;

// One set of a workout's exercise.
export const INSERT_SET = `
  INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds, rpe)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

// One workout's media file names, so the caller can delete the files.
export const SELECT_WORKOUT_MEDIA_FILES = 'SELECT file FROM workout_media WHERE workout_id = ?';

// Deleting a workout, children first: its media rows.
export const DELETE_WORKOUT_MEDIA = 'DELETE FROM workout_media WHERE workout_id = ?';

// The workout itself, last.
export const DELETE_WORKOUT = 'DELETE FROM workouts WHERE id = ?';

// A finished workout's own fields. gym_id: the gym of a one-off visit, else NULL (the gym comes from the timeline).
export const INSERT_WORKOUT = `
  INSERT INTO workouts (id, title, start_time, end_time, description, gym_id)
  VALUES (?, ?, ?, ?, ?, ?)`;

// One photo or video of a finished workout, at its place.
export const INSERT_WORKOUT_MEDIA = `
  INSERT INTO workout_media (id, workout_id, file, kind, position)
  VALUES (?, ?, ?, ?, ?)`;
