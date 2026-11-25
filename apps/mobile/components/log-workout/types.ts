import type { ActiveExercise, ActiveSet, ActiveWorkout } from '@/types/workout';
import type { EditorSet } from '@/types/routine';
import type { ExerciseType } from '@/types/exercise';
import type { WorkoutSettings } from '@/types/workoutSettings';

// Props and local types of the Log Workout pieces (components/log-workout/).

// What the exercise blocks and set rows call, by key. The same functions on
// every render, so typing in one set redraws only that set's exercise and row.
export interface ExerciseActions {
  notes: (exerciseKey: string, notes: string) => void;
  rest: (exerciseKey: string) => void;
  open: (exerciseId: string) => void;
  menu: (exerciseKey: string) => void;
  setMenu: (exerciseKey: string, setKey: string) => void;
  setChange: (exerciseKey: string, setKey: string, change: Partial<ActiveSet>) => void;
  toggleDone: (exerciseKey: string, setKey: string) => void;
  play: (setKey: string, time: string) => void;
  stop: () => void;
  deleteSet: (exerciseKey: string, setKey: string) => void;
  addSet: (exerciseKey: string) => void;
  repsLeftInfo: () => void;
}

// A set's ▶ stopwatch.
export interface SetTimer {
  setKey: string;
  startedAt: number;
}

export interface LogHeaderProps {
  workout: ActiveWorkout;
  // Share of the workout's sets completed, 0–1 (the blue line under the header).
  progress: number;
  onBack: () => void;
  onClock: () => void;
  onFinish: () => void;
}

export interface WorkoutStatsRowProps {
  workout: ActiveWorkout;
  onDuration: () => void;
}

export interface DurationStatProps {
  workout: ActiveWorkout;
  onPress: () => void;
}

export interface LogExerciseProps {
  exercise: ActiveExercise;
  settings: WorkoutSettings;
  timer: SetTimer | null;
  actions: ExerciseActions;
  hideRest?: boolean; // inside a superset, only its last exercise shows the rest timer
}

export interface SetRowProps {
  exerciseKey: string;
  type: ExerciseType;
  set: ActiveSet;
  // W, F or its number.
  badge: string;
  previous: EditorSet | undefined;
  perHand: boolean;
  medal: boolean;
  // ▶ beside a lone TIME box.
  showPlay: boolean;
  timerStartedAt: number | null;
  actions: ExerciseActions;
}

export interface SetTimerTextProps {
  startedAt: number;
}

export interface RestBarProps {
  restEndsAt: number | null;
  restTotal: number | null;
  insetBottom: number;
  onAdjust: (seconds: number) => void;
}

export interface ExerciseMenuSheetProps {
  // The exercise whose ⋮ was tapped; null = closed.
  exerciseKey: string | null;
  // The workout's exercises: Add To Superset when there is another to pair with,
  // Remove From Superset when this one is paired.
  exercises: { key: string; supersetId: string | null }[];
  onDismiss: () => void;
  onReorder: () => void;
  onReplace: (exerciseKey: string) => void;
  onAddToSuperset: (exerciseKey: string) => void;
  onRemoveFromSuperset: (exerciseKey: string) => void;
}

export interface RepsLeftInfoSheetProps {
  visible: boolean;
  onDismiss: () => void;
}
