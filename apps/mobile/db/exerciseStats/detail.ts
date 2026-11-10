import { getDb } from '@/db/client';
import { getGymTimeline } from '@/db/gym/gym';
import { gymName, isPerGym, recordKey, workoutGym } from '@/lib/gym/timeline';
import { NO_GYM } from '@/constants/gym';
import { muscleGroup, parseList, secondaryGroups } from '@/lib/domain/muscles';
import type { ExerciseDetail } from '@/types/exercise';
import { getExerciseHistory } from './history';
import { SELECT_EXERCISE_DETAIL } from './queries';
import type { ExerciseDetailRow } from './rows';

// The exercise page (what ⓘ in the picker and an exercise name on the routine
// page open).
export async function getExerciseDetail(id: string): Promise<ExerciseDetail | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ExerciseDetailRow>(SELECT_EXERCISE_DETAIL, [id]);
  if (!row) return null;
  const primary = muscleGroup(row.target_muscle, row.body_part);
  const [history, timeline] = await Promise.all([getExerciseHistory(id), getGymTimeline()]);
  // Only a user who changed gym sees records per gym.
  const perGym = isPerGym(row.equipment) && timeline.changes.length > 0;
  const now = new Date().toISOString();
  const currentGym = workoutGym(timeline, now, null);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    catalogueId: row.catalogue_id,
    primary,
    secondary: secondaryGroups(parseList(row.secondary_muscles), primary),
    description: row.description,
    instructions: parseList(row.instructions),
    sessions: history.map((h) => ({
      workoutId: h.workout.id,
      title: h.workout.title,
      startTime: h.workout.startTime,
      sets: h.sets,
      gymKey: recordKey(timeline, row.equipment, h.workout.startTime, h.gymId),
    })),
    gym: perGym ? { key: currentGym ?? NO_GYM, name: gymName(timeline, currentGym) } : null,
  };
}
