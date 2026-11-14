import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import initSqlJs from 'sql.js';
import { describeNoNumbers, describeSkipped, importCsvToDatabase } from './import-csv';
import catalogueJson from '@hevier/catalogue/exercises.json';
import type { CatalogueEntry } from '@/types/import';
import { SELECT_BODY_WEIGHT_EXERCISE_IDS, SET_BODY_WEIGHT } from '@/db/bodyWeight/queries';

const SAMPLE = `${__dirname}/fixtures/sample-workouts.csv`;
const loadCatalogue = () =>
  catalogueJson as unknown as CatalogueEntry[];

async function importSample(catalogue: CatalogueEntry[] = []) {
  const { bytes } = await importCsvToDatabase(fs.readFileSync(SAMPLE, 'utf-8'), catalogue);
  const db = new (await initSqlJs()).Database(bytes);
  const one = (q: string) => db.exec(q)[0].values[0][0];
  const all = (q: string) => db.exec(q)[0]?.values ?? [];
  return { db, one, all };
}

// The fake export in scripts/fixtures: 6 workouts covering warm-up and failure
// sets, RPE, a reps-only, a timed and a distance exercise, dumbbell work, a
// football game and a tennis match (both logged as Sprints). Hevy's export has
// no routines, so none are made: the user builds them in the app.
describe('importCsvToDatabase (sample CSV)', () => {
  it('imports every workout, exercise and set', async () => {
    const { one } = await importSample();
    expect(one('SELECT COUNT(*) FROM workouts')).toBe(6);
    // 8 exercises in the CSV, plus Football, which every database gets (migration 006).
    expect(one('SELECT COUNT(*) FROM exercises')).toBe(11);
    expect(one('SELECT COUNT(*) FROM sets')).toBe(16);
    expect(one('PRAGMA user_version')).toBe(16);
    expect(one('SELECT COUNT(*) FROM routines')).toBe(0);
  });

  it('works out each exercise type from the columns used', async () => {
    const { all } = await importSample();
    const types = Object.fromEntries(all('SELECT name, type FROM exercises'));
    expect(types['Squat (Machine)']).toBe('weight_reps');
    expect(types['Pull Up']).toBe('reps_only');
    expect(types['Warm Up']).toBe('duration');
    expect(types['Running']).toBe('distance_duration');
  });

  it('keeps set types, RPE, notes and the description', async () => {
    const { all, one } = await importSample();
    const squat = all(
      `SELECT s.set_type, s.weight_kg, s.reps, s.rpe FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id JOIN exercises e ON e.id = we.exercise_id
       JOIN workouts w ON w.id = we.workout_id
       WHERE e.name = 'Squat (Machine)' AND w.start_time = (SELECT MIN(start_time) FROM workouts) ORDER BY s.set_index`
    );
    expect(squat).toEqual([
      ['warmup', 60, 10, null],
      ['normal', 100, 10, null],
      ['failure', 100, 8, 9],
    ]);
    expect(one("SELECT we.notes FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id WHERE e.name = 'Romanian Deadlift (Dumbbell)'")).toBe('heavy');
    expect(one("SELECT description FROM workouts WHERE title = 'UPPER A'")).toBe('Good session');
  });

  it('files "Foot…" games under Football and leaves Tennis as Sprints', async () => {
    const { all } = await importSample();
    const rows = Object.fromEntries(
      all(`SELECT w.title, e.name FROM workouts w JOIN workout_exercises we ON we.workout_id = w.id
           JOIN exercises e ON e.id = we.exercise_id WHERE e.name IN ('Sprints', 'Football')`)
    );
    expect(rows).toEqual({ Football: 'Football', Tennis: 'Sprints' });
  });

  it('links the exercises to the catalogue and adds the rest as a library', async () => {
    const catalogue = loadCatalogue();
    const { one } = await importSample(catalogue);
    expect(one("SELECT catalogue_id FROM exercises WHERE name = 'Squat (Machine)'")).toBe('1875');
    expect(one("SELECT type FROM exercises WHERE name = 'Pull Up'")).toBe('reps_only');
    expect(one("SELECT is_custom FROM exercises WHERE name = 'Warm Up'")).toBe(1);
    expect(one('SELECT COUNT(DISTINCT catalogue_id) FROM exercises WHERE catalogue_id IS NOT NULL')).toBe(catalogue.length);
    // 8 CSV exercises + Football, Tennis, Hiking + the catalogue minus the 7 entries they link to.
    expect(one('SELECT COUNT(*) FROM exercises')).toBe(8 + 3 + catalogue.length - 7);
  });

  it('leaves a body weight exercise counting the logged body weight, and links Lat Pulldown to the bar pulldown', async () => {
    const { db, one, all } = await importSample(loadCatalogue());
    const pullUp = one("SELECT id FROM exercises WHERE name = 'Pull Up'");
    expect(all(SELECT_BODY_WEIGHT_EXERCISE_IDS).map(([id]) => id)).toContain(pullUp);
    expect(one("SELECT catalogue_id FROM exercises WHERE name = 'Lat Pulldown (Cable)'")).toBe('0150');

    db.run("INSERT INTO body_weights (id, logged_at, weight_kg) VALUES ('b', '2026-09-01T08:00:00Z', 80)");
    const weights = all(
      `SELECT e.name, ${SET_BODY_WEIGHT} FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
       JOIN exercises e ON e.id = we.exercise_id JOIN workouts w ON w.id = we.workout_id
       WHERE e.name IN ('Pull Up', 'Squat (Machine)')`
    );
    expect(new Set(weights.filter(([name]) => name === 'Pull Up').map(([, kg]) => kg))).toEqual(new Set([80]));
    expect(new Set(weights.filter(([name]) => name !== 'Pull Up').map(([, kg]) => kg))).toEqual(new Set([null]));
  });
});

// load-device.sh replaces the phone's data with what this writes, so a CSV
// that yields (almost) nothing must stop the import instead.
describe('importCsvToDatabase (unusable CSV)', () => {
  const HEADER = fs.readFileSync(SAMPLE, 'utf-8').split('\n')[0];
  const line = (setIndex: number, start: string) =>
    `"A","${start}","","","Bench",,"",${setIndex},"normal",100,10,,,`;

  it.each([['an empty file', ''], ['a header and no rows', `${HEADER}\n`]])('refuses %s', async (_name, text) => {
    await expect(importCsvToDatabase(text)).rejects.toThrow('No workouts could be read from the CSV (the CSV has no rows)');
  });

  it('refuses a file where every date is unreadable', async () => {
    const text = [HEADER, line(0, '1 Okt 2026, 18:00'), line(1, '2 Okt 2026, 18:00')].join('\n');
    await expect(importCsvToDatabase(text)).rejects.toThrow(/No workouts could be read[^]*row 1: Could not parse date/);
  });

  it('refuses a file where too many rows are unreadable, and keeps one with a stray bad row', async () => {
    const good = (setIndex: number) => line(setIndex, 'Oct 1, 2026, 6:00 PM');
    const bad = line(99, 'someday');
    const many = [HEADER, bad, bad, ...Array.from({ length: 8 }, (_, setIndex) => good(setIndex))].join('\n');
    await expect(importCsvToDatabase(many)).rejects.toThrow('Too many CSV rows could not be read');
    const few = [HEADER, bad, ...Array.from({ length: 19 }, (_, setIndex) => good(setIndex))].join('\n');
    expect((await importCsvToDatabase(few)).skipped.map((skippedRow) => skippedRow.row)).toEqual([1]);
  });

  it('allows exactly 1 unreadable row in 10 and counts lines with the wrong number of fields', async () => {
    const good = (setIndex: number) => line(setIndex, 'Oct 1, 2026, 6:00 PM');
    const rows = (bad: string[]) => [HEADER, ...bad, ...Array.from({ length: 10 - bad.length }, (_, setIndex) => good(setIndex))].join('\n');
    expect((await importCsvToDatabase(rows(['"A","someday"']))).skipped).toHaveLength(1);
    await expect(importCsvToDatabase(rows(['"A","someday"', '"A","someday"']))).rejects.toThrow('Too many CSV rows');
  });
});

describe('importCsvToDatabase (exercises without numbers)', () => {
  const HEADER = fs.readFileSync(SAMPLE, 'utf-8').split('\n')[0];
  const START = 'Oct 1, 2026, 6:00 PM';
  const stretch = (setIndex: number) => `"A","${START}","","","Stretching",,"",${setIndex},"normal",,,,,`;
  const bench = (setIndex: number, start = START) => `"A","${start}","","","Bench",,"",${setIndex},"normal",100,10,,,`;
  const csv = (...lines: string[]) => [HEADER, ...lines].join('\n');
  const indexes = (count: number) => Array.from({ length: count }, (_, setIndex) => setIndex);

  it('imports a CSV where most rows are an exercise with no numbers, and says they were left out', async () => {
    const lines = [...indexes(12).map(stretch), ...indexes(3).map((setIndex) => bench(setIndex))];
    const { bytes, skipped, noNumbers } = await importCsvToDatabase(csv(...lines));
    const db = new (await initSqlJs()).Database(bytes);
    expect(skipped).toEqual([]);
    expect(noNumbers).toHaveLength(12);
    expect(new Set(noNumbers.map(({ exerciseName }) => exerciseName))).toEqual(new Set(['Stretching']));
    expect(db.exec('SELECT COUNT(*) FROM sets')[0].values[0][0]).toBe(3);
    expect(db.exec("SELECT COUNT(*) FROM exercises WHERE name = 'Stretching'")[0].values[0][0]).toBe(0);
  });

  it('does not let them hide a CSV where many of the other rows are unreadable', async () => {
    const bad = bench(99, 'someday');
    const lines = [...indexes(30).map(stretch), bad, bad, ...indexes(8).map((setIndex) => bench(setIndex))];
    await expect(importCsvToDatabase(csv(...lines))).rejects.toThrow('Too many CSV rows could not be read (2 of 10 rows skipped)');
  });

  it('refuses a CSV where no row has numbers', async () => {
    await expect(importCsvToDatabase(csv(...indexes(3).map(stretch)))).rejects.toThrow(
      'No workouts could be read from the CSV (no row has weight, reps, time or distance)'
    );
  });
});

describe('describeNoNumbers', () => {
  it('counts the rows and names each exercise once', () => {
    const rows = [
      { row: 1, exerciseName: 'Stretching' },
      { row: 2, exerciseName: 'Stretching' },
      { row: 3, exerciseName: 'Foam Rolling' },
    ];
    expect(describeNoNumbers(rows)).toBe('3 rows had no numbers and were left out (Stretching, Foam Rolling).');
  });
});

describe('describeSkipped', () => {
  it('lists the first rows and counts the rest', () => {
    const skipped = Array.from({ length: 12 }, (_, i) => ({ row: i + 1, reason: 'bad' }));
    const lines = describeSkipped(skipped);
    expect(lines).toHaveLength(11);
    expect(lines[10]).toBe('  ...and 2 more');
  });
});
