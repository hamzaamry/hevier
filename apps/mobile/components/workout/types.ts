import type { WorkoutCardData } from '@/types/feed';
import type { PrToastData } from '@/types/records';
import type { ActiveExercise, ActiveWorkout, MediaItem } from '@/types/workout';
import type { ReactNode } from 'react';

// Props of the workout components (components/workout/).

export interface ClockSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export interface TimerFaceProps {
  now: number;
}

export interface StopwatchFaceProps {
  now: number;
}

export interface ButtonsProps {
  now: number;
}

export interface BigButtonProps {
  label: string;
  grey?: boolean;
  onPress: () => void;
}

export interface DurationSheetProps {
  workout: ActiveWorkout;
  visible: boolean;
  onDismiss: () => void;
  noPause?: boolean; // Save Workout: the clock is stopped there
}

export interface TimeSheetProps {
  visible: boolean;
  onDismiss: () => void;
  now: number;
  startTime: number;
  durationSeconds: number;
  onStart: (time: number) => void;
  onDuration: (seconds: number) => void;
  footer?: ReactNode; // without one, plain room under the rows
}

export interface StartWheelsProps {
  now: number;
  startTime: number;
  onStart: (time: number) => void;
}

export interface DashedProps {
  radius: number;
}

export interface MediaStripProps {
  media: MediaItem[];
  onAdd?: () => void;
  onRemove?: (file: string) => void;
  // The workout page: a tap opens that photo or video's menu.
  onSelect?: (file: string) => void;
  // The one the card shows first: badged "Cover".
  coverFile?: string | null;
}

export interface MedalProps {
  size?: number;
  label?: string;
}

export interface PrToastProps {
  toast: PrToastData | null;
  onDone: () => void;
}

export interface ReorderExercisesProps {
  exercises: ActiveExercise[];
  visible: boolean;
  onDone: (keys: string[]) => void;
  onCancel: () => void;
}

export interface WorkoutCardProps {
  workout: WorkoutCardData;
  username: string;
  name: string;
  when: string;
  onOpen: (id: string) => void;
  onMenu: (id: string) => void;
  band?: boolean; // Home: a 16 grey band under each post instead of a line
}

export interface WorkoutSummaryProps {
  workout: WorkoutCardData;
  username: string;
  name: string;
  when: string;
  onMenu?: () => void;
}
