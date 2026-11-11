import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => ({ getDb: async () => null }));
const { cardioMinutes, conditioning } = await import('./conditioning');
type StatSet = import('@/types/stats').StatSet;

const set = (day: number, extra: Partial<StatSet>): StatSet => ({
  workoutId: `w${day}`,
  title: 'W',
  startTime: new Date(2026, 9, day, 11).toISOString(),
  durationSeconds: 3600,
  exerciseId: 'x',
  name: 'Squat',
  catalogueId: null,
  primary: 'Quadriceps',
  secondary: [],
  weightKg: 100,
  reps: 5,
  ...extra,
});
const football = (day: number, minutes: number) =>
  set(day, { name: 'Football', primary: 'Cardio', weightKg: null, reps: null, seconds: minutes * 60 });

describe('conditioning', () => {
  it('football counts in full, other cardio half, lifting and Warm Up not at all', () => {
    expect(cardioMinutes(football(1, 90))).toBe(90);
    expect(cardioMinutes(set(1, { name: 'Hiking', primary: 'Cardio', seconds: 3600 }))).toBe(30);
    expect(cardioMinutes(set(1, { name: 'Warm Up', primary: 'Full Body', seconds: 600 }))).toBe(0);
    expect(cardioMinutes(set(1, {}))).toBe(0);
  });

  it('a run counts half, or in full when it felt hard (RPE 7+); no RPE counts as easy', () => {
    const run = (rpe: number | null) =>
      set(1, { name: 'Run', primary: 'Cardio', weightKg: null, reps: null, seconds: 30 * 60, rpe });
    expect(cardioMinutes(run(4))).toBe(15);
    expect(cardioMinutes(run(8))).toBe(30);
    expect(cardioMinutes(run(null))).toBe(15);
  });

  it('this week from Monday, weeks met before it, games this month', () => {
    // Monday 2026-10-19; weeks before start Oct 12, 5, Sep 28, Sep 21.
    const sets = [
      football(19, 60),
      set(19, { name: 'Hiking', primary: 'Cardio', seconds: 1800 }),
      football(13, 90), // met
      football(6, 50), // not met
      football(29, 90), // Oct 29 is in the future: ignored
      { ...football(1, 80), startTime: new Date(2026, 8, 30, 11).toISOString() }, // week of Sep 28: met
    ];
    const c = conditioning(sets, new Date(2026, 9, 19, 20));
    expect(c.thisWeek).toBe(75);
    expect(c.metWeeks).toBe(2);
    expect(c.gamesThisMonth).toBe(3);
  });
});
