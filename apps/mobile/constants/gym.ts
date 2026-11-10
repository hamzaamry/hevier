// The gym before any gym change was recorded (a renamed "Previous gym").
export const FROM_START_DAY = '0001-01-01';

// Machines and cables differ from one gym to another, so their records are
// kept per gym. Not Smith machines (same bar everywhere) nor cardio machines.
export const PER_GYM_EQUIPMENT = ['leverage machine', 'cable', 'sled machine', 'assisted'] as const;

// Record key of the workouts before any gym change.
export const NO_GYM = 'none';

// Record key of the exercises that aren't per gym.
export const ALL_GYMS = '';

export const GYM_NAME_MAX_LENGTH = 60;

// How far back the Change Gym date can go.
export const GYM_DATE_YEARS_BACK = 10;

// Gyms near the user, from OpenStreetMap (lib/gym/nearby.ts). The user agent
// names the app only, never the user.
export const GYM_SEARCH = {
  url: 'https://overpass-api.de/api/interpreter',
  radiusMeters: 3000,
  maxResults: 15,
  timeoutMs: 15000,
  userAgent: 'Hevier (open-source workout app)',
};

export const EARTH_RADIUS_METERS = 6371000;
