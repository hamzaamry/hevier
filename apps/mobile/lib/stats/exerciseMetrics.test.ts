import { describe, expect, it } from 'vitest';

import { METRICS, chartPoints, formatTick, formatValue, gymChartMarks, personalRecords, setLabel } from './exerciseMetrics';
import type { ExerciseSession } from '@/types/exercise';
import type { WorkoutSet } from '@/types/workout';

const set = (extra: Partial<WorkoutSet>): WorkoutSet => ({
  id: 's',
  workoutExerciseId: 'we',
  setIndex: 0,
  setType: 'normal',
  weightKg: null,
  reps: null,
  distanceKm: null,
  durationSeconds: null,
  rpe: null,
  ...extra,
});
const session = (startTime: string, sets: Partial<WorkoutSet>[], gymKey = ''): ExerciseSession => ({
  workoutId: startTime,
  title: 'UPPER A',
  startTime,
  gymKey,
  sets: sets.map(set),
});

describe('exercise page', () => {
  it('pull ups: most reps in a set and reps per session', () => {
    const sessions = [
      session('2026-10-04T10:00:00Z', [{ reps: 12 }, { reps: 15 }]),
      session('2026-10-14T10:00:00Z', [{ reps: 14 }, { reps: 10 }, { reps: 6 }]),
    ];
    expect(chartPoints(sessions, METRICS.reps_only[0]).map((p) => p.value)).toEqual([15, 14]);
    expect(chartPoints(sessions, METRICS.reps_only[1]).map((p) => p.value)).toEqual([27, 30]);
    expect(personalRecords('reps_only', sessions)).toEqual([
      { label: 'Best Set', value: '15 reps' },
      { label: 'Most Session Reps', value: '30 reps' },
    ]);
  });

  it('weighted: heaviest, 1RM, best set and session volume; empty sets ignored', () => {
    const sessions = [
      session('2026-10-01T10:00:00Z', [{ weightKg: 80, reps: 8 }, { weightKg: 80, reps: 6 }]),
      session('2026-10-08T10:00:00Z', [{ weightKg: 80, reps: 10 }, { weightKg: null, reps: null }]),
    ];
    expect(chartPoints(sessions, METRICS.weight_reps[3]).map((p) => p.value)).toEqual([1120, 800]);
    expect(personalRecords('weight_reps', sessions)).toEqual([
      { label: 'Heaviest Weight', value: '80 kg' },
      { label: 'Best 1RM', value: '106.67 kg' },
      { label: 'Best Set Volume', value: '800 kg' },
      { label: 'Best Session Volume', value: '1120 kg' },
    ]);
  });

  it('warm-up sets count towards neither the personal records nor the chart above them', () => {
    const sessions = [
      session('2026-10-01T10:00:00Z', [{ weightKg: 80, reps: 8 }, { weightKg: 120, reps: 3, setType: 'warmup' }]),
    ];
    expect(personalRecords('weight_reps', sessions)[0]).toEqual({ label: 'Heaviest Weight', value: '80 kg' });
    expect(chartPoints(sessions, METRICS.weight_reps[0]).map((p) => p.value)).toEqual([80]);
  });

  it('skips sessions with nothing to plot, and has no records without history', () => {
    const sessions = [session('2026-10-01T10:00:00Z', [{ durationSeconds: null }])];
    expect(chartPoints(sessions, METRICS.duration[0])).toEqual([]);
    expect(personalRecords('duration', [])).toEqual([]);
  });

  it('formats values and axis labels', () => {
    expect(formatValue(4358, 'seconds')).toBe('1h 12min 38s');
    expect(formatValue(470, 'seconds')).toBe('7min 50s');
    expect(formatValue(14, 'reps')).toBe('14 reps');
    expect(formatTick(900, 'seconds')).toBe('900 s');
    expect(formatTick(15, 'reps')).toBe('15 reps');
    expect(setLabel('weight_reps', set({ weightKg: 80, reps: 10 }))).toBe('80 kg x 10');
    expect(setLabel('weight_reps', set({ weightKg: 30, reps: 10 }), true)).toBe('15 kg each x 10');
    expect(setLabel('duration', set({ durationSeconds: 470 }))).toBe('07:50');
  });

  describe('per gym', () => {
    const sessions = [
      session('2026-10-01T10:00:00Z', [{ weightKg: 70, reps: 10 }], 'A'),
      session('2026-11-01T10:00:00Z', [{ weightKg: 55, reps: 10 }], 'B'),
    ];

    it('personalRecords without gymKey is unchanged', () => {
      expect(personalRecords('weight_reps', sessions)[0]).toEqual({ label: 'Heaviest Weight', value: '70 kg' });
    });

    it('personalRecords with gymKey: value at this gym, allGyms over all', () => {
      expect(personalRecords('weight_reps', sessions, 'B')[0]).toEqual({ label: 'Heaviest Weight', value: '55 kg', allGyms: '70 kg' });
    });

    it("personalRecords: '-' when nothing at this gym yet", () => {
      expect(personalRecords('weight_reps', sessions, 'C')[0]).toEqual({ label: 'Heaviest Weight', value: '-', allGyms: '70 kg' });
      expect(personalRecords('weight_reps', [], 'C')).toEqual([]);
    });

    it('gymChartMarks: faded and breaks for keys [A,A,B,B,A] with current A', () => {
      expect(gymChartMarks(['A', 'A', 'B', 'B', 'A'], 'A')).toEqual({ faded: [false, false, true, true, false], breaks: [2, 4] });
      expect(gymChartMarks(['', ''], '')).toEqual({ faded: [false, false], breaks: [] });
    });
  });
});
