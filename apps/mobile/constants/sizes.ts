// Every fixed size and position in the app (dp): first the ones several
// screens share, then one group per screen or component, A to Z. Each
// group names the file that uses it.

// Icons (phosphor and the tab bar's own). Near sizes were merged into the
// most-used one; the last three are illustrations rather than icons.
export const ICON_SIZES = {
  xxs: 11,
  xs: 14,
  sm: 17,
  md: 20,
  lg: 22,
  xl: 24, // bottom-sheet rows
  xxl: 26,
  xxxl: 28,
  huge: 30, // tab bar, Statistics rows
  emptyState: 40, // routine editor with no exercises
  illustration: 48, // Save Workout's update-routine sheet
  mediaPlaceholder: 64, // exercise page without a picture
};

// Shared by several screens.
export const SIZES = {
  buttonHeight: 44, // full-width blue buttons
  compactButtonHeight: 40, // Add Set, Add Exercise, outline and filter-bar buttons
  pillHeight: 27.8, // metric pills under charts
  inputHeight: 36.2, // a set's weight / reps box
  setRowHeight: 35.4, // a set row while logging or editing
  tableHeaderHeight: 18, // PREVIOUS / KG / REPS header
  restRowHeight: 24.6, // "Rest Timer: …" row
  notesHeight: 22, // an exercise's notes box
  formRowHeight: 52, // edit-profile fields, sync rows
  settingsRowHeight: 60, // settings rows
  dayCircle: 32, // a day's circle in the calendar strips
  smallButton: 20, // little round × / ⋯ buttons
  avatarLarge: 86, // profile photo on Profile and Edit Profile
  searchHeight: 36, // Add Exercise and Select Gym
};

// app/onboarding.tsx
export const ONBOARDING_SIZES = {
  progressHeight: 4, // the step bars at the top
  inputHeight: 56, // name / body weight box
  choiceHeight: 120, // a Male / Female card
  choiceIcon: 40,
};

// components/ui/ActionBar.tsx
export const ACTION_BAR_SIZES = {
  barHeight: 48.1,
  iconWidth: 48.8,
};

// app/add-exercise.tsx
export const ADD_EXERCISE_SIZES = {
  exerciseThumb: 56,
  filterHeight: 36,
  sectionGapHeight: 16,
  rowHeight: 80,
  badgeTop: -0.7,
  badgeRight: -1.2,
  badgeWidth: 17.6,
  badgeHeight: 17.6,
  infoWidth: 56,
  infoDiscWidth: 19,
  infoDiscHeight: 19,
  blueButtonHeight: 39,
  addButtonLeft: 16,
  addButtonRight: 16,
};

// components/charts/BarChart.tsx
export const BAR_CHART_SIZES = {
  xTickWidth: 60,
  labelLeft: 11, // widest y label's box starts here (its ink ~2 further)
  axisGap: 5.7, // y labels end this far left of the axis
  rightGap: 16, // x axis to the screen edge
  plotHeight: 120,
  barShare: 0.59, // bar width / slot width
  xLabelGap: 5.7,
};

// components/body/BodyFigure.tsx
export const BODY_FIGURE_SIZES = {
  legendWidth: 290,
  swatchWidth: 14,
  swatchHeight: 14,
};

// components/ui/BottomSheet.tsx
export const BOTTOM_SHEET_SIZES = {
  handleWidth: 51.8,
  handleHeight: 3.8,
  rowHeight: 63.6,
  optionHeight: 61.4,
  iconWidth: 56,
};

// app/calendar.tsx
export const CALENDAR_SIZES = {
  summaryHeight: 54,
  weekdaysHeight: 36,
  weekHeight: 54,
  weekLineHeight: 1,
  dayLabelMaxWidth: 56,
  yearMonthWidth: 104.3,
  multiYearMonthsHeight: 22,
  // Year view: three months a row, each a 7-wide grid of 11.8 squares on a 14.9 pitch.
  mini: 11.8,
  miniPitch: 14.9,
};

// components/workout/ClockSheet.tsx
export const CLOCK_SHEET_SIZES = {
  segmentsHeight: 50,
  adjustBottom: 16,
  adjustLeftLeft: 32,
  adjustRightRight: 32,
  buttonHeight: 47,
  ring: 240,
  stroke: 7,
};

// components/ui/ConfirmDialog.tsx
export const CONFIRM_DIALOG_SIZES = {
  buttonHeight: 39.6,
};

// app/cycle.tsx
export const CYCLE_SIZES = {
  rowHeight: 60.2,
  dividerLeft: 16,
  dividerRight: 16,
};

// components/routines/CycleCard.tsx
export const CYCLE_CARD_SIZES = {
  barHeight: 5,
};

// components/workout/DurationSheet.tsx
export const DURATION_SHEET_SIZES = {
  rowHeight: 39.7,
  buttonHeight: 39,
  noFooterHeight: 60,
  pauseBarWidth: 3,
  pauseBarHeight: 13,
};

// app/edit-profile.tsx
export const EDIT_PROFILE_SIZES = {
  labelWidth: 100,
};

// app/exercises/[id].tsx
export const EXERCISE_PAGE_SIZES = {
  tabHeight: 48,
  tabLineHeight: 3,
  clipHeight: 232,
  pauseTop: 12.5,
  pauseRight: 13,
  pauseWidth: 30,
  pauseHeight: 30,
  chartMinHeight: 139.8,
  recordRowHeight: 55,
  stepNumberWidth: 20,
  addButtonLeft: 16,
  addButtonRight: 16,
  addButtonHeight: 47.6,
};

// components/exercises/FilterIcons.tsx
export const FILTER_ICONS_SIZES = {
  disc: 47,
};

// components/exercises/FilterSheet.tsx
export const FILTER_SHEET_SIZES = {
  cardHeight: 67,
};

// components/ui/InnerHeader.tsx
export const INNER_HEADER_SIZES = {
  sideWidth: 112,
  sideHeight: 46.5,
  pillHeight: 36.6,
};

// app/log-workout.tsx
export const LOG_WORKOUT_SIZES = {
  minimizeHeight: 46.5,
  progressTrackHeight: 2.7,
  progressFillHeight: 2.7,
  statWidth: 131,
  setRowHeight: 47.2,
  setColLeft: 16.4,
  setColWidth: 35.4,
  previousColLeft: 51.8,
  previousColWidth: 122,
  middleColLeft: 173.7,
  middleColWidth: 82.7,
  rightColLeft: 264.4,
  rightColWidth: 82.7,
  playLeft: 217.9,
  playTop: 5.7,
  playWidth: 24,
  playHeight: 24,
  wideColLeft: 249.9,
  wideColWidth: 97.2,
  checkColLeft: 360,
  checkColWidth: 35,
  repsLeftChipWidth: 44,
  repsLeftChipHeight: 32,
  addExerciseHeight: 40.4,
  restLineHeight: 4,
  restLineFillHeight: 4,
  restButtonHeight: 38,
  restButtonMinWidth: 54,
  skipMinWidth: 62.8,
};

// components/workout/MediaStrip.tsx
export const MEDIA_STRIP_SIZES = {
  boxHeight: 98,
  removeTop: 5,
  removeRight: 5,
  // The Svg canvas ends up ~2 px shorter than its measured height on Android,
  // so a border hugging the edge loses its bottom line.
  inset: 1.5,
  tile: 96,
};

// components/charts/MuscleBars.tsx
export const MUSCLE_BARS_SIZES = {
  trackHeight: 8,
  barHeight: 8,
};

// components/body/MuscleMapBody.tsx
export const MUSCLE_MAP_BODY_SIZES = {
  crop: { x: 195, y: 60, w: 634, h: 1390 }, // both views' bodies fit in here
};

// components/ui/NameDialog.tsx
export const NAME_DIALOG_SIZES = {
  inputHeight: 52.9,
};

// app/nice-work.tsx
export const NICE_WORK_SIZES = {
  partyRight: 16,
  partyWidth: 46,
  partyHeight: 46,
  dotWidth: 7,
  dotHeight: 7,
  doneHeight: 47.7,
};

// components/charts/PeriodNav.tsx
export const PERIOD_NAV_SIZES = {
  rowHeight: 48,
};

// components/workout/PrToast.tsx
export const PR_TOAST_SIZES = {
  exerciseThumb: 44,
  toastLeft: 32,
  toastRight: 32,
  toastMinHeight: 59.5,
  closeRight: -14,
  closeBottom: -11,
};

// app/(tabs)/profile.tsx
export const PROFILE_TAB_SIZES = {
  statWidth: 107,
  tileHeight: 46.9,
  tileIconWidth: 32,
};

// components/charts/ProgressChart.tsx
export const PROGRESS_CHART_SIZES = {
  xTickWidth: 60,
  left: 58.3, // y axis
  rightGap: 24.4, // last point to the screen edge
  plotHeight: 120,
  labelRight: 47.6, // y labels end here
  xLabelGap: 5.8,
  breakGap: 4, // line to the gym-change marker, each side
};

// components/ui/ReorderList.tsx
export const REORDER_LIST_SIZES = {
  dividerLeft: 16,
  dividerRight: 16,
  handleWidth: 44,
  row: 60.2,
};

// components/routines/RoutineDrag.tsx
export const ROUTINE_DRAG_SIZES = {
  shadowOffsetHeight: 8,
  slotLeft: 16,
  slotRight: 16,
  edge: 100, // px from the list's top / bottom where it scrolls by itself
  maxStep: 18, // px per frame at the very edge
};

// app/routine-editor.tsx
export const ROUTINE_EDITOR_SIZES = {
  whenRowHeight: 44,
  setColLeft: 16.4,
  setColWidth: 35.4,
  previousColLeft: 51.8,
  previousColWidth: 169.4,
  middleColLeft: 221.2,
  rightColLeft: 312.3,
  // Columns (dp from the screen edge): set box 16.4–51.8, PREVIOUS centred at
  // 136.3, KG 221.2–303.9, REPS 312.3–395.0.
  box: 82.7,
};

// components/routines/RoutineList.tsx
export const ROUTINE_LIST_SIZES = {
  moreWidth: 17.9,
  dotWidth: 3.4,
  dotHeight: 3.4,
  folderRowHeight: 54,
  cardHeight: 156.2,
  startButtonLeft: 16,
  startButtonRight: 16,
  startButtonBottom: 15.6,
  startButtonHeight: 41,
  addBoxHeight: 59.8,
};

// app/(tabs)/workout/routine/[id].tsx
export const ROUTINE_PAGE_SIZES = {
  valueColumnWidth: 80,
  firstColumnLeft: 67, // value columns sit inside the 16 dp padding
  secondColumnLeft: 174,
  startHeight: 40.4,
  chartMinHeight: 139.8,
  setRowHeight: 44,
  setCellWidth: 38.8,
};

// app/gym.tsx, components/gym/ (the timeline, the date sheet)
export const GYM_SIZES = {
  railColumn: 22, // the column the timeline's line and dots sit in
  rail: 2, // the line
  dot: 12,
  menuHit: 44, // the ⋯ button
  dayWheel: 64,
  yearWheel: 96,
};

// app/save-workout.tsx
export const SAVE_WORKOUT_SIZES = {
  statWidth: 126,
  descriptionMinHeight: 26,
  rowHeight: 60.6,
  updateButtonHeight: 47,
};

// app/select-gym.tsx, components/gym/GymListRow.tsx
export const SELECT_GYM_SIZES = {
  avatar: 46,
  rowHeight: 66,
};

// app/settings.tsx
export const SETTINGS_SIZES = {
  sectionHeight: 53,
};

// components/ShareCards.tsx
export const SHARE_CARDS_SIZES = {
  radarLabelWidth: 100,
  weekCellHeight: 26,
  tickWidth: 24,
  tickHeight: 24,
  noTickWidth: 14,
  noTickHeight: 14,
  weekCell: 31,
  radarHalfWedge: 22, // degrees
};

// app/statistics/index.tsx
export const STATISTICS_SIZES = {
  dayWidth: 46.5,
  dayHeight: 59,
  todayBottom: 2,
  todayWidth: 4,
  todayHeight: 4,
  cardioTrackHeight: 6,
  cardioFillHeight: 6,
  sectionHeight: 38,
  rowMinHeight: 82,
  rowIconWidth: 32,
};

// app/statistics/distribution.tsx
export const STATISTICS_DISTRIBUTION_SIZES = {
  rangeHeight: 36.2,
  helpWidth: 17.5,
  helpHeight: 17.5,
  dotWidth: 8,
  dotHeight: 8,
  dashWidth: 5,
  dashHeight: 2,
  cardHeight: 97.5,
  splitHeight: 6,
  labelGap: 12,
  // Room around the radar for its labels: on the sides for "Hamstrings" (about
  // 74 wide at FONT_SIZES.small) plus labelGap, above and below for one line.
  labelRoomSide: 92,
  labelRoomEnds: 26,
};

// app/statistics/exercises.tsx
export const STATISTICS_EXERCISES_SIZES = {
  rowHeight: 64,
};

// app/statistics/monthly.tsx
export const STATISTICS_MONTHLY_SIZES = {
  dayWidth: 34,
  dayHeight: 34,
  exerciseHeight: 56,
};

// components/ui/SwipeToDelete.tsx
export const SWIPE_TO_DELETE_SIZES = {
  open: 120,
};

// app/sync-scan.tsx
export const SYNC_SCAN_SIZES = {
  frameWidth: 240,
  frameHeight: 240,
  hintBottom: 48,
  hintLeft: 16,
  hintRight: 16,
};

// components/ui/WorkoutPill.tsx
export const WORKOUT_PILL_SIZES = {
  workoutPillLeft: 12.4,
  workoutPillRight: 12.4,
  workoutPillHeight: 70.9,
  pillButtonWidth: 46.6,
  pillButtonHeight: 46.6,
  pillDotWidth: 8.3,
  pillDotHeight: 8.3,
};

// components/ui/TabHeader.tsx
export const TAB_HEADER_SIZES = {
  rowHeight: 35,
  chevronWidth: 22,
  chevronHeight: 22,
  iconButtonWidth: 40,
  iconButtonHeight: 40,
};

// components/ui/Toggle.tsx
export const TOGGLE_SIZES = {
  trackWidth: 47.6,
  trackHeight: 27.8,
  knobWidth: 23,
  knobHeight: 23,
};

// components/ui/WheelPicker.tsx
export const WHEEL_PICKER_SIZES = {
  wheelRow: 48,
};

// components/workout/WorkoutCard.tsx
export const WORKOUT_CARD_SIZES = {
  avatar: 44,
  exerciseThumb: 50,
  statMinWidth: 82.3,
  timeStatMinWidth: 78.5,
  exerciseHeight: 50,
  bandHeight: 16,
};

// app/workout/[id].tsx
export const WORKOUT_PAGE_SIZES = {
  splitBarHeight: 20,
  splitBarMinWidth: 4,
  setCellWidth: 38.8,
  setRowHeight: 44,
};

// app/workout-settings.tsx
export const WORKOUT_SETTINGS_SIZES = {
  toggleTopMinHeight: 32,
};

// components/set-table/SetInputs.tsx: the PREVIOUS text and the boxes, nudged to line up.
export const SET_TABLE_SIZES = {
  previousTop: 7,
  inputTop: -0.4,
};

// components/set-table/RestTimerSheet.tsx
export const REST_TIMER_SHEET_SIZES = {
  listMaxHeight: 420,
};

// app/(tabs)/workout/index.tsx
export const WORKOUT_TAB_SIZES = {
  routinesRowHeight: 55.9,
};

// components/workout/ReorderExercises.tsx
export const REORDER_EXERCISES_SIZES = {
  exerciseThumb: 40,
};
