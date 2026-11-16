import { describe, it, expect } from 'vitest';
import { applyMuscleRules, ruleFor } from './muscleRules';
import type { CatalogueEntry } from '@/types/import';

function entry(name: string, target: string, secondaryMuscles: string[], category = 'strength'): CatalogueEntry {
  return { id: '1', name, bodyPart: null, equipment: null, target, secondaryMuscles, category, description: null, instructions: [] };
}

const fix = (e: CatalogueEntry) => applyMuscleRules(e).secondaryMuscles;

describe('muscle rules', () => {
  it('pull-ups and rows also train the upper back and traps', () => {
    expect(fix(entry('pull-up', 'lats', ['biceps', 'forearms']))).toEqual([
      'biceps',
      'forearms',
      'upper back',
      'trapezius',
      'rear deltoids',
    ]);
    expect(fix(entry('cable seated one arm alternate row', 'upper back', ['biceps', 'forearms']))).toEqual([
      'biceps',
      'forearms',
      'lats',
      'trapezius',
      'rear deltoids',
    ]);
  });

  it('squats and leg presses train the adductors', () => {
    expect(fix(entry('sled hack squat', 'quads', ['glutes', 'hamstrings', 'calves']))).toEqual([
      'glutes',
      'hamstrings',
      'calves',
      'adductors',
    ]);
  });

  it('drops muscles a movement does not train', () => {
    expect(fix(entry('lever leg extension', 'quads', ['hamstrings']))).toEqual([]);
    expect(fix(entry('sled 45° calf press', 'calves', ['hamstrings']))).toEqual([]);
    expect(fix(entry('lever seated fly', 'pectorals', ['deltoids', 'trapezius']))).toEqual(['deltoids']);
    expect(fix(entry('dumbbell seated shoulder press', 'delts', ['triceps', 'upper back']))).toEqual(['triceps']);
    expect(fix(entry('barbell reverse wrist curl', 'forearms', ['biceps', 'brachialis']))).toEqual([]);
  });

  it('gives lunges, Romanian deadlifts and back extensions one main muscle, keeping the old one', () => {
    expect(applyMuscleRules(entry('dumbbell lunge', 'glutes', ['quadriceps', 'hamstrings']))).toMatchObject({
      target: 'quads',
      secondaryMuscles: ['glutes', 'hamstrings', 'adductors'],
    });
    expect(applyMuscleRules(entry('barbell romanian deadlift', 'glutes', ['hamstrings', 'lower back']))).toMatchObject({
      target: 'hamstrings',
      secondaryMuscles: ['glutes', 'lower back'],
    });
    expect(applyMuscleRules(entry('hyperextension', 'glutes', ['hamstrings']))).toMatchObject({
      target: 'spine',
      secondaryMuscles: ['glutes', 'hamstrings'],
    });
  });

  it('never changes the main muscle to another movement\'s: another main muscle means another movement', () => {
    const lunge = entry('dumbbell lateral lunge with bicep curl', 'glutes', ['quadriceps']);
    expect(ruleFor(lunge)).toBeNull();
    expect(applyMuscleRules(lunge)).toBe(lunge);
    expect(ruleFor(entry('lower back curl', 'spine', ['glutes']))).toBeNull();
  });

  it('leaves stretches and two-in-one moves alone', () => {
    expect(ruleFor(entry('seated row stretch', 'upper back', [], 'stretching'))).toBeNull();
    expect(ruleFor(entry('dumbbell squat to press', 'quads', ['glutes']))).toBeNull();
  });
});
