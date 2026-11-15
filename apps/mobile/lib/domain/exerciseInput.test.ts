import { describe, expect, it } from 'vitest';

import { EQUIPMENT_GROUPS } from '@/constants/equipment';
import { MUSCLE_GROUPS } from '@/constants/muscles';
import type { ExerciseInput } from '@/types/exercise';
import { equipmentGroup, muscleGroup, parseList, pickerMuscleGroup, secondaryGroups } from './muscles';
import { secondaryOptions, toExerciseColumns } from './exerciseInput';

const base: ExerciseInput = {
  name: 'Landmine Twist',
  type: 'reps_only',
  equipment: 'Barbell',
  primary: 'Abdominals',
  secondary: [],
  media: null,
};

describe('toExerciseColumns', () => {
  it.each(MUSCLE_GROUPS)('primary %s reads back as the same group', (g) => {
    const c = toExerciseColumns({ ...base, primary: g });
    expect(muscleGroup(c.target_muscle, c.body_part)).toBe(g);
    expect(pickerMuscleGroup(c.target_muscle, c.body_part)).toBe(g);
  });

  it.each(EQUIPMENT_GROUPS)('equipment %s reads back as the same group', (g) => {
    expect(equipmentGroup(toExerciseColumns({ ...base, equipment: g }).equipment)).toBe(g);
  });

  it('other muscles read back as the same groups', () => {
    const opts = secondaryOptions('Chest');
    const c = toExerciseColumns({ ...base, primary: 'Chest', secondary: opts });
    expect(secondaryGroups(parseList(c.secondary_muscles), 'Chest')).toEqual(opts);
  });

  it('trims the name and keeps the type and media', () => {
    const c = toExerciseColumns({ ...base, name: '  Twist ', media: { file: 'a.mp4', kind: 'video' } });
    expect(c).toMatchObject({ name: 'Twist', type: 'reps_only', media_file: 'a.mp4', media_kind: 'video' });
    expect(toExerciseColumns(base)).toMatchObject({ media_file: null, media_kind: null });
  });
});

describe('secondaryOptions', () => {
  it('offers every body muscle but the primary, Abductors and Neck included', () => {
    const opts = secondaryOptions('Chest');
    expect(opts).not.toContain('Chest');
    expect(opts).toContain('Abductors');
    expect(opts).toContain('Neck');
  });

  it('never offers Cardio, Full Body or Other', () => {
    for (const g of ['Cardio', 'Full Body', 'Other'] as const) expect(secondaryOptions('Chest')).not.toContain(g);
  });
});
