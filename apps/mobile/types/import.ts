import type { CSV_COLUMNS } from '@/constants/hevyCsv';
import type { ExerciseType } from './exercise';
import type { MuscleGroup } from './muscles';
import type { SetType } from './workout';

// One entry of packages/catalogue/exercises.json (copied from openGym's catalogue).
export interface CatalogueEntry {
  id: string;
  name: string;
  bodyPart: string | null;
  equipment: string | null;
  target: string | null;
  secondaryMuscles: string[] | null;
  category: string | null;
  description: string | null;
  instructions: string[] | null;
}

// One file of openGym's catalogue/exercises/. A female drawing is either a
// bare { id, variantOf } or, for a few, a full entry with maleVariant.
export type OpenGymEntry = Partial<CatalogueEntry> & {
  id: string;
  variantOf?: string;
  maleVariant?: string;
  femaleVariant?: string;
};

// A muscle fix for one movement (constants/muscleRules.ts).
export interface MuscleRule {
  name: string;
  match: RegExp;
  exclude?: RegExp;
  targets: string[];
  need: Partial<Record<MuscleGroup, string>>;
  drop: MuscleGroup[];
  main?: string; // the catalogue target this movement always has (the old one becomes a secondary muscle)
}

// What scripts/update-catalogue.ts makes of an openGym update.
export interface CatalogueUpdate {
  removedIds: string[];
  sql: string[];
}

export type CsvColumn = (typeof CSV_COLUMNS)[number];

// One CSV row as the import reads it, in the app's units.
export type CsvRow = Record<CsvColumn, string> & {
  weight_kg: string;
  distance_km: string;
  rowNumber: number; // counted from 1 in the file, header not included
};

// The CSV's rows, and the lines left out (scripts/import/parseCsv.ts).
export interface ParsedCsv {
  rows: CsvRow[];
  skipped: SkippedRow[];
}

// A CSV row the import left out, and why. `row` counts data rows from 1.
export interface SkippedRow {
  row: number;
  reason: string;
}

// A CSV record by column name, before the units are converted.
export type RawRow = Record<string, string | undefined>;

export interface TransformOptions {
  // IANA name ("Europe/Paris") Hevy's time-zone-less dates are written in;
  // the machine's when left out.
  timeZone?: string;
}

// A date's pieces, month counted from 0 (scripts/import/parseHevyDate.ts).
export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

// One CSV row, read in full (scripts/import/parseCsv.ts).
export interface ParsedRow {
  rowNumber: number;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  exerciseName: string;
  notes: string | null;
  set: TransformedSet;
}

// A row of an exercise logged without weight, reps, time or distance
// (Stretching): nothing to import, and not an error.
export interface NoNumbersRow {
  row: number;
  exerciseName: string;
}

export interface ImportResult {
  bytes: Uint8Array;
  skipped: SkippedRow[];
  noNumbers: NoNumbersRow[];
}

// A Hevy CSV workout, turned into ours (scripts/import/parseCsv.ts).
export interface TransformedSet {
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
  rpe: number | null;
}

export interface TransformedWorkoutExercise {
  exerciseName: string;
  notes: string | null;
  orderIndex: number;
  sets: TransformedSet[];
}

export interface TransformedWorkout {
  title: string;
  startTime: string;
  endTime: string | null;
  description: string | null;
  exercises: TransformedWorkoutExercise[];
}

export interface TransformResult {
  exerciseTypes: Map<string, ExerciseType>;
  workouts: TransformedWorkout[];
  skipped: SkippedRow[];
  noNumbers: NoNumbersRow[];
}
