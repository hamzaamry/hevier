import { describe, expect, it } from 'vitest';

import { notificationContent, sameNotification } from './workoutNotification';
import type { ActiveExercise, ActiveSet, ActiveWorkout } from '@/types/workout';

function set(key: string, weight: string, reps: string, done = false): ActiveSet {
  return { key, setType: 'normal', weight, reps, km: '', time: '', done };
}

function exercise(key: string, name: string, sets: ActiveSet[], type: ActiveExercise['type'] = 'weight_reps'): ActiveExercise {
  return { key, exerciseId: key, catalogueId: `c-${key}`, name, type, notes: '', restSeconds: null, supersetId: null, previous: [], sets };
}

function workout(exercises: ActiveExercise[], restEndsAt: number | null = null): ActiveWorkout {
  return { title: 'UPPER A', routineId: null, startTime: '', exercises, restEndsAt, restTotal: restEndsAt ? 180 : null };
}

describe('notificationContent', () => {
  it('shows the next set, between sets and while resting', () => {
    const w = workout([exercise('lat', 'Lat Pulldown (Cable)', [set('a', '80', '11', true), set('b', '80', '8')])], 5000);
    const c = notificationContent(w);
    expect(c.title).toBe('Lat Pulldown (Cable)');
    expect(c.setText).toBe('Set 2/2 - 80 kg x 8 reps');
    expect(c.restText).toBe('Next: Set 2 of 2 (80 kg x 8 reps)');
    expect(c.restEndsAt).toBe(5000);
    expect(c.catalogueId).toBe('c-lat');
    expect(c.next).toEqual({ exerciseKey: 'lat', setKey: 'b' });
  });

  it('shows one dumbbell on exercises logged per hand', () => {
    const w = workout([exercise('bench', 'Bench Press (Dumbbell)', [set('a', '60', '8')])]);
    expect(notificationContent(w, (id) => id === 'bench').setText).toBe('Set 1/1 - 30 kg each x 8 reps');
  });

  it('moves to the next exercise, and keeps going past a set skipped earlier', () => {
    const w = workout([
      exercise('one', 'Squat', [set('a', '100', '5'), set('b', '100', '5', true)]),
      exercise('two', 'Leg Press', [set('c', '200', '10')]),
    ]);
    expect(notificationContent(w).next).toEqual({ exerciseKey: 'two', setKey: 'c' });
    w.exercises[1].sets[0].done = true;
    expect(notificationContent(w).setText).toBe('Set 1/2 - 100 kg x 5 reps');
  });

  it('leaves out values not typed, and says when every set is done', () => {
    const w = workout([exercise('pu', 'Pull Up', [set('a', '', '')], 'reps_only')]);
    expect(notificationContent(w).setText).toBe('Set 1/1');
    w.exercises[0].sets[0] = set('a', '', '12');
    expect(notificationContent(w).restText).toBe('Next: Set 1 of 1 (12 reps)');
    w.exercises[0].sets[0].done = true;
    const c = notificationContent(w);
    expect(c.title).toBe('UPPER A');
    expect(c.setText).toBe('All sets done');
    expect(c.next).toBeNull();
  });

  it('writes a decimal weight typed with a comma as a number', () => {
    const w = workout([exercise('c', 'Curl', [set('a', '12,5', '10')])]);
    expect(notificationContent(w).setText).toBe('Set 1/1 - 12.5 kg x 10 reps');
  });

  it('counts as the same only what the notification shows', () => {
    const w = workout([exercise('lat', 'Lat Pulldown', [set('a', '80', '11'), set('b', '80', '8')])]);
    const before = notificationContent(w);
    w.exercises[0].sets[1] = set('b', '85', '8');
    expect(sameNotification(before, notificationContent(w))).toBe(true);
    w.exercises[0].sets[0] = set('a', '85', '11');
    expect(sameNotification(before, notificationContent(w))).toBe(false);
    expect(sameNotification(before, { ...before, restEndsAt: 1 })).toBe(false);
    expect(sameNotification(null, null)).toBe(true);
    expect(sameNotification(before, null)).toBe(false);
  });
});
