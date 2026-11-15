// SQL for the Add Exercise / Replace Exercise picker.

// Every exercise but the archived ones, A-Z, with how often and when it was last done.
export const SELECT_PICKER_EXERCISES = `
  SELECT e.id, e.name, e.type, e.catalogue_id, e.target_muscle, e.body_part, e.equipment, e.media_file, e.media_kind,
         COUNT(w.id) AS times_done, MAX(w.start_time) AS last_done
  FROM exercises e
  LEFT JOIN workout_exercises we ON we.exercise_id = e.id
  LEFT JOIN workouts w ON w.id = we.workout_id
  WHERE e.archived_at IS NULL
  GROUP BY e.id
  ORDER BY e.name COLLATE NOCASE`;
