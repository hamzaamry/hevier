import { dayKey, shiftDays } from '@/lib/date';
import { mean, sampleSd } from '@/lib/math';
import {
  RUN_HRV_BASELINE_DAYS,
  RUN_HRV_MIN_BASELINE,
  RUN_HRV_MIN_RECENT,
  RUN_HRV_RECENT_DAYS,
  RUN_HRV_SWC_SD,
  RUN_RHR_RECENT_DAYS,
  RUN_RHR_RISE_BPM,
} from '@/constants/run';
import type { WearableDay } from '@/types/run';

// Wearable strain for the run readiness: the last week's heart-rate variability
// well below the user's own baseline AND a raised resting heart rate. Both, to
// keep false alarms down. It can only make a verdict easier, never harder than easy.
// Each source (Health Connect, HealthKit) is judged against its own baseline: the
// two measure variability differently and are never mixed.

// The local days from `from` to before `to` days ago (0 = today).
function dayKeys(nowMs: number, from: number, to: number): Set<string> {
  const keys = new Set<string>();
  for (let i = from; i < to; i++) keys.add(dayKey(shiftDays(new Date(nowMs), -i)));
  return keys;
}

function valuesIn(days: WearableDay[], keys: Set<string>, pick: (d: WearableDay) => number | undefined): number[] {
  return days.filter((d) => keys.has(d.date)).flatMap((d) => pick(d) ?? []);
}

function lnHrv(d: WearableDay): number | undefined {
  return d.hrv && d.hrv > 0 ? Math.log(d.hrv) : undefined;
}

function restingHr(d: WearableDay): number | undefined {
  return d.restingHr;
}

function strainFrom(days: WearableDay[], nowMs: number): boolean {
  const recent = dayKeys(nowMs, 0, RUN_HRV_RECENT_DAYS);
  const baseline = dayKeys(nowMs, RUN_HRV_RECENT_DAYS, RUN_HRV_RECENT_DAYS + RUN_HRV_BASELINE_DAYS);
  const hrvNow = valuesIn(days, recent, lnHrv);
  const hrvBase = valuesIn(days, baseline, lnHrv);
  const hrNow = valuesIn(days, dayKeys(nowMs, 0, RUN_RHR_RECENT_DAYS), restingHr);
  const hrBase = valuesIn(days, baseline, restingHr);
  if (hrvNow.length < RUN_HRV_MIN_RECENT || hrvBase.length < RUN_HRV_MIN_BASELINE) return false;
  if (hrNow.length === 0 || hrBase.length < RUN_HRV_MIN_BASELINE) return false;
  const hrvLow = mean(hrvNow) < mean(hrvBase) - RUN_HRV_SWC_SD * sampleSd(hrvBase);
  return hrvLow && mean(hrNow) >= mean(hrBase) + RUN_RHR_RISE_BPM;
}

export function autonomicStrain(days: WearableDay[], nowMs: number): boolean {
  const sources = new Set(days.map((d) => d.source));
  return [...sources].some((source) => strainFrom(days.filter((d) => d.source === source), nowMs));
}
