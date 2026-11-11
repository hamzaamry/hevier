import { ALL_GYMS, FROM_START_DAY, GYM_NAME_MAX_LENGTH, NO_GYM, PER_GYM_EQUIPMENT } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { dateOfDayKey, dayKey, dayKeyBefore } from '@/lib/date';
import { fullDate } from '@/lib/format/date';
import { plural } from '@/lib/format/text';
import type { Gym, GymChoice, GymStretch, GymTimeline, YourGym } from '@/types/gym';

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
    const to = next ? dayKeyBefore(next.day) : null;
    return { changeId: c.id, gymId: c.gymId, name: gymName(t, c.gymId), from, to, workouts: count(c.gymId, from, to), current: i === currentIndex };
  });

  const first = t.changes[0];
  if (first.day !== FROM_START_DAY) {
    const to = dayKeyBefore(first.day);
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

// Select Gym's "Your Gyms": every gym, the one trained at most recently first.
export function yourGyms(t: GymTimeline, workouts: { startTime: string; visitGymId: string | null }[]): YourGym[] {
  const last = new Map<string, string>();
  for (const w of workouts) {
    const gymId = workoutGym(t, w.startTime, w.visitGymId);
    if (gymId && (last.get(gymId) ?? '') < w.startTime) last.set(gymId, w.startTime);
  }
  return [...t.gyms.values()]
    .map((g) => ({ gymId: g.id, name: g.name, lastWorkout: last.get(g.id) ?? null }))
    .sort((a, b) => (b.lastWorkout ?? '').localeCompare(a.lastWorkout ?? '') || a.name.localeCompare(b.name));
}

export function sameGymName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function choiceOfName(mine: YourGym[], typed: string): GymChoice {
  const name = typed.trim().slice(0, GYM_NAME_MAX_LENGTH).trim();
  const known = mine.find((g) => sameGymName(g.name, name));
  return known ? { gymId: known.gymId, name: known.name } : { gymId: null, name };
}

// What Save Workout does with the gym picked on its Gym row: nothing when it is
// the gym of the workout's day anyway; the first gym ever named (no question,
// there is no other gym to have come from); else it asks, since it could be a
// move to a new gym or just a visit.
export function gymQuestion(t: GymTimeline, startTime: string, choice: GymChoice | undefined): 'none' | 'ask' | 'firstGym' {
  if (!choice) return 'none';
  const picked = choice.gymId ?? [...t.gyms.values()].find((g) => sameGymName(g.name, choice.name))?.id ?? null;
  if (picked !== null && picked === workoutGym(t, startTime, null)) return 'none';
  return t.changes.length === 0 ? 'firstGym' : 'ask';
}
