import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_WORKOUT_SETTINGS } from '@/constants/defaults';
import { fakeDb, freshDb, raw } from '@/db/testDb';

// workoutSettings.ts on an in-memory sql.js database, as in db/workouts/edit.test.ts.
vi.mock('./client', () => ({ getDb: async () => fakeDb }));

const { getWorkoutSettings, restOf, saveWorkoutSettings } = await import('./workoutSettings');

beforeEach(async () => {
  await freshDb();
});

describe('workout settings', () => {
  it('starts from the defaults, saves, and fills in settings added later', async () => {
    expect(await getWorkoutSettings()).toEqual(DEFAULT_WORKOUT_SETTINGS);
    await saveWorkoutSettings({ ...DEFAULT_WORKOUT_SETTINGS, defaultRestSeconds: 90, repsLeft: false });
    expect(await getWorkoutSettings()).toMatchObject({ defaultRestSeconds: 90, repsLeft: false, prAlert: true });
    raw.run("UPDATE app_state SET value = '{\"keepAwake\":true}' WHERE key = 'workoutSettings'");
    expect(await getWorkoutSettings()).toEqual({ ...DEFAULT_WORKOUT_SETTINGS, keepAwake: true });
  });

  it("an exercise's own rest timer wins; 0 turns it off despite a default", () => {
    const settings = { ...DEFAULT_WORKOUT_SETTINGS, defaultRestSeconds: 120 };
    expect(restOf(null, settings)).toBe(120);
    expect(restOf(60, settings)).toBe(60);
    expect(restOf(0, settings)).toBe(0);
    expect(restOf(null, DEFAULT_WORKOUT_SETTINGS)).toBeNull();
  });
});
