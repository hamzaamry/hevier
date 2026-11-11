// Run readiness (lib/training/runReadiness.ts): the morning check-in, one per day
// of the run slot, and what the app said about a run, kept so the guidance can be
// looked at later. run_feedback is never read by the readiness itself.
// IF NOT EXISTS: running it again (an interrupted upgrade) must not fail.
export const sql = `
CREATE TABLE IF NOT EXISTS run_checkins (
  date        TEXT PRIMARY KEY, -- local yyyy-mm-dd of the run slot
  feel        TEXT CHECK (feel IN ('fresh', 'normal', 'drained')),
  sleep_hours REAL,
  legs_sore   INTEGER NOT NULL DEFAULT 0,
  pain        INTEGER NOT NULL DEFAULT 0,
  sick        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS run_feedback (
  workout_id    TEXT PRIMARY KEY REFERENCES workouts(id),
  verdict_shown TEXT CHECK (verdict_shown IN ('rest', 'strength_only', 'easy', 'quality')),
  legs_felt     TEXT CHECK (legs_felt IN ('heavy', 'ok'))
);
`;
