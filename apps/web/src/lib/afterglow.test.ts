import { describe, expect, it } from 'vitest';
import { HERO_SESSION, STAGES, counts, frame, hoursFromProgress, progressFromHours, stageIndex } from './afterglow';
import { summarize } from './recovery';

describe('stage copy', () => {
  it('is true for the hero workout at the hour each stage starts', () => {
    const at = (h: number) => summarize(HERO_SESSION, h);
    expect(at(0).heavy).toHaveLength(17);
    expect(at(24).heavy).toHaveLength(0);
    expect(at(24).ready).toEqual([]);
    expect(at(30).ready).toEqual(expect.arrayContaining(['CORE', 'BACK_LOWER', 'ADDUCTORS']));
    expect(at(12).partly).toEqual(expect.arrayContaining(['CORE', 'BACK_LOWER']));
    expect(at(48).ready).toEqual(expect.arrayContaining(['SHOULDERS_SIDE', 'SHOULDERS_REAR', 'HAMSTRINGS']));
    expect(at(48).partly).toEqual(expect.arrayContaining(['CHEST', 'LATS', 'GLUTES', 'QUADS']));
    expect(at(72).ready).toHaveLength(17);
  });

  it('starts every stage after the previous one', () => {
    const hours = STAGES.map((s) => s.from);
    expect(hours).toEqual([...hours].sort((a, b) => a - b));
    expect(stageIndex(0)).toBe(0);
    expect(stageIndex(47.9)).toBe(2);
    expect(stageIndex(96)).toBe(4);
  });
});

describe('frame', () => {
  it('is red at 0 h and green at 96 h', () => {
    expect(frame(0).vars['--w3']).toBe('255 69 58');
    expect(frame(96).vars['--w3']).toBe('52 199 89');
    expect(Number(frame(0).vars['--halo-r'])).toBeCloseTo(1);
    expect(Number(frame(96).vars['--halo-g'])).toBeCloseTo(1);
  });

  it('turns the short-window muscles before the long-window ones', () => {
    expect(frame(36).vars['--w1']).toBe('52 199 89');
    expect(frame(36).vars['--w3']).not.toBe('52 199 89');
  });
});

describe('scroll mapping', () => {
  it('round-trips hours through progress and rests at both ends', () => {
    expect(hoursFromProgress(0)).toBe(0);
    expect(hoursFromProgress(1)).toBe(96);
    for (const h of [6, 12, 30, 48, 72, 90]) expect(hoursFromProgress(progressFromHours(h))).toBeCloseTo(h, 5);
  });

  it('counts the muscles in each state', () => {
    expect(counts(0)).toEqual({ heavy: 17, partly: 0, ready: 0 });
    expect(counts(96)).toEqual({ heavy: 0, partly: 0, ready: 17 });
  });
});
