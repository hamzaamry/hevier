import { cardioActivity, cardioFatigue, rpeToRating } from './cardio';
import { MS_PER_DAY, MS_PER_HOUR, SECONDS_PER_MINUTE } from '@/constants/time';
import {
  HARD_RIR,
  MAX_SETS_PER_SESSION,
  MIN_SET_WEIGHT,
  RECENTLY_TRAINED_DAYS,
  RECOVERY_WINDOWS,
  SECONDARY_SHARE,
  WARMUP_SET_WEIGHT,
  WEIGHT_PER_RIR,
  ZONES,
} from '@/constants/training';
import { FOOTBALL_FATIGUED, FOOTBALL_RECOVERING } from '@/constants/cardio';
import type { MuscleGroup } from '@/types/muscles';
import type { RecoveryState, SetEffort, StatSet } from '@/types/stats';

// How much each set counts, how many sets each muscle got this week, and how
// recovered it is now. The numbers (and the studies behind them) are in
// constants/training.ts.

// When the set's workout started, in ms (NaN when unreadable, like Date.parse).
export function startMsOf(s: StatSet): number {
  return s.startMs ?? Date.parse(s.startTime);
}

// 1 for a hard set (failure, or within HARD_RIR of it), down to MIN_SET_WEIGHT.
export function effortWeight(rir: number | null, failure = false): number {
  if (failure || rir === null || rir <= HARD_RIR) return 1;
  return Math.max(MIN_SET_WEIGHT, 1 - (rir - HARD_RIR) * WEIGHT_PER_RIR);
}

// Each set's effort, only from what was logged, never guessed (the user trains
// to failure, and a guess from past bests marked failure sets as easy):
// W = WARMUP_SET_WEIGHT; F = 1; reps left logged = effortWeight; nothing logged = 1.
// Memoised per sets array (the statistics screens share getStatSets' array,
// db/historyCache.ts): the array must not change afterwards, nor the result.
export function setEfforts(sets: StatSet[]): SetEffort[] {
  let efforts = effortsMemo.get(sets);
  if (!efforts) {
    efforts = sets.map(effortOf);
    effortsMemo.set(sets, efforts);
  }
  return efforts;
}

function effortOf(s: StatSet): SetEffort {
  if (s.warmup) return { weight: WARMUP_SET_WEIGHT, failure: false };
  if (s.failure) return { weight: 1, failure: true };
  if (s.rir !== null && s.rir !== undefined) return { weight: effortWeight(s.rir), failure: s.rir === 0 };
  return { weight: 1, failure: false };
}

const effortsMemo = new WeakMap<StatSet[], SetEffort[]>();
const weightsMemo = new WeakMap<StatSet[], number[]>();

export function effortWeights(sets: StatSet[]): number[] {
  let weights = weightsMemo.get(sets);
  if (!weights) {
    weights = setEfforts(sets).map((e) => e.weight);
    weightsMemo.set(sets, weights);
  }
  return weights;
}

// Hard sets per muscle among `sets` (weights from effortWeights over the
// whole history, same order): primary 1, secondary 0.5, each muscle capped at
// MAX_SETS_PER_SESSION per workout.
export function hardSets(sets: StatSet[], weights: number[], from: Date, to: Date): Map<MuscleGroup, number> {
  const perSession = new Map<string, number>(); // `${workout}|${muscle}`
  sets.forEach((s, i) => {
    const t = startMsOf(s);
    if (t < from.getTime() || t >= to.getTime()) return;
    const add = (m: MuscleGroup, v: number) => {
      const key = `${s.workoutId}|${m}`;
      perSession.set(key, (perSession.get(key) ?? 0) + v);
    };
    add(s.primary, weights[i]);
    for (const m of s.secondary) add(m, weights[i] * SECONDARY_SHARE);
  });
  const total = new Map<MuscleGroup, number>();
  for (const [key, v] of perSession) {
    const muscle = key.slice(key.indexOf('|') + 1) as MuscleGroup;
    total.set(muscle, (total.get(muscle) ?? 0) + Math.min(v, MAX_SETS_PER_SESSION));
  }
  return total;
}

// 0 = none, 1–3 = ZONES index + 1. Rounded to one decimal first, as shown.
export function zoneOf(hard: number): number {
  hard = Math.round(hard * 10) / 10;
  if (hard <= 0) return 0;
  let zone = 1;
  ZONES.forEach((z, i) => {
    if (hard >= z.from) zone = i + 1;
  });
  return zone;
}

// --- Recovery ----------------------------------------------------------------

// Each muscle a workout trained gets a window from RECOVERY_WINDOWS, from the
// sets it got (counted as for the weekly sets).
const RECENT = RECENTLY_TRAINED_DAYS * MS_PER_DAY;

const RANK: Record<RecoveryState, number> = { ready: 0, recovering: 1, fatigued: 2 };

// The window for `sets` on a muscle in one workout; null when too few.
export function recoveryWindow(sets: number): { redHours: number; hours: number } | null {
  let found: { redHours: number; hours: number } | null = null;
  for (const w of RECOVERY_WINDOWS) if (sets >= w.from) found = { redHours: w.redHours, hours: w.hours };
  return found;
}

// A cardio session's minutes: its TIME, else how long the workout lasted.
function cardioMinutes(s: StatSet): number {
  return (s.seconds || s.durationSeconds) / SECONDS_PER_MINUTE;
}

// Each muscle's state now. Every workout in the last 72 h gives a state, the
// worst one counts. Cardio (football, tennis, running...) keeps its own curve (lib/training/cardio.ts):
// fatigue above FOOTBALL_FATIGUED = red, from FOOTBALL_RECOVERING = orange. Muscles not trained in the
// last week are left out (nothing to recover from).
export function recovery(sets: StatSet[], efforts: SetEffort[], now = new Date()): Map<MuscleGroup, RecoveryState> {
  const t0 = now.getTime();
  const longest = RECOVERY_WINDOWS[RECOVERY_WINDOWS.length - 1].hours * MS_PER_HOUR;
  const perSession = new Map<string, { muscle: MuscleGroup; sets: number; at: number }>();
  const cardio = new Map<MuscleGroup, number>();
  const result = new Map<MuscleGroup, RecoveryState>();
  const worse = (m: MuscleGroup, state: RecoveryState) => {
    const was = result.get(m);
    if (!was || RANK[state] > RANK[was]) result.set(m, state);
  };
  sets.forEach((s, i) => {
    const t = startMsOf(s);
    if (!(t <= t0 && t0 - t <= RECENT)) return;
    const activity = cardioActivity(s.name);
    if (activity) {
      for (const [m, v] of cardioFatigue(activity, cardioMinutes(s), rpeToRating(s.rpe), (t0 - t) / MS_PER_HOUR)) {
        cardio.set(m, (cardio.get(m) ?? 0) + v);
      }
      return;
    }
    for (const m of [s.primary, ...s.secondary]) worse(m, 'ready');
    if (t0 - t > longest) return;
    const add = (m: MuscleGroup, v: number) => {
      const key = `${s.workoutId}|${m}`;
      const e = perSession.get(key) ?? { muscle: m, sets: 0, at: t };
      e.sets += v;
      perSession.set(key, e);
    };
    add(s.primary, efforts[i].weight);
    for (const m of s.secondary) add(m, efforts[i].weight * SECONDARY_SHARE);
  });
  for (const { muscle, sets: n, at } of perSession.values()) {
    const w = recoveryWindow(n);
    if (!w) continue;
    const hours = (t0 - at) / MS_PER_HOUR;
    worse(muscle, hours < w.redHours ? 'fatigued' : hours < w.hours ? 'recovering' : 'ready');
  }
  for (const [m, v] of cardio) worse(m, v > FOOTBALL_FATIGUED ? 'fatigued' : v >= FOOTBALL_RECOVERING ? 'recovering' : 'ready');
  return result;
}
