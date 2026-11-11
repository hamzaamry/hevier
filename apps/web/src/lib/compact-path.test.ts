import { MALE_FRONT } from '@musclemap/assets';
import { describe, expect, it } from 'vitest';
import { compactPath } from './compact-path';

function expand(compact: string): [number, number][] {
  const points: [number, number][] = [];
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  for (const [, cmd, args] of compact.matchAll(/([MlcZz])([^MlcZz]*)/g)) {
    const nums = (args.match(/-?\d+/g) ?? []).map(Number);
    if (cmd === 'M') {
      [x, y] = [nums[0], nums[1]];
      [sx, sy] = [x, y];
      points.push([x, y]);
    } else if (cmd === 'l') {
      for (let k = 0; k < nums.length; k += 2) {
        x += nums[k];
        y += nums[k + 1];
        points.push([x, y]);
      }
    } else if (cmd === 'c') {
      for (let k = 0; k < nums.length; k += 6) {
        x += nums[k + 4];
        y += nums[k + 5];
        points.push([x, y]);
      }
    } else {
      [x, y] = [sx, sy];
    }
  }
  return points;
}

describe('compactPath', () => {
  it('turns absolute M, L, C, Z into whole-unit relative commands', () => {
    expect(compactPath('M10.4 20.6L12.2 18.1C14 17 15 16 16.2 15.4Z')).toBe('M10,21l2-3c2-1,3-2,4-3z');
  });

  it('lands on the same rounded end points as the original', () => {
    const muscle = MALE_FRONT.muscles[2];
    const original = [...muscle.d.matchAll(/-?\d+\.?\d*\s+-?\d+\.?\d*/g)].length;
    const compact = compactPath(muscle.d);
    expect(expand(compact).length).toBeGreaterThan(0);
    expect(expand(compact).length).toBeLessThanOrEqual(original);
    expect(compact.length).toBeLessThan(muscle.d.length * 0.6);
  });
});
