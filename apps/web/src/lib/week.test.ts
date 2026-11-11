import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAN, morningStates, type DayPlan } from './week';

describe('morningStates', () => {
  it('shows nothing before the first workout and red the morning after', () => {
    expect(morningStates(DEFAULT_PLAN, 0)).toEqual({});
    expect(morningStates(DEFAULT_PLAN, 1).CHEST).toBe('heavy');
  });

  it('keeps the worst state when two workouts hit the same muscle', () => {
    const plan: DayPlan[] = ['legs', 'rest', 'full', 'rest', 'rest', 'rest', 'rest'];
    expect(morningStates(plan, 3).QUADS).toBe('heavy');
    expect(morningStates(plan, 4).QUADS).toBe('partly');
    expect(morningStates(plan, 6).QUADS).toBe('ready');
  });
});
