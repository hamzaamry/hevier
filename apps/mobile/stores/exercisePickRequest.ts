
import type { PickerExercise, PickRequest, Router } from '@/types/exercise';

// How a screen with its own unsaved state (the routine editor) gets exercises
// from the picker: it leaves a request here and opens /add-exercise?target=request;
// the picker hands back what was picked and closes, and the screen, still
// mounted underneath, adds them to its draft. (Log Workout doesn't need this:
// the picker writes to the workout in progress directly.)



let request: PickRequest | null = null;

export function openExercisePicker(router: Router, req: PickRequest) {
  request = req;
  router.push({ pathname: '/add-exercise', params: { target: 'request' } });
}

export function currentPickRequest(): PickRequest | null {
  return request;
}

// Hands the picks over once; a second call (double tap) does nothing.
export function deliverPicks(exercises: PickerExercise[]) {
  const req = request;
  request = null;
  req?.onPicked(exercises);
}

// ⓘ in the picker opens the exercise page with an "Add exercise" button; the
// picker leaves what that button should do here (add or swap in that exercise).
let infoPick: ((exerciseId: string) => void) | null = null;

export function setInfoPick(handler: (exerciseId: string) => void) {
  infoPick = handler;
}

export function takeInfoPick() {
  const handler = infoPick;
  infoPick = null;
  return handler;
}

// Create Exercise, opened from the picker, leaves the new exercise's id here;
// the picker takes it when it comes back into view and ticks (or swaps in) it.
let createdExercise: string | null = null;

export function setCreatedExercise(id: string) {
  createdExercise = id;
}

export function takeCreatedExercise() {
  const id = createdExercise;
  createdExercise = null;
  return id;
}
