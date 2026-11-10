import type { useRouter } from 'expo-router';
import type { CHART_UNITS, EXERCISE_TYPES } from '@/constants/exercise';
import type { WorkoutSet } from './workout';
import type { MuscleGroup } from '@/types/muscles';
import type { EquipmentGroup } from '@/types/equipment';

// What an exercise logs: one of EXERCISE_TYPES.
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

// One exercise in the Add Exercise / Replace Exercise picker (db/exercisePicker/pickerExercises.ts).
export interface PickerExercise {
  id: string;
  name: string;
  type: ExerciseType;
  catalogueId: string | null;
  muscle: MuscleGroup; // grey line under the name
  equipment: EquipmentGroup;
  timesDone: number;
  lastDone: string | null; // ISO start of the latest workout with it
}

// One titled block of the picker's list ("Recent Exercises"); '' while searching.
export interface PickerSection {
  title: string;
  data: PickerExercise[];
}

// What the picker's list is showing: the search text, the filters and, when
// replacing, the exercise being swapped out.
export interface PickerQuery {
  search: string;
  equipment: readonly EquipmentGroup[];
  muscles: readonly MuscleGroup[];
  replacingId?: string | null;
}

// The exercise page (db/exerciseStats/detail.ts): one past workout with this exercise.
export interface ExerciseSession {
  workoutId: string;
  title: string;
  startTime: string;
  sets: WorkoutSet[];
  // Which gym its records count at ('' = every gym; lib/gym/timeline.ts recordKey).
  gymKey: string;
}

export interface ExerciseDetail {
  id: string;
  name: string;
  type: ExerciseType;
  catalogueId: string | null;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  description: string | null;
  instructions: string[];
  sessions: ExerciseSession[]; // oldest first
  // Set only for a machine or cable exercise once the user has changed gym: the
  // gym whose records the page shows.
  gym: { key: string; name: string } | null;
}

// A unit of the exercise page's chart and records: one of CHART_UNITS.
export type Unit = (typeof CHART_UNITS)[number];

// One chip under the exercise page's chart (lib/stats/exerciseMetrics.ts METRICS).
export interface Metric {
  label: string; // the chip under the chart
  unit: Unit;
  value: (sets: WorkoutSet[]) => number | null; // one session's value; null = nothing to plot
}

// The exercise picker (app/add-exercise.tsx); browse: Profile's Exercises
// list, where a tap opens the exercise page.
export interface AddExerciseProps {
  browse?: boolean;
}

export interface PickRequest {
  // Replace Exercise: the exercise being swapped, for Suggested Exercises.
  replacing?: { exerciseId: string };
  onPicked: (exercises: PickerExercise[]) => void;
}

export type Router = ReturnType<typeof useRouter>;
