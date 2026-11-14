import { describe, it, expect, beforeAll } from 'vitest';
import initSqlJs, { type Database } from 'sql.js';
import { MIGRATIONS, runMigrations } from './index';
import type { MigratableDb } from './types';

function wrap(db: Database): MigratableDb {
  return {
    async execAsync(sqlText: string) {
      db.exec(sqlText);
    },
    async getFirstAsync<T>(sqlText: string): Promise<T | null> {
      const result = db.exec(sqlText);
      if (result.length === 0 || result[0].values.length === 0) return null;
      const columns = result[0].columns;
      const values = result[0].values[0];
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => (obj[col] = values[i]));
      return obj as T;
    },
  };
}

describe('runMigrations', () => {
  let SQL: Awaited<ReturnType<typeof initSqlJs>>;

  beforeAll(async () => {
    SQL = await initSqlJs();
  });

  it('creates all expected tables and sets user_version', async () => {
    const rawDb = new SQL.Database();
    const db = wrap(rawDb);

    await runMigrations(db);

    const tables = rawDb.exec(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )[0].values.map((row) => row[0]);
    expect(tables).toEqual([
      'app_state',
      'body_weights',
      'exercises',
      'gym_changes',
      'gyms',
      'routine_exercises',
      'routine_folders',
      'routine_sets',
      'routines',
      'sets',
      'workout_exercises',
      'workout_media',
      'workouts',
    ]);

    const version = rawDb.exec('PRAGMA user_version')[0].values[0][0];
    expect(version).toBe(16);
  });

  it('is idempotent: running twice does not error or duplicate', async () => {
    const rawDb = new SQL.Database();
    const db = wrap(rawDb);
    await runMigrations(db);
    await runMigrations(db); // should be a no-op since user_version is already current
    const tables = rawDb.exec(
      "SELECT name FROM sqlite_master WHERE type='table'"
    )[0].values;
    expect(tables.length).toBe(13);
  });

  it('upgrades a version-1 database by adding the catalogue columns', async () => {
    const rawDb = new SQL.Database();
    rawDb.exec(MIGRATIONS[0].sql);
    rawDb.exec('PRAGMA user_version = 1');
    rawDb.exec("INSERT INTO exercises (id, name, type) VALUES ('e1', 'Pull Up', 'reps_only')");

    await runMigrations(wrap(rawDb));

    const row = rawDb.exec("SELECT is_custom, catalogue_id FROM exercises WHERE id = 'e1'")[0].values[0];
    expect(row).toEqual([1, null]);
    expect(rawDb.exec('PRAGMA user_version')[0].values[0][0]).toBe(16);
  });

  it('allows warm-up sets and keeps the existing sets', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 8)) rawDb.exec(m.sql);
    rawDb.exec('PRAGMA user_version = 8');
    rawDb.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'LOWER A', '2026-10-06T18:56:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', 'sq', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps, rpe) VALUES
        ('s1', 'we', 0, 'normal', 100, 10, 8), ('s2', 'we', 1, 'failure', 120, 6, null);
      INSERT INTO routines (id, name) VALUES ('r', 'LOWER A');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES ('re', 'r', 'sq', 0);
      INSERT INTO routine_sets (id, routine_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('rs', 're', 0, 'failure', 120, 6);
    `);

    await runMigrations(wrap(rawDb));

    expect(rawDb.exec('SELECT id, set_type, weight_kg, reps, rpe FROM sets ORDER BY id')[0].values).toEqual([
      ['s1', 'normal', 100, 10, 8],
      ['s2', 'failure', 120, 6, null],
    ]);
    expect(rawDb.exec('SELECT id, set_type FROM routine_sets')[0].values).toEqual([['rs', 'failure']]);
    rawDb.exec(`INSERT INTO sets (id, workout_exercise_id, set_index, set_type) VALUES ('s0', 'we', 2, 'warmup')`);
    rawDb.exec(`INSERT INTO routine_sets (id, routine_exercise_id, set_index, set_type) VALUES ('rs0', 're', 1, 'warmup')`);
    expect(() => rawDb.exec(`INSERT INTO sets (id, workout_exercise_id, set_index, set_type) VALUES ('x', 'we', 3, 'dropset')`)).toThrow();
    const indexes = rawDb.exec("SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%sets%' ORDER BY name")[0].values;
    expect(indexes).toEqual([['idx_routine_sets_routine_exercise'], ['idx_sets_workout_exercise']]);
  });

  it('gives existing routines the sets of their latest workout', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 3)) rawDb.exec(m.sql);
    rawDb.exec('PRAGMA user_version = 3');
    rawDb.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time) VALUES ('old', 'LOWER A', '2026-09-01T10:00:00Z'), ('new', 'LOWER A', '2026-10-06T18:56:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we1', 'old', 'sq', 0), ('we2', 'new', 'sq', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES
        ('s1', 'we1', 0, 'normal', 80, 8), ('s2', 'we2', 0, 'normal', 100, 10), ('s3', 'we2', 1, 'normal', 120, 6);
      INSERT INTO routines (id, name) VALUES ('r', 'LOWER A');
      INSERT INTO routine_exercises (id, routine_id, exercise_id, order_index) VALUES ('re', 'r', 'sq', 0);
    `);

    await runMigrations(wrap(rawDb));

    const sets = rawDb.exec('SELECT set_index, weight_kg, reps FROM routine_sets ORDER BY set_index')[0].values;
    expect(sets).toEqual([
      [0, 100, 10],
      [1, 120, 6],
    ]);
  });

  it('adds Football and moves the "Foot…" games logged as Sprints to it', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 5)) rawDb.exec(m.sql);
    rawDb.exec('PRAGMA user_version = 5');
    rawDb.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sp', 'Sprints', 'duration');
      INSERT INTO workouts (id, title, start_time) VALUES
        ('a', 'Foot - cardio', '2026-06-16T18:30:00.000Z'),
        ('b', 'Afternoon workout', '2026-06-12T11:00:00.000Z'),
        ('t', 'Tennis', '2026-10-03T11:00:00.000Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES
        ('wa', 'a', 'sp', 0), ('wb', 'b', 'sp', 0), ('wt', 't', 'sp', 0);
    `);

    await runMigrations(wrap(rawDb));

    const moved = rawDb.exec('SELECT id, exercise_id FROM workout_exercises ORDER BY id')[0].values;
    expect(moved).toEqual([
      ['wa', 'football'],
      ['wb', 'sp'],
      ['wt', 'sp'],
    ]);
    const football = rawDb.exec("SELECT name, type FROM exercises WHERE id = 'football'")[0].values;
    expect(football).toEqual([['Football', 'duration']]);
  });

  it('adds Tennis and Hiking as duration exercises', async () => {
    const rawDb = new SQL.Database();
    await runMigrations(wrap(rawDb));

    const rows = rawDb.exec("SELECT name, type FROM exercises WHERE id IN ('tennis', 'hiking') ORDER BY id")[0].values;
    expect(rows).toEqual([
      ['Hiking', 'duration'],
      ['Tennis', 'duration'],
    ]);
  });

  it('adds the indexes the history lookups use', async () => {
    const rawDb = new SQL.Database();
    await runMigrations(wrap(rawDb));
    const indexes = rawDb.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name"
    )[0].values.map((row) => row[0]);
    expect(indexes).toEqual(expect.arrayContaining([
      'idx_routine_exercises_exercise',
      'idx_workout_exercises_exercise',
      'idx_workouts_start_time',
      'idx_workouts_title',
    ]));
    const plan = rawDb.exec(
      "EXPLAIN QUERY PLAN SELECT id FROM workout_exercises WHERE exercise_id = 'x'"
    )[0].values.map((row) => String(row[3]));
    expect(plan.join(' ')).toContain('idx_workout_exercises_exercise');
  });

  it('relinks Iso-Lateral Low Row to the plate-loaded low row, keeping its name', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 9)) rawDb.exec(m.sql);
    rawDb.exec('PRAGMA user_version = 9');
    rawDb.exec(`
      INSERT INTO exercises (id, name, type, catalogue_id, target_muscle, secondary_muscles) VALUES
        ('row', 'Iso-Lateral Low Row', 'weight_reps', '0571', 'upper back', '["biceps","forearms"]'),
        ('cat', 'Low Row - Plate Loaded (Machine)', 'weight_reps', '4214', 'upper back', '["lats","biceps","rhomboids","rear deltoids"]');
    `);

    rawDb.exec(MIGRATIONS[9].sql); // only 010: later catalogue updates change the muscles again

    expect(rawDb.exec("SELECT name, catalogue_id, secondary_muscles FROM exercises WHERE id = 'row'")[0].values[0]).toEqual([
      'Iso-Lateral Low Row',
      '4214',
      '["lats","biceps","rhomboids","rear deltoids"]',
    ]);
  });

  it('relinks Lat Pulldown to the bar lateral pulldown, keeping its name and history, and drops the female copy', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 13)) rawDb.exec(m.sql);
    rawDb.exec(`
      INSERT INTO exercises (id, name, type, catalogue_id, target_muscle, secondary_muscles) VALUES
        ('lp', 'Lat Pulldown (Cable)', 'weight_reps', '2330', 'lats', '["biceps"]'),
        ('cat', 'Bar Lateral Pulldown (Cable)', 'weight_reps', '0150', 'lats', '["biceps","upper back","trapezius"]'),
        ('fem', 'Wide Grip Lat Pulldown (Cable)', 'weight_reps', '2291', 'lats', '[]');
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'UPPER A', '2026-11-01T10:00:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', 'lp', 0);
    `);

    rawDb.exec(MIGRATIONS[13].sql);

    expect(rawDb.exec("SELECT name, catalogue_id, secondary_muscles FROM exercises WHERE id = 'lp'")[0].values[0]).toEqual([
      'Lat Pulldown (Cable)',
      '0150',
      '["biceps","upper back","trapezius"]',
    ]);
    expect(rawDb.exec("SELECT exercise_id FROM workout_exercises WHERE id = 'we'")[0].values[0]).toEqual(['lp']);
    expect(rawDb.exec("SELECT id FROM exercises WHERE catalogue_id = '2291'")).toEqual([]); // the female copy left
  });

  it('rolls back a migration that fails halfway so a retry can succeed', async () => {
    const rawDb = new SQL.Database();
    for (const m of MIGRATIONS.slice(0, 8)) rawDb.exec(m.sql);
    rawDb.exec('PRAGMA user_version = 8');
    rawDb.exec(`
      INSERT INTO exercises (id, name, type) VALUES ('sq', 'Squat', 'weight_reps');
      INSERT INTO workouts (id, title, start_time) VALUES ('w', 'LOWER A', '2026-10-06T18:56:00Z');
      INSERT INTO workout_exercises (id, workout_id, exercise_id, order_index) VALUES ('we', 'w', 'sq', 0);
      INSERT INTO sets (id, workout_exercise_id, set_index, set_type, weight_kg, reps) VALUES ('s1', 'we', 0, 'normal', 100, 10);
      CREATE TABLE routine_sets_new (id TEXT);
    `);
    const db = wrap(rawDb);

    await expect(runMigrations(db)).rejects.toThrow();
    expect(rawDb.exec('PRAGMA user_version')[0].values[0][0]).toBe(8);
    expect(() => rawDb.exec(`INSERT INTO sets (id, workout_exercise_id, set_index, set_type) VALUES ('x', 'we', 1, 'warmup')`)).toThrow();

    rawDb.exec('DROP TABLE routine_sets_new');
    await runMigrations(db);

    expect(rawDb.exec('PRAGMA user_version')[0].values[0][0]).toBe(MIGRATIONS.length);
    expect(rawDb.exec('SELECT id FROM sets')[0].values).toEqual([['s1']]);
  });
});
