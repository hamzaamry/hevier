import { describe, expect, it } from 'vitest';

import { coverFor } from './cover';
import type { MediaItem } from '@/types/workout';

const photo = (file: string): MediaItem => ({ file, kind: 'photo' });
const video = (file: string): MediaItem => ({ file, kind: 'video' });

describe('coverFor', () => {
  it('is null when there is no media', () => {
    expect(coverFor([], null)).toBeNull();
  });

  it('uses the chosen file, whatever its kind or place', () => {
    const media = [photo('a.jpg'), video('b.mp4'), photo('c.jpg')];
    expect(coverFor(media, 'b.mp4')).toEqual(video('b.mp4'));
    expect(coverFor(media, 'c.jpg')).toEqual(photo('c.jpg'));
  });

  it('ignores a chosen file that is no longer there', () => {
    expect(coverFor([photo('a.jpg')], 'gone.jpg')).toEqual(photo('a.jpg'));
  });

  it('falls back to the first photo, not the first item', () => {
    const media = [video('a.mp4'), photo('b.jpg'), photo('c.jpg')];
    expect(coverFor(media, null)).toEqual(photo('b.jpg'));
  });

  it('uses the first video when there is no photo', () => {
    expect(coverFor([video('a.mp4'), video('b.mp4')], null)).toEqual(video('a.mp4'));
  });
});
