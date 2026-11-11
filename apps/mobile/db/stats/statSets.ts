import { getDb } from '@/db/client';
import { cached } from '@/db/historyCache';
import { durationSecondsOf } from '@/lib/workout/duration';
import { muscleGroup, parseList, secondaryGroups } from '@/lib/domain/muscles';
import { rpeToRir } from '@/lib/training/rpe';
import { RUN } from '@/constants/run';
import type { MuscleGroup } from '@/types/muscles';
import type { StatSet } from '@/types/stats';
import { SELECT_STAT_SETS } from './queries';
import type { StatSetRow } from './rows';

// Profile → Dashboard → Statistics and its screens. Everything is worked out from the logged sets.

// Every set, oldest first. Shared by every screen until the history changes
// (db/historyCache.ts): don't change the array or the sets.
export function getStatSets(): Promise<StatSet[]> {
  return cached('statSets', loadStatSets);
}

async function loadStatSets(): Promise<StatSet[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<StatSetRow>(SELECT_STAT_SETS);
  // Muscles worked out once per exercise, not per set (each set shares its exercise's list).
  const muscles = new Map<string, { primary: MuscleGroup; secondary: MuscleGroup[] }>();
  return rows.map((r) => {
    let m = muscles.get(r.exercise_id);
    if (!m) {
      const primary = muscleGroup(r.target_muscle, r.body_part);
      m = { primary, secondary: secondaryGroups(parseList(r.secondary_muscles), primary) };
      muscles.set(r.exercise_id, m);
    }
    const startMs = Date.parse(r.start_time);
    return {
      workoutId: r.workout_id,
      title: r.title,
      startTime: r.start_time,
      startMs,
      durationSeconds: durationSecondsOf(r.start_time, r.end_time),
      exerciseId: r.exercise_id,
      name: r.name,
      catalogueId: r.catalogue_id,
      primary: m.primary,
      secondary: m.secondary,
      weightKg: r.weight_kg,
      bodyWeightKg: r.body_weight_kg,
      reps: r.reps,
      failure: r.set_type === 'failure',
      warmup: r.set_type === 'warmup',
      rir: r.name === RUN ? null : rpeToRir(r.rpe),
      seconds: r.duration_seconds,
      distanceKm: r.distance_km,
      rpe: r.rpe,
    };
  });
}
