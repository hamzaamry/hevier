import { describe, expect, it, vi } from 'vitest';
import { RUN_GATE_IDS, RUN_SLOT_DEFAULT_MINUTES, RUN_VERDICTS } from '@/constants/run';

vi.mock('@/db/client', () => ({ getDb: async () => null }));
const { firstAtLeast, forecast, loggedRunStartMs, nextRunSlotMs, nextSlotMs, readinessAt, verdictOf, verdictShownAt, withLegDay } =
  await import('./runReadiness');
const { runsOf: runsOfSets } = await import('./run');
type StatSet = import('@/types/stats').StatSet;
type CheckIn = import('@/types/run').CheckIn;
type Gate = import('@/types/run').Gate;
type ReadinessInput = import('@/types/run').ReadinessInput;

const SLOT_MINUTES = RUN_SLOT_DEFAULT_MINUTES;

// The worked examples: slot Tuesday 2026-11-10 06:30, a leg day Monday 20:00.
const SLOT = new Date(2026, 10, 10, 6, 30).getTime();
const LEG_DAY = new Date(2026, 10, 9, 20).getTime();
const HOUR = 3_600_000;
const slotOn = (day: number): number => new Date(2026, 10, day, 6, 30).getTime();
let nextWorkout = 0;

const base = (startMs: number, extra: Partial<StatSet>): StatSet => ({
  workoutId: `w${++nextWorkout}`,
  title: 'W',
  startTime: new Date(startMs).toISOString(),
  startMs,
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
const runAt = (startMs: number, minutes: number, rpe: number | null, km: number | null = null): StatSet =>
  base(startMs, { name: 'Run', primary: 'Cardio', secondary: [], weightKg: null, reps: null, seconds: minutes * 60, distanceKm: km, rpe });
const run = (daysBefore: number, minutes: number, rpe: number | null, km: number | null = null): StatSet =>
  runAt(new Date(2026, 10, 10 - daysBefore, 6, 30).getTime(), minutes, rpe, km);
const squats = (count: number, at = LEG_DAY): StatSet[] => {
  const workoutId = `legs-${at}`;
  return Array.from({ length: count }, () => base(at, { workoutId, failure: true }));
};
const lift = (primary: StatSet['primary'], secondary: StatSet['secondary'], count: number): StatSet[] => {
  const workoutId = `lift-${primary}`;
  return Array.from({ length: count }, () => base(LEG_DAY, { workoutId, primary, secondary, name: primary, failure: true }));
};
const football = (): StatSet => base(LEG_DAY, { name: 'Football', primary: 'Cardio', secondary: [], seconds: 90 * 60, rpe: 6 });

// About two easy runs a week for four weeks.
const H1: [number, number, number][] = [[3, 35, 3], [6, 30, 4], [10, 40, 3], [13, 30, 4], [17, 35, 3], [20, 30, 4], [24, 40, 3], [27, 30, 4]];
const h1 = (): StatSet[] => H1.map(([d, m, rpe]) => run(d, m, rpe));

const input = (sets: StatSet[], checkIn: CheckIn | null = null): ReadinessInput => ({ sets, checkIn });
const checkIn = (extra: Partial<CheckIn>): CheckIn => ({
  date: '2026-11-10',
  feel: null,
  sleepHours: null,
  legsSore: false,
  pain: false,
  sick: false,
  ...extra,
});
const ids = (r: { gates: Gate[] }): string[] => r.gates.map((g) => g.id);

describe('readinessAt: legs', () => {
  it('the morning after a heavy leg day: strength only; then easy; then quality', () => {
    const sets = [...h1(), ...squats(4)];
    const tue = readinessAt(input(sets), SLOT);
    expect([tue.verdict, ids(tue), tue.guidance]).toEqual(['strength_only', ['legs_heavy'], null]);
    const wed = readinessAt(input(sets), slotOn(11));
    expect([wed.verdict, ids(wed)]).toEqual(['easy', ['legs_partial']]);
    expect(wed.guidance).toMatchObject({ minutes: 35, hardMinutes: null, rpe: [2, 4] });
    expect(readinessAt(input(sets), slotOn(13)).verdict).toBe('quality');
  });

  // The cautious default for a trained lifter: four hard quad sets (72 h window) keep quality
  // off the table until the quads leave it, 82.5 h on (Friday). Thursday, 58.5 h, is easy because
  // the quads are still orange. Relaxing this is a constants/run.ts RUN_LEG_LOAD change that
  // waits for run feedback (docs/science/running.md).
  it('four hard quad sets: easy at 58.5 h, quality only from 82.5 h', () => {
    const sets = [...h1(), ...squats(4)];
    const thu = readinessAt(input(sets), slotOn(12));
    expect([thu.verdict, ids(thu), thu.legScore]).toEqual(['easy', ['legs_partial'], 0.5]);
    expect(readinessAt(input(sets), slotOn(13)).verdict).toBe('quality');
  });

  it('upper body only the night before changes nothing', () => {
    const sets = [...h1(), ...lift('Chest', ['Triceps'], 4), ...lift('Shoulders', [], 3)];
    const r = readinessAt(input(sets), SLOT);
    expect([r.verdict, r.gates, r.confidence]).toEqual(['quality', [], 'medium']);
  });

  it('a football game keeps the hamstrings red past 34 h and goes easy by 40 h', () => {
    const sets = [...h1(), football()];
    const verdictAt = (hours: number) => readinessAt(input(sets), LEG_DAY + hours * HOUR).verdict;
    expect([10.5, 34.5, 40].map(verdictAt)).toEqual(['strength_only', 'strength_only', 'easy']);
  });

  it('the "legs sore" tap keeps a fresh runner at easy', () => {
    const r = readinessAt(input(h1(), checkIn({ legsSore: true })), SLOT);
    expect([r.verdict, ids(r)]).toEqual(['easy', ['legs_partial']]);
  });
});

describe('readinessAt: running load', () => {
  it('a hard run yesterday: easy, from the 72 h gap and the jump in load, and a shorter run', () => {
    const r = readinessAt(input([...h1(), run(1, 40, 8)]), SLOT);
    expect(r.verdict).toBe('easy');
    expect(ids(r)).toEqual(expect.arrayContaining(['hard_gap', 'ramp_spike']));
    expect(r.load.ratio).toBeGreaterThanOrEqual(2);
    expect(r.guidance?.minutes).toBe(25);
  });

  it('the gap after a hard run is 72 h: not at 72.0 h, yes at 71.9 h', () => {
    const hardAt = (hours: number) => runAt(SLOT - hours * HOUR, 40, 8);
    const gates = (hours: number) => ids(readinessAt(input([...h1().slice(1), hardAt(hours)]), SLOT));
    expect(gates(72)).not.toContain('hard_gap');
    expect(gates(71.9)).toContain('hard_gap');
  });

  it('a big easy run starts the gap too, and says it was not rated hard', () => {
    const gapOf = (minutes: number, rpe: number) =>
      readinessAt(input([...h1().slice(1), runAt(SLOT - 30 * HOUR, minutes, rpe)]), SLOT).gates.find((g) => g.id === 'hard_gap');
    expect(gapOf(75, 4)?.detail).toEqual({ hours: 30, ratedHard: 0 }); // 300 AU, rated easy
    expect(gapOf(40, 8)?.detail).toEqual({ hours: 30, ratedHard: 1 });
    expect(gapOf(70, 4)).toBeUndefined(); // 280 AU: not big
  });

  it('a run earlier on the slot’s own day is not in the load, but its hard effort is in the gap', () => {
    const early = runAt(new Date(2026, 10, 10, 5, 50).getTime(), 40, 8);
    const r = readinessAt(input([...h1().slice(1), early]), SLOT);
    expect(r.load.ratio).toBeLessThan(1.3);
    expect(ids(r)).toContain('hard_gap');
  });

  it('a big week after three light ones: easy, and a shorter run than the usual', () => {
    const light = [9, 12, 16, 19, 23, 26].map((d) => run(d, 30, 3));
    const big = [run(6, 45, 5), run(4, 50, 5), run(2, 50, 5), run(1, 40, 5)];
    const r = readinessAt(input([...light, ...big]), SLOT);
    expect(r.runs28).toBe(10);
    expect(r.verdict).toBe('easy');
    expect(ids(r)).toContain('ramp_spike');
    expect(r.load.ratio).toBeGreaterThan(2);
    expect(r.guidance).toMatchObject({ minutes: 35, maxMinutes: 65 });
  });

  it('the load and hard-share checks wait for three runs: two runs get "base first"', () => {
    const r = readinessAt(input([run(5, 60, 8), run(8, 60, 8)]), SLOT);
    expect(r.hardShare28).toBe(1); // too much hard running, with a third run
    expect(ids(r)).toEqual(['base_first']);
    expect([r.verdict, r.confidence]).toEqual(['easy', 'low']);
  });

  it('no run in 40 days: a comeback, 20 easy minutes', () => {
    const r = readinessAt(input([run(40, 40, 3), run(44, 40, 3)]), SLOT);
    expect([r.verdict, ids(r), r.guidance?.minutes, r.guidance?.maxMinutes]).toEqual(['easy', ['comeback'], 20, 20]);
  });

  it('too much hard running: from 20% of the minutes, not at 19%', () => {
    const easy = (total: number) => [run(10, total / 3, 3), run(12, total / 3, 3), run(14, total / 3, 3)];
    const withHard = (hard: number, total: number) => readinessAt(input([...easy(total), run(5, hard, 8)]), SLOT);
    expect(withHard(40, 265).hardShare28).toBeCloseTo(0.13, 2);
    expect(ids(withHard(60, 240))).toContain('too_much_hard');
    expect(ids(withHard(57, 243))).not.toContain('too_much_hard');
  });
});

describe('readinessAt: check-in', () => {
  it('drained after a short night: rest; a short night alone: no quality; pain or illness: rest', () => {
    const verdictFor = (c: Partial<CheckIn>) => readinessAt(input(h1(), checkIn(c)), SLOT);
    expect(verdictFor({ feel: 'drained', sleepHours: 5 }).verdict).toBe('rest');
    expect(verdictFor({ feel: 'drained', sleepHours: 5.4 }).verdict).toBe('rest');
    expect(verdictFor({ feel: 'drained', sleepHours: 5.5 }).verdict).toBe('easy'); // the boundary: under 5.5 only
    expect(verdictFor({ feel: 'normal', sleepHours: 6 }).verdict).toBe('quality');
    const short = verdictFor({ feel: 'normal', sleepHours: 5.8 });
    expect([short.verdict, ids(short)]).toEqual(['easy', ['tired']]);
    expect(verdictFor({ pain: true }).verdict).toBe('rest');
    expect(verdictFor({ sick: true }).verdict).toBe('rest');
  });

  it('is provisional until a check-in for that day exists; another day’s is ignored', () => {
    expect(readinessAt(input(h1()), SLOT).provisional).toBe(true);
    expect(readinessAt(input(h1(), checkIn({ feel: 'fresh' })), SLOT).provisional).toBe(false);
    const other = readinessAt(input(h1(), checkIn({ date: '2026-11-09', sick: true })), SLOT);
    expect([other.verdict, other.provisional]).toEqual(['quality', true]);
  });
});

describe('readinessAt: guidance', () => {
  it('quality for the regular runner: 35 min, 12 of them hard, at effort 7 to 8', () => {
    const r = readinessAt(input(h1()), SLOT);
    expect(r.guidance).toMatchObject({ minutes: 35, hardMinutes: 12, rpe: [7, 8], paceSecPerKm: null });
  });

  it('easy runs show the pace of the user’s own easy runs', () => {
    const sets = [run(3, 32.5, 3, 5), run(6, 32.5, 3, 5), run(9, 32.5, 3, 5)];
    expect(readinessAt(input([...sets, run(1, 40, 8)]), SLOT).guidance?.paceSecPerKm).toEqual([380, 400]);
  });
});

describe('verdictOf', () => {
  const caps: Record<(typeof RUN_GATE_IDS)[number], Gate['cap']> = {
    ill_or_pain: 'rest',
    drained_short_sleep: 'rest',
    legs_heavy: 'strength_only',
    legs_partial: 'easy',
    hard_gap: 'easy',
    ramp_spike: 'easy',
    ramp: 'easy',
    too_much_hard: 'easy',
    base_first: 'easy',
    comeback: 'easy',
    tired: 'easy',
  };
  const all: Gate[] = RUN_GATE_IDS.map((id) => ({ id, cap: caps[id], detail: {} }));

  it('adding a gate never raises the verdict', () => {
    const rank = (gates: Gate[]) => RUN_VERDICTS.indexOf(verdictOf(gates));
    const raised: string[] = [];
    for (let mask = 0; mask < 1 << all.length; mask++) {
      const subset = all.filter((_, i) => mask & (1 << i));
      for (const g of all) if (rank([...subset, g]) > rank(subset)) raised.push(`${mask}+${g.id}`);
    }
    expect(raised).toEqual([]);
    expect(verdictOf([])).toBe('quality');
  });
});

describe('slots and the forecast', () => {
  it('the next slot is today’s until it has passed', () => {
    expect(nextSlotMs(new Date(2026, 10, 10, 5, 59), 390)).toBe(SLOT);
    expect(nextSlotMs(new Date(2026, 10, 10, 6, 31), 390)).toBe(slotOn(11));
  });

  it('and keeps the local time across a clock change', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'Europe/Paris'; // the clocks go back on 2026-10-25: a 25-hour day
    try {
      const slot = nextSlotMs(new Date(2026, 9, 24, 20), 390);
      expect(slot).toBe(new Date(2026, 9, 25, 6, 30).getTime());
      expect((slot - new Date(2026, 9, 24, 20).getTime()) / HOUR).toBe(11.5);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  it('a slot in the hour a clock change skips stays at its setting on the days after', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'Europe/Berlin'; // 02:30 does not exist on 2026-03-29
    try {
      const first = nextSlotMs(new Date(2026, 2, 28, 20), 150);
      const days = forecast(input([]), first, 3, 150);
      expect(new Date(days[0].slotMs).getHours()).toBe(3);
      expect(days.slice(1).map((d) => new Date(d.slotMs).getHours() * 60 + new Date(d.slotMs).getMinutes())).toEqual([150, 150]);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });

  it('a run already done on the day of the next slot moves the call to the next day’s slot', () => {
    const now = new Date(2026, 10, 10, 6, 0);
    const earlyRun = runAt(new Date(2026, 10, 10, 5, 40).getTime(), 30, 3);
    const runs = (sets: StatSet[]) => runsOfSets(sets);
    expect(nextRunSlotMs(now, SLOT_MINUTES, runs([earlyRun]))).toBe(slotOn(11));
    expect(nextRunSlotMs(now, SLOT_MINUTES, runs([run(1, 30, 3)]))).toBe(SLOT);
    expect(nextRunSlotMs(new Date(2026, 10, 10, 8), SLOT_MINUTES, runs([earlyRun]))).toBe(slotOn(11)); // after the slot: tomorrow's anyway
  });

  it('five mornings after a leg day, with nothing more logged, all provisional', () => {
    const days = forecast(input([...h1(), ...squats(4)]), SLOT, 5, SLOT_MINUTES);
    expect(days.map((d) => d.verdict)).toEqual(['strength_only', 'easy', 'easy', 'quality', 'quality']);
    expect(days.every((d) => d.provisional)).toBe(true);
  });

  it('finds the next easy run and the next quality run in the forecast', () => {
    const days = forecast(input([...h1(), ...squats(4)]), SLOT, 5, SLOT_MINUTES);
    expect(firstAtLeast(days, 'easy')?.slotMs).toBe(slotOn(11));
    expect(firstAtLeast(days, 'quality')?.slotMs).toBe(slotOn(13));
    expect(firstAtLeast(days.slice(0, 1), 'easy')).toBeNull();
  });

  it('a logged run started when it ended minus its length, or yesterday at the slot', () => {
    const now = new Date(2026, 10, 10, 7, 5);
    expect(loggedRunStartMs('now', now, 1920, 390)).toBe(new Date(2026, 10, 10, 6, 33).getTime());
    expect(loggedRunStartMs('yesterday', now, 1920, 390)).toBe(new Date(2026, 10, 9, 6, 30).getTime());
  });

  it('the verdict shown for a run is that morning’s call', () => {
    expect(verdictShownAt([...h1(), ...squats(4)], new Date(2026, 10, 10, 6, 40).getTime(), 390)).toBe('strength_only');
    expect(verdictShownAt(h1(), new Date(2026, 10, 10, 6, 40).getTime(), 390)).toBe('quality');
  });

  it('only the first morning uses the check-in', () => {
    const days = forecast(input(h1(), checkIn({ sick: true })), SLOT, 2, SLOT_MINUTES);
    expect(days.map((d) => d.verdict)).toEqual(['rest', 'quality']);
  });

  it('a planned leg day gives the same mornings as the real one, and leaves the sets alone', () => {
    const sets = h1();
    const planned = withLegDay(sets, LEG_DAY, 'normal');
    expect(sets).toHaveLength(8);
    const verdicts = (s: StatSet[]) => forecast(input(s), SLOT, 5, SLOT_MINUTES).map((d) => [d.verdict, d.legScore]);
    expect(verdicts(planned)).toEqual(verdicts([...sets, ...squats(4)]));
  });

  it('a lighter planned day frees the legs sooner', () => {
    const verdicts = (preset: 'light' | 'heavy') =>
      forecast(input(withLegDay(h1(), LEG_DAY, preset)), SLOT, 4, SLOT_MINUTES).map((d) => d.verdict);
    expect(verdicts('light')).toEqual(['strength_only', 'easy', 'quality', 'quality']);
    expect(verdicts('heavy')).toEqual(['strength_only', 'easy', 'easy', 'quality']);
  });
});
