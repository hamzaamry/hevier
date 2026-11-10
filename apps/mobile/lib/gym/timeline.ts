import { ALL_GYMS, FROM_START_DAY, NO_GYM, PER_GYM_EQUIPMENT } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { dateOfDayKey, dayKey } from '@/lib/date';
import { fullDate } from '@/lib/format/date';
import { plural } from '@/lib/format/text';
import type { Gym, GymStretch, GymTimeline } from '@/types/gym';

// Which gym a workout was at, from the days the user changed gym. Days are
// local calendar days ('YYYY-MM-DD', compared as text).

// Only machines and cables are per gym; free weights, Smith machines and cardio
// machines feel the same everywhere.
export function isPerGym(equipment: string | null): boolean {
  return (PER_GYM_EQUIPMENT as readonly (string | null)[]).includes(equipment);
}

// The gym of the latest change on or before the day; null before any change.
export function gymOnDay(t: GymTimeline, day: string): string | null {
  let gymId: string | null = null;
  for (const change of t.changes) {
    if (change.day > day) break;
    gymId = change.gymId;
  }
  return gymId;
}

// A one-off visit wins over the timeline.
export function workoutGym(t: GymTimeline, startTime: string, visitGymId: string | null): string | null {
  return visitGymId ?? gymOnDay(t, dayKey(new Date(startTime)));
}

// What a set's records are kept under: nothing for exercises that count at every gym.
export function recordKey(t: GymTimeline, equipment: string | null, startTime: string, visitGymId: string | null): string {
  if (!isPerGym(equipment)) return ALL_GYMS;
  return workoutGym(t, startTime, visitGymId) ?? NO_GYM;
}

export function currentGym(t: GymTimeline, now: Date): Gym | null {
  const id = gymOnDay(t, dayKey(now));
  return (id && t.gyms.get(id)) || null;
}

export function gymName(t: GymTimeline, gymId: string | null): string {
  return (gymId && t.gyms.get(gymId)?.name) || GYM_LABELS.previousGym;
}

function dayBefore(day: string): string {
  const d = dateOfDayKey(day);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

// The Gym screen's history, newest first. The workouts before the first change
// are the unnamed Previous gym; it is listed only when there are some.
export function gymStretches(
  t: GymTimeline,
  workouts: { startTime: string; visitGymId: string | null }[],
  now: Date,
): GymStretch[] {
  if (t.changes.length === 0) return [];
  const placed = workouts.map((w) => ({ day: dayKey(new Date(w.startTime)), gymId: workoutGym(t, w.startTime, w.visitGymId) }));
  const count = (gymId: string | null, from: string | null, to: string | null) =>
    placed.filter((w) => w.gymId === gymId && (from === null || w.day >= from) && (to === null || w.day <= to)).length;
  const today = dayKey(now);
  const currentIndex = t.changes.reduce((last, c, i) => (c.day <= today ? i : last), -1);

  const stretches: GymStretch[] = t.changes.map((c, i) => {
    const from = c.day === FROM_START_DAY ? null : c.day;
    const next = t.changes[i + 1];
    const to = next ? dayBefore(next.day) : null;
    return { changeId: c.id, gymId: c.gymId, name: gymName(t, c.gymId), from, to, workouts: count(c.gymId, from, to), current: i === currentIndex };
  });

  const first = t.changes[0];
  if (first.day !== FROM_START_DAY) {
    const to = dayBefore(first.day);
    const earlier = count(null, null, to);
    if (earlier > 0) stretches.unshift({ changeId: null, gymId: null, name: GYM_LABELS.previousGym, from: null, to, workouts: earlier, current: false });
  }
  return stretches.reverse();
}

// "Oct 30, 2026 – now · 4 workouts"
export function stretchLabel(s: GymStretch): string {
  const count = `${s.workouts} ${plural(s.workouts, 'workout')}`;
  const from = s.from && fullDate(dateOfDayKey(s.from));
  const to = s.to && fullDate(dateOfDayKey(s.to));
  if (from && to) return `${from} – ${to} · ${count}`;
  if (from) return `${from} – ${GYM_LABELS.now} · ${count}`;
  if (to) return `Until ${to} · ${count}`;
  return count;
}

export function deleteMessage(s: GymStretch, previousName: string): string {
  const from = s.from ? fullDate(dateOfDayKey(s.from)) : '';
  return `Delete this gym change? Workouts from ${from} count at ${previousName} again.`;
}
