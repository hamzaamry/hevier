// The photo or video a workout's card shows first (db/feed/cards.ts), by file
// name. Not a workout_media id: Edit Workout writes those rows again with new
// ids, while the file names stay.
export const sql = `
ALTER TABLE workouts ADD COLUMN cover_file TEXT;
`;
