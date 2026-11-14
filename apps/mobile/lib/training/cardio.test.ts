import { describe, expect, it } from 'vitest';

import { cardioActivity, cardioFatigue, cardioLeft, cardioScale, ratingToRpe, rpeToRating } from './cardio';
import { CARDIO_ACTIVITIES, FOOTBALL } from '@/constants/cardio';

const football = CARDIO_ACTIVITIES[FOOTBALL];

describe('cardio', () => {
  it('a normal 90-minute game counts 1, longer games less per minute', () => {
    expect(cardioScale(football, 90)).toBeCloseTo(1);
    expect(cardioScale(football, 45)).toBeCloseTo(0.62, 2);
    expect(cardioScale(football, 108)).toBeCloseTo(1.14, 2);
    expect(cardioScale(football, 90, 'easy')).toBeCloseTo(0.7);
    expect(cardioScale(football, 90, 'hard')).toBeCloseTo(1.3);
    expect(cardioScale(football, 900)).toBeCloseTo(cardioScale(football, 150));
  });

  it('stays full for a day, then halves every 30 hours', () => {
    expect(cardioLeft(0.8, 0)).toBe(0.8);
    expect(cardioLeft(0.8, 24)).toBe(0.8);
    expect(cardioLeft(0.8, 54)).toBeCloseTo(0.4);
    expect(cardioLeft(0.8, -1)).toBe(0);
  });

  it('football hamstrings: heavy for about a day and a half, ready around day three', () => {
    const at = (h: number) => cardioFatigue(football, 90, 'normal', h).get('Hamstrings')!;
    expect(at(30)).toBeGreaterThan(0.6); // Heavy recent load
    expect(at(48)).toBeLessThan(0.6);
    expect(at(48)).toBeGreaterThanOrEqual(0.3); // Partly recovered
    expect(at(72)).toBeLessThan(0.3); // Likely ready
    expect(cardioFatigue(football, 90, 'normal', 0).has('Biceps')).toBe(false);
  });

  it('knows each activity by exercise name, and nothing else', () => {
    for (const name of ['Football', 'Sprints', 'Tennis', 'Running', 'Hiking', 'Walking']) {
      expect(cardioActivity(name)).toBeDefined();
    }
    expect(cardioActivity('Bench Press')).toBeUndefined();
    expect(cardioActivity('constructor')).toBeUndefined();
  });

  it('sprints: hard on the hamstrings after a 20-minute session', () => {
    const f = cardioFatigue(cardioActivity('Sprints')!, 20, 'normal', 12);
    expect(f.get('Hamstrings')).toBeCloseTo(0.8);
    expect(f.has('Shoulders')).toBe(false);
  });

  it('tennis: tires the shoulders as well as the legs', () => {
    const f = cardioFatigue(cardioActivity('Tennis')!, 90, 'normal', 12);
    expect(f.get('Shoulders')).toBeCloseTo(0.4);
    expect(f.get('Quadriceps')).toBeCloseTo(0.6);
  });

  it('running, hiking and walking tire the legs progressively less', () => {
    const quads = (name: string, minutes: number) =>
      cardioFatigue(cardioActivity(name)!, minutes, 'normal', 12).get('Quadriceps')!;
    expect(quads('Running', 45)).toBeGreaterThan(quads('Hiking', 180));
    expect(quads('Hiking', 180)).toBeGreaterThan(quads('Walking', 90));
  });

  it('a short easy walk is not worth a flag, a very long one is capped', () => {
    const walking = cardioActivity('Walking')!;
    expect(cardioFatigue(walking, 30, 'easy', 0).get('Calves')!).toBeLessThan(0.3);
    expect(cardioScale(walking, 5000)).toBeCloseTo(cardioScale(walking, 300));
  });

  it('keeps the rating in sets.rpe, normal when missing', () => {
    expect(rpeToRating(ratingToRpe('easy'))).toBe('easy');
    expect(rpeToRating(ratingToRpe('hard'))).toBe('hard');
    expect(rpeToRating(null)).toBe('normal');
    expect(rpeToRating(undefined)).toBe('normal');
  });
});
