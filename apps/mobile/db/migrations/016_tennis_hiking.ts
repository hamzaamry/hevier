// Tennis and Hiking: duration exercises like Football, with their own fatigue in the
// recovery view (constants/cardio.ts). Old tennis sessions logged as Sprints stay as they are.
export const sql = `
INSERT OR IGNORE INTO exercises (id, name, type, catalogue_id, is_custom, body_part, target_muscle, secondary_muscles, equipment, category)
VALUES
  ('tennis', 'Tennis', 'duration', NULL, 1, 'cardio', 'cardiovascular system', '[]', 'body weight', 'cardio'),
  ('hiking', 'Hiking', 'duration', NULL, 1, 'cardio', 'cardiovascular system', '[]', 'body weight', 'cardio');
`;
