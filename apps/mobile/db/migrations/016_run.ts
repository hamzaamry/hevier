// Run (constants/run.ts): its own exercise, a distance and a time, with how hard
// it felt in sets.rpe. Only adds the exercise: workouts already saved under other
// names (a Hevy "Running") stay as they are. If the user already made an exercise
// called Run, it is kept as it is and counts as the run exercise (everything finds
// it by name); its type is never changed.
export const sql = `
INSERT OR IGNORE INTO exercises (id, name, type, catalogue_id, is_custom, body_part, target_muscle, secondary_muscles, equipment, category)
VALUES ('run', 'Run', 'distance_duration', NULL, 1, 'cardio', 'cardiovascular system', '[]', 'body weight', 'cardio');
`;
