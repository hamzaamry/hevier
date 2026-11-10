// What the gym queries return.

// SELECT_GYMS
export interface GymRow {
  id: string;
  name: string;
}

// SELECT_GYM_CHANGES
export interface GymChangeRow {
  id: string;
  day: string;
  gym_id: string;
}

// SELECT_GYM_BY_NAME
export interface GymIdRow {
  id: string;
}
