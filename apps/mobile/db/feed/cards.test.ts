import { describe, expect, it, vi } from 'vitest';

vi.mock('@/db/client', () => ({ getDb: async () => null }));
vi.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));
const { buildCards } = await import('./cards');

const NO_CHANGES = { gyms: new Map(), changes: [] };

// A workout_media row as the card query returns it.
const media = (workout: string, file: string, kind: 'photo' | 'video' = 'photo') => ({
  workout_id: workout,
  file,
  kind,
});

const row = (workout: string, we: string, name: string, set: string | null, weight: number | null, reps: number | null) => ({
  workout_id: workout,
  workout_exercise_id: we,
  exercise_id: name,
  name,
  type: 'weight_reps' as const,
  catalogue_id: null,
  archived: 0,
  notes: null,
  set_id: set,
  set_type: set ? ('normal' as const) : null,
  weight_kg: weight,
  reps,
  duration_seconds: null,
  distance_km: null,
  body_weight_kg: null,
  equipment: null,
  start_time: '2026-10-06T18:00:00Z',
  gym_id: null,
});

describe('workout cards', () => {
  it('marks an archived exercise, the others not', () => {
    const [card] = buildCards(
      [{ id: 'w1', title: 'CORE', start_time: '2026-10-06T18:00:00Z', end_time: null, cover_file: null }],
      [{ ...row('w1', 'a', 'Twist', 's1', null, 12), archived: 1 }, row('w1', 'b', 'Plank', 's2', null, 1)],
      NO_CHANGES
    );
    expect(card.exercises.map((e) => [e.name, e.archived])).toEqual([
      ['Twist', true],
      ['Plank', false],
    ]);
  });

  it('counts sets, volume and records per workout', () => {
    const cards = buildCards(
      [
        { id: 'w1', title: 'UPPER A', start_time: '2026-10-06T18:00:00Z', end_time: '2026-10-06T19:09:00Z', cover_file: null },
        { id: 'w2', title: 'UPPER B', start_time: '2026-10-13T18:00:00Z', end_time: null, cover_file: null },
      ],
      [
        row('w1', 'a', 'Bench', 's1', 80, 10),
        row('w1', 'b', 'Warm Up', null, null, null),
        row('w2', 'c', 'Bench', 's2', 90, 10),
        row('w2', 'c', 'Bench', 's3', 60, 10),
      ],
      NO_CHANGES
    );
    expect(cards[0]).toMatchObject({ durationSeconds: 4140, volumeKg: 800, records: 0 });
    expect(cards[0].exercises.map((e) => [e.name, e.sets.length])).toEqual([
      ['Bench', 1],
      ['Warm Up', 0],
    ]);
    expect(cards[1]).toMatchObject({ durationSeconds: 0, volumeKg: 1500, records: 3 });
    // The medal goes on the set that beat the records, not the lighter one after it.
    expect(cards[1].exercises[0].sets.map((s) => s.record)).toEqual([true, false]);
  });

  it('a visit workout counts its records at the visited gym only', () => {
    const timeline = {
      gyms: new Map([['A', { id: 'A', name: 'A' }], ['B', { id: 'B', name: 'B' }]]),
      changes: [{ id: 'c1', day: '2026-10-01', gymId: 'A' }, { id: 'c2', day: '2026-10-10', gymId: 'B' }],
    };
    const cable = (workout: string, start: string, gym: string | null, weight: number) => ({
      ...row(workout, workout, 'Press', `s${workout}`, weight, 10),
      equipment: 'cable',
      start_time: start,
      gym_id: gym,
    });
    const cards = buildCards(
      [
        { id: 'w1', title: 'x', start_time: '2026-10-05T12:00:00Z', end_time: null, cover_file: null }, // at A
        { id: 'w2', title: 'x', start_time: '2026-10-12T12:00:00Z', end_time: null, cover_file: null }, // at B: first there
        { id: 'w3', title: 'x', start_time: '2026-10-13T12:00:00Z', end_time: null, cover_file: null }, // a visit to A
        { id: 'w4', title: 'x', start_time: '2026-10-14T12:00:00Z', end_time: null, cover_file: null }, // at B again
      ],
      [
        cable('w1', '2026-10-05T12:00:00Z', null, 80),
        cable('w2', '2026-10-12T12:00:00Z', null, 100),
        cable('w3', '2026-10-13T12:00:00Z', 'A', 85), // beats A's 80
        cable('w4', '2026-10-14T12:00:00Z', null, 90), // B's best is 100: no record
      ],
      timeline
    );
    expect(cards.map((c) => c.records)).toEqual([0, 0, 3, 0]);
  });

  it('has no cover without media', () => {
    const [card] = buildCards(
      [{ id: 'w1', title: 'x', start_time: '2026-10-06T18:00:00Z', end_time: null, cover_file: null }],
      [],
      NO_CHANGES
    );
    expect(card).toMatchObject({ cover: null, mediaCount: 0 });
  });

  it('defaults to the first photo, not the first item, and counts the rest', () => {
    const [card] = buildCards(
      [{ id: 'w1', title: 'x', start_time: '2026-10-06T18:00:00Z', end_time: null, cover_file: null }],
      [],
      NO_CHANGES,
      [media('w1', 'a.mp4', 'video'), media('w1', 'b.jpg'), media('w1', 'c.jpg')]
    );
    expect(card.cover).toEqual({ file: 'b.jpg', kind: 'photo' });
    expect(card.mediaCount).toBe(3);
  });

  it('uses the chosen file, a video included, and ignores one that is gone', () => {
    const workout = (cover_file: string | null) => ({
      id: 'w1',
      title: 'x',
      start_time: '2026-10-06T18:00:00Z',
      end_time: null,
      cover_file,
    });
    const mediaRows = [media('w1', 'a.jpg'), media('w1', 'b.mp4', 'video')];
    expect(buildCards([workout('b.mp4')], [], NO_CHANGES, mediaRows)[0]).toMatchObject({
      cover: { file: 'b.mp4', kind: 'video' },
      coverFile: 'b.mp4',
    });
    expect(buildCards([workout('gone.jpg')], [], NO_CHANGES, mediaRows)[0]).toMatchObject({
      cover: { file: 'a.jpg', kind: 'photo' },
      coverFile: 'gone.jpg',
    });
  });
});
