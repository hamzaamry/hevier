import type { EquipmentGroup } from '@/types/equipment';

// The Equipment sheet's groups. The EquipmentGroup type (types/equipment.ts) is
// built from this list; equipmentGroup() is in lib/domain/muscles.ts.
export const EQUIPMENT_GROUPS = [
  'None',
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Plate',
  'Resistance Band',
  'Suspension Band',
  'Other',
] as const;

// The catalogue's equipment in the app's groups.
// No Cable group: cable exercises are "Machine", as are cardio machines.
export const EQUIPMENT_OF: Record<string, EquipmentGroup> = {
  'body weight': 'None',
  barbell: 'Barbell',
  'ez barbell': 'Barbell',
  'olympic barbell': 'Barbell',
  'trap bar': 'Barbell',
  landmine: 'Barbell',
  dumbbell: 'Dumbbell',
  kettlebell: 'Kettlebell',
  'leverage machine': 'Machine',
  'smith machine': 'Machine',
  'sled machine': 'Machine',
  cable: 'Machine',
  assisted: 'Machine',
  'stationary bike': 'Machine',
  'elliptical machine': 'Machine',
  'upper body ergometer': 'Machine',
  'skierg machine': 'Machine',
  'stepmill machine': 'Machine',
  'weight plate': 'Plate',
  band: 'Resistance Band',
  'resistance band': 'Resistance Band',
  'suspension trainer': 'Suspension Band',
};

// The other way round, for exercises the user makes (lib/domain/exerciseInput.ts).
// Other is no word at all: equipmentGroup(null) is Other.
export const EQUIPMENT_WORD_OF: Record<EquipmentGroup, string | null> = {
  None: 'body weight',
  Barbell: 'barbell',
  Dumbbell: 'dumbbell',
  Kettlebell: 'kettlebell',
  Machine: 'leverage machine',
  Plate: 'weight plate',
  'Resistance Band': 'resistance band',
  'Suspension Band': 'suspension trainer',
  Other: null,
};
