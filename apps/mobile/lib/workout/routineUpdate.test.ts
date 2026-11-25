import { describe, expect, it } from 'vitest';

import { changesMessage, routineChanges, routineFromWorkout } from './routineUpdate';
import type { ActiveExercise, ActiveSet, ActiveWorkout } from '@/types/workout';
import type { EditorExercise, EditorRoutine, EditorSet } from '@/types/routine';

const planned = (setType: EditorSet['setType'] = 'normal'): EditorSet => ({
  setType,
  weightKg: 100,
  reps: 5,
  distanceKm: null,
  durationSeconds: null,
});
const plan = (exerciseId: string, sets: EditorSet[]): EditorExercise => ({
  exerciseId,
  catalogueId: null,
  name: exerciseId,
  type: 'weight_reps',
  notes: null,
  restSeconds: 120,
  supersetId: null,
  sets,
  previous: [],
});
let k = 0;
const did = (done: boolean, setType: ActiveSet['setType'] = 'normal', weight = '100', reps = '5'): ActiveSet => ({
  key: `s${k++}`,
  setType,
  weight,
  reps,
  km: '',
  time: '',
  done,
});
const ex = (exerciseId: string, sets: ActiveSet[]): ActiveExercise => ({
  key: `e${k++}`,
  exerciseId,
  catalogueId: null,
  name: exerciseId,
  type: 'weight_reps',
  notes: '',
  restSeconds: 120,
  supersetId: null,
  previous: [],
  sets,
});
const workout = (exercises: ActiveExercise[]): ActiveWorkout => ({
  title: 'UPPER A',
  routineId: 'r',
  startTime: '',
  exercises,
  restEndsAt: null,
  restTotal: null,
});
const routine: EditorRoutine = {
  id: 'r',
  name: 'UPPER A',
  exercises: [plan('lat', [planned(), planned()]), plan('bench', [planned(), planned(), planned()])],
};

describe('routine update', () => {
  it('asks nothing when only weights and reps changed', () => {
    const w = workout([
      ex('lat', [did(true, 'normal', '80', '11'), did(true)]),
      ex('bench', [did(true), did(true), did(true, 'normal', '30', '8')]),
    ]);
    expect(changesMessage(routineChanges(routine, w))).toBeNull();
  });

  it("says what changed; sets left unticked count as removed", () => {
    const w = workout([
      ex('lat', [did(true, 'failure'), did(true, 'failure'), did(true), did(true)]),
      ex('bench', [did(true), did(false), did(false)]),
    ]);
    expect(changesMessage(routineChanges(routine, w))).toBe('You added 2 sets, removed 2 sets and changed 2 set types.');
  });

  it('notices exercises added, removed and moved', () => {
    const w = workout([ex('bench', [did(true), did(true), did(true)]), ex('curl', [did(true)]), ex('lat', [did(false)])]);
    expect(routineChanges(routine, w)).toMatchObject({ addedExercises: 1, removedExercises: 1, reordered: false });
    const moved = workout([ex('bench', [did(true), did(true), did(true)]), ex('lat', [did(true), did(true)])]);
    expect(changesMessage(routineChanges(routine, moved))).toBe('You reordered the exercises.');
  });

  it('Update Routine keeps what was done, with its weights and reps', () => {
    const w = workout([ex('lat', [did(true, 'failure', '82,5', '9'), did(false)]), ex('curl', [did(true, 'normal', '', '12')])]);
    expect(routineFromWorkout(routine, w)).toEqual({
      id: 'r',
      name: 'UPPER A',
      exercises: [
        {
          exerciseId: 'lat',
          notes: null,
          restSeconds: 120,
          supersetId: null,
          sets: [{ setType: 'failure', weightKg: 82.5, reps: 9, distanceKm: null, durationSeconds: null }],
        },
        {
          exerciseId: 'curl',
          notes: null,
          restSeconds: 120,
          supersetId: null,
          sets: [{ setType: 'normal', weightKg: null, reps: 12, distanceKm: null, durationSeconds: null }],
        },
      ],
    });
  });
});
