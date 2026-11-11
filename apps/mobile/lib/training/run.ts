import { startMsOf } from './effort';
import { dayKey, shiftDays, startOfDay } from '@/lib/date';
import { clamp, median, roundToStep } from '@/lib/math';
import { MS_PER_HOUR, SECONDS_PER_MINUTE } from '@/constants/time';
import {
  RUN,
  RUN_ACUTE_DAYS,
  RUN_CHRONIC_DAYS,
  RUN_CHRONIC_FLOOR,
  RUN_DEFAULT_RPE,
  RUN_EASY_MAX_RPE,
  RUN_HARD_MIN_RPE,
  RUN_LEG_LOAD,
  RUN_LEGS_SORE_BUMP,
  RUN_LOAD_HISTORY_DAYS,
  RUN_MAX_MINUTES,
  RUN_MIN_MINUTES,
  RUN_MINUTES_STEP,
  RUN_PACE_MIN_RUNS,
  RUN_PACE_SPREAD_SEC,
  RUN_PROGRESSION,
  RUN_RECENT_RUNS,
  RUN_SPIKE_SHORTEN,
} from '@/constants/run';
import type { MuscleGroup } from '@/types/muscles';
import type { CheckIn, CheckInChange, IntensityMinutes, LoadState, RunKind, RunLog } from '@/types/run';
import type { RecoveryState, StatSet } from '@/types/stats';

// The maths of run readiness that needs no check-in: how big each run was, how
// the last weeks add up, how tired the running muscles are, how long to run.
// The numbers are in constants/run.ts; lib/training/runReadiness.ts puts them
// together into a verdict.

// Whether the run screens show: for whoever turned them on or off in Settings; until they
// choose, only for someone who has logged a run (a lifter who never runs sees nothing).
export function runIsOn(enabled: boolean | null, hasRun: boolean): boolean {
  return enabled ?? hasRun;
}

const blankCheckIn = (date: string): CheckIn => ({ date, feel: null, sleepHours: null, legsSore: false, pain: false, sick: false });

// The check-in after a tap, built on the one before it (never on what was loaded), so two
// quick taps both stay. `change` is the fields to set, or a function of the check-in as it is.
export function applyCheckIn(current: CheckIn | null, change: CheckInChange, date: string): CheckIn {
  const base = current ?? blankCheckIn(date);
  return { ...base, ...(typeof change === 'function' ? change(base) : change), date: base.date };
}

// Session load in arbitrary units: minutes × how hard it felt (1–10).
export function runLoad(minutes: number, rpe: number): number {
  return minutes * rpe;
}

export function runKind(rpe: number): RunKind {
  return rpe <= RUN_EASY_MAX_RPE ? 'easy' : rpe >= RUN_HARD_MIN_RPE ? 'hard' : 'moderate';
}

// The runs among `sets`, one per workout (several Run sets in a workout are one
// run: minutes and distance add, the hardest effort counts). A run with no
// effort counts as RUN_DEFAULT_RPE; one with no time is left out. A run starts
// when its workout did, so one done at the end of a longer workout is dated early.
export function runsOf(sets: StatSet[]): RunLog[] {
  const runs = new Map<string, RunLog>();
  for (const s of sets) {
    const minutes = (s.seconds ?? 0) / SECONDS_PER_MINUTE;
    if (s.name !== RUN || minutes <= 0) continue;
    const rpe = s.rpe ?? RUN_DEFAULT_RPE;
    const run = runs.get(s.workoutId);
    if (run) {
      run.minutes += minutes;
      if (typeof s.distanceKm === 'number') run.km = (run.km ?? 0) + s.distanceKm;
      run.rpe = Math.max(run.rpe, rpe);
    } else {
      runs.set(s.workoutId, { workoutId: s.workoutId, startMs: startMsOf(s), minutes, km: s.distanceKm ?? null, rpe });
    }
  }
  return [...runs.values()];
}

// The runs in the RUN_CHRONIC_DAYS before `slotMs`, by calendar days.
function recentRuns(runs: RunLog[], slotMs: number): RunLog[] {
  const from = shiftDays(new Date(slotMs), -RUN_CHRONIC_DAYS).getTime();
  return runs.filter((r) => r.startMs >= from && r.startMs < slotMs);
}

// Weight of the newest day in a moving average over `days` days.
function ewmaWeight(days: number): number {
  return 2 / (days + 1);
}

// Short and long moving average of the daily load, through the day before the
// slot's day (a run on the slot's own day is not counted). ratio = short ÷ long,
// the long one never below RUN_CHRONIC_FLOOR.
export function loadState(runs: RunLog[], slotMs: number): LoadState {
  const slotDay = startOfDay(new Date(slotMs));
  const perDay = new Map<string, number>();
  const from = shiftDays(slotDay, -RUN_LOAD_HISTORY_DAYS).getTime();
  for (const r of runs) {
    if (r.startMs < from || r.startMs >= slotDay.getTime()) continue;
    const key = dayKey(new Date(r.startMs));
    perDay.set(key, (perDay.get(key) ?? 0) + runLoad(r.minutes, r.rpe));
  }
  const [wa, wc] = [ewmaWeight(RUN_ACUTE_DAYS), ewmaWeight(RUN_CHRONIC_DAYS)];
  let acute = 0;
  let chronic = 0;
  for (let i = -RUN_LOAD_HISTORY_DAYS; i < 0; i++) {
    const load = perDay.get(dayKey(shiftDays(slotDay, i))) ?? 0;
    acute += wa * (load - acute);
    chronic += wc * (load - chronic);
  }
  return { acute, chronic, ratio: acute / Math.max(chronic, RUN_CHRONIC_FLOOR) };
}

// Minutes by how hard the runs felt, in the RUN_CHRONIC_DAYS before the slot.
export function intensityMinutes(runs: RunLog[], slotMs: number): IntensityMinutes {
  const recent = recentRuns(runs, slotMs);
  const total = { easy: 0, moderate: 0, hard: 0 };
  for (const r of recent) total[runKind(r.rpe)] += r.minutes;
  const minutes = total.easy + total.moderate + total.hard;
  return { ...total, hardShare: minutes > 0 ? total.hard / minutes : 0, runs: recent.length };
}

// How much the legs weigh against running, 0 to 1: the worst running muscle's state
// (RUN_LEG_LOAD), plus the "legs sore" tap.
export function legScore(states: Map<MuscleGroup, RecoveryState>, legsSore = false): number {
  let worst = 0;
  for (const [muscle, load] of Object.entries(RUN_LEG_LOAD) as [MuscleGroup, Record<RecoveryState, number>][]) {
    worst = Math.max(worst, load[states.get(muscle) ?? 'ready']);
  }
  return Math.min(1, worst + (legsSore ? RUN_LEGS_SORE_BUMP : 0));
}

// How long to run: the usual length (median of the latest runs) up to
// RUN_PROGRESSION × the longest lately; shorter after a spike. A runner with
// none lately gets the shortest run.
export function suggestMinutes(runs: RunLog[], slotMs: number, spike: boolean): { minutes: number; maxMinutes: number } {
  const recent = recentRuns(runs, slotMs);
  if (recent.length === 0) return { minutes: RUN_MIN_MINUTES, maxMinutes: RUN_MIN_MINUTES };
  const longest = Math.max(...recent.map((r) => r.minutes));
  const maxMinutes = clamp(Math.round(RUN_PROGRESSION * longest), RUN_MIN_MINUTES, RUN_MAX_MINUTES);
  const latest = [...recent].sort((a, b) => b.startMs - a.startMs).slice(0, RUN_RECENT_RUNS);
  const usual = roundToStep(median(latest.map((r) => r.minutes)), RUN_MINUTES_STEP);
  const minutes = Math.max(RUN_MIN_MINUTES, Math.min(usual, maxMinutes));
  return { minutes: spike ? Math.max(RUN_MIN_MINUTES, roundToStep(RUN_SPIKE_SHORTEN * minutes, RUN_MINUTES_STEP)) : minutes, maxMinutes };
}

// The range (seconds per km) the user's own easy runs lately fall in; null with too few.
export function easyPace(runs: RunLog[], slotMs: number): [number, number] | null {
  const paces = recentRuns(runs, slotMs)
    .filter((r) => r.rpe <= RUN_EASY_MAX_RPE && r.km !== null && r.km > 0)
    .map((r) => (r.minutes * SECONDS_PER_MINUTE) / (r.km as number));
  if (paces.length < RUN_PACE_MIN_RUNS) return null;
  const mid = Math.round(median(paces));
  return [mid - RUN_PACE_SPREAD_SEC, mid + RUN_PACE_SPREAD_SEC];
}

// Hours from a run's start to the slot.
export function hoursBefore(run: RunLog, slotMs: number): number {
  return (slotMs - run.startMs) / MS_PER_HOUR;
}
