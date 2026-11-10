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
