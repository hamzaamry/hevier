import type { RadarMuscle } from '@/types/muscles';
import type { FootballRating } from '@/types/cardio';
import type { SetType } from '@/types/workout';
import type { ExerciseType } from '@/types/exercise';
import type { RecordKind } from '@/types/records';
import type { RecoveryState } from '@/types/stats';

// Words shown on screen that come from a list or a map (menus, chips, tabs,
// legends, buttons). Plain text written in a screen stays in that screen.
// First the ones several screens share, then one group per screen or
// component, A to Z. Each group names the file that uses it.

// Shared by several screens.

// Range menus: lib/training/periods.ts PERIODS and constants/profile.ts PROFILE_RANGES.
export const PERIOD_LABELS = {
  last15Days: 'Last 15 days',
  last30Days: 'Last 30 days',
  last3Months: 'Last 3 months',
  last6Months: 'Last 6 months',
  year: 'Year',
  allTime: 'All time',
} as const;

// A set's boxes and their column header: app/log-workout.tsx, app/routine-editor.tsx,
// app/(tabs)/workout/routine/[id].tsx.
export const SET_FIELD_LABELS = {
  weight: 'KG',
  reps: 'REPS',
  km: 'KM',
  time: 'TIME',
};

// The Set Type menu, in order: app/log-workout.tsx, app/routine-editor.tsx.
export const SET_TYPE_LABELS: Record<SetType, string> = {
  warmup: 'Warm Up Set',
  normal: 'Normal Set',
  failure: 'Failure Set',
};

// Chips under the Profile and routine charts: app/(tabs)/profile.tsx,
// app/(tabs)/workout/routine/[id].tsx.
export const CHART_METRIC_LABELS = {
  duration: 'Duration',
  volume: 'Volume',
  reps: 'Reps',
};

// One group per screen or component.

// components/exercise-picker/filterSections.tsx: the muscle filter sheet's sections.
export const MUSCLE_SECTION_LABELS = {
  upperBody: 'Upper Body',
  lowerBody: 'Lower Body',
  other: 'Other',
};

// The exercise picker's list sections (lib/domain/exerciseSearch.ts pickerSections).
export const PICKER_SECTION_LABELS = {
  suggested: 'Suggested Exercises',
  recent: 'Recent Exercises',
  all: 'All Exercises',
};

// app/calendar.tsx: the view menu. The CalendarView type (types/calendar.ts)
// is built from this list.
export const CALENDAR_VIEWS = ['Month', 'Year', 'Multi-year'] as const;

// components/exercise-page/ExercisePageTabs.tsx: the exercise page's tabs.
export const EXERCISE_TAB_LABELS = {
  summary: 'Summary',
  history: 'History',
  howto: 'How to',
};

// app/log-workout.tsx: how hard a football game was.
export const FOOTBALL_RATING_LABELS: Record<FootballRating, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
};

// app/statistics/index.tsx: the Advanced statistics rows.
export const STATISTICS_ROW_LABELS = {
  setCount: {
    title: 'Set count per muscle group',
    subtitle: 'Number of sets logged for each muscle group.',
  },
  distributionChart: {
    title: 'Muscle distribution (Chart)',
    subtitle: 'Compare your current and previous muscle distributions.',
  },
  distributionBody: {
    title: 'Muscle distribution (Body)',
    subtitle: 'Weekly heat map of muscles worked.',
  },
  mainExercises: {
    title: 'Main exercises',
    subtitle: 'List of exercises you do most often.',
  },
  monthlyReport: {
    title: 'Monthly Report',
    subtitle: 'Recap of your monthly workouts and statistics.',
  },
};

// app/workout/[id].tsx: the sets column header, per exercise type.
export const WORKOUT_COLUMN_LABELS: Record<ExerciseType, string> = {
  weight_reps: 'WEIGHT & REPS',
  reps_only: 'REPS',
  duration: 'TIME',
  distance_duration: 'DISTANCE & TIME',
};

// components/body/BodyFigure.tsx: the recovery legend.
export const RECOVERY_LABELS: Record<RecoveryState, string> = {
  ready: 'Likely ready',
  recovering: 'Partly recovered',
  fatigued: 'Heavy recent load',
};

// components/ShareCards.tsx: the record on a PR share card.
export const SHARE_RECORD_LABELS: Record<RecordKind, string> = {
  weight: 'Heaviest Weight',
  oneRm: 'Best One Rep Max',
  volume: 'Best Set Volume',
  reps: 'Most Reps',
  duration: 'Longest Duration',
  distance: 'Longest Distance',
};

// components/ui/TabBar.tsx: the bottom tabs, by route name.
export const TAB_LABELS = {
  index: 'Home',
  workout: 'Workout',
  profile: 'Profile',
};

// hooks/useWorkoutNotification.ts: the notification's buttons, by button id.
export const NOTIFICATION_BUTTON_LABELS = {
  complete: 'Complete Set',
  skip: 'Skip',
  minus15: '-15s',
  plus15: '+15s',
};

// RADAR_MUSCLES (constants/muscles.ts): the muscles around the radar chart.
export const RADAR_MUSCLE_LABELS: Record<RadarMuscle, string> = {
  Chest: 'Chest',
  Shoulders: 'Shoulders',
  Triceps: 'Triceps',
  Lats: 'Lats',
  'Upper Back': 'Upper Back',
  Biceps: 'Biceps',
  Abdominals: 'Abs',
  Quadriceps: 'Quads',
  Hamstrings: 'Hamstrings',
  Glutes: 'Glutes',
  Calves: 'Calves',
};

// lib/stats/exerciseMetrics.ts METRICS: the chips under an exercise's chart.
export const EXERCISE_CHART_LABELS = {
  heaviestWeight: 'Heaviest Weight',
  oneRepMax: 'One Rep Max',
  bestSetVolume: 'Best Set Volume',
  sessionVolume: 'Session Volume',
  mostRepsSet: 'Most Reps (Set)',
  sessionReps: 'Session Reps',
  bestTime: 'Best Time',
  totalTime: 'Total Time',
  bestDistance: 'Best Distance',
  sessionDistance: 'Session Distance',
};

// lib/stats/exerciseMetrics.ts RECORDS: Personal Records under an exercise's chart.
export const EXERCISE_RECORD_LABELS = {
  heaviestWeight: 'Heaviest Weight',
  best1Rm: 'Best 1RM',
  bestSetVolume: 'Best Set Volume',
  bestSessionVolume: 'Best Session Volume',
  bestSet: 'Best Set',
  mostSessionReps: 'Most Session Reps',
  bestTime: 'Best Time',
  bestDistance: 'Best Distance',
  bestSessionDistance: 'Best Session Distance',
};

// lib/stats/records.ts: a record set while logging (PR toast).
export const RECORD_LABELS: Record<RecordKind, string> = {
  weight: 'Best Weight',
  oneRm: 'Best 1RM',
  volume: 'Best Set Volume',
  reps: 'Most Reps',
  duration: 'Longest Duration',
  distance: 'Longest Distance',
};

// Settings → Gym, Change Gym, Select Gym and the Gym row on Save Workout.
export const GYM_LABELS = {
  settingsRow: 'Gym',
  notSet: 'Not set',
  screenTitle: 'Gym',
  currentGym: 'Current gym',
  history: 'History',
  changeGym: 'Change Gym',
  previousGym: 'Previous gym',
  now: 'now',
  footer: 'Machine and cable weights differ from one gym to another, so their records are kept per gym. Free weights count everywhere.',
  rename: 'Rename Gym',
  changeDate: 'Change Date',
  delete: 'Delete Gym Change',
  namePrevious: 'Name This Gym',
  renameTitle: 'Rename Gym',
  addGym: 'Add Gym',
  namePlaceholder: 'Gym name',
  deleteConfirm: 'Delete', // the message is built by deleteMessage() (lib/gym/timeline.ts)
  formDate: 'Date',
  formGym: 'Gym',
  select: 'Select',
  formNote: 'Workouts from this day on count at the new gym. Workouts before it stay at the gym you had then.',
  dateSheet: 'Date',
  done: 'Done',
  dayTaken: "There's already a gym change on this day.",
  pickerTitle: 'Select Gym',
  cancel: 'Cancel',
  search: 'Search gym',
  yourGyms: 'Your Gyms',
  nearYou: 'Near You',
  useLocation: 'Use my location',
  finding: 'Finding gyms near you…',
  noWorkouts: 'No workouts yet',
  denied: "Location is off for Hevier. Search or type the gym's name instead.",
  failed: "Couldn't load gyms nearby. Check your connection, or type the gym's name.",
  locationOff: "Couldn't find where you are. Turn on location, or type the gym's name.",
  empty: "No gyms found within 3 km. Type the gym's name instead.",
  changedGym: 'I Changed Gym',
  justThisWorkout: 'Just This Workout',
  recordsAt: 'At',
  allGyms: 'all gyms',
};
