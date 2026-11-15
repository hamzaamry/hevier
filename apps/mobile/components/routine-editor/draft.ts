import { parseClock, parseNumber, setTextOf } from '@/lib/format/setFormat';
import type { EditorExercise, EditorSet, RoutineDraft } from '@/types/routine';
import type { WorkoutDraft } from '@/types/workoutEdit';
import type { DraftExercise, DraftSet, WorkoutMeta } from './types';

// The routine editor's draft: exercises and sets as typed text, each with a
// key the rows are drawn by. One counter for all keys, so they never repeat.
let nextKey = 1;
export function newKey(): number {
  return nextKey++;
}

export function toDraftSet(s: EditorSet): DraftSet {
  return { key: newKey(), setType: s.setType, ...setTextOf(s), rpe: s.rpe };
}

export function emptySet(): DraftSet {
  return { key: newKey(), setType: 'normal', weight: '', reps: '', km: '', time: '' };
}

// A loaded routine's or workout's exercises, ready to edit.
export function toDraftExercises(exercises: EditorExercise[]): DraftExercise[] {
  return exercises.map((e) => ({ ...e, key: newKey(), sets: e.sets.map(toDraftSet) }));
}

export function fromDraftSet(s: DraftSet): EditorSet {
  return {
    setType: s.setType,
    weightKg: parseNumber(s.weight),
    reps: parseNumber(s.reps),
    distanceKm: parseNumber(s.km),
    durationSeconds: parseClock(s.time),
    rpe: s.rpe,
  };
}

// Add Set copies the set above it, but not its hidden RPE, which was
// logged for that set only (Edit Workout).
export function nextDraftSet(sets: DraftSet[]): DraftSet {
  const last = sets[sets.length - 1];
  return last ? { ...last, key: newKey(), setType: 'normal', rpe: null } : emptySet();
}

// What Cancel compares, to tell whether it would lose changes.
export function snapshot(name: string, exercises: DraftExercise[], extra?: unknown[]): string {
  return JSON.stringify([
    name,
    extra ?? null,
    exercises.map((e) => [e.exerciseId, e.notes ?? '', e.restSeconds, e.sets.map((s) => [s.setType, s.weight, s.reps, s.km, s.time])]),
  ]);
}

// The draft as Save / Update writes it: a routine…
export function routinePayload(
  id: string | null,
  folderId: string | null,
  name: string,
  exercises: DraftExercise[]
): RoutineDraft {
  return {
    id,
    folderId,
    name: name.trim(),
    exercises: exercises.map((e) => ({
      exerciseId: e.exerciseId,
      notes: e.notes?.trim() || null,
      restSeconds: e.restSeconds,
      sets: e.sets.map(fromDraftSet),
    })),
  };
}

// …or a saved workout (Edit Workout), over the old one.
export function workoutPayload(id: string, name: string, meta: WorkoutMeta, exercises: DraftExercise[]): WorkoutDraft {
  return {
    id,
    title: name.trim(),
    description: meta.description.trim() || null,
    startTime: new Date(meta.startTime).toISOString(),
    endTime: new Date(meta.startTime + meta.durationSeconds * 1000).toISOString(),
    exercises: exercises.map((e) => ({
      exerciseId: e.exerciseId,
      notes: e.notes?.trim() || null,
      sets: e.sets.map(fromDraftSet),
    })),
    media: meta.media,
  };
}
