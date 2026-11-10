// The gyms the user trained at and the days they changed gym (Settings → Gym).
// Machine and cable records are kept per gym (lib/gym/timeline.ts). A workout
// has gym_id only for a one-off visit to another gym; otherwise its gym comes
// from the latest gym change before it.
export const sql = `
CREATE TABLE gyms (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL
);
CREATE TABLE gym_changes (
  id      TEXT PRIMARY KEY,
  day     TEXT NOT NULL UNIQUE,
  gym_id  TEXT NOT NULL REFERENCES gyms(id)
);
ALTER TABLE workouts ADD COLUMN gym_id TEXT REFERENCES gyms(id);
`;
