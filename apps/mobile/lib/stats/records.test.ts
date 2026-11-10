import { describe, expect, it } from 'vitest';

import type { ActiveSet } from '@/types/workout';
import type { Bests } from '@/types/records';
import { epley1RM, exerciseBests, setRecords, workoutRecordCounts, workoutRecords } from './records';

const set = (weight: string, reps: string, done = true, extra: Partial<ActiveSet> = {}): ActiveSet => ({
  key: `${weight}x${reps}`,
  setType: 'normal',
  weight,
  reps,
  km: '',
  time: '',
  done,
  ...extra,
});

// The user's best Lat Pulldown before: 80kg x 8.
const bests: Bests = { weightKg: 80, oneRmKg: epley1RM(80, 8), volumeKg: 640, reps: 8, durationSeconds: null, distanceKm: null };

describe('personal records', () => {
  it('estimates 1RM with Epley (80kg x 10 = 106.67)', () => {
    expect(epley1RM(80, 10)).toBeCloseTo(106.667, 3);
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('more reps at the same weight: Best 1RM and Best Set Volume', () => {
    const s = set('80', '10');
    expect(setRecords('weight_reps', bests, [s], s.key)).toEqual([
      { kind: 'oneRm', label: 'Best 1RM', value: '106.67 kg' },
      { kind: 'volume', label: 'Best Set Volume', value: '800 kg' },
    ]);
  });

  it('a heavier weight: Best Weight too', () => {
    const s = set('85', '8');
    expect(setRecords('weight_reps', bests, [s], s.key).map((r) => r.label)).toEqual([
      'Best Weight',
      'Best 1RM',
      'Best Set Volume',
    ]);
  });

  it('equalling a record is not a record', () => {
    const s = set('80', '8');
    expect(setRecords('weight_reps', bests, [s], s.key)).toEqual([]);
  });

  it('an earlier completed set in this workout raises the bar', () => {
    const first = set('80', '10');
    const second = { ...set('80', '9'), key: 'second' };
    expect(setRecords('weight_reps', bests, [first, second], 'second')).toEqual([]);
    // Not done yet, so it does not count.
    const undone = { ...first, done: false };
    expect(setRecords('weight_reps', bests, [undone, second], 'second').map((r) => r.kind)).toEqual(['oneRm', 'volume']);
  });

  it('a warm-up set has no records and does not raise the bar for the next set', () => {
    const warmup = set('120', '3', true, { key: 'warmup', setType: 'warmup' });
    const working = set('85', '8');
    expect(setRecords('weight_reps', bests, [warmup], 'warmup')).toEqual([]);
    expect(setRecords('weight_reps', bests, [warmup, working], working.key).map((r) => r.kind)).toEqual([
      'weight',
      'oneRm',
      'volume',
    ]);
  });

  it('no history, no records: the first time is not a PR', () => {
    const s = set('80', '10');
    expect(setRecords('weight_reps', null, [s], s.key)).toEqual([]);
  });

  it('an unfinished set has no records', () => {
    const s = set('90', '10', false);
    expect(setRecords('weight_reps', bests, [s], s.key)).toEqual([]);
  });

  it('reps only, timed and distance exercises', () => {
    expect(setRecords('reps_only', bests, [set('', '12')], 'x12')).toEqual([
      { kind: 'reps', label: 'Most Reps', value: '12' },
    ]);
    const timed: Bests = { ...bests, durationSeconds: 300 };
    expect(setRecords('duration', timed, [set('', '', true, { key: 't', time: '06:00' })], 't')).toEqual([
      { kind: 'duration', label: 'Longest Duration', value: '06:00' },
    ]);
    const run: Bests = { ...bests, distanceKm: 5 };
    expect(setRecords('distance_duration', run, [set('', '', true, { key: 'd', km: '5.5' })], 'd')).toEqual([
      { kind: 'distance', label: 'Longest Distance', value: '5.5 km' },
    ]);
  });
});

describe('records per saved workout', () => {
  const s = (workoutId: string, weightKg: number, reps: number, exerciseId = 'bench') => ({
    workoutId,
    exerciseId,
    type: 'weight_reps' as const,
    setType: 'normal' as const,
    weightKg,
    reps,
    durationSeconds: null,
    distanceKm: null,
    recordKey: '',
  });

  it('counts each kind an exercise beat once; the first time is not a record', () => {
    const counts = workoutRecordCounts([
      s('w1', 80, 10),
      s('w2', 85, 5), // weight only (1RM 99.2 < 106.7, volume 425 < 800)
      s('w2', 86, 5), // weight again: still one record
      s('w3', 80, 12), // 1RM 112 and volume 960
      s('w3', 60, 10, 'squat'), // first squat: nothing
    ]);
    expect([...counts]).toEqual([
      ['w1', 0],
      ['w2', 1],
      ['w3', 2],
    ]);
  });
  it('ignores warm-up sets: no record, and they do not raise the bar', () => {
    const warmup = { ...s('w2', 120, 3), setType: 'warmup' as const };
    const { counts, recordSets } = workoutRecords([s('w1', 80, 10), warmup, s('w3', 85, 5)]);
    expect([...counts]).toEqual([
      ['w1', 0],
      ['w2', 0],
      ['w3', 1],
    ]);
    expect(recordSets).toEqual([false, false, true]);
  });

  it('keeps warm-up sets out of the stored bests', () => {
    const rows = [s('w1', 80, 10), { ...s('w1', 120, 3), setType: 'warmup' as const }].map(
      ({ workoutId: _w, type: _t, recordKey: _k, ...row }) => row
    );
    expect(exerciseBests(rows).get('bench')?.weightKg).toBe(80);
    expect(exerciseBests([rows[1]]).size).toBe(0);
  });

  it('lists what each workout beat, with the new best (the PR cards)', () => {
    const { records } = workoutRecords([s('w1', 80, 10), s('w2', 85, 5), s('w2', 86, 5), s('w3', 80, 12)]);
    expect(records.get('w1')).toBeUndefined();
    expect(records.get('w2')).toEqual([{ exerciseId: 'bench', kind: 'weight', value: 86 }]);
    expect(records.get('w3')).toEqual([
      { exerciseId: 'bench', kind: 'oneRm', value: 112 },
      { exerciseId: 'bench', kind: 'volume', value: 960 },
    ]);
  });

  // A machine exercise whose records are kept per gym: its recordKey is the gym.
  const at = (gym: string, workoutId: string, weightKg: number, reps: number) => ({ ...s(workoutId, weightKg, reps, 'press'), recordKey: gym });

  it("a cable PR at gym A doesn't stop a medal at gym B; the first workout at B has no medal", () => {
    const { counts, recordSets } = workoutRecords([
      at('A', 'w1', 80, 10),
      at('A', 'w2', 100, 10), // PR at A
      at('B', 'w3', 60, 10), // first at B: no medal
      at('B', 'w4', 65, 10), // beats B's 60
    ]);
    expect(recordSets).toEqual([false, true, false, true]);
    expect([...counts].map(([, n]) => n > 0)).toEqual([false, true, false, true]);
  });

  it("back at gym A: the bar is A's best, not B's", () => {
    const { recordSets } = workoutRecords([at('A', 'w1', 100, 10), at('B', 'w2', 120, 10), at('A', 'w3', 105, 10)]);
    expect(recordSets).toEqual([false, false, true]);
    const { recordSets: equal } = workoutRecords([at('A', 'w1', 100, 10), at('B', 'w2', 120, 10), at('A', 'w3', 100, 10)]);
    expect(equal).toEqual([false, false, false]);
  });

  it("a barbell exercise ignores recordKey ('' everywhere)", () => {
    const { recordSets } = workoutRecords([s('w1', 80, 10), s('w2', 90, 10)]);
    expect(recordSets).toEqual([false, true]);
  });
});
