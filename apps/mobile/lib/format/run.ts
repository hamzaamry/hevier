import { pad2 } from './duration';
import { timeLabel } from './date';
import { plural } from './text';
import { dayKey, shiftDays } from '@/lib/date';
import { DATE_LOCALE, SECONDS_PER_MINUTE } from '@/constants/time';
import {
  RUN_ANYWAY_RPE_MAX,
  RUN_BLOCK_RECOVERY_MINUTES,
  RUN_HARD_BLOCK_MINUTES,
  RUN_MIN_MINUTES,
  RUN_WARMUP_MINUTES,
} from '@/constants/run';
import {
  RUN_ANYWAY,
  RUN_BIG_RUN_REASON,
  RUN_EASY_EFFORT,
  RUN_GATE_REASONS,
  RUN_LENGTH,
  RUN_NO_LIFTING_LINE,
  RUN_PACE,
  RUN_QUALITY_EFFORT,
  RUN_REST_PAIN_LINE,
  RUN_VERDICT_LINES,
} from '@/constants/runCopy';
import type { Gate, Readiness, RunGuidance } from '@/types/run';

// The sentences of the run screens, filled in from a Readiness (copy in constants/runCopy.ts).

// Puts values into the {words} of a copy template.
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ''));
}

// 380 → "6:20"
export function paceText(secondsPerKm: number): string {
  return `${Math.floor(secondsPerKm / SECONDS_PER_MINUTE)}:${pad2(secondsPerKm % SECONDS_PER_MINUTE)}`;
}

// One reason a gate fired, in a sentence.
export function gateReason(g: Gate): string {
  const d = g.detail;
  const template = g.id === 'hard_gap' && d.ratedHard === 0 ? RUN_BIG_RUN_REASON : RUN_GATE_REASONS[g.id];
  return fill(template, {
    sleep: d.sleep ?? '',
    hours: Math.round(Number(d.hours)),
    ratio: Number(d.ratio).toFixed(1),
    percent: Math.round(Number(d.share) * 100),
    runs: d.runs ?? '',
    runWord: plural(Number(d.runs), 'run'),
  });
}

// The one sentence under the verdict. Rest for pain or illness never says a walk is fine.
export function verdictLine(r: Readiness): string {
  if (r.verdict === 'rest' && r.gates.some((g) => g.id === 'ill_or_pain')) return RUN_REST_PAIN_LINE;
  return r.verdict === 'strength_only' && !r.recentLifting ? RUN_NO_LIFTING_LINE : RUN_VERDICT_LINES[r.verdict];
}

// The length typed in Log Run, in seconds: whole minutes ("45", "120") and optional seconds ("30").
// null when there are no minutes or seconds, or anything but digits, or seconds past 59.
export function runSeconds(minutesText: string, secondsText: string): number | null {
  const digits = /^\d{1,4}$/;
  const m = minutesText.trim();
  const s = secondsText.trim();
  if ((m && !digits.test(m)) || (s && !digits.test(s))) return null;
  const seconds = Number(s || 0);
  if (seconds >= SECONDS_PER_MINUTE) return null;
  const total = Number(m || 0) * SECONDS_PER_MINUTE + seconds;
  return total > 0 ? total : null;
}

// What to do on the run: the effort, in words, and the length.
export function effortLines(r: Readiness): string[] {
  const g = r.guidance;
  if (!g) return r.verdict === 'strength_only' && r.recentLifting ? [fill(RUN_ANYWAY, { minutes: RUN_MIN_MINUTES, rpe: RUN_ANYWAY_RPE_MAX })] : [];
  const length = fill(RUN_LENGTH, { minutes: g.minutes, max: g.maxMinutes });
  return [r.verdict === 'quality' ? qualityPlan(g) : RUN_EASY_EFFORT, length, ...paceLines(g)];
}

function qualityPlan(g: RunGuidance): string {
  const blocks = Math.max(1, Math.round((g.hardMinutes ?? 0) / RUN_HARD_BLOCK_MINUTES));
  return fill(RUN_QUALITY_EFFORT, {
    warmup: RUN_WARMUP_MINUTES,
    blocks,
    block: RUN_HARD_BLOCK_MINUTES,
    rpeLow: g.rpe[0],
    rpeHigh: g.rpe[1],
    recovery: RUN_BLOCK_RECOVERY_MINUTES,
  });
}

function paceLines(g: RunGuidance): string[] {
  return g.paceSecPerKm ? [fill(RUN_PACE, { from: paceText(g.paceSecPerKm[0]), to: paceText(g.paceSecPerKm[1]) })] : [];
}

// "today 6:30 AM", "tomorrow 6:30 AM", "Fri 6:30 AM".
export function slotLabel(slotMs: number, now: Date): string {
  const slot = new Date(slotMs);
  const key = dayKey(slot);
  const day =
    key === dayKey(now) ? 'today' : key === dayKey(shiftDays(now, 1)) ? 'tomorrow' : slot.toLocaleDateString(DATE_LOCALE, { weekday: 'short' });
  return `${day} ${timeLabel(slot)}`;
}

// "Tue", the weekday of a slot.
export function weekdayShort(slotMs: number): string {
  return new Date(slotMs).toLocaleDateString(DATE_LOCALE, { weekday: 'short' });
}

// 390 → "6:30 AM"
export function minutesLabel(minutesAfterMidnight: number): string {
  return timeLabel(new Date(2000, 0, 1, Math.floor(minutesAfterMidnight / 60), minutesAfterMidnight % 60));
}
