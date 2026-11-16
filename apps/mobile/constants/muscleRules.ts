import type { MuscleRule } from '@/types/import';

// Muscle fixes applied on top of openGym's catalogue (scripts/import/muscleRules.ts),
// one rule per movement, matched on the exercise name. First match wins.
//   targets: the main muscles this movement has; another one = not this movement, no fix.
//   need:    groups the exercise must list (added as the catalogue word given).
//   drop:    groups a movement like this doesn't train (removed).
//   main:    the main muscle it always has, where openGym is split (lunges were
//            glutes, split squats quads): the old one becomes a secondary muscle.
// Only lifting categories are checked: a stretch lists what it stretches.

export const RULE_CATEGORIES = ['strength', 'calisthenics', 'olympic', 'plyometrics', 'isometric'];

// Two movements in one ("squat to press", "lunge and row"): left as they are.
export const COMBO = /\b(and|to|into|with (press|row|curl|raise|fly))\b|\bcomplex\b|\+/;

const ARMS_AND_TORSO = ['Chest', 'Triceps', 'Biceps', 'Lats', 'Upper Back', 'Traps', 'Shoulders', 'Forearms'] as const;
const LEGS = ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors'] as const;

export const MUSCLE_RULES: MuscleRule[] = [
  // --- Pull -----------------------------------------------------------------
  {
    name: 'straight arm pulldown / pullover',
    match: /straight[- ]arm (pulldown|pull down|pushdown|lat)|pullover/,
    targets: ['lats', 'pectorals'],
    need: {},
    drop: ['Biceps', ...LEGS],
  },
  {
    name: 'pull-up / chin-up / pulldown',
    match: /pull[- ]?ups?\b|chin[- ]?ups?\b|pull ?downs?\b|muscle[- ]?ups?\b/,
    targets: ['lats', 'upper back'],
    need: { Biceps: 'biceps', 'Upper Back': 'upper back', Traps: 'trapezius', Shoulders: 'rear deltoids' },
    drop: ['Chest', 'Triceps', ...LEGS],
  },
  {
    name: 'upright row',
    match: /upright row/,
    targets: ['delts', 'traps'],
    need: { Traps: 'trapezius', Biceps: 'biceps' },
    drop: ['Chest', 'Triceps', 'Lats', ...LEGS],
  },
  {
    name: 'row',
    match: /\brows?\b/,
    exclude: /rower|rowing|renegade|sit-?up/,
    targets: ['upper back', 'lats', 'delts'],
    need: { Lats: 'lats', 'Upper Back': 'upper back', Traps: 'trapezius', Shoulders: 'rear deltoids', Biceps: 'biceps' },
    drop: ['Chest', 'Triceps', 'Quadriceps', 'Calves'],
  },
  {
    name: 'face pull / reverse fly / rear delt',
    match: /face pull|revers(e)? fly|reverse flye|rear delt|rear lateral|bent[- ]over lateral raise|band pull[- ]apart/,
    targets: ['delts', 'upper back'],
    need: { Shoulders: 'rear deltoids', 'Upper Back': 'upper back', Traps: 'trapezius' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats', ...LEGS],
  },
  {
    name: 'shrug',
    match: /shrugs?\b/,
    targets: ['traps'],
    need: { Forearms: 'forearms' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats', 'Shoulders', ...LEGS],
  },
  // --- Shoulders ------------------------------------------------------------
  {
    name: 'lateral raise',
    match: /lateral raise|side raise|lateral delt raise|side lateral/,
    targets: ['delts'],
    need: { Traps: 'trapezius' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats', 'Upper Back', ...LEGS],
  },
  {
    name: 'front raise',
    match: /front raise/,
    targets: ['delts'],
    need: { Chest: 'upper chest' },
    drop: ['Triceps', 'Biceps', 'Lats', 'Upper Back', ...LEGS],
  },
  {
    name: 'shoulder press',
    match: /(shoulder|overhead|military|arnold|seated|standing|z|landmine|behind the neck|push) press\b/,
    exclude: /bench|chest|leg|floor|incline|decline|triceps|calf|hip|pallof|ab\b/,
    targets: ['delts'],
    need: { Triceps: 'triceps' },
    drop: ['Biceps', 'Lats', 'Upper Back', 'Hamstrings', 'Calves'],
  },
  // --- Push -----------------------------------------------------------------
  {
    name: 'fly',
    match: /\bfly(e)?s?\b|pec deck|crossover/,
    targets: ['pectorals'],
    need: { Shoulders: 'shoulders' },
    drop: ['Triceps', 'Biceps', 'Lats', 'Upper Back', 'Traps', ...LEGS],
  },
  {
    name: 'dip',
    match: /\bdips?\b/,
    exclude: /hip|glute|squat|jerk|pull/,
    targets: ['triceps', 'pectorals'],
    need: { Triceps: 'triceps', Chest: 'chest', Shoulders: 'shoulders' },
    drop: ['Biceps', 'Lats', 'Upper Back', ...LEGS],
  },
  {
    name: 'chest press / bench press / push-up',
    match: /bench press|chest press|floor press|push-?ups?\b|press-?ups?\b|incline press|decline press|svend press|squeeze press/,
    exclude: /jump|plank to|hip/,
    targets: ['pectorals', 'triceps', 'delts'],
    need: { Triceps: 'triceps', Shoulders: 'shoulders', Chest: 'chest' },
    drop: ['Biceps', 'Lats', 'Upper Back', 'Traps', 'Quadriceps', 'Hamstrings', 'Calves'],
  },
  // --- Arms -----------------------------------------------------------------
  {
    name: 'wrist curl / extension',
    match: /wrist|finger curl|reverse grip wrist|forearm (curl|roll)/,
    targets: ['forearms'],
    need: {},
    drop: ['Biceps', 'Triceps', 'Shoulders', 'Chest', 'Lats', 'Upper Back', 'Traps', ...LEGS],
  },
  {
    name: 'triceps isolation',
    match: /triceps|pushdown|push-?down|press-?down|skull ?crusher|french press|kickback/,
    exclude: /glute|hip|donkey|leg|bench press|dip|push-?up/,
    targets: ['triceps'],
    need: {},
    drop: ['Biceps', 'Chest', 'Shoulders', 'Lats', 'Upper Back', 'Traps', ...LEGS],
  },
  {
    name: 'biceps curl',
    match: /\bcurls?\b/,
    exclude: /leg|hamstring|nordic|glute|crunch|curl-?up|ball curl|slider|sliding|towel|hip|knee|abs?\b|trunk|spine|back/,
    targets: ['biceps', 'forearms'],
    need: { Forearms: 'forearms' },
    drop: ['Triceps', 'Chest', 'Shoulders', 'Lats', 'Upper Back', 'Traps', ...LEGS],
  },
  // --- Legs -----------------------------------------------------------------
  {
    name: 'leg extension',
    match: /leg extension|knee extension|sissy squat/,
    exclude: /crunch|hip|back/,
    targets: ['quads'],
    need: {},
    drop: ['Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors', ...ARMS_AND_TORSO],
  },
  {
    name: 'leg curl',
    match: /leg curl|hamstring curl|nordic|glute[- ]ham raise|ball curl|slider curl|sliding leg curl/,
    targets: ['hamstrings'],
    need: { Calves: 'calves' },
    drop: ['Quadriceps', 'Adductors', 'Abductors', ...ARMS_AND_TORSO],
  },
  {
    name: 'calf raise',
    match: /calf (raise|press|extension)|heel raise|donkey calf|calves raise/,
    targets: ['calves'],
    need: {},
    drop: ['Hamstrings', 'Quadriceps', 'Glutes', 'Adductors', 'Abductors', ...ARMS_AND_TORSO],
  },
  {
    name: 'hip abduction',
    match: /abduction|abductor|clamshell|clam shell|fire hydrant|lateral band walk|monster walk|side[- ]lying leg raise/,
    exclude: /shoulder|scapula|arm/,
    targets: ['abductors', 'glutes'],
    need: { Glutes: 'glutes', Abductors: 'abductors' },
    drop: ['Quadriceps', 'Hamstrings', 'Calves', ...ARMS_AND_TORSO],
  },
  {
    name: 'hip adduction',
    match: /adduction|adductor|copenhagen/,
    exclude: /shoulder|scapula|arm|pallof/,
    targets: ['adductors'],
    need: {},
    drop: ['Calves', ...ARMS_AND_TORSO],
  },
  {
    name: 'hip thrust / glute bridge',
    match: /hip thrust|glute bridge|hip bridge|(barbell|dumbbell|single leg|one leg|weighted|band|marching|elevated|feet up) bridge/,
    exclude: /side|plank|straight arm|neck|wrestler/,
    targets: ['glutes'],
    need: { Hamstrings: 'hamstrings' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats', 'Upper Back', 'Traps', 'Shoulders', 'Forearms'],
  },
  {
    name: 'romanian / stiff-leg deadlift',
    match: /romanian|stiff[- ]legg?(ed)? deadlift|straight[- ]leg deadlift|\brdl\b|single[- ]leg deadlift|good morning/,
    targets: ['hamstrings', 'glutes', 'spine'],
    main: 'hamstrings',
    need: { Glutes: 'glutes', 'Lower Back': 'lower back' },
    drop: ['Chest', 'Triceps', 'Biceps'],
  },
  {
    name: 'back extension',
    match: /hyperextension|back extension/,
    exclude: /glute|reverse|leg/,
    targets: ['spine', 'glutes', 'hamstrings'],
    main: 'spine',
    need: { Glutes: 'glutes', Hamstrings: 'hamstrings' },
    drop: ['Chest', 'Triceps', 'Biceps'],
  },
  {
    name: 'lunge / step-up / split squat',
    match: /lunge|step-?ups?\b|split squat/,
    exclude: /calf|jump|hop/,
    targets: ['quads', 'glutes', 'adductors'],
    main: 'quads',
    need: { Glutes: 'glutes', Adductors: 'adductors' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats'],
  },
  {
    name: 'deadlift / hinge',
    match: /deadlift|good morning|\brdl\b|hip hinge|pull[- ]through|kettlebell swing|\bswings?\b/,
    targets: ['hamstrings', 'glutes', 'spine'],
    need: { Glutes: 'glutes', Hamstrings: 'hamstrings', 'Lower Back': 'lower back' },
    drop: ['Chest', 'Triceps', 'Biceps'],
  },
  {
    name: 'squat / leg press / lunge',
    match: /squat|leg press|hack|lunge|step-?ups?\b|pistol|split squat|belt squat/,
    exclude: /calf|jump|hop|sissy/,
    targets: ['quads', 'glutes', 'adductors'],
    need: { Glutes: 'glutes', Quadriceps: 'quadriceps', Adductors: 'adductors' },
    drop: ['Chest', 'Triceps', 'Biceps', 'Lats'],
  },
];
