// The kinds of the shared Button and Stat (components/ui/).
export const BUTTON_VARIANTS = ['primary', 'secondary', 'neutral', 'outline'] as const;

export const BUTTON_SIZES = ['normal', 'compact'] as const;

// How see-through a button is while pressed.
export const PRESSED_OPACITY = 0.7;

// How see-through a button is while it can't be tapped.
export const DISABLED_OPACITY = 0.4;

// Text sizes of a Stat (label above a value).
export const STAT_SIZES = ['small', 'medium', 'large'] as const;

// Where a set table's columns sit (components/set-table/columns.ts).
export const SET_TABLE_LAYOUTS = ['log', 'editor'] as const;

// The faint stripes in a share card's corner (components/share-cards/).
export const SHARE_CARD_STRIPES = ['streak', 'pr'] as const;

// An exercise's note in Log Workout shows this many lines until "Show more" is
// tapped; a note over either limit counts as long (lib/domain/exerciseNotes.ts).
export const NOTES_COLLAPSED_LINES = 3;
export const NOTES_COLLAPSED_MAX_CHARS = 140;

// The Clock sheet's two modes (components/workout/ClockSheet.tsx).
export const CLOCK_MODES = ['timer', 'stopwatch'] as const;
