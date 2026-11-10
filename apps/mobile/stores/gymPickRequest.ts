import type { Router } from '@/types/exercise';
import type { GymChoice } from '@/types/gym';

// How a screen gets a gym from Select Gym: it leaves what to do with the pick
// here and opens /select-gym; Select Gym hands the pick back and closes, and the
// screen, still mounted underneath, uses it (as stores/exercisePickRequest.ts).

let onPicked: ((choice: GymChoice) => void) | null = null;

export function openGymPicker(router: Router, picked: (choice: GymChoice) => void) {
  onPicked = picked;
  router.push('/select-gym');
}

// Hands the pick over once; a second call (double tap) does nothing.
export function deliverGymPick(choice: GymChoice) {
  const handler = onPicked;
  onPicked = null;
  handler?.(choice);
}
