import { recovery, setEfforts, startMsOf } from './effort';
import { easyPace, hoursBefore, intensityMinutes, legScore, loadState, runLoad, runsOf, suggestMinutes } from './run';
import { dayKey, shiftDays } from '@/lib/date';
import { clamp } from '@/lib/math';
import { MS_PER_DAY, MS_PER_SECOND } from '@/constants/time';
import { FOOTBALL } from '@/constants/football';
import { RECENTLY_TRAINED_DAYS } from '@/constants/training';
import {
  RUN,
  RUN_BIG_LOAD,
  RUN_EASY_RPE_RANGE,
  RUN_HARD_GAP_HOURS,
  RUN_HARD_MIN_RPE,
  RUN_HARD_SHARE_MAX,
  RUN_LEG_DAY_HELPERS,
  RUN_LEG_DAY_NAME,
  RUN_LEG_DAY_SETS,
  RUN_LEGS_HEAVY,
  RUN_LEGS_PARTIAL,
  RUN_MIN_RUNS,
  RUN_QUALITY_HARD_RANGE,
  RUN_QUALITY_HARD_SHARE,
  RUN_QUALITY_RPE_RANGE,
  RUN_RAMP_CAUTION,
  RUN_RAMP_SPIKE,
  RUN_SLEEP_LOW_H,
  RUN_SLEEP_VERY_LOW_H,
  RUN_VERDICTS,
} from '@/constants/run';
import type {
  CheckIn,
  Gate,
  GateId,
  LegDayPreset,
  LoadState,
  Readiness,
  ReadinessInput,
  RunGuidance,
  RunLog,
  RunLogWhen,
  RunVerdict,
} from '@/types/run';
import type { StatSet } from '@/types/stats';

// Should I run at the slot, and how hard? Every check below can only lower the
// call, never raise it: the verdict is the most cautious one that fired. The
// numbers are in constants/run.ts; the reasons are returned with the verdict so
// the screen can show why. This is a training estimate, not medical advice.

const rank = (verdict: RunVerdict): number => RUN_VERDICTS.indexOf(verdict);

// The most cautious cap among the gates; quality when none fired.
export function verdictOf(gates: Gate[]): RunVerdict {
  return gates.reduce<RunVerdict>((worst, g) => (rank(g.cap) < rank(worst) ? g.cap : worst), 'quality');
}

// The slot of the day `day` falls on: `slotMinutes` after local midnight.
export function slotAt(day: Date, slotMinutes: number): number {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(slotMinutes / 60), slotMinutes % 60).getTime();
}

// The next time the slot comes: today's if it hasn't passed, else tomorrow's.
export function nextSlotMs(now: Date, slotMinutes: number): number {
  const today = slotAt(now, slotMinutes);
  return now.getTime() < today ? today : slotAt(shiftDays(now, 1), slotMinutes);
}

// The slot to call: the next one, or the following day's when a run has already
// been done on the day of that slot (before it): no point asking again.
export function nextRunSlotMs(now: Date, slotMinutes: number, runs: RunLog[]): number {
  const slot = nextSlotMs(now, slotMinutes);
  const day = dayKey(new Date(slot));
  const ranToday = runs.some((r) => r.startMs <= now.getTime() && dayKey(new Date(r.startMs)) === day);
  return ranToday ? slotAt(shiftDays(new Date(slot), 1), slotMinutes) : slot;
}

interface Facts {
  checkIn: CheckIn | null;
  legScore: number;
  load: LoadState;
  runs28: number;
  hardShare28: number;
  lastHard: { hours: number; ratedHard: boolean } | null;
}

function gate(id: GateId, cap: RunVerdict, detail: Gate['detail'] = {}): Gate {
  return { id, cap, detail };
}

function checkInGates(c: CheckIn | null): Gate[] {
  if (!c) return [];
  const gates: Gate[] = [];
  const sleep = c.sleepHours;
  if (c.sick || c.pain) gates.push(gate('ill_or_pain', 'rest'));
  if (c.feel === 'drained' && sleep !== null && sleep < RUN_SLEEP_VERY_LOW_H) gates.push(gate('drained_short_sleep', 'rest', { sleep }));
  if (c.feel === 'drained' || (sleep !== null && sleep < RUN_SLEEP_LOW_H)) gates.push(gate('tired', 'easy', { sleep: sleep ?? '' }));
  return gates;
}

function legGates(score: number): Gate[] {
  if (score >= RUN_LEGS_HEAVY) return [gate('legs_heavy', 'strength_only', { score })];
  if (score >= RUN_LEGS_PARTIAL) return [gate('legs_partial', 'easy', { score })];
  return [];
}

function loadGates(f: Facts): Gate[] {
  const gates: Gate[] = [];
  if (f.lastHard && f.lastHard.hours < RUN_HARD_GAP_HOURS) {
    gates.push(gate('hard_gap', 'easy', { hours: f.lastHard.hours, ratedHard: f.lastHard.ratedHard ? 1 : 0 }));
  }
  if (f.runs28 === 0) gates.push(gate('comeback', 'easy'));
  else if (f.runs28 < RUN_MIN_RUNS) gates.push(gate('base_first', 'easy', { runs: f.runs28 }));
  else gates.push(...settledRunnerGates(f));
  return gates;
}

// The checks that only mean something with a few runs behind them.
function settledRunnerGates(f: Facts): Gate[] {
  const gates: Gate[] = [];
  const { ratio } = f.load;
  if (ratio >= RUN_RAMP_SPIKE) gates.push(gate('ramp_spike', 'easy', { ratio }));
  else if (ratio >= RUN_RAMP_CAUTION) gates.push(gate('ramp', 'easy', { ratio }));
  if (f.hardShare28 >= RUN_HARD_SHARE_MAX) gates.push(gate('too_much_hard', 'easy', { share: f.hardShare28 }));
  return gates;
}

function collectGates(f: Facts): Gate[] {
  const gates = [...checkInGates(f.checkIn), ...legGates(f.legScore), ...loadGates(f)];
  return gates.sort((a, b) => rank(a.cap) - rank(b.cap));
}

function isRatedHard(run: RunLog): boolean {
  return run.rpe >= RUN_HARD_MIN_RPE;
}

// The latest hard run: rated hard, or big enough (minutes × effort) to count as one.
function lastHardRun(runs: RunLog[], slotMs: number): Facts['lastHard'] {
  const hard = runs.filter((r) => isRatedHard(r) || runLoad(r.minutes, r.rpe) >= RUN_BIG_LOAD);
  const last = hard.reduce<RunLog | null>((a, r) => (!a || r.startMs > a.startMs ? r : a), null);
  return last ? { hours: hoursBefore(last, slotMs), ratedHard: isRatedHard(last) } : null;
}

function guidanceFor(verdict: RunVerdict, runs: RunLog[], slotMs: number, spike: boolean): RunGuidance | null {
  if (verdict === 'rest' || verdict === 'strength_only') return null;
  const { minutes, maxMinutes } = suggestMinutes(runs, slotMs, verdict === 'easy' && spike);
  if (verdict === 'quality') {
    const [low, high] = RUN_QUALITY_HARD_RANGE;
    const hardMinutes = clamp(Math.round(RUN_QUALITY_HARD_SHARE * minutes), low, high);
    return { minutes, maxMinutes, hardMinutes, rpe: RUN_QUALITY_RPE_RANGE, paceSecPerKm: null };
  }
  return { minutes, maxMinutes, hardMinutes: null, rpe: RUN_EASY_RPE_RANGE, paceSecPerKm: easyPace(runs, slotMs) };
}

function hasRecentLifting(sets: StatSet[], slotMs: number): boolean {
  const from = slotMs - RECENTLY_TRAINED_DAYS * MS_PER_DAY;
  return sets.some((s) => s.name !== RUN && s.name !== FOOTBALL && startMsOf(s) >= from && startMsOf(s) < slotMs);
}

// The call for the run slot at `slotMs`, from the sets logged before it and the
// check-in for that day (ignored when it is for another day).
export function readinessAt(input: ReadinessInput, slotMs: number): Readiness {
  const slot = new Date(slotMs);
  const checkIn = input.checkIn?.date === dayKey(slot) ? input.checkIn : null;
  const runs = runsOf(input.sets).filter((r) => r.startMs < slotMs);
  const load = loadState(runs, slotMs);
  const intensity = intensityMinutes(runs, slotMs);
  const legs = legScore(recovery(input.sets, setEfforts(input.sets), slot), checkIn?.legsSore);
  const gates = collectGates({
    checkIn,
    legScore: legs,
    load,
    runs28: intensity.runs,
    hardShare28: intensity.hardShare,
    lastHard: lastHardRun(runs, slotMs),
  });
  const verdict = verdictOf(gates);
  const recentLifting = hasRecentLifting(input.sets, slotMs);
  return {
    slotMs,
    verdict,
    gates,
    provisional: checkIn === null,
    confidence: intensity.runs >= RUN_MIN_RUNS && recentLifting ? 'medium' : 'low',
    recentLifting,
    legScore: legs,
    load,
    runs28: intensity.runs,
    hardShare28: intensity.hardShare,
    guidance: guidanceFor(verdict, runs, slotMs, gates.some((g) => g.id === 'ramp_spike')),
  };
}

// The slots from `fromSlotMs` for `days` days, assuming no more lifting or
// running. Only the first can use the check-in: the rest are provisional.
// `slotMinutes` is the user's setting, not read back from the first slot: a slot
// in the hour a clock change skips would otherwise move every later day.
export function forecast(input: ReadinessInput, fromSlotMs: number, days: number, slotMinutes: number): Readiness[] {
  const from = new Date(fromSlotMs);
  return Array.from({ length: days }, (_, i) =>
    readinessAt(i === 0 ? input : { ...input, checkIn: null }, slotAt(shiftDays(from, i), slotMinutes))
  );
}

// When a run being logged started: it ended just now, or it was yesterday at the run slot.
export function loggedRunStartMs(when: RunLogWhen, now: Date, seconds: number, slotMinutes: number): number {
  return when === 'yesterday' ? slotAt(shiftDays(now, -1), slotMinutes) : now.getTime() - seconds * MS_PER_SECOND;
}

// What the readiness said for the morning of the day of `startMs`, before any check-in.
export function verdictShownAt(sets: StatSet[], startMs: number, slotMinutes: number): RunVerdict {
  return readinessAt({ sets, checkIn: null }, slotAt(new Date(startMs), slotMinutes)).verdict;
}

// The first of `days` with a verdict at least `verdict`; null when none.
export function firstAtLeast(days: Readiness[], verdict: RunVerdict): Readiness | null {
  return days.find((d) => rank(d.verdict) >= rank(verdict)) ?? null;
}

// `sets` plus a leg session at `atMs` that isn't saved anywhere: sets to failure
// on the quadriceps with the helper muscles a squat gives. For the what-if.
export function withLegDay(sets: StatSet[], atMs: number, preset: LegDayPreset): StatSet[] {
  const planned: StatSet = {
    workoutId: 'planned-leg-day',
    title: RUN_LEG_DAY_NAME,
    startTime: new Date(atMs).toISOString(),
    startMs: atMs,
    durationSeconds: 0,
    exerciseId: 'planned-leg-day',
    name: RUN_LEG_DAY_NAME,
    catalogueId: null,
    primary: 'Quadriceps',
    secondary: RUN_LEG_DAY_HELPERS,
    weightKg: null,
    reps: null,
    failure: true,
  };
  return [...sets, ...Array.from({ length: RUN_LEG_DAY_SETS[preset] }, () => planned)];
}
