import type { DRAG_ITEM_KINDS, ROUTINE_METRICS } from '@/constants/routine';
import type { ExerciseType } from './exercise';
import type { SetType, WorkoutSession } from './workout';

export interface Routine {
  id: string;
  name: string;
}

// The Workout tab's routine list (db/routines/folders.ts).
export interface RoutineSummary {
  id: string;
  name: string;
  exerciseNames: string[];
}

// A folder's id and name, as made by createFolder (db/routines/folders.ts).
export interface Folder {
  id: string;
  name: string;
}

export interface RoutineFolder {
  id: string;
  name: string;
  collapsed: boolean;
  routines: RoutineSummary[];
}

export interface RoutineOverview {
  folders: RoutineFolder[];
  // Routines outside any folder: the built-in "My Routines" section.
  unfiled: RoutineSummary[];
  unfiledCollapsed: boolean;
}

// The routine page (db/routines/page.ts).
export interface PlannedSet {
  setIndex: number;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
  distanceKm: number | null;
  durationSeconds: number | null;
}

export interface RoutinePageExercise {
  id: string; // routine_exercises.id
  exerciseId: string;
  catalogueId: string | null; // picture: files/catalogue/still/<id>.webp
  name: string;
  type: ExerciseType;
  restSeconds: number | null;
  supersetId: string | null;
  sets: PlannedSet[];
}

// What the routine page's chart shows: one of ROUTINE_METRICS.
export type RoutineMetric = (typeof ROUTINE_METRICS)[number];

// A past workout of the routine with its totals (db/sessions/sessions.ts).
export type RoutineSession = WorkoutSession;

export interface RoutinePage {
  id: string;
  name: string;
  exercises: RoutinePageExercise[];
  // Oldest first. Hevy's export has no routine ids, so a session is a workout
  // with the routine's title.
  sessions: RoutineSession[];
}

// The routine editor (db/routines/editor.ts).
// rpe: a saved workout's logged effort (RPE scale), kept through Edit Workout.
export type EditorSet = Omit<PlannedSet, 'setIndex'> & { rpe?: number | null };

export interface EditorExercise {
  exerciseId: string;
  catalogueId: string | null;
  name: string;
  type: ExerciseType;
  notes: string | null;
  restSeconds: number | null;
  supersetId: string | null;
  sets: EditorSet[];
  // The sets from the last workout with this exercise: the PREVIOUS column.
  previous: EditorSet[];
}

export interface EditorRoutine {
  id: string;
  name: string;
  exercises: EditorExercise[];
}

export interface RoutineDraft {
  id: string | null; // null = new routine
  folderId?: string | null; // where a new routine goes (null = My Routines)
  name: string;
  exercises: RoutineDraftExercise[];
}

// One exercise of a routine as it is saved: its planned sets in order.
export interface RoutineDraftExercise {
  exerciseId: string;
  notes: string | null;
  restSeconds: number | null;
  supersetId: string | null;
  sets: EditorSet[];
}

// What a row of the Workout tab's list is for the routine drag
// (lib/routineDrop.ts): one of DRAG_ITEM_KINDS.
export type DragItemKind = (typeof DRAG_ITEM_KINDS)[number];

export interface DragListItem {
  key: string;
  kind: DragItemKind;
  folderId: string | null; // null = My Routines
  collapsed?: boolean; // headers
}

// The routine cycle (db/rotation/cycle.ts).
export interface CycleRoutine {
  id: string;
  name: string;
}

export interface Cycle {
  routines: CycleRoutine[]; // still in the app, in cycle order
  next: number; // index in routines
  nextExercises: string[];
  last: { title: string; startTime: string } | null; // newest workout from the cycle
}

// What a workout did differently from its routine (lib/workout/routineUpdate.ts).
export interface RoutineChanges {
  addedExercises: number;
  removedExercises: number;
  reordered: boolean;
  addedSets: number;
  removedSets: number;
  changedTypes: number;
}

// Where the routine editor's draft comes from (hooks/useRoutineDraft.ts): a
// routine, a workout copied into a new routine, or a workout being edited.
export interface RoutineDraftSource {
  id?: string;
  fromWorkout?: string;
  workout?: string;
}
