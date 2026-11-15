// SQL for exercises the user makes (Create / Edit Exercise, the exercise page's ⋯).

// A new exercise: made by the user, no catalogue entry.
export const INSERT_EXERCISE = `
  INSERT INTO exercises (id, name, type, body_part, target_muscle, secondary_muscles, equipment, media_file, media_kind,
                         catalogue_id, is_custom, user_created)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, 1)`;

// Edit Exercise's Save (the type is passed back unchanged when it is locked).
export const UPDATE_EXERCISE = `
  UPDATE exercises
  SET name = ?, type = ?, body_part = ?, target_muscle = ?, secondary_muscles = ?, equipment = ?, media_file = ?, media_kind = ?
  WHERE id = ?`;

// One exercise as the form needs it.
export const SELECT_EXERCISE_FOR_EDIT = `
  SELECT id, name, type, body_part, target_muscle, secondary_muscles, equipment, media_file, media_kind
  FROM exercises WHERE id = ?`;

// Another exercise with this name, any case, archived ones included.
export const SELECT_BY_NAME = 'SELECT id, archived_at FROM exercises WHERE name = ? COLLATE NOCASE AND id <> ? LIMIT 1';

// Whether a workout, a routine or the workout in progress (saved in app_state)
// uses the exercise: its type can't change then.
export const SELECT_EXERCISE_USED = `
  SELECT 1 AS used WHERE EXISTS (SELECT 1 FROM workout_exercises WHERE exercise_id = ?)
                      OR EXISTS (SELECT 1 FROM routine_exercises WHERE exercise_id = ?)
                      OR EXISTS (SELECT 1 FROM app_state WHERE value LIKE '%' || ? || '%')`;

export const ARCHIVE_EXERCISE = 'UPDATE exercises SET archived_at = ? WHERE id = ?';
export const RESTORE_EXERCISE = 'UPDATE exercises SET archived_at = NULL WHERE id = ?';
