// Design tokens (measured on a 1080x2340 / density 420 phone = 2.625 px per
// dp). Every screen styles itself from these so the whole app stays consistent.

export const COLORS = {
  background: '#000000',
  black: '#000000', // shadows, see-through overlays (with withAlpha)
  white: '#FFFFFF', // white shapes that aren't text: toggle knob, picture backgrounds, icon strokes
  surface: '#1C1C1E', // cards, tab bar, inner-page headers, icon circles, the running-workout pill
  raised: '#2C2C2E', // things that sit on a surface: PR toast, buttons inside the workout pill
  primary: '#008CFF', // buttons, active tab, links
  tabIndicator: '#00192F', // pill behind the active tab icon
  text: '#FFFFFF',
  textSecondary: '#84898F', // section labels, routine exercise lists, sheet grab bar, last period on charts
  iconMuted: '#ACAFB4', // the small "i" info glyph
  dashedBorder: '#E5E6E8', // "+ Add new routine" box
  danger: '#E34B36', // destructive actions, failure sets (F), discard, "fatigued"
  warmup: '#F5A623', // warm-up sets (W)
  caution: '#F5A623', // warnings, "partly recovered"
  success: '#34C759', // a rise in a stat, "likely ready", confetti
  done: '#56BE23', // a ticked set, the running-workout dot
  doneRow: '#163108', // background of a ticked set row
  sheet: '#161618', // bottom sheet background
  separator: '#2C2C2E', // lines between rows, under a scrolled header; dialog buttons; progress track
  track: '#3A3A3C', // empty part of a bar, radar web, chart axes, small grey buttons on a card
  selectedRow: '#061727', // a picked row in the exercise picker
  selectedChip: '#2D4257', // a picked filter
  mediaButton: 'rgba(120, 120, 128, 0.6)', // round button over a video
  overlay: 'rgba(0, 0, 0, 0.5)', // behind a bottom sheet
  dialogOverlay: 'rgba(0, 0, 0, 0.7)', // behind a centred dialog
  chartGrid: '#242426', // horizontal grid lines in charts
  streak: '#FF5C21', // the Calendar's week-streak flame
};

// `color` (a #RRGGBB token) at `alpha` opacity, e.g. withAlpha(COLORS.primary, 0.35).
export function withAlpha(color: string, alpha: number): string {
  const n = parseInt(color.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Weekly-sets zones on the body map and the radar, lightest = fewest sets.
// Clearly different blues; the top one vivid rather than near-navy.
export const ZONE_COLORS = ['#B8DCFF', '#4DA8FF', '#0A66FF'] as const;

// Body map: a muscle with nothing to show, and a workout's main / helper muscles.
export const BODY_MAP_COLORS = {
  base: '#C8C8C8',
  primaryMuscle: '#2F8CFF',
  secondaryMuscle: '#8CC4FF',
};

// Personal-record medal and toast.
export const PR_COLORS = {
  gold: '#E9A90B', // the record line in the toast
  medal: '#F6D000',
  ribbon: '#F1B314',
  ink: '#1A1A1A', // the number on the medal
};

// Equipment filter icons: dark glyphs on a light disc.
export const FILTER_ICON_COLORS = {
  ink: '#4A4B50',
  body: '#C3C6CC',
  disc: '#F3F4F8',
};

// Share cards (Nice Work): a navy card with faint coloured stripes.
export const SHARE_COLORS = {
  cardBg: '#000A1E',
  cardBorder: '#1A2235',
  streakStripe: '#2A1218',
  prStripe: '#2A2711',
  weekBg: '#0D1A33',
  radarAxis: '#2A3550',
  radarFill: '#0A3470',
};

export const CONFETTI_COLORS = [COLORS.primary, '#FFC700', COLORS.danger, COLORS.success, '#AF52DE', COLORS.white];

// The app's typeface, Figtree, in the four weights it ships with.
export const FONTS = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  bold: 'Figtree_700Bold',
};

// Text sizes, smallest to largest.
export const FONT_SIZES = {
  micro: 9.5, // day letters in the Calendar's year view
  tick: 10, // chart axis numbers
  mini: 11, // tab bar labels, "Coming soon"
  xs: 12,
  caption: 13, // table headers, stat labels
  small: 14,
  callout: 15,
  body: 16, // most text
  row: 17, // list rows, settings rows
  title: 18.5, // exercise names, section and card titles
  heading: 20,
  headline: 22,
  display: 24, // tab titles ("Home", "Workout"), big numbers
  largeTitle: 26, // the Nice Work title
  timer: 29, // the rest timer's digits in Log Workout
  hero: 46, // big numbers on the share cards
  clock: 64, // the stopwatch / timer sheet
  huge: 76, // the biggest share-card number
};

// Line heights for text that wraps, smallest to largest.
export const LINE_HEIGHTS = {
  tight: 14,
  compact: 18,
  snug: 20,
  normal: 22,
  relaxed: 24,
  loose: 26,
  hero: 56,
  huge: 84,
};

const text = (fontFamily: string, fontSize: number) => ({ fontFamily, fontSize, color: COLORS.text });

// Text styles: a weight and a size, white by default. Change the colour or
// add a line height next to it: { ...TYPE.body, color: COLORS.textSecondary }.
export const TYPE = {
  micro: text(FONTS.regular, FONT_SIZES.micro),
  tick: text(FONTS.regular, FONT_SIZES.tick),
  mini: text(FONTS.regular, FONT_SIZES.mini),
  miniMedium: text(FONTS.medium, FONT_SIZES.mini),
  xs: text(FONTS.regular, FONT_SIZES.xs),
  xsMedium: text(FONTS.medium, FONT_SIZES.xs),
  xsSemibold: text(FONTS.semibold, FONT_SIZES.xs),
  xsBold: text(FONTS.bold, FONT_SIZES.xs),
  caption: text(FONTS.regular, FONT_SIZES.caption),
  captionMedium: text(FONTS.medium, FONT_SIZES.caption),
  small: text(FONTS.regular, FONT_SIZES.small),
  smallMedium: text(FONTS.medium, FONT_SIZES.small),
  callout: text(FONTS.regular, FONT_SIZES.callout),
  calloutMedium: text(FONTS.medium, FONT_SIZES.callout),
  calloutSemibold: text(FONTS.semibold, FONT_SIZES.callout),
  body: text(FONTS.regular, FONT_SIZES.body),
  bodyMedium: text(FONTS.medium, FONT_SIZES.body), // button labels
  bodySemibold: text(FONTS.semibold, FONT_SIZES.body),
  row: text(FONTS.regular, FONT_SIZES.row),
  rowMedium: text(FONTS.medium, FONT_SIZES.row),
  rowSemibold: text(FONTS.semibold, FONT_SIZES.row),
  title: text(FONTS.regular, FONT_SIZES.title),
  titleMedium: text(FONTS.medium, FONT_SIZES.title), // exercise names
  titleSemibold: text(FONTS.semibold, FONT_SIZES.title), // section and card titles
  titleBold: text(FONTS.bold, FONT_SIZES.title),
  heading: text(FONTS.regular, FONT_SIZES.heading),
  headingSemibold: text(FONTS.semibold, FONT_SIZES.heading),
  headingBold: text(FONTS.bold, FONT_SIZES.heading),
  headlineSemibold: text(FONTS.semibold, FONT_SIZES.headline),
  headlineBold: text(FONTS.bold, FONT_SIZES.headline),
  displaySemibold: text(FONTS.semibold, FONT_SIZES.display), // tab titles
  largeTitleBold: text(FONTS.bold, FONT_SIZES.largeTitle),
  timerMedium: text(FONTS.medium, FONT_SIZES.timer),
  heroBold: text(FONTS.bold, FONT_SIZES.hero),
  clock: text(FONTS.regular, FONT_SIZES.clock),
  hugeBold: text(FONTS.bold, FONT_SIZES.huge),
};

// Run readiness (components/run/): one colour per verdict, hardest to easiest to read.
export const RUN_COLORS = {
  quality: COLORS.success,
  easy: COLORS.primary,
  strength_only: COLORS.caution,
  rest: COLORS.iconMuted,
};

// Statistics → Muscle distribution (components/stats/).
export const DISTRIBUTION_COLORS = {
  previous: COLORS.textSecondary, // last period's dashed outline
  up: COLORS.success, // a rise on a card
  push: COLORS.primary,
  pull: ZONE_COLORS[0], // the pale zone blue: clearly apart from push
  warn: COLORS.caution, // the push / pull warning
};
