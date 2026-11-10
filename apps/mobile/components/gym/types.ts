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
