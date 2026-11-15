// Exercises the user makes in the app (Create Exercise). user_created marks them:
// is_custom alone can't, the app's own Football, Tennis and Hiking are is_custom too.
// Archiving sets archived_at instead of deleting, so past workouts keep the
// exercise. media_file is its photo or video in the app's documents, media/.
export const sql = `
ALTER TABLE exercises ADD COLUMN user_created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE exercises ADD COLUMN archived_at TEXT;
ALTER TABLE exercises ADD COLUMN media_file TEXT;
ALTER TABLE exercises ADD COLUMN media_kind TEXT CHECK (media_kind IN ('photo', 'video'));
`;
