import type { MuscleKey } from './recovery';

// Mirrors apps/mobile/constants/training.ts and docs/science/sets.md (sets.test.ts keeps them equal).
export const HARD_RIR = 3;
export const MIN_SET_WEIGHT = 0.3;
export const WEIGHT_PER_RIR = 0.14;
export const WARMUP_SET_WEIGHT = 0.3;
export const SECONDARY_SHARE = 0.5;

// A logged set: warm-up, failure, or how many reps were left.
export type SetEntry = 'W' | 'F' | number;

export function setCredit(entry: SetEntry): number {
  if (entry === 'W') return WARMUP_SET_WEIGHT;
  if (entry === 'F' || entry <= HARD_RIR) return 1;
  return Math.max(MIN_SET_WEIGHT, 1 - (entry - HARD_RIR) * WEIGHT_PER_RIR);
}

// The order a tap cycles through.
export const ENTRY_CYCLE: SetEntry[] = ['F', 2, 4, 6, 8, 'W'];

export function nextEntry(entry: SetEntry): SetEntry {
  const index = ENTRY_CYCLE.indexOf(entry);
  return ENTRY_CYCLE[(index + 1) % ENTRY_CYCLE.length];
}

export function totalCredit(entries: SetEntry[]): number {
  return entries.reduce<number>((sum, entry) => sum + setCredit(entry), 0);
}

export type ZoneId = 'below' | 'maintenance' | 'growth';

export function zoneOf(weeklySets: number): ZoneId {
  if (weeklySets >= 4) return 'growth';
  return weeklySets >= 3 ? 'maintenance' : 'below';
}

export interface Exercise {
  id: string;
  label: string;
  main: MuscleKey;
  helpers: MuscleKey[];
}

export const EXERCISES: Exercise[] = [
  { id: 'bench', label: 'Bench press', main: 'CHEST', helpers: ['TRICEPS', 'SHOULDERS_FRONT'] },
  { id: 'squat', label: 'Squat', main: 'QUADS', helpers: ['GLUTES', 'ADDUCTORS'] },
  { id: 'pullup', label: 'Pull-up', main: 'LATS', helpers: ['BICEPS', 'RHOMBOIDS'] },
];

export function entryLabel(entry: SetEntry): { big: string; small: string } {
  if (entry === 'W') return { big: 'W', small: 'warm-up' };
  if (entry === 'F') return { big: 'F', small: 'failure' };
  return { big: entry >= 8 ? '8+' : String(entry), small: 'reps left' };
}
