import type { BodyPart } from './muscles';
import type { StripDay } from './stats';
import type { ExerciseType } from './exercise';
import type { WorkoutRecord } from './records';
import type { MediaItem, SetType } from './workout';

// A workout card on Home, the Profile and the workout page (db/feed/cards.ts).
export interface CardSet {
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
  record: boolean; // beat one of the exercise's records
}

export interface CardExercise {
  exerciseId: string;
  name: string;
  type: ExerciseType;
  catalogueId: string | null;
  archived: boolean; // a user's exercise they archived since
  notes: string | null;
  sets: CardSet[];
}

export interface WorkoutCardData {
  id: string;
  title: string;
  startTime: string;
  durationSeconds: number;
  volumeKg: number;
  records: number;
  exercises: CardExercise[];
  // Its records (the "Nice work!" PR cards); none = no record.
  prs?: (WorkoutRecord & { name: string })[];
  // Only on the workout page (getWorkoutCard).
  description?: string | null;
  media?: MediaItem[];
}

// What the "Nice work!" cards are drawn from (app/nice-work.tsx).
export interface NiceWorkData {
  workout: WorkoutCardData;
  number: number; // the how-many-th workout
  streak: number;
  username: string;
  muscles: Map<string, string>;
  days: StripDay[];
  times: number; // workouts in those 7 days
  parts: Record<BodyPart, number>;
}
