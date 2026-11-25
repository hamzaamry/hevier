import { getDb } from '@/db/client';
import { getGymTimeline } from '@/db/gym/gym';
import { cached } from '@/db/historyCache';
import { recordKey } from '@/lib/gym/timeline';
import type { GymTimeline } from '@/types/gym';
import { workoutRecords } from '@/lib/stats/records';
import { durationSecondsOf } from '@/lib/workout/duration';
import { coverFor } from '@/lib/workout/cover';
import type { HistorySet } from '@/types/records';
import type { CardSet, WorkoutCardData } from '@/types/feed';
import type { MediaItem } from '@/types/workout';
import {
  SELECT_WORKOUT_DESCRIPTION,
  SELECT_WORKOUT_MEDIA,
  SELECT_WORKOUT_MEDIA_ALL,
  SELECT_WORKOUT_SETS,
  SELECT_WORKOUTS,
} from './queries';
import type { WorkoutDescriptionRow, WorkoutMediaCardRow, WorkoutMediaRow, WorkoutRow, WorkoutSetRow } from './rows';
import { setVolumeKg } from '@/lib/volume';

// Saved workouts as the workout cards show them (Profile "Workouts", the
// Home feed) and the workout page.

// Newest first. Shared by every screen until the history changes
// (db/historyCache.ts): don't change the cards.
export function getWorkoutCards(): Promise<WorkoutCardData[]> {
  return cached('workoutCards', loadWorkoutCards);
}

async function loadWorkoutCards(): Promise<WorkoutCardData[]> {
  const db = await getDb();
  const workouts = await db.getAllAsync<WorkoutRow>(SELECT_WORKOUTS);
  const rows = await db.getAllAsync<WorkoutSetRow>(SELECT_WORKOUT_SETS);
  const media = await db.getAllAsync<WorkoutMediaCardRow>(SELECT_WORKOUT_MEDIA_ALL);
  return buildCards(workouts, rows, await getGymTimeline(), media).reverse();
}

// One workout, for its page. Records need the whole history, so this takes
// it from the (usually already loaded) cards.
export async function getWorkoutCard(id: string): Promise<WorkoutCardData | null> {
  const card = (await getWorkoutCards()).find((w) => w.id === id);
  if (!card) return null;
  const db = await getDb();
  const extra = await db.getFirstAsync<WorkoutDescriptionRow>(SELECT_WORKOUT_DESCRIPTION, [id]);
  const media = await db.getAllAsync<WorkoutMediaRow>(SELECT_WORKOUT_MEDIA, [id]);
  return { ...card, description: extra?.description ?? null, media };
}

export function buildCards(
  workouts: WorkoutRow[],
  rows: WorkoutSetRow[],
  timeline: GymTimeline,
  mediaRows: WorkoutMediaCardRow[] = []
): WorkoutCardData[] {
  const cards = new Map<string, WorkoutCardData>();
  // The workouts' photos and videos in their stored order, one list each.
  const media = new Map<string, MediaItem[]>();
  for (const m of mediaRows) {
    const list = media.get(m.workout_id) ?? [];
    list.push({ file: m.file, kind: m.kind });
    media.set(m.workout_id, list);
  }
  for (const w of workouts) {
    const items = media.get(w.id) ?? [];
    cards.set(w.id, {
      id: w.id,
      title: w.title,
      startTime: w.start_time,
      durationSeconds: durationSecondsOf(w.start_time, w.end_time),
      volumeKg: 0,
      records: 0,
      exercises: [],
      cover: coverFor(items, w.cover_file),
      mediaCount: items.length,
      coverFile: w.cover_file,
    });
  }
  const history: HistorySet[] = [];
  const historySets: CardSet[] = [];
  let lastWorkoutExercise: string | null = null;
  for (const r of rows) {
    const card = cards.get(r.workout_id);
    if (!card) continue;
    if (r.workout_exercise_id !== lastWorkoutExercise) {
      card.exercises.push({
        id: r.workout_exercise_id,
        exerciseId: r.exercise_id,
        name: r.name,
        type: r.type,
        catalogueId: r.catalogue_id,
        archived: r.archived === 1,
        notes: r.notes,
        supersetId: r.superset_id,
        sets: [],
      });
      lastWorkoutExercise = r.workout_exercise_id;
    }
    if (r.set_id === null) continue;
    const set: CardSet = {
      setType: r.set_type ?? 'normal',
      weightKg: r.weight_kg,
      reps: r.reps,
      durationSeconds: r.duration_seconds,
      distanceKm: r.distance_km,
      record: false,
    };
    card.exercises[card.exercises.length - 1].sets.push(set);
    historySets.push(set);
    card.volumeKg += setVolumeKg(r.weight_kg, r.reps, r.body_weight_kg);
    history.push({
      workoutId: r.workout_id,
      exerciseId: r.exercise_id,
      type: r.type,
      setType: set.setType,
      weightKg: r.weight_kg,
      reps: r.reps,
      durationSeconds: r.duration_seconds,
      distanceKm: r.distance_km,
      recordKey: recordKey(timeline, r.equipment, r.start_time, r.gym_id),
    });
  }
  const { counts, recordSets, records } = workoutRecords(history);
  recordSets.forEach((record, i) => (historySets[i].record = record));
  for (const [id, count] of counts) {
    const card = cards.get(id);
    if (card) card.records = count;
  }
  for (const [id, list] of records) {
    const card = cards.get(id);
    if (card) {
      card.prs = list.map((r) => ({ ...r, name: card.exercises.find((e) => e.exerciseId === r.exerciseId)?.name ?? '' }));
    }
  }
  return [...cards.values()];
}
