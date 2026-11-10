// Gyms and the dates the user changed gym (Settings → Gym).

export interface Gym {
  id: string;
  name: string;
}

// day: 'YYYY-MM-DD' local; FROM_START_DAY = the gym before any change (a renamed "Previous gym").
export interface GymChange {
  id: string;
  day: string;
  gymId: string;
}

// changes: oldest first.
export interface GymTimeline {
  gyms: Map<string, Gym>;
  changes: GymChange[];
}

// What the Gym row / Select Gym hands back: an existing gym, or a new name to create.
export interface GymChoice {
  gymId: string | null;
  name: string;
}

// One period at a gym, as listed on the Gym screen (newest first).
// changeId null = the unnamed Previous gym; from / to null = open ended.
export interface GymStretch {
  changeId: string | null;
  gymId: string | null;
  name: string;
  from: string | null;
  to: string | null;
  workouts: number;
  current: boolean;
}

// A gym OpenStreetMap lists near the user (lib/gym/overpass.ts).
export interface NearbyGym {
  id: string;
  name: string;
  street: string | null;
  meters: number;
}

// What "Use my location" is doing (hooks/useNearbyGyms.ts).
export type NearbyState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'done'; gyms: NearbyGym[] }
  | { kind: 'denied' }
  | { kind: 'failed' };
