import { parseClock, parseNumber } from '@/lib/format/setFormat';
import { clock } from '@/lib/format/duration';
import { RECORD_LABELS } from '@/constants/labels';
import { round2 } from '@/lib/format/weight';
import type { ActiveSet } from '@/types/workout';
import type { ExerciseType } from '@/types/exercise';
import type { Bests, HistorySet, Measures, RecordKind, SetRecord, WorkoutRecord } from '@/types/records';
import { setVolumeKg } from '@/lib/volume';

// Personal records while logging:
// a completed set that beats the exercise's history, and every set completed
// before it in this workout, gets a medal and a toast ("Best 1RM - 106.67 kg").
// Warm-up sets never set a record and never raise the bar.

// Estimated one-rep max (Epley), 106.67 for 80kg x 10.
export function epley1RM(weightKg: number, reps: number): number {
  return reps <= 1 ? weightKg : weightKg * (1 + reps / 30);
}

// The bests of each exercise in `sets`; exercises without sets are left out.
export function exerciseBests(sets: Omit<HistorySet, 'workoutId' | 'type' | 'recordKey'>[]): Map<string, Bests> {
  const result = new Map<string, Bests>();
  for (const r of sets) {
    if (r.setType === 'warmup') continue;
    let bests = result.get(r.exerciseId);
    if (!bests) {
      bests = { weightKg: null, oneRmKg: null, volumeKg: null, reps: null, durationSeconds: null, distanceKm: null };
      result.set(r.exerciseId, bests);
    }
    raise(bests, measure(r.weightKg, r.reps, r.durationSeconds, r.distanceKm));
  }
  return result;
}

function measure(weight: number | null, reps: number | null, seconds: number | null, km: number | null): Measures {
  const m: Measures = {};
  if (weight && weight > 0 && reps && reps > 0) {
    m.weight = weight;
    m.oneRm = epley1RM(weight, reps);
    m.volume = setVolumeKg(weight, reps);
  }
  if (reps && reps > 0) m.reps = reps;
  if (seconds && seconds > 0) m.duration = seconds;
  if (km && km > 0) m.distance = km;
  return m;
}

const FIELD: Record<RecordKind, keyof Bests> = {
  weight: 'weightKg',
  oneRm: 'oneRmKg',
  volume: 'volumeKg',
  reps: 'reps',
  duration: 'durationSeconds',
  distance: 'distanceKm',
};

function raise(bests: Bests, m: Measures) {
  for (const kind of Object.keys(m) as RecordKind[]) {
    const field = FIELD[kind];
    if (bests[field] === null || m[kind]! > bests[field]!) bests[field] = m[kind]!;
  }
}

// Which records each exercise type can set, in the order the toast lists them.
const KINDS: Record<ExerciseType, RecordKind[]> = {
  weight_reps: ['weight', 'oneRm', 'volume'],
  reps_only: ['reps'],
  duration: ['duration'],
  distance_duration: ['distance'],
};

function valueLabel(kind: RecordKind, n: number) {
  if (kind === 'reps') return String(n);
  if (kind === 'duration') return clock(n);
  if (kind === 'distance') return `${round2(n)} km`;
  return `${round2(n)} kg`;
}

function measureSet(s: ActiveSet): Measures {
  return measure(parseNumber(s.weight), parseNumber(s.reps), parseClock(s.time), parseNumber(s.km));
}

// The records set by `setKey` among an exercise's sets: compared with the history
// and with the sets completed above it.
export function setRecords(type: ExerciseType, history: Bests | null, sets: ActiveSet[], setKey: string): SetRecord[] {
  if (!history) return [];
  const index = sets.findIndex((s) => s.key === setKey);
  const set = sets[index];
  if (!set?.done || set.setType === 'warmup') return [];
  const bar: Bests = { ...history };
  for (const earlier of sets.slice(0, index)) if (earlier.done && earlier.setType !== 'warmup') raise(bar, measureSet(earlier));
  const m = measureSet(set);
  const records: SetRecord[] = [];
  for (const kind of KINDS[type]) {
    const value = m[kind];
    const best = bar[FIELD[kind]];
    // A record needs something to beat: no history of this measure, no record.
    if (value === undefined || best === null || value <= best) continue;
    records.push({ kind, label: RECORD_LABELS[kind], value: valueLabel(kind, value) });
  }
  return records;
}

// Records per saved workout, for the "Records" count on workout cards: each
// kind (Best Weight, Best 1RM…) an exercise beat in that workout counts once.
// `sets` in order: by workout start, then exercise and set order.
export function workoutRecordCounts(sets: HistorySet[]): Map<string, number> {
  return workoutRecords(sets).counts;
}

// The same, plus which sets beat a record (the medals on the workout page)
// and each workout's records (the "Nice work!" PR cards).
export function workoutRecords(sets: HistorySet[]): {
  counts: Map<string, number>;
  recordSets: boolean[];
  records: Map<string, WorkoutRecord[]>;
} {
  const counts = new Map<string, number>();
  const records = new Map<string, WorkoutRecord[]>();
  const recordSets = sets.map(() => false);
  const bests = new Map<string, Bests>();
  let i = 0;
  while (i < sets.length) {
    // One exercise within one workout.
    const { workoutId, exerciseId, type, recordKey } = sets[i];
    // A machine's records are kept per gym.
    const bestsKey = `${exerciseId}|${recordKey}`;
    let j = i;
    while (j < sets.length && sets[j].workoutId === workoutId && sets[j].exerciseId === exerciseId) j++;
    if (!counts.has(workoutId)) counts.set(workoutId, 0);
    const history = bests.get(bestsKey);
    const bar: Bests = history
      ? { ...history }
      : { weightKg: null, oneRmKg: null, volumeKg: null, reps: null, durationSeconds: null, distanceKm: null };
    const broken = new Set<RecordKind>();
    for (let k = i; k < j; k++) {
      const s = sets[k];
      if (s.setType === 'warmup') continue;
      const m = measure(s.weightKg, s.reps, s.durationSeconds, s.distanceKm);
      // The first time an exercise is done is not a record.
      if (history) {
        for (const kind of KINDS[type]) {
          const best = bar[FIELD[kind]];
          if (m[kind] !== undefined && best !== null && m[kind]! > best) {
            broken.add(kind);
            recordSets[k] = true;
          }
        }
      }
      raise(bar, m);
    }
    bests.set(bestsKey, bar);
    counts.set(workoutId, counts.get(workoutId)! + broken.size);
    if (broken.size) {
      const list = records.get(workoutId) ?? [];
      for (const kind of KINDS[type]) {
        if (broken.has(kind)) list.push({ exerciseId, kind, value: bar[FIELD[kind]]! });
      }
      records.set(workoutId, list);
    }
    i = j;
  }
  return { counts, recordSets, records };
}
