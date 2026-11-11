import { DAYS_PER_WEEK, MS_PER_DAY, MS_PER_SECOND } from '@/constants/time';

// Calendar maths in local time. Days are counted from calendar dates, never by
// 24 h steps, so a clock change (a 23 or 25 hour day) doesn't shift anything.

// "2026-10-14", the local calendar day.
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Local midnight at the start of d's day.
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// The same clock time `days` calendar days from d (seconds dropped), so a
// clock change doesn't move it.
export function shiftDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());
}

// Weeks start on Monday.
export function startOfWeek(d: Date): Date {
  const start = startOfDay(d);
  start.setDate(start.getDate() - ((start.getDay() + 6) % DAYS_PER_WEEK));
  return start;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Whole days between the midnights of two times; rounded, as a day across a
// clock change is 23 or 25 hours long.
export function daysBetween(from: number, to: number): number {
  return Math.round((startOfDay(new Date(to)).getTime() - startOfDay(new Date(from)).getTime()) / MS_PER_DAY);
}

// Weeks in a period, from its whole days: a period with a clock change in it
// is an hour off 7 × 24 h a week.
export function weeksBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) / DAYS_PER_WEEK;
}

// Whole seconds left until endsAt (rounded up), never negative.
export function secondsUntil(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / MS_PER_SECOND));
}

// Whole seconds since startedAt (rounded down, so a stopwatch starts at 0), never negative.
export function secondsSince(startedAt: number, now: number): number {
  return Math.max(0, Math.floor((now - startedAt) / MS_PER_SECOND));
}

// The local midnight of a dayKey ("2026-10-14").
export function dateOfDayKey(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayKeyBefore(day: string): string {
  const d = dateOfDayKey(day);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

// The number of days in a month (monthIndex 0 = January).
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Date wheels that stop at today.
export function monthsUpToToday(year: number, today: Date): number {
  return year === today.getFullYear() ? today.getMonth() + 1 : 12;
}

export function daysUpToToday(year: number, monthIndex: number, today: Date): number {
  return year === today.getFullYear() && monthIndex === today.getMonth() ? today.getDate() : daysInMonth(year, monthIndex);
}

// The dayKey of a day picked on scroll wheels: the day is cut back to the
// month's length, and a day after today becomes today.
export function clampedDayKey(year: number, monthIndex: number, day: number, today: Date): string {
  const picked = dayKey(new Date(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex))));
  const now = dayKey(today);
  return picked > now ? now : picked;
}
