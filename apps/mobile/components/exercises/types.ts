import type { ReactNode } from 'react';
import type { EquipmentGroup } from '@/types/equipment';
import type { MuscleGroup } from '@/types/muscles';
import type { MediaItem } from '@/types/workout';

// Props of the exercises components (components/exercises/).

export interface ExerciseThumbProps {
  catalogueId: string | null;
  media?: MediaItem | null; // a user's exercise: its own photo or video
  size?: number;
}

export interface FilterIconProps {
  children: React.ReactNode;
  figure?: boolean;
}

export interface EquipmentIconProps {
  group: EquipmentGroup;
}

export interface MuscleIconProps {
  group: MuscleGroup;
}

export interface FigureProps {
  view: 'front' | 'back';
  highlight: MuscleGroup | 'all' | null;
}

export interface FilterOption<K extends string> {
  key: K;
  icon: ReactNode;
}

export type Region = MuscleGroup | 'base';

export type Shape = { region: Region } & (
  | { kind: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'path'; d: string }
);

// A titled group of options in a filter sheet (Upper Body, Lower Body…).
export interface FilterSection<K extends string> {
  title?: string;
  options: FilterOption<K>[];
}

export interface FilterSheetProps<K extends string> {
  title: string;
  sections: FilterSection<K>[];
  visible: boolean;
  selected: K[];
  // The bottom button: "Show N results" from countFor, or applyLabel (Create Exercise's "Done").
  countFor?: (picks: K[]) => number;
  applyLabel?: string;
  // One pick: a tap applies it and closes, no bottom buttons (Create Exercise's Equipment, Muscle).
  single?: boolean;
  onApply: (picks: K[]) => void;
  onDismiss: () => void;
}

export interface ShowButtonProps<K extends string> {
  picks: K[];
  countFor?: (picks: K[]) => number;
  applyLabel?: string;
  onApply: (picks: K[]) => void;
}
