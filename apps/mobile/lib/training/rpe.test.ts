import { describe, expect, it } from 'vitest';

import { ratingToRpe } from './cardio';
import { FOOTBALL } from '@/constants/cardio';
import { rirToRpe, rpeToRir, setRpe } from './rpe';

describe('rpe', () => {
  it('turns the reps-left chips 0–4 into RPE 10–6', () => {
    expect([0, 1, 2, 3, 4].map(rirToRpe)).toEqual([10, 9, 8, 7, 6]);
  });

  it('keeps no reps left as null', () => {
    expect(rirToRpe(null)).toBeNull();
    expect(rirToRpe(undefined)).toBeNull();
  });

  it('turns a saved RPE back into reps left, never below 0', () => {
    expect([10, 9, 8, 7, 6].map(rpeToRir)).toEqual([0, 1, 2, 3, 4]);
    expect(rpeToRir(7.5)).toBe(2.5);
    expect(rpeToRir(11)).toBe(0);
    expect(rpeToRir(null)).toBeNull();
  });

  it('round-trips the chips', () => {
    for (const rir of [0, 1, 2, 3, 4]) expect(rpeToRir(rirToRpe(rir))).toBe(rir);
  });

  it('saves reps left for a lift, none on a failure set', () => {
    expect(setRpe('Squat', { setType: 'normal', rir: 1 })).toBe(9);
    expect(setRpe('Squat', { setType: 'warmup', rir: 3 })).toBe(7);
    expect(setRpe('Squat', { setType: 'normal' })).toBeNull();
    expect(setRpe('Squat', { setType: 'failure', rir: 0 })).toBeNull();
  });

  it('saves the football rating, nothing when not picked', () => {
    expect(setRpe(FOOTBALL, { setType: 'normal', rating: 'hard', rir: 1 })).toBe(ratingToRpe('hard'));
    expect(setRpe(FOOTBALL, { setType: 'normal', rir: 1 })).toBeNull();
    expect(setRpe(FOOTBALL, { setType: 'failure', rating: 'easy' })).toBe(ratingToRpe('easy'));
  });
});
