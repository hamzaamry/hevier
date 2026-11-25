import { parse } from 'csv-parse/sync';
import { CSV_COLUMNS, DISTANCE_COLUMNS, WEIGHT_COLUMNS } from '@/constants/hevyCsv';
import { KM_PER_MILE } from '@/constants/distance';
import { CONVERTED_DECIMALS, KG_PER_LB } from '@/constants/weight';
import type { ExerciseType } from '@/types/exercise';
import type { SetType } from '@/types/workout';
import type {
  CsvColumn,
  CsvRow,
  NoNumbersRow,
  ParsedCsv,
  ParsedRow,
  RawRow,
  SkippedRow,
  TransformOptions,
  TransformResult,
  TransformedSet,
  TransformedWorkout,
  TransformedWorkoutExercise,
} from '@/types/import';
import { normalizeSupersets } from '@/lib/workout/supersets';
import { machineTimeZone, parseHevyDate } from './parseHevyDate';

// Hevy also has drop sets; Hevier doesn't, so they come in as normal sets.
function toSetType(value: string): SetType {
  return value === 'failure' || value === 'warmup' ? value : 'normal';
}

// A number column in the unit the app uses: Hevy's imperial exports have
// weight_lbs and distance_miles instead of weight_kg and distance_km.
function metricColumn(row: RawRow, metric: string, imperial: string, perUnit: number): string {
  if (metric in row) return row[metric] ?? '';
  const raw = (row[imperial] ?? '').trim();
  if (raw === '') return '';
  const value = Number(raw);
  return Number.isNaN(value) ? raw : String(Number((value * perUnit).toFixed(CONVERTED_DECIMALS)));
}

function missingColumns(header: string[]): string[] {
  const missing: string[] = CSV_COLUMNS.filter((column) => !header.includes(column));
  if (!header.includes(WEIGHT_COLUMNS.kg) && !header.includes(WEIGHT_COLUMNS.lbs)) missing.push(WEIGHT_COLUMNS.kg);
  if (!header.includes(DISTANCE_COLUMNS.km) && !header.includes(DISTANCE_COLUMNS.miles)) missing.push(DISTANCE_COLUMNS.km);
  return missing;
}

// A line with more or fewer fields than the header is left out, never read
// with its fields shifted into the wrong columns.
export function parseCsvText(text: string): ParsedCsv {
  const lines = parse(text, { skip_empty_lines: true, bom: true, relax_column_count: true }) as string[][];
  if (lines.length === 0) return { rows: [], skipped: [] };
  const [header, ...records] = lines;
  if (header.length === 1 && header[0].includes(';')) {
    throw new Error('This looks like a semicolon-separated file: export a comma-separated CSV');
  }
  const repeated = header.filter((name, index) => header.indexOf(name) !== index);
  if (repeated.length > 0) throw new Error(`CSV repeats the columns: ${[...new Set(repeated)].join(', ')}`);
  const missing = missingColumns(header);
  if (missing.length > 0) throw new Error(`CSV is missing columns: ${missing.join(', ')}`);
  const rows: CsvRow[] = [];
  const skipped: SkippedRow[] = [];
  records.forEach((record, index) => {
    const rowNumber = index + 1;
    if (record.every((field) => field.trim() === '')) return;
    if (record.length !== header.length) {
      skipped.push({ row: rowNumber, reason: `Expected ${header.length} fields, got ${record.length}` });
      return;
    }
    const raw: RawRow = Object.fromEntries(header.map((name, column) => [name, record[column]]));
    rows.push({
      ...(Object.fromEntries(CSV_COLUMNS.map((column) => [column, raw[column] ?? ''])) as Record<CsvColumn, string>),
      weight_kg: metricColumn(raw, WEIGHT_COLUMNS.kg, WEIGHT_COLUMNS.lbs, KG_PER_LB),
      distance_km: metricColumn(raw, DISTANCE_COLUMNS.km, DISTANCE_COLUMNS.miles, KM_PER_MILE),
      rowNumber,
    });
  });
  return { rows, skipped };
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) throw new Error(`Expected a number, got: "${value}"`);
  return parsed;
}

function inferExerciseType(sets: TransformedSet[]): ExerciseType | null {
  const hasDistance = sets.some((set) => set.distanceKm !== null);
  const hasDuration = sets.some((set) => set.durationSeconds !== null);
  const hasWeight = sets.some((set) => set.weightKg !== null);
  const hasReps = sets.some((set) => set.reps !== null);
  const distanceOnly = hasDistance && !hasWeight && !hasReps;
  if (hasDistance && (hasDuration || distanceOnly)) return 'distance_duration';
  if (hasDuration) return 'duration';
  if (hasWeight) return 'weight_reps';
  if (hasReps) return 'reps_only';
  return null;
}

function nullIfBlank(value: string): string | null {
  return value.trim() === '' ? null : value;
}

// Reads every value of a row once: the set it holds, or what is wrong with it
// (a value that is not a number or a date).
function parseRow(row: CsvRow, timeZone: string): ParsedRow | { reason: string } {
  try {
    if (row.set_index.trim() === '' || !Number.isFinite(Number(row.set_index))) {
      throw new Error(`Expected a set number, got: "${row.set_index}"`);
    }
    const set: TransformedSet = {
      setIndex: Number(row.set_index),
      setType: toSetType(row.set_type),
      weightKg: toNullableNumber(row.weight_kg),
      reps: toNullableNumber(row.reps),
      distanceKm: toNullableNumber(row.distance_km),
      durationSeconds: toNullableNumber(row.duration_seconds),
      rpe: toNullableNumber(row.rpe),
    };
    return {
      rowNumber: row.rowNumber,
      title: row.title,
      description: nullIfBlank(row.description),
      startTime: parseHevyDate(row.start_time, timeZone),
      endTime: row.end_time.trim() === '' ? null : parseHevyDate(row.end_time, timeZone),
      exerciseName: row.exercise_title,
      notes: nullIfBlank(row.exercise_notes),
      supersetId: nullIfBlank(row.superset_id),
      set,
    };
  } catch (error) {
    return { reason: (error as Error).message };
  }
}

// Groups in the order each key first appears.
function groupBy<Item>(items: Item[], keyOf: (item: Item) => string): Map<string, Item[]> {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

// Rows with a bad value are left out and reported in `skipped`; rows of an
// exercise with no weight, reps, time or distance at all, in `noNumbers`.
export function transformRows(csvRows: CsvRow[], { timeZone = machineTimeZone() }: TransformOptions = {}): TransformResult {
  const skipped: SkippedRow[] = [];
  const noNumbers: NoNumbersRow[] = [];
  const parsedRows: ParsedRow[] = [];
  for (const csvRow of csvRows) {
    const parsed = parseRow(csvRow, timeZone);
    if ('reason' in parsed) skipped.push({ row: csvRow.rowNumber, reason: parsed.reason });
    else parsedRows.push(parsed);
  }

  const exerciseTypes = new Map<string, ExerciseType>();
  for (const [exerciseName, exerciseRows] of groupBy(parsedRows, (row) => row.exerciseName)) {
    const type = inferExerciseType(exerciseRows.map((row) => row.set));
    if (type) {
      exerciseTypes.set(exerciseName, type);
      continue;
    }
    for (const row of exerciseRows) noNumbers.push({ row: row.rowNumber, exerciseName });
  }

  const typedRows = parsedRows.filter((row) => exerciseTypes.has(row.exerciseName));
  const workouts: TransformedWorkout[] = [...groupBy(typedRows, (row) => `${row.title}\u0000${row.startTime}`).values()].map(
    (sessionRows) => {
      const [first] = sessionRows;
      // A superset id left on one exercise is dropped here, so the database only holds real supersets.
      const exercises: TransformedWorkoutExercise[] = normalizeSupersets(
        [...groupBy(sessionRows, (row) => row.exerciseName)].map(([exerciseName, exerciseRows], orderIndex) => ({
          exerciseName,
          notes: exerciseRows.find((row) => row.notes !== null)?.notes ?? null,
          supersetId: exerciseRows.find((row) => row.supersetId !== null)?.supersetId ?? null,
          orderIndex,
          sets: exerciseRows.map((row) => row.set),
        }))
      );
      return {
        title: first.title,
        startTime: first.startTime,
        endTime: first.endTime,
        description: first.description,
        exercises,
      };
    }
  );

  return { exerciseTypes, workouts, skipped: skipped.sort((earlier, later) => earlier.row - later.row), noNumbers };
}
