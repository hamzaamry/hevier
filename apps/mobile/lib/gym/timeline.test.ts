import { describe, expect, it } from 'vitest';
import { ALL_GYMS, FROM_START_DAY, NO_GYM } from '@/constants/gym';
import type { GymTimeline } from '@/types/gym';
import { currentGym, deleteMessage, gymName, yourGyms, gymOnDay, gymStretches, isPerGym, recordKey, stretchLabel, workoutGym } from './timeline';

function timeline(changes: [string, string][], names: Record<string, string> = { a: 'Gym A', b: 'Gym B' }): GymTimeline {
  return {
    gyms: new Map(Object.entries(names).map(([id, name]) => [id, { id, name }])),
    changes: changes.map(([day, gymId], i) => ({ id: `c${i}`, day, gymId })),
  };
}
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

describe('isPerGym', () => {
  it('true for the 4 machine types, false for smith machine, stationary bike, barbell, null', () => {
    for (const e of ['leverage machine', 'cable', 'sled machine', 'assisted']) expect(isPerGym(e)).toBe(true);
    for (const e of ['smith machine', 'stationary bike', 'barbell', null]) expect(isPerGym(e)).toBe(false);
  });
});

describe('gymOnDay', () => {
  const t = timeline([['2026-03-12', 'a'], ['2026-10-30', 'b']]);
  it('is null before any change', () => expect(gymOnDay(t, '2026-03-11')).toBeNull());
  it('is the latest change on or before the day', () => {
    expect(gymOnDay(t, '2026-06-01')).toBe('a');
    expect(gymOnDay(t, '2026-12-01')).toBe('b');
  });
  it('counts a change on the day itself', () => {
    expect(gymOnDay(t, '2026-03-12')).toBe('a');
    expect(gymOnDay(t, '2026-10-30')).toBe('b');
  });
});

describe('workoutGym', () => {
  const t = timeline([['2026-10-30', 'b']]);
  it('a workout at 23:50 local on 29 Oct is at the old gym when the change is 30 Oct', () => {
    expect(workoutGym(t, new Date(2026, 9, 29, 23, 50).toISOString(), null)).toBeNull();
    expect(workoutGym(t, new Date(2026, 9, 30, 0, 10).toISOString(), null)).toBe('b');
  });
  it('a DST day (2026-10-25 in Europe) still maps by local day', () => {
    const t2 = timeline([['2026-10-25', 'b']]);
    expect(workoutGym(t2, new Date(2026, 9, 25, 0, 30).toISOString(), null)).toBe('b');
    expect(workoutGym(t2, new Date(2026, 9, 24, 23, 59).toISOString(), null)).toBeNull();
    expect(workoutGym(t2, new Date(2026, 9, 25, 23, 59).toISOString(), null)).toBe('b');
  });
  it('a visit wins over the timeline', () => {
    expect(workoutGym(t, at(2026, 11, 5), 'a')).toBe('a');
  });
});

describe('recordKey', () => {
  it('ALL_GYMS for barbell, NO_GYM for a machine with no changes, the gym id after a change', () => {
    expect(recordKey(timeline([]), 'barbell', at(2026, 11, 1), null)).toBe(ALL_GYMS);
    expect(recordKey(timeline([]), 'cable', at(2026, 11, 1), null)).toBe(NO_GYM);
    expect(recordKey(timeline([['2026-10-30', 'b']]), 'cable', at(2026, 11, 1), null)).toBe('b');
    expect(recordKey(timeline([['2026-10-30', 'b']]), 'cable', at(2026, 10, 1), null)).toBe(NO_GYM);
  });
});

describe('currentGym / gymName', () => {
  const t = timeline([['2026-10-30', 'b']]);
  it('finds the gym of today', () => {
    expect(currentGym(t, new Date(2026, 10, 2))?.name).toBe('Gym B');
    expect(currentGym(t, new Date(2026, 9, 1))).toBeNull();
  });
  it('names Previous gym when there is none', () => {
    expect(gymName(t, 'b')).toBe('Gym B');
    expect(gymName(t, null)).toBe('Previous gym');
  });
});

describe('gymStretches', () => {
  const now = new Date(2026, 10, 10);
  const w = (y: number, m: number, d: number, visit: string | null = null) => ({ startTime: at(y, m, d), visitGymId: visit });

  it('is empty without changes', () => {
    expect(gymStretches(timeline([]), [w(2026, 1, 1)], now)).toEqual([]);
  });

  it('newest first, Previous gym last with its count, current flag and counts right', () => {
    const t = timeline([['2026-10-30', 'a']]);
    const s = gymStretches(t, [w(2026, 1, 1), w(2026, 2, 1), w(2026, 11, 1)], now);
    expect(s).toEqual([
      { changeId: 'c0', gymId: 'a', name: 'Gym A', from: '2026-10-30', to: null, workouts: 1, current: true },
      { changeId: null, gymId: null, name: 'Previous gym', from: null, to: '2026-10-29', workouts: 2, current: false },
    ]);
  });

  it('has no Previous gym stretch without earlier workouts', () => {
    const t = timeline([['2026-10-30', 'a']]);
    expect(gymStretches(t, [w(2026, 11, 1)], now).map((x) => x.changeId)).toEqual(['c0']);
  });

  it('a named previous gym is a normal stretch with no start', () => {
    const t = timeline([[FROM_START_DAY, 'a'], ['2026-10-30', 'b']]);
    const s = gymStretches(t, [w(2026, 1, 1)], now);
    expect(s.map((x) => [x.name, x.from, x.to, x.workouts, x.current])).toEqual([
      ['Gym B', '2026-10-30', null, 0, true],
      ['Gym A', null, '2026-10-29', 1, false],
    ]);
  });

  it('a return to gym A gives two A stretches', () => {
    const t = timeline([['2026-03-12', 'a'], ['2026-06-01', 'b'], ['2026-10-30', 'a']]);
    const s = gymStretches(t, [w(2026, 4, 1), w(2026, 7, 1), w(2026, 11, 1), w(2026, 11, 2)], now);
    expect(s.map((x) => [x.name, x.workouts, x.current])).toEqual([
      ['Gym A', 2, true],
      ['Gym B', 1, false],
      ['Gym A', 1, false],
    ]);
  });

  it('a visit to another gym is not counted in the stretch it happened in', () => {
    const t = timeline([['2026-03-12', 'a'], ['2026-06-01', 'b']]);
    const s = gymStretches(t, [w(2026, 4, 1, 'b'), w(2026, 4, 2)], now);
    expect(s.map((x) => [x.name, x.workouts])).toEqual([['Gym B', 0], ['Gym A', 1]]);
  });
});

describe('labels', () => {
  const s = (from: string | null, to: string | null, workouts: number) =>
    ({ changeId: 'c', gymId: 'a', name: 'A', from, to, workouts, current: to === null });
  it('stretchLabel: dates, "now", and singular "1 workout"', () => {
    expect(stretchLabel(s('2026-10-30', null, 4))).toBe('Oct 30, 2026 – now · 4 workouts');
    expect(stretchLabel(s(null, '2026-10-29', 112))).toBe('Until Oct 29, 2026 · 112 workouts');
    expect(stretchLabel(s('2026-03-12', '2026-10-29', 1))).toBe('Mar 12, 2026 – Oct 29, 2026 · 1 workout');
  });
  it('deleteMessage names the gym the workouts go back to', () => {
    expect(deleteMessage(s('2026-10-30', null, 4), 'Previous gym')).toBe(
      'Delete this gym change? Workouts from Oct 30, 2026 count at Previous gym again.',
    );
  });
});

describe('yourGyms', () => {
  const t = timeline([['2026-03-12', 'a'], ['2026-10-30', 'b']], { a: 'Gym A', b: 'Gym B', c: 'Gym C' });
  const w = (y: number, m: number, d: number, visit: string | null = null) => ({ startTime: at(y, m, d), visitGymId: visit });

  it('the gym with the most recent workout first, gyms without workouts last', () => {
    const list = yourGyms(t, [w(2026, 4, 1), w(2026, 11, 1)]);
    expect(list.map((g) => [g.name, g.lastWorkout])).toEqual([
      ['Gym B', at(2026, 11, 1)],
      ['Gym A', at(2026, 4, 1)],
      ['Gym C', null],
    ]);
  });

  it('a visit counts for the visited gym', () => {
    expect(yourGyms(t, [w(2026, 4, 1), w(2026, 11, 5, 'a')])[0]).toMatchObject({ name: 'Gym A', lastWorkout: at(2026, 11, 5) });
  });
});
