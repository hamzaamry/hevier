import { PERIOD_LABELS } from '@/constants/labels';
import { RUN_SLOT_DEFAULT_MINUTES } from '@/constants/run';
import type { RunSettings } from '@/types/run';
import type { WorkoutSettings } from '@/types/workoutSettings';

// Every default setting and first choice a screen opens with, in one place.
// Change one here and the screen opens on the new value.

// Workout Settings before the user changes any (db/workoutSettings.ts); a
// setting added later falls back to its value here.
export const DEFAULT_WORKOUT_SETTINGS: WorkoutSettings = {
  defaultRestSeconds: null, // no rest timer unless the exercise has its own
  keepAwake: false, // the screen may sleep in Log Workout
  repsLeft: true, // ask "Reps left?" after the last set
  inlineTimer: true, // ▶ on timed sets
  prAlert: true, // toast, chime and buzz on a new record
};

// Run settings before the user changes any (db/run/settings.ts).
export const DEFAULT_RUN_SETTINGS: RunSettings = {
  enabled: null, // off until the user turns it on or logs a run
  slotMinutes: RUN_SLOT_DEFAULT_MINUTES,
  disclaimerSeen: false, // the medical note is shown on first open
};

// The period and metric each chart opens on (labels from lib/training/periods.ts PERIODS
// and constants/profile.ts PROFILE_RANGES).
export const CHART_DEFAULTS = {
  profileMetric: 'duration', // Profile chart
  profilePeriod: PERIOD_LABELS.last3Months, // Profile chart
  routineMetric: 'volume', // routine page chart
  routinePeriod: PERIOD_LABELS.last3Months, // routine page chart
  exercisePeriod: PERIOD_LABELS.last3Months, // exercise page chart
  bodyWeightPeriod: PERIOD_LABELS.allTime, // Profile → Body weight chart (weights are logged now and then)
  setCountPeriod: PERIOD_LABELS.last30Days, // Statistics → Set Count
  distributionPeriod: PERIOD_LABELS.last30Days, // Statistics → Muscle Distribution
} as const;

// The view each screen opens on.
export const VIEW_DEFAULTS = {
  calendar: 'Month', // Calendar: Month, Year or Multi-year
  statisticsBody: 'hard', // Statistics body map: hard sets ('hard') or 'recovery'
} as const;

// The Clock sheet (lib/clock.ts) before the user touches it.
export const CLOCK_DEFAULTS = {
  mode: 'timer', // opens on the timer, not the stopwatch
  timerSeconds: 60, // 01:00
} as const;
