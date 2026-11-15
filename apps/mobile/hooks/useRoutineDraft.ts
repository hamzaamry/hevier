import { useEffect, useState } from 'react';
import { getRoutineForEdit } from '@/db/routines/editor';
import { getWorkoutForEdit } from '@/db/workouts/edit';
import { getWorkoutMedia } from '@/db/workouts/media';
import { durationSecondsOf } from '@/lib/workout/duration';
import { snapshot, toDraftExercises } from '@/components/routine-editor/draft';
import type { DraftExercise, WorkoutMeta } from '@/components/routine-editor/types';
import type { RoutineDraftSource } from '@/types/routine';

const NO_META: WorkoutMeta = { description: '', startTime: 0, durationSeconds: 0, media: [] };

// The routine editor's draft: loaded from a routine (`id`), a workout to copy
// into a new routine (`fromWorkout`, Save as Routine) or a workout to edit
// (`workout`, Edit Workout); empty for a new routine. `isDirty` tells Cancel
// whether it would lose changes.
export function useRoutineDraft({ id, fromWorkout, workout }: RoutineDraftSource) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [meta, setMeta] = useState<WorkoutMeta>(NO_META);
  // What Cancel compares with: the loaded draft, or nothing for a new one.
  const [saved, setSaved] = useState<string | null>(() => (id || workout ? null : snapshot('', [])));

  useEffect(() => {
    if (!id) return;
    getRoutineForEdit(id).then((r) => {
      if (!r) return;
      const draft = toDraftExercises(r.exercises);
      setName(r.name);
      setExercises(draft);
      setSaved(snapshot(r.name, draft));
    });
  }, [id]);

  // Save as Routine: a new routine filled from the workout. It stays unsaved
  // (and Cancel asks first) until Save.
  useEffect(() => {
    if (!fromWorkout) return;
    getWorkoutForEdit(fromWorkout).then((w) => {
      if (!w) return;
      setName(w.title);
      setExercises(toDraftExercises(w.exercises));
    });
  }, [fromWorkout]);

  useEffect(() => {
    if (!workout) return;
    // The media is loaded here only: Copy Workout and Save as Routine never get it.
    Promise.all([getWorkoutForEdit(workout), getWorkoutMedia(workout)]).then(([w, media]) => {
      if (!w) return;
      const loaded = {
        description: w.description ?? '',
        startTime: Date.parse(w.startTime),
        durationSeconds: durationSecondsOf(w.startTime, w.endTime),
        media,
      };
      const draft = toDraftExercises(w.exercises);
      setName(w.title);
      setExercises(draft);
      setMeta(loaded);
      setSaved(snapshot(w.title, draft, metaParts(loaded)));
    });
  }, [workout]);

  // Only Cancel needs it, so the JSON snapshot of the whole draft is taken
  // there, not on every keystroke.
  function isDirty() {
    return saved !== null && snapshot(name, exercises, workout ? metaParts(meta) : undefined) !== saved;
  }

  return { name, setName, exercises, setExercises, meta, setMeta, isDirty };
}

function metaParts(m: WorkoutMeta): unknown[] {
  return [m.description, m.startTime, m.durationSeconds, m.media.map((x) => x.file)];
}
