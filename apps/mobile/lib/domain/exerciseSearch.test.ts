import { describe, expect, it } from 'vitest';
import type { PickerExercise } from '@/types/exercise';
import catalogueJson from '@hevier/catalogue/exercises.json';
import { HEVY_OFFICIAL_NAMES } from '@/scripts/import/hevyOfficialNames';
import { toHevyName } from '@/scripts/import/catalogue';
import { filterExercises, pickerCount, pickerSections, recentExercises, searchExercises, suggestedExercises } from './exerciseSearch';

const ex = (name: string, extra: Partial<PickerExercise> = {}): PickerExercise => ({
  id: name,
  name,
  type: 'weight_reps',
  catalogueId: null,
  muscle: 'Biceps',
  secondary: [],
  stretch: false,
  equipment: 'Dumbbell',
  media: null,
  timesDone: 0,
  lastDone: null,
  ...extra,
});

describe('exercise picker', () => {
  it('lists recent exercises, latest first, without ones never done', () => {
    const all = [
      ex('A', { lastDone: '2026-10-01T10:00:00Z' }),
      ex('B'),
      ex('C', { lastDone: '2026-10-14T10:00:00Z' }),
    ];
    expect(recentExercises(all).map((e) => e.name)).toEqual(['C', 'A']);
    expect(recentExercises(all, 1).map((e) => e.name)).toEqual(['C']);
  });

  it('searches every word, any order, case-insensitive; done ones first', () => {
    const all = [
      ex('21s Bicep Curl', { equipment: 'Barbell' }),
      ex('Bicep Curl (Dumbbell)', { timesDone: 12 }),
      ex('Hammer Curl (Dumbbell)'),
      ex('Bench Press (Dumbbell)'),
    ];
    expect(searchExercises(all, 'curl').map((e) => e.name)).toEqual([
      'Bicep Curl (Dumbbell)',
      '21s Bicep Curl',
      'Hammer Curl (Dumbbell)',
    ]);
    expect(searchExercises(all, ' DUMB  curl ').map((e) => e.name)).toEqual([
      'Bicep Curl (Dumbbell)',
      'Hammer Curl (Dumbbell)',
    ]);
    expect(searchExercises(all, 'aas')).toEqual([]);
    expect(searchExercises(all, '  ')).toBe(all);
  });

  it('suggests 3 of the same muscle, most done first, not the one replaced', () => {
    const all = [
      ex('Triceps Pushdown', { muscle: 'Triceps', timesDone: 9 }),
      ex('Skullcrusher', { muscle: 'Triceps', timesDone: 2 }),
      ex('Dips', { muscle: 'Triceps' }),
      ex('Close Grip Bench', { muscle: 'Triceps' }),
      ex('Bicep Curl', { muscle: 'Biceps', timesDone: 30 }),
    ];
    expect(suggestedExercises(all, { id: 'Triceps Pushdown', muscle: 'Triceps' }).map((e) => e.name)).toEqual([
      'Skullcrusher',
      'Close Grip Bench',
      'Dips',
    ]);
  });

  it('filters by any of the picked equipment and any of the picked muscles', () => {
    const all = [
      ex('Bicep Curl (Dumbbell)'),
      ex('Bicep Curl (Barbell)', { equipment: 'Barbell' }),
      ex('Wrist Curl (Barbell)', { equipment: 'Barbell', muscle: 'Forearms' }),
      ex('Bench Press (Barbell)', { equipment: 'Barbell', muscle: 'Chest' }),
    ];
    expect(filterExercises(all, [], [])).toEqual(all);
    expect(filterExercises(all, ['Barbell'], []).map((e) => e.name)).toEqual([
      'Bicep Curl (Barbell)',
      'Wrist Curl (Barbell)',
      'Bench Press (Barbell)',
    ]);
    expect(filterExercises(all, ['Barbell'], ['Biceps', 'Forearms']).map((e) => e.name)).toEqual([
      'Bicep Curl (Barbell)',
      'Wrist Curl (Barbell)',
    ]);
    expect(filterExercises(all, ['Plate'], ['Biceps'])).toEqual([]);
  });

  it('lists stretches after the workout exercises, and never suggests one', () => {
    const all = [
      ex('Biceps Stretch', { stretch: true, timesDone: 5 }),
      ex('Bicep Curl'),
      ex('Hammer Curl', { secondary: ['Forearms'] }),
    ];
    expect(filterExercises(all, [], []).map((e) => e.name)).toEqual(['Bicep Curl', 'Hammer Curl', 'Biceps Stretch']);
    expect(searchExercises(all, 'bicep').map((e) => e.name)).toEqual(['Biceps Stretch', 'Bicep Curl']);
    expect(suggestedExercises(all, { id: 'Bicep Curl', muscle: 'Biceps' }).map((e) => e.name)).toEqual(['Hammer Curl']);
  });

  it('counts the other muscles an exercise works, after the main ones', () => {
    const all = [
      ex('Seated Cable Row', { muscle: 'Upper Back', secondary: ['Lats', 'Biceps'], equipment: 'Cable' }),
      ex('Pull Up', { muscle: 'Lats', secondary: ['Biceps'], equipment: 'None' }),
      ex('Bench Press', { muscle: 'Chest', secondary: ['Triceps'] }),
    ];
    expect(filterExercises(all, [], ['Lats']).map((e) => e.name)).toEqual(['Pull Up', 'Seated Cable Row']);
    expect(filterExercises(all, ['Cable'], ['Lats', 'Upper Back']).map((e) => e.name)).toEqual(['Seated Cable Row']);
    expect(filterExercises(all, ['Machine'], ['Lats'])).toEqual([]);
    expect(filterExercises(all, [], ['Forearms'])).toEqual([]);
  });
});

describe('picker sections', () => {
  const all = [
    ex('Bicep Curl', { timesDone: 3, lastDone: '2026-10-01T10:00:00Z' }),
    ex('Hammer Curl'),
    ex('Squat', { muscle: 'Quadriceps', equipment: 'Barbell' }),
  ];
  const none = { search: '', equipment: [], muscles: [] };

  it('shows Recent then All without a search', () => {
    const s = pickerSections(all, none);
    expect(s.map((x) => [x.title, x.data.length])).toEqual([
      ['Recent Exercises', 1],
      ['All Exercises', 3],
    ]);
  });

  it('adds Suggested first when replacing', () => {
    const s = pickerSections(all, { ...none, replacingId: 'Bicep Curl' });
    expect(s[0].title).toBe('Suggested Exercises');
    expect(s[0].data.map((e) => e.name)).toEqual(['Hammer Curl']);
  });

  it('shows one untitled section of matches, or none', () => {
    expect(pickerSections(all, { ...none, search: 'curl' })).toEqual([{ title: '', data: [all[0], all[1]] }]);
    expect(pickerSections(all, { ...none, search: 'deadlift' })).toEqual([]);
  });

  it('counts what the filters would show', () => {
    expect(pickerCount(all, { ...none, equipment: ['Barbell'] })).toBe(1);
    expect(pickerCount(all, { ...none, search: 'curl', muscles: ['Biceps'] })).toBe(2);
  });
});

describe('search on the whole catalogue', () => {
  // The library as the app installs it (scripts/import-csv.ts): Hevy's name where
  // known, else a converted one; a few done as in a real history.
  const catalogue = catalogueJson as { id: string; name: string }[];
  const used = new Set<string>();
  const done: Record<string, number> = {
    'Pull Up': 67,
    'Lateral Raise (Dumbbell)': 54,
    'Triceps Dip': 4,
    'Chest Dip': 3,
  };
  const all = [
    ...catalogue.filter((c) => HEVY_OFFICIAL_NAMES[c.id]),
    ...catalogue.filter((c) => !HEVY_OFFICIAL_NAMES[c.id]),
  ].map((c) => {
    const base = HEVY_OFFICIAL_NAMES[c.id] ?? toHevyName(c.name);
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base} #${n}`;
    used.add(name);
    const equipment = / \((Machine|Cable|Smith Machine)\)/.test(name)
      ? 'Machine'
      : name.includes('(Dumbbell)')
        ? 'Dumbbell'
        : 'None';
    return ex(name, { id: c.id, equipment, timesDone: done[name] ?? 0 });
  });
  const top = (q: string, n = 5) =>
    searchExercises(all, q)
      .slice(0, n)
      .map((e) => e.name);

  // The program's exercises (Frame Builder PDF) as written there.
  it.each([
    ['Pull-up', 'Pull Up'],
    ['pullup', 'Pull Up'],
    ['Incline DB press', 'Incline Bench Press (Dumbbell)'],
    ['Lateral raise (DB, standing)', 'Lateral Raise (Dumbbell)'],
    ['Lateral raise (DB, seated)', 'Seated Lateral Raise (Dumbbell)'],
    ['Dips', 'Triceps Dip'],
    ['DB curl', 'Bicep Curl (Dumbbell)'],
    ['Romanian deadlift (DB)', 'Romanian Deadlift (Dumbbell)'],
    ['DB RDL', 'Romanian Deadlift (Dumbbell)'],
    ['Flat DB press', 'Bench Press (Dumbbell)'],
    ['Overhead DB triceps ext.', 'Seated Alternate Overhead Triceps Extension (Dumbbell)'],
    ['Incline DB curl', 'Incline Biceps Curl (Dumbbell)'],
    ['Adductor machine', 'Hip Adduction (Machine)'],
    ['Band pull-aparts', 'Pull Apart (Band)'],
    ['Chin tucks', 'Chin Tuck'],
    ['Wall slides', 'Serratus Wall Slide'],
    ['DB pullover', 'Pullover (Dumbbell)'],
    ['Barbell hip thrust', 'Hip Thrust (Barbell)'],
    ['Seated row, wide grip', 'Seated Wide Grip Row (Band)'],
    ['lat pull down', 'Lat Pulldown (Cable)'],
  ])('finds "%s"', (q, name) => {
    expect(top(q)).toContain(name);
  });

  it('matches the start of words, not the middle', () => {
    expect(searchExercises(all, 'row').some((e) => /narrow/i.test(e.name) && !/\brow\b/i.test(e.name))).toBe(false);
    expect(searchExercises(all, 'rdl').some((e) => /hurdle/i.test(e.name))).toBe(false);
  });

  it('knows gym names the exercise names don\'t say', () => {
    expect(top('reverse pec deck', 1)).toEqual(['Rear Delt Reverse Fly (Machine)']);
    expect(top('pec deck')).toContain('Chest Fly (Machine)');
    expect(top('hamstring curl').every((n) => /(leg|hamstring) curl/i.test(n))).toBe(true);
  });

  it('puts the plain move before its variants', () => {
    expect(top('hip thrust', 1)).toEqual(['Hip Thrusts']);
    expect(top('lateral raise', 1)).toEqual(['Lateral Raise (Dumbbell)']);
  });
});
