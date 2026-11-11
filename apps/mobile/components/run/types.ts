import type { CheckIn, CheckInChange, Readiness, RunSettings } from '@/types/run';

// Props of the pieces of the run screens in components/run/.

export interface ReadinessCardProps {
  readiness: Readiness;
  now: Date;
}

export interface EffortPickerProps {
  value: number | null;
  onChange: (rpe: number | null) => void;
}

export interface StepperProps {
  label: string;
  minusLabel: string; // what a screen reader says for − and +
  plusLabel: string;
  onMinus: () => void;
  onPlus: () => void;
}

export interface ForecastStripProps {
  days: Readiness[];
}

export interface CheckInRowProps {
  checkIn: CheckIn | null;
  // What the check-in is for: "today" or "tomorrow".
  when: string;
  onChange: (change: CheckInChange) => void;
}

// The small card on Statistics: the call in one line, opens the run screen. Until the
// note on the run screen has been read it shows no call.
export interface RunTodayCardProps {
  readiness: Readiness;
  now: Date;
  noteRead: boolean;
  onOpen: () => void;
}

export interface DisclaimerCardProps {
  onAccept: () => void;
}

export interface RunSettingsRowsProps {
  settings: RunSettings;
  on: boolean; // the feature shows: the choice, or (not yet chosen) whether a run was logged
  onChange: (patch: Partial<RunSettings>) => void;
}
