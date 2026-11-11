import type { PERIODS } from '@/constants/periods';
import type { BODY_VIEWS, PUSH_PULL_SIDES, RECOVERY_STATES } from '@/constants/stats';
import type { BodyPart, MuscleGroup, RadarMuscle } from '@/types/muscles';

// One logged set with what the statistics need (db/stats/statSets.ts).
export interface StatSet {
  workoutId: string;
  title: string;
  startTime: string;
  durationSeconds: number; // the workout's
  exerciseId: string;
  name: string;
  catalogueId: string | null;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  weightKg: number | null;
  bodyWeightKg?: number | null; // body weight exercises: the body weight logged at the time
  reps: number | null;
  failure?: boolean; // a failure set (always a hard set)
  warmup?: boolean; // a warm-up set (W), counts 0.3
  rir?: number | null; // reps left as logged (from sets.rpe), else estimated
  seconds?: number | null; // the set's TIME (duration exercises)
  distanceKm?: number | null; // the set's distance (Run)
  rpe?: number | null; // as saved; Football keeps its easy / normal / hard here, Run its session RPE
  startMs?: number; // startTime as ms, read once (getStatSets fills it in)
}

export interface StripDay {
  date: Date;
  trained: boolean;
}

export interface MuscleCount {
  muscle: MuscleGroup;
  sets: number;
}

export interface SplitPart {
  part: BodyPart;
  percent: number;
}

export interface MainExercise {
  exerciseId: string;
  name: string;
  catalogueId: string | null;
  workouts: number;
  sets: number;
}

// The Monthly Report for one month (lib/stats/stats.ts).
export interface MonthReport {
  workouts: number;
  durationSeconds: number;
  volumeKg: number;
  sets: number;
  reps: number;
  days: Set<number>; // days of the month trained
  topExercises: MainExercise[];
  muscles: MuscleCount[];
}

// A range menu's period: one of PERIODS.
export type Period = (typeof PERIODS)[number];

// Muscle Distribution's radar over a period (lib/training/distribution.ts).
export interface PeriodLoad {
  perWeek: Record<RadarMuscle, number>;
  total: number; // hard sets on the radar's muscles over the whole period
}

// A side of Push / Pull (lib/training/pushPull.ts): one of PUSH_PULL_SIDES.
export type PushPullSide = (typeof PUSH_PULL_SIDES)[number];

// A muscle on the recovery body map (lib/training/effort.ts): one of RECOVERY_STATES.
export type RecoveryState = (typeof RECOVERY_STATES)[number];

// What the workout's volume is as heavy as, on the share card (lib/training/weightComparison.ts).
export interface WeightComparison {
  name: string;
  emoji: string;
  line: string; // "That's like lifting a T-rex!"
}

// How much one set counts (lib/training/effort.ts).
export interface SetEffort {
  weight: number; // how much the set counts (effortWeight, or WARMUP_SET_WEIGHT)
  failure: boolean; // logged as failure, or with 0 reps left
}

// Push / Pull sets a week (lib/training/pushPull.ts).
export interface PushPull {
  push: number; // sets a week
  pull: number;
  armPush: number;
  armPull: number;
}

// The cards under the radar (lib/training/distribution.ts).
export interface PeriodSummary {
  workouts: number;
  durationSeconds: number;
  volumeKg: number;
  sets: number; // every logged set
}

// What the Statistics body map shows: one of BODY_VIEWS (hard sets or recovery).
export type BodyView = (typeof BODY_VIEWS)[number]['key'];

// The Conditioning card (lib/training/conditioning.ts).
export interface Conditioning {
  thisWeek: number; // minutes, Monday to now
  metWeeks: number; // of the CARDIO_WEEKS_LOOKBACK full weeks before this one
  gamesThisMonth: number;
}
