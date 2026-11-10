import { getDb } from '@/db/client';
import { getGymTimeline } from '@/db/gym/gym';
import { gymName, isPerGym, recordKey, workoutGym } from '@/lib/gym/timeline';
import { exerciseBests } from '@/lib/stats/records';
import type { Bests } from '@/types/records';
import { selectEquipmentOf, selectSetsOfExercises } from './queries';
import type { EquipmentRow, ExerciseSetRow } from './rows';

// The bests of an exercise over all saved workouts; null when it was never done,
// so the first time is not a record (every set would be one). A machine or cable
// exercise counts only the workouts at the gym a workout started at `at` would
// be at (db/gym, lib/gym/timeline.ts).
export async function getExerciseBests(exerciseId: string, at = new Date()): Promise<Bests | null> {
  return (await getExerciseBestsFor([exerciseId], at)).get(exerciseId) ?? null;
}

// The same for several exercises in one query (starting a routine asked once
// per exercise). Exercises never done are left out.
export async function getExerciseBestsFor(exerciseIds: string[], at = new Date()): Promise<Map<string, Bests>> {
  const ids = [...new Set(exerciseIds)];
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const [rows, timeline] = await Promise.all([db.getAllAsync<ExerciseSetRow>(selectSetsOfExercises(ids.length), ids), getGymTimeline()]);
  const start = at.toISOString();
  return exerciseBests(
    rows
      .filter((r) => recordKey(timeline, r.equipment, r.start_time, r.gym_id) === recordKey(timeline, r.equipment, start, null))
      .map((r) => ({
        exerciseId: r.exercise_id,
        setType: r.set_type,
        weightKg: r.weight_kg,
        reps: r.reps,
        durationSeconds: r.duration_seconds,
        distanceKm: r.distance_km,
      }))
  );
}

// The gym name that goes with the records of each machine or cable exercise
// ("at Basic-Fit Nation"). Nothing for a user who never changed gym: they
// can't tell records are per gym.
export async function getRecordsGymFor(exerciseIds: string[], at = new Date()): Promise<Map<string, string>> {
  const ids = [...new Set(exerciseIds)];
  const result = new Map<string, string>();
  if (ids.length === 0) return result;
  const timeline = await getGymTimeline();
  if (timeline.changes.length === 0) return result;
  const db = await getDb();
  const name = gymName(timeline, workoutGym(timeline, at.toISOString(), null));
  for (const row of await db.getAllAsync<EquipmentRow>(selectEquipmentOf(ids.length), ids)) {
    if (isPerGym(row.equipment)) result.set(row.id, name);
  }
  return result;
}
