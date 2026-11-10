import type { ReactNode } from 'react';
import type { GymStretch } from '@/types/gym';

// Props of the gym screens' pieces in components/gym/.

// The picture of a Select Gym row: a gym, "Use my location" or "Add …".
export type GymListIcon = 'gym' | 'location' | 'add';

export interface GymListRowProps {
  title: string;
  // Grey line under the title (the street, or "Last workout Oct 29").
  subtitle?: string;
  // Grey text on the right (the distance).
  right?: string;
  icon: GymListIcon;
  onPress: () => void;
}

// A row of Change Gym (and Save Workout's Gym row): icon, label, grey value, ›.
export interface GymFormRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}

export interface DaySheetProps {
  visible: boolean;
  // The day shown when it opens, 'YYYY-MM-DD'.
  day: string;
  // Days that already have a gym change: Done stays grey on them.
  takenDays: string[];
  onDone: (day: string) => void;
  onDismiss: () => void;
}

export interface GymTimelineRowProps {
  stretch: GymStretch;
  first: boolean;
  last: boolean;
  onMenu: (stretch: GymStretch) => void;
}
