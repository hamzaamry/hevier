import { describe, expect, it } from 'vitest';

import { clamp, mean, median, roundToStep, sampleSd } from './math';

describe('math', () => {
  it('median: the middle, or the mean of the two middle ones', () => {
    expect(median([30, 40, 35])).toBe(35);
    expect(median([30, 40, 35, 31])).toBe(33);
  });

  it('sampleSd divides by n - 1', () => {
    expect(mean([2, 4])).toBe(3);
    expect(sampleSd([2, 4])).toBeCloseTo(Math.SQRT2);
  });

  it('clamps and rounds to a step', () => {
    expect([clamp(5, 6, 16), clamp(20, 6, 16), clamp(9, 6, 16)]).toEqual([6, 16, 9]);
    expect([roundToStep(33.75, 5), roundToStep(32, 5)]).toEqual([35, 30]);
  });
});
