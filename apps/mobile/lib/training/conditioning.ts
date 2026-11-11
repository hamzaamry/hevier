import { startMsOf } from './effort';
import { DAYS_PER_WEEK, MS_PER_DAY, SECONDS_PER_MINUTE } from '@/constants/time';
import { CARDIO_WEEKS_LOOKBACK, MODERATE_CARDIO_SHARE, WEEKLY_CARDIO_TARGET_MIN } from '@/constants/training';
import { FOOTBALL } from '@/constants/football';
import { RUN, RUN_DEFAULT_RPE, RUN_HARD_MIN_RPE } from '@/constants/run';
import { startOfWeek } from '@/lib/date';
import type { Conditioning, StatSet } from '@/types/stats';

// The Conditioning card: what football and
// cardio give, next to what they cost in Recovery. WHO 2020 asks adults for
// 75–150 min of vigorous activity a week, or twice that moderate. Football is
// vigorous (small-sided games run at ~80–85% of max heart rate); a run is
// vigorous when it felt hard (RPE 7+), else moderate; other Cardio exercises
// count as moderate, so half. Shown only up to "met": no
// more-is-better, the app manages fatigue rather than pushing volume.

// Vigorous-equivalent minutes a set adds; 0 for lifting and Warm Up.
export function cardioMinutes(s: StatSet): number {
  if (s.name === FOOTBALL) return (s.seconds || s.durationSeconds) / SECONDS_PER_MINUTE;
  if (s.name === RUN) {
    const share = (s.rpe ?? RUN_DEFAULT_RPE) >= RUN_HARD_MIN_RPE ? 1 : MODERATE_CARDIO_SHARE;
    return ((s.seconds ?? 0) / SECONDS_PER_MINUTE) * share;
  }
  if (s.primary === 'Cardio') return ((s.seconds ?? 0) / SECONDS_PER_MINUTE) * MODERATE_CARDIO_SHARE;
  return 0;
}

export function conditioning(sets: StatSet[], now = new Date()): Conditioning {
  const week = startOfWeek(now).getTime();
  const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const perWeek = new Map<number, number>();
  const games = new Set<string>();
  for (const s of sets) {
    const t = startMsOf(s);
    if (t > now.getTime()) continue;
    const minutes = cardioMinutes(s);
    if (minutes > 0) {
      const start = startOfWeek(new Date(t)).getTime();
      perWeek.set(start, (perWeek.get(start) ?? 0) + minutes);
    }
    if (s.name === FOOTBALL && t >= month) games.add(s.workoutId);
  }
  let metWeeks = 0;
  for (let i = 1; i <= CARDIO_WEEKS_LOOKBACK; i++) {
    // Week starts by calendar, not 7 × 24 h, so a clock change can't skip one.
    const start = startOfWeek(new Date(week - i * DAYS_PER_WEEK * MS_PER_DAY + MS_PER_DAY / 2)).getTime();
    if ((perWeek.get(start) ?? 0) >= WEEKLY_CARDIO_TARGET_MIN) metWeeks++;
  }
  return { thisWeek: Math.round(perWeek.get(week) ?? 0), metWeeks, gamesThisMonth: games.size };
}
