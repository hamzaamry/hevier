import type { PlannedSet, RoutineSession, RoutinePageExercise } from '@/types/routine';

// Props and local types of the routine page pieces (components/routine-page/).

export interface RoutineExerciseBlockProps {
  exercise: RoutinePageExercise;
  onOpen: (exerciseId: string) => void;
  hideRest?: boolean; // inside a superset, only its last exercise shows the rest timer
}

export interface RoutineChartProps {
  sessions: RoutineSession[]; // all of them, oldest first
}

// One value column of a planned set table: its title and how a set fills it.
export interface PlannedColumn {
  label: string;
  value: (s: PlannedSet) => string;
}
