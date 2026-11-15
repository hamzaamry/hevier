import type { BodyPart, MuscleGroup } from '@/types/muscles';

// The muscle groups the app works with, and the catalogue
// words that map onto them. The functions that use these tables are in
// lib/domain/muscles.ts; the types built from the lists in types/muscles.ts.

// The Muscle Group sheet: Upper Body, Lower Body, then Cardio / Full Body / Other.
export const UPPER_BODY_MUSCLES = [
  'Abdominals',
  'Biceps',
  'Chest',
  'Forearms',
  'Lats',
  'Lower Back',
  'Neck',
  'Shoulders',
  'Traps',
  'Triceps',
  'Upper Back',
] as const;
export const LOWER_BODY_MUSCLES = ['Abductors', 'Adductors', 'Calves', 'Glutes', 'Hamstrings', 'Quadriceps'] as const;
export const OTHER_MUSCLES = ['Cardio', 'Full Body', 'Other'] as const;
export const MUSCLE_GROUPS = [...UPPER_BODY_MUSCLES, ...LOWER_BODY_MUSCLES, ...OTHER_MUSCLES] as const;

// The catalogue's target muscles in the app's groups.
export const MUSCLE_OF_TARGET: Record<string, MuscleGroup> = {
  abs: 'Abdominals',
  obliques: 'Abdominals',
  biceps: 'Biceps',
  pectorals: 'Chest',
  'serratus anterior': 'Chest',
  forearms: 'Forearms',
  lats: 'Lats',
  spine: 'Lower Back',
  'levator scapulae': 'Neck',
  delts: 'Shoulders',
  traps: 'Traps',
  triceps: 'Triceps',
  'upper back': 'Upper Back',
  abductors: 'Abductors',
  adductors: 'Adductors',
  calves: 'Calves',
  // Tibialis raises: the body map has no shins, the lower leg is the nearest.
  shins: 'Calves',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  quads: 'Quadriceps',
  // Knee raises, hip flexion: the front of the thigh (rectus femoris).
  'hip flexors': 'Quadriceps',
  'cardiovascular system': 'Cardio',
  'full body': 'Full Body',
};

// The catalogue's secondary muscles in the app's groups; parts with no group
// (ankles, feet, hip flexors…) are left out.
export const MUSCLE_OF_SECONDARY: Record<string, MuscleGroup> = {
  core: 'Abdominals',
  abdominals: 'Abdominals',
  obliques: 'Abdominals',
  'lower abs': 'Abdominals',
  shoulders: 'Shoulders',
  deltoids: 'Shoulders',
  'rear deltoids': 'Shoulders',
  'rotator cuff': 'Shoulders',
  chest: 'Chest',
  'upper chest': 'Chest',
  biceps: 'Biceps',
  brachialis: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  'grip muscles': 'Forearms',
  'wrist flexors': 'Forearms',
  'wrist extensors': 'Forearms',
  wrists: 'Forearms',
  lats: 'Lats',
  'latissimus dorsi': 'Lats',
  'upper back': 'Upper Back',
  rhomboids: 'Upper Back',
  back: 'Upper Back',
  'lower back': 'Lower Back',
  trapezius: 'Traps',
  traps: 'Traps',
  sternocleidomastoid: 'Neck',
  glutes: 'Glutes',
  hamstrings: 'Hamstrings',
  quadriceps: 'Quadriceps',
  calves: 'Calves',
  soleus: 'Calves',
  adductors: 'Adductors',
  abductors: 'Abductors',
  groin: 'Adductors',
  'inner thighs': 'Adductors',
};

// The other way round, for exercises the user makes (lib/domain/exerciseInput.ts):
// the catalogue words that read back as each group.
export const TARGET_WORD_OF: Record<MuscleGroup, { target: string | null; bodyPart: string | null }> = {
  Abdominals: { target: 'abs', bodyPart: null },
  Biceps: { target: 'biceps', bodyPart: null },
  Chest: { target: 'pectorals', bodyPart: null },
  Forearms: { target: 'forearms', bodyPart: null },
  Lats: { target: 'lats', bodyPart: null },
  'Lower Back': { target: 'spine', bodyPart: null },
  Neck: { target: 'levator scapulae', bodyPart: null },
  Shoulders: { target: 'delts', bodyPart: null },
  Traps: { target: 'traps', bodyPart: null },
  Triceps: { target: 'triceps', bodyPart: null },
  'Upper Back': { target: 'upper back', bodyPart: null },
  Abductors: { target: 'abductors', bodyPart: null },
  Adductors: { target: 'adductors', bodyPart: null },
  Calves: { target: 'calves', bodyPart: null },
  Glutes: { target: 'glutes', bodyPart: null },
  Hamstrings: { target: 'hamstrings', bodyPart: null },
  Quadriceps: { target: 'quads', bodyPart: null },
  Cardio: { target: 'cardiovascular system', bodyPart: 'cardio' },
  'Full Body': { target: null, bodyPart: 'full body' },
  Other: { target: null, bodyPart: null },
};

// Secondary muscles: only body muscles (not Cardio, Full Body or Other).
export const SECONDARY_WORD_OF: Partial<Record<MuscleGroup, string>> = {
  Abdominals: 'abdominals',
  Biceps: 'biceps',
  Chest: 'chest',
  Forearms: 'forearms',
  Lats: 'lats',
  'Lower Back': 'lower back',
  Neck: 'sternocleidomastoid',
  Shoulders: 'shoulders',
  Traps: 'traps',
  Triceps: 'triceps',
  'Upper Back': 'upper back',
  Abductors: 'abductors',
  Adductors: 'adductors',
  Calves: 'calves',
  Glutes: 'glutes',
  Hamstrings: 'hamstrings',
  Quadriceps: 'quadriceps',
};

// The "Nice work!" radar card's body parts (lib/stats/stats.ts), clockwise from the
// right.
export const BODY_PARTS = ['Chest', 'Arms', 'Core', 'Shoulders', 'Back', 'Legs'] as const;

export const BODY_PART_OF: Partial<Record<MuscleGroup, BodyPart>> = {
  Chest: 'Chest',
  Biceps: 'Arms',
  Triceps: 'Arms',
  Forearms: 'Arms',
  Abdominals: 'Core',
  Shoulders: 'Shoulders',
  Lats: 'Back',
  'Upper Back': 'Back',
  'Lower Back': 'Back',
  Traps: 'Back',
  Neck: 'Back',
  Quadriceps: 'Legs',
  Hamstrings: 'Legs',
  Glutes: 'Legs',
  Calves: 'Legs',
  Abductors: 'Legs',
  Adductors: 'Legs',
};

// Statistics → Muscle distribution's radar axes (lib/training/distribution.ts).
// Push at the top right, pull below it, legs on the left. Forearms and neck
// are left out: grip work would make the arms look bigger than they are.
export const RADAR_MUSCLES = [
  'Chest',
  'Shoulders',
  'Triceps',
  'Lats',
  'Upper Back',
  'Biceps',
  'Abdominals',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
] as const satisfies readonly MuscleGroup[];

// Our muscle groups on MuscleMap's (components/body/BodyFigure.tsx). It has no neck.
export const MUSCLE_MAP_GROUPS: Partial<Record<MuscleGroup, string[]>> = {
  Abdominals: ['CORE', 'OBLIQUES'],
  Biceps: ['BICEPS'],
  Chest: ['CHEST'],
  Forearms: ['FOREARMS'],
  Lats: ['LATS'],
  'Lower Back': ['BACK_LOWER'],
  Shoulders: ['SHOULDERS_FRONT', 'SHOULDERS_SIDE', 'SHOULDERS_REAR'],
  Traps: ['TRAPEZIUS'],
  Triceps: ['TRICEPS'],
  'Upper Back': ['RHOMBOIDS'],
  Abductors: ['ABDUCTORS'],
  Adductors: ['ADDUCTORS'],
  Calves: ['CALVES'],
  Glutes: ['GLUTES'],
  Hamstrings: ['HAMSTRINGS'],
  Quadriceps: ['QUADS'],
};

// MuscleMap draws its "abductors" down the outside of the thigh, where the
// outer quad (vastus lateralis) is: when no abductor work was done that strip
// shows the quads' colour instead of staying grey.
export const MUSCLE_MAP_FALLBACK: Record<string, MuscleGroup> = {
  ABDUCTORS: 'Quadriceps',
};
