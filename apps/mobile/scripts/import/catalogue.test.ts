import { describe, it, expect } from 'vitest';
import { catalogueExerciseType, toHevyName } from './catalogue';
import type { CatalogueEntry } from '@/types/import';

function entry(overrides: Partial<CatalogueEntry>): CatalogueEntry {
  return {
    id: '0001',
    name: 'dumbbell bench press',
    bodyPart: 'chest',
    equipment: 'dumbbell',
    target: 'pectorals',
    secondaryMuscles: [],
    category: 'strength',
    description: null,
    instructions: [],
    ...overrides,
  };
}

describe('toHevyName', () => {
  it('moves the equipment prefix into a Hevy-style suffix', () => {
    expect(toHevyName('dumbbell bench press')).toBe('Bench Press (Dumbbell)');
    expect(toHevyName('lever leg extension')).toBe('Leg Extension (Machine)');
    expect(toHevyName('ez barbell curl')).toBe('Curl (EZ Bar)');
  });

  it('keeps names without equipment as plain title case', () => {
    expect(toHevyName('pull-up')).toBe('Pull-up');
    expect(toHevyName('3/4 sit-up')).toBe('3/4 Sit-up');
  });

  it('turns parenthesised details and versions into readable parts', () => {
    expect(toHevyName('cable straight arm pulldown (with rope)')).toBe('Straight Arm Pulldown - With Rope (Cable)');
    expect(toHevyName('dumbbell hammer curl v. 2')).toBe('Hammer Curl V2 (Dumbbell)');
  });

  it('leaves the figure out and writes short forms in capitals', () => {
    expect(toHevyName('half sit-up (male)')).toBe('Half Sit-up');
    expect(toHevyName('arms apart circular toe touch male')).toBe('Arms Apart Circular Toe Touch');
    expect(toHevyName('ez bar biceps curl')).toBe('EZ Bar Biceps Curl');
    expect(toHevyName('bodyweight single leg rdl')).toBe('Bodyweight Single Leg RDL');
    expect(toHevyName('sled 45° leg press (back pov)')).toBe('45° Leg Press - Back View (Machine)');
    expect(toHevyName('air squat version 2')).toBe('Air Squat V2');
  });
});

describe('catalogueExerciseType', () => {
  it('maps equipment and category to the four logging types', () => {
    expect(catalogueExerciseType(entry({}))).toBe('weight_reps');
    expect(catalogueExerciseType(entry({ equipment: 'body weight', category: 'calisthenics' }))).toBe('reps_only');
    expect(catalogueExerciseType(entry({ name: 'front plank', category: 'isometric' }))).toBe('duration');
    expect(catalogueExerciseType(entry({ name: 'run', category: 'cardio' }))).toBe('distance_duration');
    expect(catalogueExerciseType(entry({ name: 'jumping jack', category: 'cardio' }))).toBe('duration');
  });
});
