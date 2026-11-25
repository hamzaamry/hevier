import { parseClock, parseNumber } from '@/lib/format/setFormat';
import { plural } from '@/lib/format/text';
import { normalizeSupersets } from '@/lib/workout/supersets';
import type { ActiveWorkout } from '@/types/workout';
import type { EditorRoutine, RoutineChanges, RoutineDraft } from '@/types/routine';

// The "Update routine" sheet after Save:
// when a workout started from a routine was done differently (exercises added,
// removed or moved, sets added or removed, set types changed), offer to make
// the routine what was done. Only completed sets count, as in the saved
// workout. Different weights or reps alone don't ask: they change every time.

function doneExercises(workout: ActiveWorkout) {
  return workout.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
    .filter((e) => e.sets.length > 0);
}

// The same exercise twice is matched in order: "squat#0", "squat#1".
function keyed<T extends { exerciseId: string }>(list: T[]): (T & { key: string })[] {
  const seen = new Map<string, number>();
  return list.map((e) => {
    const n = seen.get(e.exerciseId) ?? 0;
    seen.set(e.exerciseId, n + 1);
    return { ...e, key: `${e.exerciseId}#${n}` };
  });
}

export function routineChanges(routine: EditorRoutine, workout: ActiveWorkout): RoutineChanges {
  const done = keyed(doneExercises(workout));
  const planned = keyed(routine.exercises);
  const plannedByKey = new Map(planned.map((e) => [e.key, e]));
  const doneKeys = new Set(done.map((e) => e.key));
  const changes: RoutineChanges = {
    addedExercises: 0,
    removedExercises: planned.filter((e) => !doneKeys.has(e.key)).length,
    reordered: false,
    addedSets: 0,
    removedSets: 0,
    changedTypes: 0,
  };
  for (const e of done) {
    const p = plannedByKey.get(e.key);
    if (!p) {
      changes.addedExercises++;
      continue;
    }
    changes.addedSets += Math.max(0, e.sets.length - p.sets.length);
    changes.removedSets += Math.max(0, p.sets.length - e.sets.length);
    for (let i = 0; i < Math.min(e.sets.length, p.sets.length); i++) {
      if (e.sets[i].setType !== p.sets[i].setType) changes.changedTypes++;
    }
  }
  const order = (list: { key: string }[], keep: Set<string>) => list.map((e) => e.key).filter((k) => keep.has(k));
  const both = new Set(done.map((e) => e.key).filter((k) => plannedByKey.has(k)));
  changes.reordered = order(done, both).join() !== order(planned, both).join();
  return changes;
}

const count = (n: number, one: string, many: string) => `${n} ${plural(n, one, many)}`;

// "You added 2 sets and changed 13 set types." — null when nothing changed.
export function changesMessage(c: RoutineChanges): string | null {
  const parts: string[] = [];
  if (c.addedExercises) parts.push(`added ${count(c.addedExercises, 'exercise', 'exercises')}`);
  if (c.removedExercises) parts.push(`removed ${count(c.removedExercises, 'exercise', 'exercises')}`);
  if (c.reordered) parts.push('reordered the exercises');
  if (c.addedSets) parts.push(`added ${count(c.addedSets, 'set', 'sets')}`);
  if (c.removedSets) parts.push(`removed ${count(c.removedSets, 'set', 'sets')}`);
  if (c.changedTypes) parts.push(`changed ${count(c.changedTypes, 'set type', 'set types')}`);
  if (parts.length === 0) return null;
  const last = parts.pop()!;
  return `You ${parts.length ? `${parts.join(', ')} and ${last}` : last}.`;
}

// Update Routine: the routine becomes what was done, completed sets with their
// weights and reps (next time's starting values), in the workout's order.
export function routineFromWorkout(routine: EditorRoutine, workout: ActiveWorkout): RoutineDraft {
  return {
    id: routine.id,
    name: routine.name,
    exercises: normalizeSupersets(
      doneExercises(workout).map((e) => ({
        exerciseId: e.exerciseId,
        notes: e.notes.trim() || null,
        restSeconds: e.restSeconds,
        supersetId: e.supersetId,
        sets: e.sets.map((s) => ({
          setType: s.setType,
          weightKg: parseNumber(s.weight),
          reps: parseNumber(s.reps),
          distanceKm: parseNumber(s.km),
          durationSeconds: parseClock(s.time),
        })),
      }))
    ),
  };
}
