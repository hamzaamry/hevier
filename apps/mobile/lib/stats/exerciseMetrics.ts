import { clock, recordDurationLabel } from '@/lib/format/duration';
import { EXERCISE_CHART_LABELS, EXERCISE_RECORD_LABELS } from '@/constants/labels';
import { round2 } from '@/lib/format/weight';
import { epley1RM } from '@/lib/stats/records';
import type { ExerciseSession, ExerciseType, Metric, Unit } from '@/types/exercise';
import type { WorkoutSet } from '@/types/workout';
import { setVolumeKg } from '@/lib/volume';

// The exercise page's maths: the chart's metrics, the Personal Records under it,
// and how values, axis ticks and sets are written.

const max = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x !== null && x > 0);
  return v.length ? Math.max(...v) : null;
};
const sum = (values: (number | null)[]) => {
  const v = values.filter((x): x is number => x !== null && x > 0);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};
const lifted = (sets: WorkoutSet[]) => sets.filter((s) => (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0);

// Chips under the chart, per exercise type.
export const METRICS: Record<ExerciseType, Metric[]> = {
  weight_reps: [
    { label: EXERCISE_CHART_LABELS.heaviestWeight, unit: 'kg', value: (s) => max(lifted(s).map((x) => x.weightKg)) },
    { label: EXERCISE_CHART_LABELS.oneRepMax, unit: 'kg', value: (s) => max(lifted(s).map((x) => epley1RM(x.weightKg!, x.reps!))) },
    { label: EXERCISE_CHART_LABELS.bestSetVolume, unit: 'kg', value: (s) => max(lifted(s).map((x) => setVolumeKg(x.weightKg, x.reps))) },
    { label: EXERCISE_CHART_LABELS.sessionVolume, unit: 'kg', value: (s) => sum(lifted(s).map((x) => setVolumeKg(x.weightKg, x.reps))) },
  ],
  reps_only: [
    { label: EXERCISE_CHART_LABELS.mostRepsSet, unit: 'reps', value: (s) => max(s.map((x) => x.reps)) },
    { label: EXERCISE_CHART_LABELS.sessionReps, unit: 'reps', value: (s) => sum(s.map((x) => x.reps)) },
  ],
  duration: [
    { label: EXERCISE_CHART_LABELS.bestTime, unit: 'seconds', value: (s) => max(s.map((x) => x.durationSeconds)) },
    { label: EXERCISE_CHART_LABELS.totalTime, unit: 'seconds', value: (s) => sum(s.map((x) => x.durationSeconds)) },
  ],
  distance_duration: [
    { label: EXERCISE_CHART_LABELS.bestDistance, unit: 'km', value: (s) => max(s.map((x) => x.distanceKm)) },
    { label: EXERCISE_CHART_LABELS.sessionDistance, unit: 'km', value: (s) => sum(s.map((x) => x.distanceKm)) },
  ],
};

// Personal Records under the chart: the best of each over all sessions.
const RECORDS: Record<ExerciseType, { label: string; metric: Metric }[]> = {
  weight_reps: [
    { label: EXERCISE_RECORD_LABELS.heaviestWeight, metric: METRICS.weight_reps[0] },
    { label: EXERCISE_RECORD_LABELS.best1Rm, metric: METRICS.weight_reps[1] },
    { label: EXERCISE_RECORD_LABELS.bestSetVolume, metric: METRICS.weight_reps[2] },
    { label: EXERCISE_RECORD_LABELS.bestSessionVolume, metric: METRICS.weight_reps[3] },
  ],
  reps_only: [
    { label: EXERCISE_RECORD_LABELS.bestSet, metric: METRICS.reps_only[0] },
    { label: EXERCISE_RECORD_LABELS.mostSessionReps, metric: METRICS.reps_only[1] },
  ],
  duration: [{ label: EXERCISE_RECORD_LABELS.bestTime, metric: METRICS.duration[0] }],
  distance_duration: [
    { label: EXERCISE_RECORD_LABELS.bestDistance, metric: METRICS.distance_duration[0] },
    { label: EXERCISE_RECORD_LABELS.bestSessionDistance, metric: METRICS.distance_duration[1] },
  ],
};

const workingSets = (sets: WorkoutSet[]) => sets.filter((s) => s.setType !== 'warmup');

// With `gymKey` (a machine or cable exercise once the user has changed gym):
// `value` is the best at that gym ('-' when nothing yet) and `allGyms` the best
// over every gym.
export function personalRecords(
  type: ExerciseType,
  sessions: ExerciseSession[],
  gymKey?: string
): { label: string; value: string; allGyms?: string }[] {
  const best = (list: ExerciseSession[], metric: Metric) => max(list.map((s) => metric.value(workingSets(s.sets))));
  return RECORDS[type]
    .map(({ label, metric }) => ({ label, unit: metric.unit, all: best(sessions, metric), here: best(sessions.filter((s) => s.gymKey === gymKey), metric) }))
    .filter((r) => r.all !== null)
    .map((r) => {
      if (gymKey === undefined) return { label: r.label, value: formatValue(r.all!, r.unit) };
      return { label: r.label, value: r.here === null ? '-' : formatValue(r.here, r.unit), allGyms: formatValue(r.all!, r.unit) };
    });
}

// The chart of a per-gym exercise: points from other gyms than the current one
// are faded, and the line breaks wherever the gym changes between two points.
export function gymChartMarks(keys: string[], currentKey: string): { faded: boolean[]; breaks: number[] } {
  return {
    faded: keys.map((k) => k !== currentKey),
    breaks: keys.flatMap((k, i) => (i > 0 && k !== keys[i - 1] ? [i] : [])),
  };
}

// One point per session that has something to plot.
export function chartPoints(sessions: ExerciseSession[], metric: Metric) {
  return sessions
    .map((s) => ({ session: s, value: metric.value(workingSets(s.sets)) }))
    .filter((p): p is { session: ExerciseSession; value: number } => p.value !== null);
}

// "106.67 kg", "15 reps", "7min 50s", "1h 12min 38s", "5.5 km"
export function formatValue(value: number, unit: Unit): string {
  if (unit === 'kg') return `${round2(value)} kg`;
  if (unit === 'reps') return `${Math.round(value)} reps`;
  if (unit === 'km') return `${round2(value)} km`;
  return recordDurationLabel(value);
}

// Y axis labels: "15 reps", "900 s", "100 kg", "5 km".
export function formatTick(value: number, unit: Unit): string {
  if (unit === 'seconds') return `${Math.round(value)} s`;
  if (unit === 'reps') return `${Math.round(value)} reps`;
  return `${round2(value)} ${unit}`;
}

// A set as the History tab lists it: "80 kg x 10", "15 reps", "07:50", "5 km · 30:00";
// dumbbells per hand (db/perHand/perHand.ts) "15 kg each x 10".
export function setLabel(type: ExerciseType, s: WorkoutSet, perHand = false): string {
  if (type === 'weight_reps') {
    const kg = s.weightKg ?? 0;
    return perHand ? `${round2(kg / 2)} kg each x ${s.reps ?? 0}` : `${round2(kg)} kg x ${s.reps ?? 0}`;
  }
  if (type === 'reps_only') return `${s.reps ?? 0} reps`;
  if (type === 'duration') return clock(s.durationSeconds) || '-';
  return `${round2(s.distanceKm ?? 0)} km · ${clock(s.durationSeconds) || '-'}`;
}
