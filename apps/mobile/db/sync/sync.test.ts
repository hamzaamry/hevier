import { describe, expect, it, vi } from 'vitest';
import { fakeDb, freshDb, raw } from '@/db/testDb';

// The workout count and last workout sent with each copy to the PC.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));
const { countWorkouts, lastWorkoutStart } = await import('./sync');

describe('sync', () => {
  it('finds when the newest workout started', async () => {
    await freshDb();
    expect(await lastWorkoutStart()).toBeNull();
    raw.exec(`INSERT INTO workouts (id, title, start_time) VALUES ('a', 'A', '2026-11-06T15:31:57.722Z'), ('b', 'B', '2026-10-15T18:00:00Z')`);
    expect(await lastWorkoutStart()).toBe('2026-11-06T15:31:57.722Z');
  });

  it('counts saved workouts', async () => {
    await freshDb();
    expect(await countWorkouts()).toBe(0);
    raw.exec(`INSERT INTO workouts (id, title, start_time) VALUES ('a', 'A', '2026-10-14T18:00:00Z'), ('b', 'B', '2026-10-15T18:00:00Z')`);
    expect(await countWorkouts()).toBe(2);
  });
});
