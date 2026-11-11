import type { MuscleGroup } from '@/types/muscles';
import type { RecoveryState } from '@/types/stats';

// Running in the app. A run is logged like any other exercise: one set with a
// distance, a time and how hard it felt (session RPE out of 10, saved in
// sets.rpe). Recovery and Conditioning treat it on its own, as with Football.
// The run readiness (lib/training/runReadiness.ts) turns these numbers into a
// verdict. Every number here is a tunable default, not a measured fact: where a
// value is a convention it says so.

export const RUN = 'Run';

// Names a Hevy export may use for the same thing: the import files these under
// Run. The openGym catalogue's own "run" entry is left out of the library,
// since Run is built in.
export const RUN_IMPORT_NAMES = ['Run', 'Running', 'Running (Outdoor)', 'Running (Treadmill)'] as const;
export const RUN_CATALOGUE_ID = '0685';

// --- Choices (the types in types/run.ts are built from these) ------------------

// Lowest cap first: a gate can only move a verdict down this list.
export const RUN_VERDICTS = ['rest', 'strength_only', 'easy', 'quality'] as const;
export const RUN_KINDS = ['easy', 'moderate', 'hard'] as const;
export const RUN_FEELS = ['fresh', 'normal', 'drained'] as const;
export const RUN_LEGS_FELT = ['heavy', 'ok'] as const;
export const RUN_LEG_DAY_PRESETS = ['light', 'normal', 'heavy'] as const;
export const RUN_WEARABLE_SOURCES = ['health_connect', 'healthkit'] as const;
export const RUN_GATE_IDS = [
  'ill_or_pain',
  'drained_short_sleep',
  'legs_heavy',
  'legs_partial',
  'hard_gap',
  'ramp_spike',
  'ramp',
  'too_much_hard',
  'base_first',
  'comeback',
  'tired',
] as const;

// --- How hard a run felt -----------------------------------------------------------

// Session RPE (1–10): up to the first is easy, from the second hard, between is moderate.
export const RUN_EASY_MAX_RPE = 4;
export const RUN_HARD_MIN_RPE = 7;
// A run saved without RPE (imported, or skipped) counts as this.
export const RUN_DEFAULT_RPE = 4;
// A run this big (minutes × RPE) counts as hard for the gap after a hard run, whatever its RPE.
export const RUN_BIG_LOAD = 300;

// The effort chips in Log Workout, easy to hard.
export const RUN_EFFORT_CHOICES = [2, 3, 4, 6, 8] as const;

// --- Load: minutes × RPE, smoothed over a short and a long window ------------------
// A rough read on "is this week unusually big for me", never a risk score: it
// can only move a verdict down to easy.

export const RUN_ACUTE_DAYS = 7;
export const RUN_CHRONIC_DAYS = 28; // also the window for "runs lately"
export const RUN_LOAD_HISTORY_DAYS = 120; // older days weigh under 0.1% of the long window
export const RUN_CHRONIC_FLOOR = 20; // load a day (about 140 a week): stops a tiny base from inflating the ratio
export const RUN_RAMP_CAUTION = 1.3;
export const RUN_RAMP_SPIKE = 1.5;
// Runs in the last RUN_CHRONIC_DAYS before the load ratio, the hard share and quality mean anything.
export const RUN_MIN_RUNS = 3;

// --- Intensity (convention for a hobby runner) --------------------------------------

export const RUN_HARD_SHARE_MAX = 0.2; // of the minutes in the last RUN_CHRONIC_DAYS
export const RUN_HARD_GAP_HOURS = 72; // no new quality run this soon after a hard one

// --- How long and how hard to run ---------------------------------------------------

export const RUN_PROGRESSION = 1.3; // the next run at most this × the longest in the last RUN_CHRONIC_DAYS (a convention)
export const RUN_MIN_MINUTES = 20; // also the whole run of a comeback
export const RUN_MAX_MINUTES = 90;
export const RUN_MINUTES_STEP = 5; // minutes are rounded to this
export const RUN_RECENT_RUNS = 5; // the usual length is the median of this many latest runs
export const RUN_SPIKE_SHORTEN = 0.75;
export const RUN_QUALITY_HARD_SHARE = 0.35; // of a quality session spent hard
export const RUN_QUALITY_HARD_RANGE = [6, 16] as const; // minutes
export const RUN_EASY_RPE_RANGE = [2, 4] as const;
export const RUN_QUALITY_RPE_RANGE = [7, 8] as const;
export const RUN_PACE_MIN_RUNS = 2; // easy runs with a distance before a pace is shown
export const RUN_PACE_SPREAD_SEC = 10; // the easy pace shown is the median ± this, seconds per km

// --- Legs ---------------------------------------------------------------------------
// What each muscle's recovery state (Recovery view: lib/training/effort.ts,
// extended to the planned run time) adds to the legs score, 0 to 1. The score is
// the worst muscle's, capped at 1 (plus RUN_LEGS_SORE_BUMP when the check-in says
// the legs are sore). A tired leg muscle costs more where it drives running:
//
// - red (fatigued) on hamstrings or quadriceps: the full score, skip the run;
//   on calves or glutes 0.8, still enough to skip; adductors and abductors only 0.3.
// - orange (recovering) is worth 0.5 on quadriceps and hamstrings, 0.4 on calves and
//   glutes: they keep the run easy, never quality.
//
// So four hard quad sets (72 h window) keep a quality run off the table for about
// 83 h. That is cautious on purpose and probably too cautious for someone who
// squats every week. Relax it (for example orange quadriceps to 0.35) only once
// run_feedback shows legs "ok" far more often than "heavy" in that band
// (docs/science/running.md).
export const RUN_LEG_LOAD: Partial<Record<MuscleGroup, Record<RecoveryState, number>>> = {
  Quadriceps: { ready: 0, recovering: 0.5, fatigued: 1 },
  Hamstrings: { ready: 0, recovering: 0.5, fatigued: 1 },
  Calves: { ready: 0, recovering: 0.4, fatigued: 0.8 },
  Glutes: { ready: 0, recovering: 0.4, fatigued: 0.8 },
  Adductors: { ready: 0, recovering: 0.15, fatigued: 0.3 },
  Abductors: { ready: 0, recovering: 0.15, fatigued: 0.3 },
};
export const RUN_LEGS_HEAVY = 0.8; // at least: strength only
export const RUN_LEGS_PARTIAL = 0.4; // at least: easy only
export const RUN_LEGS_SORE_BUMP = 0.4; // the "legs sore" tap

// A leg session planned for the what-if (week view): sets to failure on the quadriceps,
// with the helper muscles a squat gives (lib/training/runReadiness.ts withLegDay).
export const RUN_LEG_DAY_SETS: Record<(typeof RUN_LEG_DAY_PRESETS)[number], number> = { light: 2, normal: 4, heavy: 6 };
export const RUN_LEG_DAY_HELPERS: MuscleGroup[] = ['Glutes', 'Hamstrings', 'Calves'];
export const RUN_LEG_DAY_NAME = 'Planned leg day';

// --- Check-in ---------------------------------------------------------------------

export const RUN_SLEEP_LOW_H = 6; // under: no quality run
export const RUN_SLEEP_VERY_LOW_H = 5.5; // under, and drained: rest
export const RUN_SLOT_DEFAULT_MINUTES = 6 * 60 + 30; // 06:30

// --- Wearables (not connected yet: lib/training/autonomic.ts waits for the wearables change) -----
// Downgrade only: strain needs both a low heart-rate variability week and a raised resting
// heart rate, each measured against the same source's own baseline.

export const RUN_HRV_RECENT_DAYS = 7;
export const RUN_HRV_BASELINE_DAYS = 28; // the days before the recent ones
export const RUN_HRV_MIN_RECENT = 3;
export const RUN_HRV_MIN_BASELINE = 14;
export const RUN_HRV_SWC_SD = 0.5; // recent week this many baseline SDs below the baseline mean
export const RUN_RHR_RECENT_DAYS = 3;
export const RUN_RHR_RISE_BPM = 3; // a guess

// --- Screens ---------------------------------------------------------------------

export const RUN_FORECAST_DAYS = 5;
export const RUN_WHY_PREVIEW = 3; // reasons shown before "More"
export const RUN_SLOT_STEP_MINUTES = 15;
export const MINUTES_PER_DAY = 24 * 60;
export const RUN_WORKOUT_TITLE = 'Run';
// What a quality run is built from, around its hard minutes.
export const RUN_WARMUP_MINUTES = 10;
export const RUN_HARD_BLOCK_MINUTES = 3;
export const RUN_BLOCK_RECOVERY_MINUTES = 2;
// "If you run anyway" after a strength-only call.
export const RUN_ANYWAY_RPE_MAX = 3;
// The check-in's sleep stepper.
export const RUN_SLEEP_START_H = 7;
export const RUN_SLEEP_STEP_H = 0.5;
export const RUN_SLEEP_MIN_H = 3;
export const RUN_SLEEP_MAX_H = 12;
// Log Run: the whole effort scale, and when the run was (just now, or yesterday at the run slot).
export const RUN_EFFORT_SCALE_ROWS = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
] as const;
export const RUN_LOG_WHEN = ['now', 'yesterday'] as const;
