import type { EditorSet } from '@/types/routine';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { SetText, SetType } from '@/types/workout';
import type { SetInputField } from '@/types/setFields';
import type { ExerciseType } from '@/types/exercise';
import type { SET_TABLE_LAYOUTS } from '@/constants/ui';

// Props of the set table pieces in components/set-table/.

export interface SetBadgeProps {
  setType: SetType;
  // What the SET column shows: "W", "F" or the set's number (setBadges in lib/format/setFormat.ts).
  label: string;
  // The column's place in its row.
  style?: StyleProp<TextStyle>;
}

export interface RestTimerSheetProps {
  visible: boolean;
  // "Rest Timer", or "Default Rest Timer" in the settings.
  title: string;
  // The ticked choice, in seconds (null = Off).
  value: number | null;
  onPick: (seconds: number | null) => void;
  onDismiss: () => void;
}

export interface SetTypeSheetProps {
  visible: boolean;
  // The ticked type.
  value: SetType | undefined;
  onPick: (type: SetType) => void;
  onRemove: () => void;
  onDismiss: () => void;
}

// A blue icon + text row under an exercise's name ("Rest Timer: 2min 0s", "Weight: Per hand").
export interface OptionRowProps {
  icon: ReactNode;
  label: string;
  // Without it the row is only shown (the routine page).
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

// Where a set table's columns sit: Log Workout has a ✓ column, the editors don't.
export type SetTableLayout = (typeof SET_TABLE_LAYOUTS)[number];

export interface SetTableHeaderProps {
  fields: SetInputField[];
  // KG/HAND instead of KG.
  perHand: boolean;
  layout: SetTableLayout;
  style?: StyleProp<ViewStyle>;
}

export interface SetInputsProps {
  type: ExerciseType;
  set: SetText;
  perHand: boolean;
  layout: SetTableLayout;
  // A ticked set's boxes have no border.
  done?: boolean;
  // Shown instead of the TIME box (Log Workout's running ▶ stopwatch).
  timer?: ReactNode;
  onChange: (change: Partial<SetText>) => void;
}

export interface ExerciseBlockHeaderProps {
  name: string;
  catalogueId: string | null;
  notes: string;
  onNotes: (notes: string) => void;
  onMenu: () => void;
  // Picture and name open the exercise page (Log Workout).
  onOpen?: () => void;
  // A long note starts folded to a few lines with Show more (Log Workout).
  foldLongNotes?: boolean;
}

export interface PreviousCellProps {
  type: ExerciseType;
  previous: EditorSet | undefined;
  perHand: boolean;
  layout: SetTableLayout;
}
