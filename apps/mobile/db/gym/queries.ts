// SQL for the gyms and the days the user changed gym (Settings → Gym).

export const SELECT_GYMS = 'SELECT id, name FROM gyms';

// Oldest first.
export const SELECT_GYM_CHANGES = 'SELECT id, day, gym_id FROM gym_changes ORDER BY day';

// Every workout's start and one-off gym, for the gym screens' counts and dates.
export const SELECT_GYM_WORKOUTS = 'SELECT start_time, gym_id FROM workouts ORDER BY start_time';

export const SELECT_GYM_BY_NAME = 'SELECT id FROM gyms WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1';

export const INSERT_GYM = 'INSERT INTO gyms (id, name) VALUES (?, ?)';

export const RENAME_GYM = 'UPDATE gyms SET name = ? WHERE id = ?';

// A second change on the same day replaces the first.
export const UPSERT_GYM_CHANGE = `
  INSERT INTO gym_changes (id, day, gym_id) VALUES (?, ?, ?)
  ON CONFLICT(day) DO UPDATE SET gym_id = excluded.gym_id`;

export const MOVE_GYM_CHANGE = 'UPDATE gym_changes SET day = ? WHERE id = ?';

export const DELETE_GYM_CHANGE = 'DELETE FROM gym_changes WHERE id = ?';

// Gyms no change and no one-off visit uses any more.
export const DELETE_UNUSED_GYMS = `
  DELETE FROM gyms
  WHERE id NOT IN (SELECT gym_id FROM gym_changes)
    AND id NOT IN (SELECT gym_id FROM workouts WHERE gym_id IS NOT NULL)`;
