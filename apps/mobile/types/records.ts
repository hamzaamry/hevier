import type { RECORD_KINDS } from '@/constants/records';
import type { ExerciseType } from './exercise';
import type { SetType } from './workout';

// An exercise's best values (lib/stats/records.ts).
export interface Bests {
  weightKg: number | null;
  oneRmKg: number | null;
  volumeKg: number | null; // weight x reps of one set
  reps: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
}

// A kind of record: one of RECORD_KINDS.
export type RecordKind = (typeof RECORD_KINDS)[number];

// What one set measures, per kind of record (kg, reps, seconds or km);
// a kind the set does not measure is left out (lib/stats/records.ts).
export type Measures = Partial<Record<RecordKind, number>>;

export interface SetRecord {
  kind: RecordKind;
  label: string;
  value: string;
}

export interface HistorySet {
  workoutId: string;
  exerciseId: string;
  type: ExerciseType;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
}

// A record one workout set: which exercise, which kind, the new best.
export interface WorkoutRecord {
  exerciseId: string;
  kind: RecordKind;
  value: number; // kg, reps, seconds or km
}

// The PR toast while logging (components/workout/PrToast.tsx).
export interface PrToastData {
  id: number;
  name: string;
  catalogueId: string | null;
  records: SetRecord[];
  gym: string | null;
}
