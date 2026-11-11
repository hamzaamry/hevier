import { describe, expect, it } from 'vitest';
import * as app from '../../../mobile/constants/training';
import { HARD_RIR, MIN_SET_WEIGHT, SECONDARY_SHARE, WARMUP_SET_WEIGHT, WEIGHT_PER_RIR, setCredit, totalCredit, zoneOf } from './sets';

describe('set credit', () => {
  it('follows docs/science/sets.md', () => {
    expect(setCredit('F')).toBe(1);
    expect(setCredit(0)).toBe(1);
    expect(setCredit(3)).toBe(1);
    expect(setCredit(4)).toBeCloseTo(0.86, 2);
    expect(setCredit(6)).toBeCloseTo(0.58, 2);
    expect(setCredit(8)).toBeCloseTo(0.3, 2);
    expect(setCredit(12)).toBe(0.3);
    expect(setCredit('W')).toBe(0.3);
  });

  it('adds up a session and picks the weekly zone', () => {
    expect(totalCredit(['W', 2, 2, 'F', 6])).toBeCloseTo(3.88, 2);
    expect(zoneOf(2.9)).toBe('below');
    expect(zoneOf(3)).toBe('maintenance');
    expect(zoneOf(4)).toBe('growth');
  });

  it('uses the same numbers as apps/mobile/constants/training.ts', () => {
    expect(HARD_RIR).toBe(app.HARD_RIR);
    expect(MIN_SET_WEIGHT).toBe(app.MIN_SET_WEIGHT);
    expect(WEIGHT_PER_RIR).toBe(app.WEIGHT_PER_RIR);
    expect(WARMUP_SET_WEIGHT).toBe(app.WARMUP_SET_WEIGHT);
    expect(SECONDARY_SHARE).toBe(app.SECONDARY_SHARE);
  });
});
