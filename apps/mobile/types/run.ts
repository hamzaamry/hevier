import type {
  RUN_FEELS,
  RUN_GATE_IDS,
  RUN_KINDS,
  RUN_LEG_DAY_PRESETS,
  RUN_LEGS_FELT,
  RUN_LOG_WHEN,
  RUN_VERDICTS,
  RUN_WEARABLE_SOURCES,
} from '@/constants/run';
import type { StatSet } from './stats';

// The call for a run slot, lowest to highest: one of RUN_VERDICTS.
export type RunVerdict = (typeof RUN_VERDICTS)[number];
export type RunKind = (typeof RUN_KINDS)[number];
export type Feel = (typeof RUN_FEELS)[number];
export type LegsFelt = (typeof RUN_LEGS_FELT)[number];
export type LegDayPreset = (typeof RUN_LEG_DAY_PRESETS)[number];
export type WearableSource = (typeof RUN_WEARABLE_SOURCES)[number];
export type GateId = (typeof RUN_GATE_IDS)[number];

// A run, worked out from its workout's Run sets (lib/training/run.ts runsOf).
export interface RunLog {
  workoutId: string;
  startMs: number;
  minutes: number;
  km: number | null;
  rpe: number;
}

// The morning check-in, for the run slot of one day (`date` is that local day, yyyy-mm-dd).
export interface CheckIn {
  date: string;
  feel: Feel | null;
  sleepHours: number | null;
  legsSore: boolean;
  pain: boolean;
  sick: boolean;
}

export interface WearableDay {
  date: string; // local yyyy-mm-dd
  restingHr?: number;
  hrv?: number; // ms; never compared across sources
  source: WearableSource;
}

// Something that capped the verdict; `detail` fills the sentence the screen shows.
export interface Gate {
  id: GateId;
  cap: RunVerdict;
  detail: Record<string, number | string>;
}

// Smoothed run load, per day (minutes × RPE).
export interface LoadState {
  acute: number;
  chronic: number;
  ratio: number;
}

export interface IntensityMinutes {
  easy: number;
  moderate: number;
  hard: number;
  hardShare: number;
  runs: number;
}

export interface RunGuidance {
  minutes: number;
  maxMinutes: number;
  hardMinutes: number | null; // quality only
  rpe: readonly [number, number];
  paceSecPerKm: readonly [number, number] | null; // easy runs, from the user's own easy runs
}

export interface Readiness {
  slotMs: number;
  verdict: RunVerdict;
  gates: Gate[]; // most restrictive first
  provisional: boolean; // no check-in for this slot's day yet
  confidence: 'low' | 'medium'; // never high: the app can't see most of what matters
  recentLifting: boolean; // any lifting in the week before the slot
  legScore: number;
  load: LoadState;
  runs28: number;
  hardShare28: number;
  guidance: RunGuidance | null; // null when the verdict is no run
}

// Run settings, saved as one JSON value in app_state (db/run/settings.ts).
export interface RunSettings {
  // null until the user chooses: then it is on only for someone who has logged a run.
  enabled: boolean | null;
  slotMinutes: number; // minutes after midnight the run usually happens
  disclaimerSeen: boolean;
}

export type RunLogWhen = (typeof RUN_LOG_WHEN)[number];

// A change to the check-in: the fields to set, or a function of the check-in as it is now (a toggle).
export type CheckInChange = Partial<CheckIn> | ((current: CheckIn) => Partial<CheckIn>);

// What the run screens load (hooks/useRunReadiness.ts), before the check-in is applied.
export interface RunLoaded {
  settings: RunSettings;
  sets: StatSet[];
  now: Date;
  slotMs: number; // the next run slot
}

// Everything the run screens show, loaded together (hooks/useRunReadiness.ts).
export interface RunScreenData {
  settings: RunSettings;
  on: boolean; // the feature shows (lib/training/run.ts runIsOn)
  sets: StatSet[];
  checkIn: CheckIn | null;
  now: Date;
  slotMs: number; // the next run slot
  readiness: Readiness; // for that slot
  days: Readiness[]; // the next mornings from that slot, the first being `readiness`
}

// What Log Run shows after saving a run.
export interface SavedRun {
  workoutId: string;
  verdictShown: RunVerdict;
  pace: string | null;
  easy: string | null;
}

// What Log Run saves (db/run/logRun.ts).
export interface LogRunInput {
  startMs: number;
  seconds: number;
  km: number | null;
  rpe: number | null;
  verdictShown: RunVerdict; // what the readiness said for that morning
}

export interface ReadinessInput {
  sets: StatSet[];
  checkIn: CheckIn | null;
}
