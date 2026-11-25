// Supersets: two or more exercises done one after the other without resting.
// Each exercise of a group keeps the group's id (null = no superset), so the
// workout, its draft and a routine all read a pair back the same way.
// Only real supersets reach the database: every change that can leave a group
// with one exercise (pair, unpair, remove, saving only the done exercises, the
// CSV import) runs normalizeSupersets.

type Key = string | number;

export interface SupersetMember {
  key: Key;
  supersetId: string | null;
}

type Grouped = Pick<SupersetMember, 'supersetId'>;

// A group left with one exercise is no superset: its id is dropped.
export function normalizeSupersets<T extends Grouped>(exercises: T[]): T[] {
  const sizes = new Map<string, number>();
  for (const e of exercises) if (e.supersetId) sizes.set(e.supersetId, (sizes.get(e.supersetId) ?? 0) + 1);
  return exercises.map((e) => (e.supersetId && (sizes.get(e.supersetId) ?? 0) < 2 ? { ...e, supersetId: null } : e));
}

// Pair two exercises in a new group. The picked one goes right under the other,
// as Hevy does, so the pair reads as one block.
export function pairExercises<T extends SupersetMember>(exercises: T[], key: T['key'], partnerKey: T['key'], supersetId: string): T[] {
  const partner = exercises.find((e) => e.key === partnerKey);
  if (key === partnerKey || !partner || !exercises.some((e) => e.key === key)) return exercises;
  const result: T[] = [];
  for (const e of exercises) {
    if (e.key === partnerKey) continue;
    if (e.key !== key) result.push(e);
    else result.push({ ...e, supersetId }, { ...partner, supersetId });
  }
  return normalizeSupersets(result);
}

// Remove one exercise from its superset; its partner is left alone.
export function unpairExercise<T extends SupersetMember>(exercises: T[], key: T['key']): T[] {
  return normalizeSupersets(exercises.map((e) => (e.key === key ? { ...e, supersetId: null } : e)));
}

export interface SupersetBlock<T> {
  supersetId: string | null;
  exercises: T[];
}

// One block per consecutive group. A single exercise, even with an id left on
// it, is a block of its own with no superset.
export function supersetBlocks<T extends Grouped>(exercises: T[]): SupersetBlock<T>[] {
  const blocks: SupersetBlock<T>[] = [];
  for (const exercise of exercises) {
    const id = exercise.supersetId;
    const last = blocks.at(-1);
    if (id && last?.supersetId === id) last.exercises.push(exercise);
    else blocks.push({ supersetId: id, exercises: [exercise] });
  }
  for (const block of blocks) if (block.exercises.length < 2) block.supersetId = null;
  return blocks;
}

// The last exercise of a superset ends it, so the rest timer starts after it;
// the ones before it flow straight into the next.
export function endsSuperset(exercises: SupersetMember[], key: Key): boolean {
  const supersetId = exercises.find((e) => e.key === key)?.supersetId;
  if (!supersetId) return true;
  const members = exercises.filter((e) => e.supersetId === supersetId);
  return members.length < 2 || members.at(-1)?.key === key;
}

// Reorder Exercises: a superset moves as one block, at the place of whichever of
// its exercises comes first in the new order.
export function orderKeepingSupersets<T extends SupersetMember>(exercises: T[], keys: T['key'][]): T[] {
  const byKey = new Map(exercises.map((e) => [e.key, e]));
  const ordered = keys.map((k) => byKey.get(k)).filter((e): e is T => e !== undefined); // unknown keys skipped
  const placed = new Set<Key>();
  const result: T[] = [];
  for (const e of ordered) {
    if (placed.has(e.key)) continue;
    const group = e.supersetId ? ordered.filter((x) => x.supersetId === e.supersetId) : [e];
    for (const member of group) {
      placed.add(member.key);
      result.push(member);
    }
  }
  return result;
}
