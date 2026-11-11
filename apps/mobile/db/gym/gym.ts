import * as Crypto from 'expo-crypto';
import { FROM_START_DAY } from '@/constants/gym';
import { getDb } from '@/db/client';
import { cached, invalidateHistory } from '@/db/historyCache';
import { dayKey } from '@/lib/date';
import { gymOnDay } from '@/lib/gym/timeline';
import type { Gym, GymChoice, GymTimeline, GymWorkout } from '@/types/gym';
import {
  DELETE_GYM_CHANGE,
  DELETE_UNUSED_GYMS,
  INSERT_GYM,
  MOVE_GYM_CHANGE,
  RENAME_GYM,
  SELECT_GYMS,
  SELECT_GYM_BY_NAME,
  SELECT_GYM_CHANGES,
  SELECT_GYM_WORKOUTS,
  UPSERT_GYM_CHANGE,
} from './queries';
import type { GymChangeRow, GymIdRow, GymRow, GymWorkoutRow } from './rows';

// Settings → Gym and the Gym row on Save Workout. Every record is worked out
// from the timeline, so each write refreshes the history (cached workout cards
// included).

export function getGymTimeline(): Promise<GymTimeline> {
  return cached('gymTimeline', async () => {
    const db = await getDb();
    const [gymRows, changeRows] = await Promise.all([
      db.getAllAsync<GymRow>(SELECT_GYMS),
      db.getAllAsync<GymChangeRow>(SELECT_GYM_CHANGES),
    ]);
    const gyms = new Map<string, Gym>(gymRows.map((r) => [r.id, { id: r.id, name: r.name }]));
    return { gyms, changes: changeRows.map((r) => ({ id: r.id, day: r.day, gymId: r.gym_id })) };
  });
}

// Oldest first. Cached like the timeline, and refreshed by the same writes.
export function getGymWorkouts(): Promise<GymWorkout[]> {
  return cached('gymWorkouts', async () => {
    const db = await getDb();
    const rows = await db.getAllAsync<GymWorkoutRow>(SELECT_GYM_WORKOUTS);
    return rows.map((r) => ({ startTime: r.start_time, visitGymId: r.gym_id }));
  });
}

// The id of the picked gym, or of the gym with that name (the same name in
// another case is the same gym), or of a new one.
export async function ensureGym(choice: GymChoice): Promise<string> {
  if (choice.gymId) return choice.gymId;
  const db = await getDb();
  const existing = await db.getFirstAsync<GymIdRow>(SELECT_GYM_BY_NAME, [choice.name]);
  if (existing) return existing.id;
  const id = Crypto.randomUUID();
  await db.runAsync(INSERT_GYM, [id, choice.name.trim()]);
  return id;
}

// From `day` on, workouts count at this gym. Nothing changes when it already is
// the gym on that day.
function refuseFuture(day: string) {
  if (day > dayKey(new Date())) throw new Error(`Gym change on a future day: ${day}`);
}

export async function addGymChange(day: string, choice: GymChoice): Promise<void> {
  refuseFuture(day);
  const gymId = await ensureGym(choice);
  invalidateHistory();
  const t = await getGymTimeline();
  if (gymOnDay(t, day) === gymId) return;
  const db = await getDb();
  await db.runAsync(UPSERT_GYM_CHANGE, [Crypto.randomUUID(), day, gymId]);
  invalidateHistory();
}

// Gives the gym the user had before the first change a name.
export async function namePreviousGym(name: string): Promise<void> {
  const gymId = await ensureGym({ gymId: null, name });
  const db = await getDb();
  await db.runAsync(UPSERT_GYM_CHANGE, [Crypto.randomUUID(), FROM_START_DAY, gymId]);
  invalidateHistory();
}

export async function renameGym(gymId: string, name: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(RENAME_GYM, [name.trim(), gymId]);
  invalidateHistory();
}

// The UI doesn't offer a day that already has a change; a clash throws.
export async function moveGymChange(changeId: string, day: string): Promise<void> {
  refuseFuture(day);
  const db = await getDb();
  await db.runAsync(MOVE_GYM_CHANGE, [day, changeId]);
  invalidateHistory();
}

export async function deleteGymChange(changeId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(DELETE_GYM_CHANGE, [changeId]);
  await db.runAsync(DELETE_UNUSED_GYMS);
  invalidateHistory();
}
