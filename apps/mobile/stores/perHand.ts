import { useSyncExternalStore } from 'react';

import { getPerHand, savePerHand } from '@/db/perHand/perHand';

// Which exercises show dumbbell weight per hand (db/perHand/perHand.ts), shared by
// Log Workout, the routine editor and the set lists: read once from the
// database, then kept here so a switch redraws every screen showing it.

let eligible = new Set<string>();
let on = new Set<string>();
let loaded = false;
const listeners = new Set<() => void>();

function changed() {
  for (const l of listeners) l();
}

function load() {
  getPerHand()
    .then((p) => {
      eligible = new Set(p.eligible);
      on = new Set(p.on);
      changed();
    })
    .catch((e) => console.warn('[perHand] load failed', e));
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!loaded) {
    loaded = true;
    load();
  }
  return () => {
    listeners.delete(l);
  };
}

// null: no switch for this exercise (not two dumbbells).
export function usePerHand(exerciseId: string): boolean | null {
  return useSyncExternalStore(subscribe, () => (eligible.has(exerciseId) ? on.has(exerciseId) : null));
}

// For code outside components (the workout notification).
export function perHandOn(exerciseId: string): boolean {
  return on.has(exerciseId);
}

export function togglePerHand(exerciseId: string) {
  if (!eligible.has(exerciseId)) return;
  on = new Set(on);
  if (on.has(exerciseId)) on.delete(exerciseId);
  else on.add(exerciseId);
  changed();
  savePerHand([...on]).catch((e) => console.warn('[perHand] save failed', e));
}

// An exercise was made or its equipment changed (Create / Edit Exercise): which
// ones are two-dumbbell moves may have changed.
export function reloadPerHand() {
  if (loaded) load();
}
