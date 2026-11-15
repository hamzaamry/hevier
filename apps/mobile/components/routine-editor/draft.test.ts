import { describe, expect, it } from 'vitest';
import type { EditorExercise } from '@/types/routine';
import { fromDraftSet, nextDraftSet, routinePayload, snapshot, toDraftExercises, toDraftSet, workoutPayload } from './draft';

const saved: EditorExercise = {
  exerciseId: 'squat',
  catalogueId: null,
  name: 'Squat',
  type: 'weight_reps',
  notes: ' heavy ',
  restSeconds: 120,
  sets: [{ setType: 'warmup', weightKg: 60, reps: 10, distanceKm: null, durationSeconds: null, rpe: 7 }],
  previous: [],
};

describe('routine draft', () => {
  it('turns saved sets into text and back', () => {
    const d = toDraftSet(saved.sets[0]);
    expect([d.weight, d.reps, d.km, d.time]).toEqual(['60', '10', '', '']);
    expect(fromDraftSet(d)).toEqual(saved.sets[0]);
  });

  it('gives every exercise and set its own key', () => {
    const [a, b] = toDraftExercises([saved, saved]);
    expect(new Set([a.key, b.key, a.sets[0].key, b.sets[0].key]).size).toBe(4);
  });

  it('Add Set copies the last set as a normal set, without its RPE', () => {
    const [e] = toDraftExercises([saved]);
    const next = nextDraftSet(e.sets);
    expect([next.weight, next.reps, next.setType, next.rpe]).toEqual(['60', '10', 'normal', null]);
    expect(next.key).not.toBe(e.sets[0].key);
    expect(nextDraftSet([]).weight).toBe('');
  });

  it('a changed set changes the snapshot (Cancel asks first)', () => {
    const [e] = toDraftExercises([saved]);
    const before = snapshot('Legs', [e]);
    expect(snapshot('Legs', [e])).toBe(before);
    expect(snapshot('Legs', [{ ...e, sets: [{ ...e.sets[0], reps: '9' }] }])).not.toBe(before);
  });

  it('builds the save payloads with trimmed text', () => {
    const [e] = toDraftExercises([saved]);
    const routine = routinePayload(null, 'f1', ' Legs ', [e]);
    expect(routine.name).toBe('Legs');
    expect(routine.exercises[0]).toMatchObject({ exerciseId: 'squat', notes: 'heavy', restSeconds: 120 });
    const w = workoutPayload('w1', 'Legs', { description: ' ', startTime: Date.UTC(2026, 0, 1), durationSeconds: 3600, media: [] }, [e]);
    expect([w.description, w.startTime, w.endTime]).toEqual([null, '2026-01-01T00:00:00.000Z', '2026-01-01T01:00:00.000Z']);
  });
});
