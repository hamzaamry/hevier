// SQL for routines and their folders (Workout tab, routine page, routine editor).

// --- Folders ---

// Every folder, top to bottom.
export const SELECT_FOLDERS = 'SELECT id, name, collapsed FROM routine_folders ORDER BY position';

// Every routine with its exercise names in order (a routine without exercises comes once, exercise null).
export const SELECT_ROUTINES_WITH_EXERCISES = `
  SELECT r.id, r.name, r.folder_id, e.name AS exercise
  FROM routines r
  LEFT JOIN routine_exercises re ON re.routine_id = r.id
  LEFT JOIN exercises e ON e.id = re.exercise_id
  ORDER BY r.position, r.name, re.order_index`;

// Fold or unfold one folder.
export const UPDATE_FOLDER_COLLAPSED = 'UPDATE routine_folders SET collapsed = ? WHERE id = ?';

// A new folder, above the existing ones.
export const INSERT_FOLDER_ON_TOP = `
  INSERT INTO routine_folders (id, name, position)
  VALUES (?, ?, (SELECT COALESCE(MIN(position) - 1, 0) FROM routine_folders))`;

// Rename one folder.
export const UPDATE_FOLDER_NAME = 'UPDATE routine_folders SET name = ? WHERE id = ?';

// The position after the last routine in "My Routines".
export const SELECT_NEXT_UNFILED_POSITION = `
  SELECT COALESCE(MAX(position) + 1, 0) AS next
  FROM routines
  WHERE folder_id IS NULL`;

// A deleted folder's routines go to "My Routines", shifted by the given amount.
export const MOVE_FOLDER_ROUTINES_TO_UNFILED = `
  UPDATE routines
  SET folder_id = NULL, position = position + ?
  WHERE folder_id = ?`;

// Delete one folder.
export const DELETE_FOLDER = 'DELETE FROM routine_folders WHERE id = ?';

// One folder's place in the list.
export const UPDATE_FOLDER_POSITION = 'UPDATE routine_folders SET position = ? WHERE id = ?';

// --- Moving a routine ---

// The other routines of a folder (null = My Routines), in order.
export const SELECT_OTHER_ROUTINES_IN_FOLDER = `
  SELECT id FROM routines
  WHERE folder_id IS ? AND id != ?
  ORDER BY position, name`;

// Put a routine in a folder.
export const UPDATE_ROUTINE_FOLDER = 'UPDATE routines SET folder_id = ? WHERE id = ?';

// One routine's place in its folder.
export const UPDATE_ROUTINE_POSITION = 'UPDATE routines SET position = ? WHERE id = ?';

// --- Writing a routine ---

// The fields of a routine needed to copy it.
export const SELECT_ROUTINE_FOR_COPY = 'SELECT name, folder_id, position FROM routines WHERE id = ?';

// A routine's exercises in order, to copy them.
export const SELECT_ROUTINE_EXERCISES_FOR_COPY = `
  SELECT id, exercise_id, order_index, rest_seconds, notes, superset_id
  FROM routine_exercises
  WHERE routine_id = ?
  ORDER BY order_index`;

// Make room under a routine in its folder.
export const SHIFT_ROUTINES_BELOW = `
  UPDATE routines
  SET position = position + 1
  WHERE folder_id IS ? AND position > ?`;

// A routine at a given place.
export const INSERT_ROUTINE = 'INSERT INTO routines (id, name, folder_id, position) VALUES (?, ?, ?, ?)';

// A new routine at the end of its folder (the folder id is given twice).
export const INSERT_ROUTINE_AT_END = `
  INSERT INTO routines (id, name, folder_id, position)
  VALUES (?, ?, ?, (SELECT COALESCE(MAX(position) + 1, 0) FROM routines WHERE folder_id IS ?))`;

// Rename one routine.
export const UPDATE_ROUTINE_NAME = 'UPDATE routines SET name = ? WHERE id = ?';

// One exercise of a routine.
export const INSERT_ROUTINE_EXERCISE = `
  INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index, rest_seconds, notes, superset_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)`;

// One planned set of a routine's exercise.
export const INSERT_ROUTINE_SET = `
  INSERT INTO routine_sets (id, routine_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

// Copy every planned set of one routine exercise to another, with new ids.
export const COPY_ROUTINE_SETS = `
  INSERT INTO routine_sets (id, routine_exercise_id, set_index, set_type, weight_kg, reps, distance_km, duration_seconds)
  SELECT lower(hex(randomblob(16))), ?, set_index, set_type, weight_kg, reps, distance_km, duration_seconds
  FROM routine_sets
  WHERE routine_exercise_id = ?`;

// Every planned set of a routine.
export const DELETE_ROUTINE_SETS = `
  DELETE FROM routine_sets
  WHERE routine_exercise_id IN (SELECT id FROM routine_exercises WHERE routine_id = ?)`;

// Every exercise of a routine.
export const DELETE_ROUTINE_EXERCISES = 'DELETE FROM routine_exercises WHERE routine_id = ?';

// The routine itself.
export const DELETE_ROUTINE = 'DELETE FROM routines WHERE id = ?';

// --- Routine page and editor ---

// One routine's id and name.
export const SELECT_ROUTINE = 'SELECT id, name FROM routines WHERE id = ?';

// A routine's exercises with their planned sets, in order (an exercise without sets comes once, set columns null).
export const SELECT_ROUTINE_EXERCISES_WITH_SETS = `
  SELECT re.id AS re_id, re.exercise_id, e.catalogue_id, e.name, e.type, re.rest_seconds, re.superset_id,
         rs.set_index, rs.set_type, rs.weight_kg, rs.reps, rs.distance_km, rs.duration_seconds
  FROM routine_exercises re
  JOIN exercises e ON e.id = re.exercise_id
  LEFT JOIN routine_sets rs ON rs.routine_exercise_id = re.id
  WHERE re.routine_id = ?
  ORDER BY re.order_index, rs.set_index`;

// The notes of a routine's exercises.
export const SELECT_ROUTINE_EXERCISE_NOTES = 'SELECT id, notes FROM routine_exercises WHERE routine_id = ?';
