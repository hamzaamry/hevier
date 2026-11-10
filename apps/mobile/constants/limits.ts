// How much is shown or allowed: list lengths, label counts and picker ranges.
// One group per screen or component, A to Z. Each group names the file that
// uses it. Training rules (rest choices, recent exercises, media per pick)
// live in constants/training.ts.

// components/charts/BarChart.tsx
export const BAR_CHART_LIMITS = {
  maxXLabels: 6, // x labels under the bars at most
};

// lib/clock.ts
export const CLOCK_LIMITS = {
  minTimerSeconds: 15, // -15s stops here when the timer isn't running
};

// components/ui/Confetti.tsx
export const CONFETTI_LIMITS = {
  pieces: 90, // confetti pieces per burst
};

// components/workout/DurationSheet.tsx
export const DURATION_SHEET_LIMITS = {
  maxMinutes: 600, // longest duration on the wheel
  daysBack: 365, // how far back the start-time wheel goes (at least)
};

// app/log-workout.tsx
export const LOG_WORKOUT_LIMITS = {
  repsLeftChoices: [0, 1, 2, 3, 4], // 4 = "4+"
};

// app/statistics/monthly.tsx
export const MONTHLY_REPORT_LIMITS = {
  shownMuscles: 6, // "Sets per muscle" bars
};

// components/charts/ProgressChart.tsx
export const PROGRESS_CHART_LIMITS = {
  maxXLabels: 8, // x labels under the line at most
};

// Points from another gym than the current one (exercise page of a machine).
export const CHART_FADED_OPACITY = 0.35;

// components/ShareCards.tsx
export const SHARE_CARDS_LIMITS = {
  summaryExercises: 5, // summary card, then "…and N more exercises"
  exercisesCardExercises: 7, // exercises card, then "…and N more exercises"
};

// components/workout/WorkoutCard.tsx
export const WORKOUT_CARD_LIMITS = {
  shownExercises: 3, // then "See N more exercises"
};

// app/workout/[id].tsx
export const WORKOUT_PAGE_LIMITS = {
  shownSplitParts: 3, // Muscle Split: top body parts, then "Show N more"
};

// How many rows a long list draws at first, per batch while scrolling, and how
// many screens' worth it keeps around (FlatList initialNumToRender /
// maxToRenderPerBatch / windowSize). Tuned per list; spread onto the list.
export const LIST_RENDERING = {
  // Home feed and Profile: cards built a few at a time after the first draw, not 10 at once.
  feed: { initialNumToRender: 4, maxToRenderPerBatch: 3, windowSize: 7 },
  // Calendar months: built 2 at a time off screen; the default 10 at once froze the screen ~0.6 s.
  calendarMonths: { initialNumToRender: 3, maxToRenderPerBatch: 2, windowSize: 9 },
  calendarYears: { initialNumToRender: 2, windowSize: 5 },
  calendarMultiYear: { initialNumToRender: 4, windowSize: 5 },
  // Nice Work share cards: one drawn at first (the confetti starts with it), the next ones as you swipe.
  shareCards: { initialNumToRender: 1, windowSize: 3 },
  // Scroll wheels: three rows show; a few more cover the first fling.
  wheelPicker: { initialNumToRender: 7, windowSize: 5 },
  exercisePicker: { initialNumToRender: 12, windowSize: 11 },
};

