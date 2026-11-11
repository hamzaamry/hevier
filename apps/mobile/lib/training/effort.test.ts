import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => ({ getDb: async () => null }));
const { effortWeight, effortWeights, hardSets, recovery, recoveryWindow, setEfforts, zoneOf } = await import('./effort');
type StatSet = import('@/types/stats').StatSet;

const set = (startTime: string, weightKg: number | null, reps: number, extra: Partial<StatSet> = {}): StatSet => ({
  workoutId: startTime,
  title: 'LOWER',
  startTime,
  durationSeconds: 3600,
  exerciseId: 'squat',
  name: 'Squat',
  catalogueId: null,
  primary: 'Quadriceps',
  secondary: ['Glutes'],
  weightKg,
  reps,
  ...extra,
});
const at = (d: number, h = 18) => new Date(2026, 9, d, h).toISOString();

describe('effort', () => {
  it('weighs hard sets 1 and easy ones down to 0.3', () => {
    expect(effortWeight(0)).toBe(1);
    expect(effortWeight(3)).toBe(1);
    expect(effortWeight(5)).toBeCloseTo(0.72);
    expect(effortWeight(20)).toBe(0.3);
    expect(effortWeight(20, true)).toBe(1); // a failure set is always hard
  });

  it('counts only what was logged, never a guess', () => {
    const sets = [
      set(at(6), 120, 10),
      set(at(13), 60, 10), // far below the best, nothing logged: still a full set
      set(at(13), 40, 12, { warmup: true }),
      set(at(13), 100, 10, { failure: true }),
      set(at(13), 100, 10, { rir: 0 }),
      set(at(13), 100, 10, { rir: 4 }),
    ];
    const e = setEfforts(sets);
    expect(e.map((x) => x.weight)).toEqual([1, 1, 0.3, 1, 1, expect.closeTo(0.86, 2)]);
    expect(e.map((x) => x.failure)).toEqual([false, false, false, true, true, false]);
    expect(effortWeights(sets)).toEqual(e.map((x) => x.weight));
  });

  it('counts hard sets per muscle: secondary 0.5, at most 12 a workout', () => {
    const sets = Array.from({ length: 15 }, () => set(at(13), 120, 10));
    const hard = hardSets(sets, sets.map(() => 1), new Date(2026, 9, 12), new Date(2026, 9, 19));
    expect(hard.get('Quadriceps')).toBe(12);
    expect(hard.get('Glutes')).toBeCloseTo(7.5);
  });

  it('zones: under 3, 3, 4+ (rounded as shown)', () => {
    expect([0, 1, 2.9, 2.96, 3, 3.9, 3.96, 4, 25].map(zoneOf)).toEqual([0, 1, 1, 2, 2, 2, 3, 3, 3]);
  });

  it('recovery windows: ~1 set 30 h, 2–3 sets 48 h, 4+ sets 72 h', () => {
    expect(recoveryWindow(0.5)).toBeNull();
    expect(recoveryWindow(1)).toEqual({ redHours: 12, hours: 30 });
    expect(recoveryWindow(2)).toEqual({ redHours: 24, hours: 48 });
    expect(recoveryWindow(3)).toEqual({ redHours: 24, hours: 48 });
    expect(recoveryWindow(4)).toEqual({ redHours: 24, hours: 72 });
  });

  it('recovery: red the first day, orange until the window ends, then green', () => {
    // 2 chest sets to failure and 4 lat sets, Friday 18:00.
    const chest = Array.from({ length: 2 }, () =>
      set(at(13), 60, 8, { exerciseId: 'press', primary: 'Chest', secondary: ['Triceps'] })
    );
    const lats = Array.from({ length: 4 }, () =>
      set(at(13), 80, 8, { exerciseId: 'pull', primary: 'Lats', secondary: [] })
    );
    const all = [...chest, ...lats];
    const e = setEfforts(all);
    const stateAt = (m: 'Chest' | 'Lats' | 'Triceps', d: number, h = 18) =>
      recovery(all, e, new Date(2026, 9, d, h)).get(m);
    expect(stateAt('Chest', 13, 20)).toBe('fatigued'); // 2 hours after
    expect(stateAt('Chest', 14, 19)).toBe('recovering'); // 25 h
    expect(stateAt('Chest', 15, 19)).toBe('ready'); // 49 h
    expect(stateAt('Lats', 15, 19)).toBe('recovering'); // 4 sets: 72 h
    expect(stateAt('Lats', 16, 19)).toBe('ready');
    expect(stateAt('Triceps', 13, 20)).toBe('fatigued'); // 2 helper sets = 1: 30 h, red 12 h
    expect(stateAt('Triceps', 14, 19)).toBe('recovering');
    expect(stateAt('Chest', 21)).toBeUndefined(); // not trained in the last week
  });

  it('recovery: warm-ups alone leave no window; the worst workout counts', () => {
    const warm = [set(at(13), 40, 12, { warmup: true })];
    expect(recovery(warm, setEfforts(warm), new Date(2026, 9, 13, 20)).get('Quadriceps')).toBe('ready');
    const two = [
      ...Array.from({ length: 4 }, () => set(at(11), 120, 8)), // Wednesday: 72 h window
      set(at(13), 120, 8, { workoutId: 'fri' }), // Friday: one set, 30 h
    ];
    // Saturday 18:00: Wednesday's is 72 h old (done), Friday's 24 h (orange).
    expect(recovery(two, setEfforts(two), new Date(2026, 9, 14, 18)).get('Quadriceps')).toBe('recovering');
  });

  it('a run leaves no window: Cardio gets no state, the legs keep their lifting one', () => {
    const squats = Array.from({ length: 4 }, () => set(at(13, 11), 120, 8));
    const run = set(at(13, 18), null, 0, { exerciseId: 'run', name: 'Run', primary: 'Cardio', secondary: [], seconds: 1800, rpe: 8 });
    const states = recovery([...squats, run], setEfforts([...squats, run]), new Date(2026, 9, 13, 20));
    expect(states.has('Cardio')).toBe(false);
    expect(states.get('Quadriceps')).toBe('fatigued');
  });

  it('football: its own curve in recovery, never sets', () => {
    const game = set(at(13, 11), null, 0, {
      exerciseId: 'football',
      name: 'Football',
      primary: 'Cardio',
      secondary: [],
      seconds: 90 * 60,
    });
    const day = (d: number, h: number) => new Date(2026, 9, d, h);
    const stateAt = (d: number) => recovery([game], setEfforts([game]), day(d, 11));
    expect(stateAt(14).get('Hamstrings')).toBe('fatigued'); // 24 h later: still full (0.8)
    expect(stateAt(14).has('Cardio')).toBe(false);
    expect(stateAt(15).get('Hamstrings')).toBe('recovering');
    expect(stateAt(16).get('Hamstrings')).toBe('ready');
    // Not a set for the weekly sets view on the legs.
    expect(hardSets([game], [1], day(13, 0), day(14, 0)).get('Hamstrings')).toBeUndefined();
  });
});
