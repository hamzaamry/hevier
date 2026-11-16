import { NOTES_COLLAPSED_LINES, NOTES_COLLAPSED_MAX_CHARS } from '@/constants/ui';

// Whether an exercise's note is long enough to be folded in Log Workout. A
// count of newlines and characters, not a measure of the screen: the same
// answer on every phone, and no layout pass before the first paint.
export function isLongNote(notes: string): boolean {
  return notes.length > NOTES_COLLAPSED_MAX_CHARS || notes.split('\n').length > NOTES_COLLAPSED_LINES;
}
