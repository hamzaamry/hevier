// What an exercise logs: weight and reps, reps only, a time, or a distance and
// a time. The ExerciseType type (types/exercise.ts) is built from this list.
export const EXERCISE_TYPES = ['weight_reps', 'reps_only', 'duration', 'distance_duration'] as const;

// The units of the exercise page's chart and records (lib/stats/exerciseMetrics.ts).
// The Unit type (types/exercise.ts) is built from this list.
export const CHART_UNITS = ['kg', 'reps', 'seconds', 'km'] as const;

// The exercise page's tabs (app/exercises/[id].tsx), in order.
export const EXERCISE_PAGE_TABS = ['summary', 'history', 'howto'] as const;

// The two catalogue files an exercise can have on disk: a looping clip and a still.
export const CATALOGUE_MEDIA_KINDS = ['clip', 'still'] as const;

// The exercise picker's two filter sheets (app/add-exercise.tsx).
export const PICKER_FILTERS = ['equipment', 'muscles'] as const;

// Catalogue categories that are not workout exercises: the picker lists them
// after the others (lib/domain/exerciseSearch.ts).
export const STRETCH_CATEGORIES = ['stretching', 'mobility', 'yoga', 'rehab'];

// The picker search's short forms (lib/domain/exerciseSearch.ts), typed words
// already lowercased and without a final "s": the words they stand for.
// "adductor" -> "adduct" finds the machine, named "Hip Adduction (Machine)".
export const SEARCH_ALIASES: Record<string, string[]> = {
  db: ['dumbbell'],
  dbs: ['dumbbell'],
  bb: ['barbell'],
  kb: ['kettlebell'],
  rdl: ['romanian', 'deadlift'],
  sldl: ['stiff', 'leg', 'deadlift'],
  ohp: ['overhead', 'press'],
  adductor: ['adduct'],
  abductor: ['abduct'],
};

// Gym names an exercise's name doesn't say (lib/domain/exerciseSearch.ts): an
// exercise whose name matches is also found by these words. "reverse pec deck"
// finds "Rear Delt Reverse Fly (Machine)", which has "reverse" itself.
export const SEARCH_NICKNAMES: [RegExp, string][] = [
  [/\bfly\b.*\(machine\)/i, 'pec deck'],
  [/\bleg curl/i, 'hamstring curl'],
  [/\bleg extension/i, 'quad extension'],
  [/calf extension/i, 'calf raise'],
  [/lateral raise/i, 'side raise'],
  [/iso-lateral/i, 'hammer strength'],
  [/hip thrust/i, 'glute bridge'],
  [/shoulder press/i, 'overhead press ohp'],
];
