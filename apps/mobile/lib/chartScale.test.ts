import { describe, expect, it } from 'vitest';
import { breakEnds, scale } from './chartScale';

describe('scale', () => {
  it("pads the range by 10% and puts the grid at 6000 and 8000 kg", () => {
    const { min, max, ticks } = scale([5055, 5475, 6210, 6380, 6275, 6675, 6485, 8835]);
    expect(ticks).toEqual([6000, 8000]);
    expect(min).toBeCloseTo(4677);
    expect(max).toBeCloseTo(9213);
  });

  it('handles a single workout', () => {
    const { min, max, ticks } = scale([60]);
    expect(min).toBeLessThan(60);
    expect(max).toBeGreaterThan(60);
    expect(ticks.length).toBeGreaterThan(0);
  });

  it('keeps at least two grid lines', () => {
    expect(scale([64, 66, 66, 68, 67, 73, 69, 91, 115, 100]).ticks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('breakEnds', () => {
  it('both sides stop `gap` short of the middle, on the line between the points', () => {
    expect(breakEnds([0, 0], [100, 50], 4)).toEqual({ before: [46, 23], after: [54, 27] });
  });

  it('none when the points are too close for a gap', () => {
    expect(breakEnds([0, 0], [6, 0], 4)).toBeNull();
  });
});
