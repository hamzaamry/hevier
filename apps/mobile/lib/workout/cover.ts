import type { MediaItem } from '@/types/workout';

// The cover a workout's card shows: the one the user picked, else the first
// photo, else the first video (a video has no picture of its own). Null when
// the workout has no media.
export function coverFor(media: MediaItem[], chosen: string | null): MediaItem | null {
  return media.find((m) => m.file === chosen) ?? media.find((m) => m.kind === 'photo') ?? media[0] ?? null;
}
