import { SESSIONS, recoveryState, type MuscleKey, type RecoveryState, type SessionId } from './recovery';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export const DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export type DayPlan = SessionId | 'rest';
export const PLAN_CYCLE: DayPlan[] = ['rest', 'push', 'pull', 'legs', 'full'];
export const PLAN_LABEL: Record<DayPlan, string> = { rest: 'Rest', push: 'Push', pull: 'Pull', legs: 'Legs', full: 'Full body' };
export const DEFAULT_PLAN: DayPlan[] = ['push', 'rest', 'legs', 'rest', 'pull', 'rest', 'rest'];

// Workouts start at 6 pm and the map is read at 8 am, so a workout the day before is 14 h old.
const MORNING_OFFSET_HOURS = 10;

const RANK: Record<RecoveryState, number> = { idle: 0, ready: 1, partly: 2, heavy: 3 };

// docs/science/recovery.md: if a muscle was trained in several workouts, the worst state counts.
export function morningStates(plan: DayPlan[], day: number): Partial<Record<MuscleKey, RecoveryState>> {
  const worst: Partial<Record<MuscleKey, RecoveryState>> = {};
  plan.forEach((kind, trained) => {
    if (kind === 'rest' || trained >= day) return;
    const session = SESSIONS.find((s) => s.id === kind);
    if (!session) return;
    const hours = (day - trained) * 24 - MORNING_OFFSET_HOURS;
    for (const [muscle, sets] of Object.entries(session.sets) as [MuscleKey, number][]) {
      const state = recoveryState(sets, hours);
      const current = worst[muscle];
      if (state !== 'idle' && (!current || RANK[state] > RANK[current])) worst[muscle] = state;
    }
  });
  return worst;
}
