import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => ({ getDb: async () => null }));
const { recovery, setEfforts } = await import('./effort');
const { applyCheckIn, easyPace, intensityMinutes, legScore, loadState, runIsOn, runKind, runLoad, runsOf, suggestMinutes } = await import('./run');
type StatSet = import('@/types/stats').StatSet;
type RunLog = import('@/types/run').RunLog;

const SLOT = new Date(2026, 10, 10, 6, 30).getTime(); // Tuesday
let nextWorkout = 0;

const base = (startTime: string, extra: Partial<StatSet>): StatSet => ({
  workoutId: `w${++nextWorkout}`,
  title: 'W',
  startTime,
  durationSeconds: 3600,
  exerciseId: 'x',
  name: 'Squat',
  catalogueId: null,
  primary: 'Quadriceps',
  secondary: ['Glutes', 'Hamstrings', 'Calves'],
  weightKg: 100,
  reps: 5,
  ...extra,
});
const runSet = (daysBefore: number, minutes: number, rpe: number | null, km: number | null = null): StatSet =>
  base(new Date(2026, 10, 10 - daysBefore, 6, 30).toISOString(), {
    name: 'Run',
    primary: 'Cardio',
    secondary: [],
    weightKg: null,
    reps: null,
    seconds: minutes * 60,
    distanceKm: km,
    rpe,
  });
// 4 sets to failure, Monday 20:00 before the slot; `sets` of them.
const squats = (sets: number): StatSet[] => {
  const workoutId = 'leg-day';
  const startTime = new Date(2026, 10, 9, 20).toISOString();
  return Array.from({ length: sets }, () => base(startTime, { workoutId, failure: true }));
};
const football = (): StatSet =>
  base(new Date(2026, 10, 9, 20).toISOString(), { name: 'Football', primary: 'Cardio', secondary: [], seconds: 90 * 60, rpe: 6 });

// The runner of the worked examples: about two easy runs a week, all at 06:30.
const H1: [number, number, number][] = [[3, 35, 3], [6, 30, 4], [10, 40, 3], [13, 30, 4], [17, 35, 3], [20, 30, 4], [24, 40, 3], [27, 30, 4]];
const h1 = (): StatSet[] => H1.map(([d, m, rpe]) => runSet(d, m, rpe));
const logs = (sets: StatSet[]): RunLog[] => runsOf(sets);

const legsAt = (sets: StatSet[], hoursAfterLegDay: number, sore = false): number => {
  const now = new Date(new Date(2026, 10, 9, 20).getTime() + hoursAfterLegDay * 3_600_000);
  return legScore(recovery(sets, setEfforts(sets), now), sore);
};

describe('run load', () => {
  it('is minutes × effort, easy up to 4, hard from 7', () => {
    expect([runLoad(30, 4), runLoad(45, 7)]).toEqual([120, 315]);
    expect([4, 5, 6, 7].map(runKind)).toEqual(['easy', 'moderate', 'moderate', 'hard']);
  });

  it('runsOf keeps runs only, counts no effort as 4, and joins the sets of one workout', () => {
    const lap = (km: number, rpe: number): StatSet => ({ ...runSet(1, 10, rpe, km), workoutId: 'laps' });
    const found = logs([runSet(2, 30, null, 5), base(new Date(2026, 10, 8).toISOString(), {}), football(), lap(1, 3), lap(2, 8)]);
    expect(found.map((r) => [r.minutes, r.km, r.rpe])).toEqual([[30, 5, 4], [20, 3, 8]]);
  });

  it('runsOf leaves out a run with no time', () => {
    expect(logs([{ ...runSet(1, 0, 4), seconds: null }])).toEqual([]);
  });
});

describe('applyCheckIn', () => {
  it('quick taps build on each other: drained, then pain, then pain again', () => {
    const drained = applyCheckIn(null, { feel: 'drained' }, '2026-11-10');
    const pain = applyCheckIn(drained, (c) => ({ pain: !c.pain }), '2026-11-10');
    expect(pain).toEqual({ date: '2026-11-10', feel: 'drained', sleepHours: null, legsSore: false, pain: true, sick: false });
    expect(applyCheckIn(pain, (c) => ({ pain: !c.pain }), '2026-11-10').pain).toBe(false);
  });
});

describe('runIsOn', () => {
  it('follows the setting once chosen; before that, only a runner sees it', () => {
    expect([runIsOn(true, false), runIsOn(false, true)]).toEqual([true, false]);
    expect([runIsOn(null, true), runIsOn(null, false)]).toEqual([true, false]);
  });
});

describe('loadState', () => {
  it('one 120 AU run yesterday: the short average jumps, the floor keeps the ratio sane', () => {
    const s = loadState(logs([runSet(1, 30, 4)]), SLOT);
    expect(s.acute).toBeCloseTo(30, 2);
    expect(s.chronic).toBeCloseTo(8.28, 2);
    expect(s.ratio).toBeCloseTo(1.5, 2); // 30 / max(8.28, 20)
  });

  it('and three days ago it has faded', () => {
    const s = loadState(logs([runSet(3, 30, 4)]), SLOT);
    expect(s.acute).toBeCloseTo(16.88, 2);
    expect(s.chronic).toBeCloseTo(7.17, 2);
  });

  it('the regular runner is level', () => {
    const s = loadState(logs(h1()), SLOT);
    expect(s.acute).toBeCloseTo(25.53, 2);
    expect(s.chronic).toBeCloseTo(27.26, 2);
    expect(s.ratio).toBeCloseTo(0.94, 2);
  });

  it('a run on the slot’s own day, before or at the slot, is not counted; one the day before is', () => {
    const early = { ...runSet(0, 30, 4), startTime: new Date(2026, 10, 10, 5, 50).toISOString() };
    expect(loadState(logs([runSet(0, 30, 4)]), SLOT).acute).toBe(0);
    expect(loadState(logs([early]), SLOT).acute).toBe(0);
    const lateYesterday = { ...runSet(1, 30, 4), startTime: new Date(2026, 10, 9, 23, 50).toISOString() };
    expect(loadState(logs([lateYesterday]), SLOT).acute).toBeCloseTo(30, 2);
  });

  // The slot is three mornings after the clocks changed: Paris 2026-10-25, New York 2026-11-01.
  it.each([
    ['Europe/Paris', [2026, 9, 28]],
    ['America/New_York', [2026, 10, 4]],
  ])('days follow the calendar across a clock change (%s)', (zone, [y, m, d]) => {
    const previous = process.env.TZ;
    process.env.TZ = zone;
    try {
      // The same three mornings of 30 easy minutes before a slot on `day`.
      const before = (day: Date): number => {
        const sets = [1, 2, 3].map((back) => {
          const s = runSet(0, 30, 4);
          return { ...s, startTime: new Date(day.getFullYear(), day.getMonth(), day.getDate() - back, 6, 30).toISOString() };
        });
        return loadState(logs(sets), day.getTime()).acute;
      };
      const slot = new Date(y, m, d, 6, 30);
      expect(new Date(y, m, d - 4).getTimezoneOffset()).not.toBe(slot.getTimezoneOffset()); // a change in between
      expect(before(slot)).toBeCloseTo(before(new Date(2026, 6, 15, 6, 30)), 6);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});

describe('intensityMinutes', () => {
  it('splits the last 28 days by effort and gives the hard share', () => {
    const runs = logs([runSet(2, 100, 3), runSet(5, 80, 5), runSet(8, 60, 8), runSet(30, 90, 8)]);
    const m = intensityMinutes(runs, SLOT);
    expect([m.easy, m.moderate, m.hard, m.runs]).toEqual([100, 80, 60, 3]);
    expect(m.hardShare).toBeCloseTo(60 / 240);
  });
});

describe('legScore', () => {
  it('four hard squat sets: red the first day, then orange on the quads and helpers, then free', () => {
    const sets = squats(4);
    expect(legsAt(sets, 10.5)).toBe(1);
    expect(legsAt(sets, 34.5)).toBe(0.5); // hamstrings still orange
    expect(legsAt(sets, 58.5)).toBe(0.5); // only the quads left, still orange: easy only
    expect(legsAt(sets, 82.5)).toBe(0);
  });

  it('two sets are over sooner: the quads orange at 34.5 h, the single-set helpers done', () => {
    expect(legsAt(squats(2), 34.5)).toBe(0.5);
    expect(legsAt(squats(2), 58.5)).toBe(0);
  });

  it('a football game: hamstrings stay red past 34 h, orange at 40 h', () => {
    const game = [football()];
    expect([10.5, 34.5, 40].map((h) => legsAt(game, h))).toEqual([1, 1, 0.5]);
  });

  it('"legs sore" adds to fresh legs and is capped at 1', () => {
    expect(legsAt([], 10.5, true)).toBe(0.4);
    expect(legsAt(squats(4), 10.5, true)).toBe(1);
  });
});

describe('suggestMinutes', () => {
  it('the usual length (median of the last 5 runs), at most 1.3 × the longest lately', () => {
    expect(suggestMinutes(logs(h1()), SLOT, false)).toEqual({ minutes: 35, maxMinutes: 52 });
  });

  it('is capped to 90 and floored at 20; a spike shortens it; no runs lately is the shortest run', () => {
    expect(suggestMinutes(logs([runSet(2, 80, 3)]), SLOT, false).maxMinutes).toBe(90);
    expect(suggestMinutes(logs([runSet(2, 15, 3)]), SLOT, false)).toEqual({ minutes: 20, maxMinutes: 20 });
    expect(suggestMinutes(logs(h1()), SLOT, true).minutes).toBe(25); // 0.75 × 35 = 26.25
    expect(suggestMinutes(logs([runSet(40, 60, 3)]), SLOT, false)).toEqual({ minutes: 20, maxMinutes: 20 });
  });
});

describe('easyPace', () => {
  it('is the median of the easy runs lately, ± 10 s', () => {
    const paced = [runSet(2, 31.6667, 3, 5), runSet(4, 32.5, 3, 5), runSet(6, 33.3333, 3, 5), runSet(8, 20, 8, 5)];
    expect(easyPace(logs(paced), SLOT)).toEqual([380, 400]);
  });

  it('needs two runs with a distance', () => {
    expect(easyPace(logs([runSet(2, 30, 3, 5), runSet(4, 30, 3)]), SLOT)).toBeNull();
  });
});
