import { describe, expect, it } from 'vitest';
import type { PickerExercise } from '@/types/exercise';
import catalogueJson from '@hevier/catalogue/exercises.json';
import { filterExercises, pickerCount, pickerSections, recentExercises, searchExercises, suggestedExercises } from './exerciseSearch';

const ex = (name: string, extra: Partial<PickerExercise> = {}): PickerExercise => ({
  id: name,
  name,
  type: 'weight_reps',
  catalogueId: null,
  muscle: 'Biceps',
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
      ex('21s Bicep Curl'),
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
    expect(filterExercises(all, [], [])).toBe(all);
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
});

// The first searchExercises, kept as the reference.
function searchReference(all: PickerExercise[], query: string): PickerExercise[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return all;
  return all
    .filter((e) => {
      const name = e.name.toLowerCase();
      return words.every((w) => name.includes(w));
    })
    .sort((a, b) => b.timesDone - a.timesDone || a.name.localeCompare(b.name));
}

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
  it('finds and orders exactly as before', () => {
    const catalogue = catalogueJson as { id: string; name: string }[];
    // Same names in other cases and with accents, duplicates, and some done
    // a few times, in the database's order (NOCASE) rather than localeCompare's.
    const all = [
      ...catalogue.map((c, i) => ex(c.name, { id: c.id, timesDone: i % 7 === 0 ? i % 5 : 0 })),
      ex('Bicep Curl (Dumbbell)', { id: 'dup1', timesDone: 3 }),
      ex('bicep curl (dumbbell)', { id: 'dup2', timesDone: 3 }),
      ex('Écarté', { id: 'acc' }),
      ex('ecarte', { id: 'acc2' }),
      ex('_Warm Up', { id: 'w' }),
    ].sort((a, b) => (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0));
    for (const q of ['', 'b', 'curl', 'curl dumb', 'PRESS', '  bench  incline ', 'é', 'e', '(', 'zzz', 'up']) {
      expect(searchExercises(all, q).map((e) => e.id), q).toEqual(searchReference(all, q).map((e) => e.id));
    }
  });
});

