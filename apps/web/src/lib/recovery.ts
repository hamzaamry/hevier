export type RecoveryState = 'heavy' | 'partly' | 'ready' | 'idle';

export type MuscleKey =
  | 'CHEST'
  | 'SHOULDERS_FRONT'
  | 'SHOULDERS_SIDE'
  | 'SHOULDERS_REAR'
  | 'TRICEPS'
  | 'BICEPS'
  | 'FOREARMS'
  | 'TRAPEZIUS'
  | 'RHOMBOIDS'
  | 'LATS'
  | 'BACK_LOWER'
  | 'CORE'
  | 'OBLIQUES'
  | 'GLUTES'
  | 'QUADS'
  | 'HAMSTRINGS'
  | 'ADDUCTORS'
  | 'ABDUCTORS'
  | 'CALVES';

export interface RecoveryWindow {
  heavyUntil: number;
  partlyUntil: number;
}

export const GREEN_VISIBLE_HOURS = 7 * 24;

// docs/science/recovery.md: the window depends on the effective sets a muscle got
// in one workout (main muscle 1, helper 0.5).
export function recoveryWindow(sets: number): RecoveryWindow | null {
  if (sets < 0.75) return null;
  if (sets < 1.5) return { heavyUntil: 12, partlyUntil: 30 };
  if (sets < 3.5) return { heavyUntil: 24, partlyUntil: 48 };
  return { heavyUntil: 24, partlyUntil: 72 };
}

export function recoveryState(sets: number, hoursSince: number): RecoveryState {
  const window = recoveryWindow(sets);
  if (!window) return 'idle';
  if (hoursSince < window.heavyUntil) return 'heavy';
  if (hoursSince < window.partlyUntil) return 'partly';
  if (hoursSince <= GREEN_VISIBLE_HOURS) return 'ready';
  return 'idle';
}

export type SessionId = 'push' | 'pull' | 'legs' | 'full';

export interface Session {
  id: SessionId;
  label: string;
  sets: Partial<Record<MuscleKey, number>>;
}

// Illustrative sessions: effective sets already include the half credit for helper muscles.
export const SESSIONS: Session[] = [
  {
    id: 'push',
    label: 'Push day',
    sets: { CHEST: 7, SHOULDERS_FRONT: 3.5, SHOULDERS_SIDE: 3, TRICEPS: 6.5, CORE: 1 },
  },
  {
    id: 'pull',
    label: 'Pull day',
    sets: { LATS: 7, RHOMBOIDS: 4, TRAPEZIUS: 2, SHOULDERS_REAR: 3, BICEPS: 6, FOREARMS: 2, BACK_LOWER: 1 },
  },
  {
    id: 'legs',
    label: 'Leg day',
    sets: { QUADS: 8, GLUTES: 5, HAMSTRINGS: 3, CALVES: 4, ADDUCTORS: 1, ABDUCTORS: 1, BACK_LOWER: 2 },
  },
  {
    id: 'full',
    label: 'Full body',
    sets: {
      CHEST: 4,
      SHOULDERS_FRONT: 2,
      SHOULDERS_SIDE: 3,
      TRICEPS: 2.5,
      LATS: 4,
      RHOMBOIDS: 2,
      BICEPS: 3,
      TRAPEZIUS: 1,
      QUADS: 4,
      GLUTES: 3,
      HAMSTRINGS: 1,
      CALVES: 1,
      CORE: 1,
    },
  },
];

export const MUSCLE_LABELS: Record<MuscleKey, string> = {
  CHEST: 'Chest',
  SHOULDERS_FRONT: 'Front delts',
  SHOULDERS_SIDE: 'Side delts',
  SHOULDERS_REAR: 'Rear delts',
  TRICEPS: 'Triceps',
  BICEPS: 'Biceps',
  FOREARMS: 'Forearms',
  TRAPEZIUS: 'Traps',
  RHOMBOIDS: 'Upper back',
  LATS: 'Lats',
  BACK_LOWER: 'Lower back',
  CORE: 'Abs',
  OBLIQUES: 'Obliques',
  GLUTES: 'Glutes',
  QUADS: 'Quads',
  HAMSTRINGS: 'Hamstrings',
  ADDUCTORS: 'Adductors',
  ABDUCTORS: 'Abductors',
  CALVES: 'Calves',
};

export const MUSCLE_KEYS = Object.keys(MUSCLE_LABELS) as MuscleKey[];

export function summarize(session: Session, hours: number): Record<RecoveryState, MuscleKey[]> {
  const out: Record<RecoveryState, MuscleKey[]> = { heavy: [], partly: [], ready: [], idle: [] };
  for (const [key, sets] of Object.entries(session.sets) as [MuscleKey, number][]) {
    out[recoveryState(sets, hours)].push(key);
  }
  return out;
}

export const DEFAULT_SESSION: SessionId = 'full';
export const DEFAULT_HOURS = 20;

export function sessionById(id: SessionId): Session {
  return SESSIONS.find((s) => s.id === id) ?? SESSIONS[0];
}

export function fillVars(session: Session, hours: number): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of MUSCLE_KEYS) {
    vars[`--f-${key}`] = `url(#g-${recoveryState(session.sets[key] ?? 0, hours)})`;
  }
  return vars;
}
