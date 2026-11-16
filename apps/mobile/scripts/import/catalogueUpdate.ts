import { applyMuscleRules } from './muscleRules';
import { FEMALE_COPIES, HIDDEN_EXERCISES } from '@/constants/hiddenExercises';
import type { CatalogueEntry, CatalogueUpdate, OpenGymEntry } from '@/types/import';

// Turns openGym's catalogue into ours: one entry per exercise, without the
// female drawings of an exercise we already have (openGym hides most of them
// with variantOf; a few are full entries marked maleVariant) and the look-alikes
// in constants/hiddenExercises.ts, with our muscle
// fixes on top (constants/muscleRules.ts).
export function fromOpenGym(files: OpenGymEntry[]): CatalogueEntry[] {
  return files
    .filter((e) => !e.variantOf && !e.maleVariant && e.name && !HIDDEN_EXERCISES[e.id])
    .map((e) => ({
      id: e.id,
      name: e.name ?? '',
      bodyPart: e.bodyPart ?? null,
      equipment: e.equipment ?? null,
      target: e.target ?? null,
      secondaryMuscles: e.secondaryMuscles ?? [],
      category: e.category ?? null,
      description: e.description ?? null,
      instructions: e.instructions ?? [],
    }))
    .map(applyMuscleRules)
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

// Each exercise's female drawing (openGym's femaleVariant), for users who pick
// female drawings (lib/exercises/drawings.ts), and the ones linked by hand
// (constants/hiddenExercises.ts).
export function femaleDrawings(files: OpenGymEntry[], kept: CatalogueEntry[]): Record<string, string> {
  const ids = new Set(kept.map((e) => e.id));
  const out: Record<string, string> = {};
  for (const e of files) if (e.femaleVariant && ids.has(e.id)) out[e.id] = e.femaleVariant;
  for (const [id, female] of Object.entries(FEMALE_COPIES)) if (ids.has(id) && !out[id]) out[id] = female;
  return out;
}

// Catalogue fields and the exercises column each one fills.
const COLUMNS: [keyof CatalogueEntry, string][] = [
  ['bodyPart', 'body_part'],
  ['target', 'target_muscle'],
  ['secondaryMuscles', 'secondary_muscles'],
  ['equipment', 'equipment'],
  ['category', 'category'],
  ['description', 'description'],
  ['instructions', 'instructions'],
];

function sqlValue(v: CatalogueEntry[keyof CatalogueEntry]): string {
  if (v === null || v === undefined) return 'NULL';
  const text = Array.isArray(v) ? JSON.stringify(v) : String(v);
  return `'${text.replaceAll("'", "''")}'`;
}

// The SQL that brings an installed database from `before` to `after`: changed
// fields are rewritten on every exercise linked to that entry (the user's own
// names stay), and entries that are gone are deleted unless something uses
// them (a workout, a routine or the workout in progress).
export function catalogueUpdate(before: CatalogueEntry[], after: CatalogueEntry[]): CatalogueUpdate {
  const old = new Map(before.map((e) => [e.id, e]));
  const kept = new Set(after.map((e) => e.id));
  const sql: string[] = [];

  for (const e of after) {
    const o = old.get(e.id);
    if (!o) continue;
    const sets = COLUMNS.filter(([field]) => JSON.stringify(o[field]) !== JSON.stringify(e[field])).map(
      ([field, column]) => `${column} = ${sqlValue(e[field])}`
    );
    if (sets.length > 0) sql.push(`UPDATE exercises SET ${sets.join(', ')} WHERE catalogue_id = '${e.id}';`);
  }

  const removedIds = before.filter((e) => !kept.has(e.id)).map((e) => e.id);
  if (removedIds.length > 0) {
    sql.push(
      `DELETE FROM exercises WHERE catalogue_id IN (${removedIds.map((id) => `'${id}'`).join(', ')})` +
        ' AND id NOT IN (SELECT exercise_id FROM workout_exercises)' +
        ' AND id NOT IN (SELECT exercise_id FROM routine_exercises)' +
        " AND NOT EXISTS (SELECT 1 FROM app_state WHERE value LIKE '%' || exercises.id || '%');"
    );
  }
  return { removedIds, sql };
}
