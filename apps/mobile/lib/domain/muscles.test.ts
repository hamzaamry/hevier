import { describe, expect, it } from 'vitest';

import { equipmentGroup, muscleGroup, parseList, pickerMuscleGroup, secondaryGroups } from './muscles';

describe('muscles', () => {
  it('names muscles by group', () => {
    expect(muscleGroup('pectorals', 'chest')).toBe('Chest');
    expect(muscleGroup('quads', 'upper legs')).toBe('Quadriceps');
    expect(muscleGroup('cardiovascular system', 'cardio')).toBe('Cardio');
    expect(muscleGroup(null, null)).toBe('Other');
  });

  it('names a full body move by the muscle it works, the picker files it under Full Body', () => {
    expect(muscleGroup('glutes', 'full body')).toBe('Glutes');
    expect(muscleGroup('cardiovascular system', 'full body')).toBe('Cardio');
    expect(muscleGroup('full body', 'full body')).toBe('Full Body');
    expect(muscleGroup(null, 'full body')).toBe('Full Body');
    expect(pickerMuscleGroup('glutes', 'full body')).toBe('Full Body');
    expect(pickerMuscleGroup('glutes', 'upper legs')).toBe('Glutes');
  });

  it("knows openGym's newer target words", () => {
    expect(muscleGroup('obliques', 'waist')).toBe('Abdominals');
    expect(muscleGroup('shins', 'lower legs')).toBe('Calves');
    expect(muscleGroup('hip flexors', 'upper legs')).toBe('Quadriceps');
  });

  it('groups equipment: cables are Cable', () => {
    expect(equipmentGroup('cable')).toBe('Cable');
    expect(equipmentGroup('body weight')).toBe('None');
    expect(equipmentGroup('ez barbell')).toBe('Barbell');
    expect(equipmentGroup('stability ball')).toBe('Other');
  });

  it("names secondary muscles by group, without the primary or repeats", () => {
    expect(secondaryGroups(['rhomboids', 'biceps', 'grip muscles', 'lats', 'upper back', 'ankles'], 'Lats')).toEqual([
      'Upper Back',
      'Biceps',
      'Forearms',
    ]);
  });

  it('reads a JSON list, empty when missing, not a list or broken', () => {
    expect(parseList('["a", 2]')).toEqual(['a', '2']);
    expect(parseList(null)).toEqual([]);
    expect(parseList('{"a":1}')).toEqual([]);
    expect(parseList('not json')).toEqual([]);
  });
});
