import { describe, expect, it } from 'vitest';

import { dayKey } from '@/lib/date';
import { autonomicStrain } from './autonomic';
import type { WearableDay, WearableSource } from '@/types/run';

const NOW = new Date(2026, 10, 10, 6, 30).getTime();

// `baseline` ln-HRV values alternate 4.0 ± 0.1 (sd about 0.1) over the 28 days before the last week.
// The last week is `recent` (ln HRV) on its first `recentDays` days; resting rate is 55 bpm, `recentHr` the last 3 days.
function days(source: WearableSource, recent: number, recentDays: number, recentHr: number): WearableDay[] {
  return Array.from({ length: 35 }, (_, i) => {
    const hasHrv = i >= 7 || i < recentDays;
    return {
      date: dayKey(new Date(2026, 10, 10 - i)),
      hrv: hasHrv ? Math.exp(i < 7 ? recent : 4 + (i % 2 ? 0.1 : -0.1)) : undefined,
      restingHr: i < 3 ? recentHr : 55,
      source,
    };
  });
}

describe('autonomicStrain', () => {
  it('needs both a low variability week and a resting rate 3 bpm up', () => {
    expect(autonomicStrain(days('healthkit', 3.94, 7, 58), NOW)).toBe(true);
    expect(autonomicStrain(days('healthkit', 3.94, 7, 57), NOW)).toBe(false);
    expect(autonomicStrain(days('healthkit', 3.99, 7, 58), NOW)).toBe(false);
  });

  it('needs three days of variability in the last week', () => {
    expect(autonomicStrain(days('healthkit', 3.94, 2, 58), NOW)).toBe(false);
    expect(autonomicStrain(days('healthkit', 3.94, 3, 58), NOW)).toBe(true);
  });

  it('never mixes sources: a baseline from one and a low week from the other is no strain', () => {
    const baseline = days('healthkit', 4, 7, 55).filter((d) => d.date < dayKey(new Date(2026, 10, 4)));
    const lowWeek = days('health_connect', 3.94, 7, 58).filter((d) => d.date >= dayKey(new Date(2026, 10, 4)));
    expect(autonomicStrain([...baseline, ...lowWeek], NOW)).toBe(false);
  });
});
