// Supersets: the exercises of a group share its id, in workout and in routine
// (lib/workout/supersets.ts). NULL = the exercise is on its own.
export const sql = `
ALTER TABLE workout_exercises ADD COLUMN superset_id TEXT;
ALTER TABLE routine_exercises ADD COLUMN superset_id TEXT;
`;
