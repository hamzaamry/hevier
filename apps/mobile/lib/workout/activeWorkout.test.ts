import { describe, expect, it, vi } from 'vitest';
import { SET_FIELDS } from '@/constants/setFields';
import { DEFAULT_WORKOUT_SETTINGS } from '@/constants/defaults';
import { FOOTBALL } from '@/constants/cardio';
import type { ActiveExercise, ActiveSet, ActiveWorkout } from '@/types/workout';

let nextId = 0;
vi.mock('expo-crypto', () => ({ randomUUID: () => `id${++nextId}` }));
const { elapsedSeconds, needsBodyWeight, newSet, nextSetLike, orderByKeys, shouldAskRating, shouldAskRepsLeft, workoutStats } = await import('./activeWorkout');

const set = (from: Partial<ActiveSet>) => newSet(from);
const exercise = (name: string, sets: ActiveSet[]) => ({ key: name, name, sets }) as unknown as ActiveExercise;

describe('nextSetLike', () => {
  it('copies the last set’s values, not done, a normal set with its own key', () => {
    const last = set({ weight: '80', reps: '8', setType: 'failure', done: true });
    const next = nextSetLike([set({ weight: '60' }), last]);
    expect([next.weight, next.reps, next.setType, next.done]).toEqual(['80', '8', 'normal', false]);
    expect(next.key).not.toBe(last.key);
  });

  it('is empty when there is no set yet', () => {
    expect(nextSetLike([]).weight).toBe('');
  });
});

describe('elapsedSeconds', () => {
  it('is 0 when the start time cannot be read', () => {
    expect(elapsedSeconds({ startTime: 'garbage' } as ActiveWorkout, Date.now())).toBe(0);
  });
});

describe('orderByKeys', () => {
  it('puts the items in the order of the keys and skips unknown ones', () => {
    const list = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
    expect(orderByKeys(list, ['c', 'x', 'a', 'b']).map((i) => i.key)).toEqual(['c', 'a', 'b']);
  });
});

describe('shouldAskRepsLeft', () => {
  const on = { ...DEFAULT_WORKOUT_SETTINGS, repsLeft: true };
  it('asks after the last set is ticked, on exercises with reps', () => {
    expect(shouldAskRepsLeft(SET_FIELDS.weight_reps, set({ done: true }), on)).toBe(true);
    expect(shouldAskRepsLeft(SET_FIELDS.weight_reps, set({ done: false }), on)).toBe(false);
    expect(shouldAskRepsLeft(SET_FIELDS.duration, set({ done: true }), on)).toBe(false);
  });

  it('not on a failure set, nor when turned off', () => {
    expect(shouldAskRepsLeft(SET_FIELDS.weight_reps, set({ done: true, setType: 'failure' }), on)).toBe(false);
    expect(shouldAskRepsLeft(SET_FIELDS.weight_reps, set({ done: true }), { ...on, repsLeft: false })).toBe(false);
  });
});

describe('shouldAskRating', () => {
  it('asks once a Football game is ticked', () => {
    expect(shouldAskRating(exercise(FOOTBALL, [set({ done: true })]))).toBe(true);
    expect(shouldAskRating(exercise(FOOTBALL, [set({ done: false })]))).toBe(false);
    expect(shouldAskRating(exercise('Squat', [set({ done: true })]))).toBe(false);
  });
});

describe('body weight exercises', () => {
  const pullUps = { ...exercise('Pull Up', [set({ reps: '10', done: true }), set({ reps: '8', done: false })]), exerciseId: 'pu' };
  const bench = { ...exercise('Bench', [set({ weight: '100', reps: '5', done: true })]), exerciseId: 'bp' };
  const workout = { exercises: [pullUps, bench] } as unknown as ActiveWorkout;
  const ids = new Set(['pu']);

  it('counts the body weight for done sets of body weight exercises', () => {
    expect(workoutStats(workout, { weightKg: 80, exerciseIds: ids })).toEqual({ volumeKg: 800 + 500, sets: 2 });
    expect(workoutStats(workout, { weightKg: null, exerciseIds: ids }).volumeKg).toBe(500);
    expect(workoutStats(workout).volumeKg).toBe(500);
  });

  it('asks for the body weight only when none is logged and a body weight exercise is done', () => {
    expect(needsBodyWeight(workout, { weightKg: null, exerciseIds: ids })).toBe(true);
    expect(needsBodyWeight(workout, { weightKg: 80, exerciseIds: ids })).toBe(false);
    expect(needsBodyWeight(workout, { weightKg: null, exerciseIds: new Set() })).toBe(false);
    expect(needsBodyWeight(workout, null)).toBe(false);
  });
});
