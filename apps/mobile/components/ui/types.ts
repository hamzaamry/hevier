import type { ReorderItem } from '@/types/ui';
import type { ActiveWorkout } from '@/types/workout';
import type { SharedValue } from 'react-native-reanimated';
import type { ReactNode } from 'react';
import type { KeyboardTypeOptions, StyleProp, ViewProps, ViewStyle } from 'react-native';
import type { BUTTON_SIZES, BUTTON_VARIANTS, STAT_SIZES } from '@/constants/ui';

// Props of the shared screen pieces in components/ui/.

// Screen: a plain View, filled with the app background.
export type ScreenProps = ViewProps;

// Button: its fill (primary blue, secondary grey, neutral lighter grey, outline blue border).
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

// Button: its height (normal 44, compact 40).
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  // Drawn left of the label (a + for Add Set / Add Exercise).
  icon?: ReactNode;
  // Red label, for Discard Workout.
  danger?: boolean;
  disabled?: boolean;
  // A spinner instead of the label, and no taps, while busy.
  busy?: boolean;
  // Its place and width in the screen (margins, flex, position).
  style?: StyleProp<ViewStyle>;
}

export interface EmptyStateProps {
  // The grey sentence: "No workouts yet".
  message: string;
  // A bold line above it: "Can't find squat".
  title?: string;
  // A picture above everything (the routine editor's barbell).
  icon?: ReactNode;
  // A button under the message.
  action?: ReactNode;
  // A small left-aligned note inside a section, instead of a centred block.
  note?: boolean;
  // Its spacing in the screen.
  style?: StyleProp<ViewStyle>;
}

export interface PillProps {
  label: string;
  // Filled blue when on.
  active: boolean;
  onPress: () => void;
}

export interface MetricPillsProps<K extends string | number> {
  options: readonly { key: K; label: string }[];
  // The key of the pill that is on.
  value: K;
  onChange: (key: K) => void;
  // Lets the pills go onto a second line (the exercise page has four).
  wrap?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Stat: small (workout cards, Log Workout), medium (Profile), large (Save Workout).
export type StatSize = (typeof STAT_SIZES)[number];

export interface StatProps {
  label: string;
  value: string;
  size?: StatSize;
  // Blue value (the Duration you can tap).
  blue?: boolean;
  // Drawn before the value (the records medal).
  icon?: ReactNode;
  onPress?: () => void;
  // Its width in the row.
  style?: StyleProp<ViewStyle>;
}

export interface ActionBarProps {
  icon: ReactNode;
  label: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export interface AvatarProps {
  name: string;
  size: number;
}

export interface BottomSheetProps {
  visible: boolean;
  // Without a title (the range picker) the card sits right under the grab bar.
  title?: string;
  onDismiss: () => void;
  onClosed?: () => void;
  // Content straight on the sheet, without the rounded card (Duration sheet).
  bare?: boolean;
  children: ReactNode;
}

export interface SheetItemProps {
  icon: ReactNode;
  label: string;
  destructive?: boolean;
  first?: boolean;
  onPress: () => void;
}

export interface SheetOptionProps {
  label: string;
  selected: boolean;
  first?: boolean;
  onPress: () => void;
}

export interface ConfettiPieceProps {
  piece: Piece;
  fall: number;
  clock: SharedValue<number>;
}

export interface ConfirmDialogProps {
  visible: boolean;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  // 'danger' = red label (Delete…); 'primary' = blue button (Resume…)
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss?: () => void; // a tap outside or Back, when it isn't the same as Cancel (default onCancel)
}

export interface DialogButtonProps {
  label: string;
  destructive?: boolean;
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface FolderAddIconProps {
  color: string;
  size?: number;
}

export interface InnerHeaderProps {
  title: string;
  onTitlePress?: () => void; // a ⌄ after the title (the Calendar's Month / Year / Multi-year)
  onBack?: () => void;
  left?: ReactNode; // replaces the ← (e.g. "Cancel" in the routine editor)
  right?: ReactNode;
}

export interface HeaderPillButtonProps {
  label: string;
  disabled?: boolean;
  onPress: () => void;
}

export interface HeaderTextLeftProps {
  label: string;
  onPress: () => void;
}

export interface HeaderTextButtonProps {
  label: string;
  onPress: () => void;
}

export interface NameDialogProps {
  visible: boolean;
  title: string;
  placeholder: string;
  onSave: (name: string) => void;
  onCancel: () => void;
  message?: string; // a line under the title
  keyboardType?: KeyboardTypeOptions; // e.g. decimal-pad for the body weight
  isValid?: (text: string) => boolean; // Save stays grey until true (default: something typed)
  cancelLabel?: string;
  onDismiss?: () => void; // a tap outside or Back, when it isn't the same as Cancel (default onCancel)
}

export interface ReorderListProps {
  items: ReorderItem[];
  onChange: (items: ReorderItem[]) => void;
}

export interface DragHandleProps {
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: () => void;
}

export interface SwipeToDeleteProps {
  onDelete: () => void;
  rowStyle?: ViewStyle | (ViewStyle | false | null | undefined)[];
  children: ReactNode;
}

export interface PillTimeProps {
  workout: ActiveWorkout;
  resting: boolean;
}

export interface TabHeaderProps {
  title: string;
  onTitlePress?: () => void;
  right?: ReactNode;
  divider?: boolean;
}

export interface HeaderIconButtonProps {
  children: ReactNode;
  onPress?: () => void;
}

export interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export interface WheelPickerProps {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  width?: number;
  flex?: number;
}

export interface Piece {
  x: number; // start x
  drift: number; // sideways travel while falling
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  spin: number; // degrees over the fall
}

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  maxLength?: number;
}

export interface FormRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}
