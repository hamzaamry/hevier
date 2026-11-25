import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Barbell } from 'phosphor-react-native/src/icons/Barbell';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import * as Crypto from 'expo-crypto';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TimeSheet } from '@/components/workout/DurationSheet';
import { openExercisePicker } from '@/stores/exercisePickRequest';
import { HeaderPillButton, HeaderTextLeft, InnerHeader } from '@/components/ui/InnerHeader';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useMediaSource } from '@/hooks/useMediaSource';
import { deleteMediaFiles } from '@/lib/workoutMedia';
import { EditorExerciseMenu } from '@/components/routine-editor/EditorExerciseMenu';
import { ExerciseEditor } from '@/components/routine-editor/ExerciseEditor';
import { SupersetBlocks } from '@/components/workout/SupersetBlocks';
import { WorkoutMetaFields } from '@/components/routine-editor/WorkoutMetaFields';
import { nextDraftSet, routinePayload, workoutPayload } from '@/components/routine-editor/draft';
import { newDraftExercise } from '@/components/routine-editor/newDraftExercise';
import type { DraftExercise, DraftSet } from '@/components/routine-editor/types';
import { RestTimerSheet } from '@/components/set-table/RestTimerSheet';
import { SupersetPickerSheet } from '@/components/set-table/SupersetMenu';
import { SetTypeSheet } from '@/components/set-table/SetTypeSheet';
import { patchSet, removeByKey, updateByKey } from '@/components/set-table/draftOps';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES } from '@/constants/sizes';
import { saveRoutine } from '@/db/routines/write';
import { saveWorkoutEdit } from '@/db/workouts/edit';
import { useRoutineDraft } from '@/hooks/useRoutineDraft';
import { normalizeSupersets, pairExercises, unpairExercise } from '@/lib/workout/supersets';

// The routine editor, built from Log Workout's blocks without the ✓ column;
// KG/REPS end at the right edge instead. Nothing is written until Update
// (Save when creating a routine: no id).
//
// Two more uses from a saved workout's ⋯ menu:
// `fromWorkout` = Save as Routine (Create Routine, prefilled from the workout),
// `workout` = Edit Workout (no rest timers; start, duration and description;
// Save writes over the workout). The pieces are in components/routine-editor/.

export default function RoutineEditor() {
  // Without an id: Create Routine (New Routine), into `folder` when given.
  const { id, folder, fromWorkout, workout } = useLocalSearchParams<{
    id?: string;
    folder?: string;
    fromWorkout?: string;
    workout?: string;
  }>();
  const editingWorkout = !!workout;
  const creating = !id && !workout;
  const router = useRouter();
  const keyboard = useKeyboardHeight();
  const { name, setName, exercises, setExercises, meta, setMeta, isDirty } = useRoutineDraft({ id, fromWorkout, workout });
  // When the time sheet opened (its date wheel ends on that day); 0 = closed.
  const [timeSheet, setTimeSheet] = useState(0);
  // Sheets and dialogs.
  const [restFor, setRestFor] = useState<number | null>(null);
  const [setMenu, setSetMenu] = useState<{ exercise: number; set: number } | null>(null);
  const [exerciseMenu, setExerciseMenu] = useState<number | null>(null);
  // Add To Superset: the exercise waiting for its partner.
  const [supersetFor, setSupersetFor] = useState<number | null>(null);
  const [discarding, setDiscarding] = useState(false);

  // All stable (functional updates only), so the memoized exercises don't redraw
  // when another one changes: typing in a set redraws just its own exercise.
  const updateExercise = useCallback(
    (key: number, change: (e: DraftExercise) => DraftExercise) => setExercises((all) => updateByKey(all, key, change)),
    [setExercises]
  );
  const updateSet = useCallback(
    (exerciseKey: number, setKey: number, change: Partial<DraftSet>) =>
      updateExercise(exerciseKey, (e) => ({ ...e, sets: patchSet(e.sets, setKey, change) })),
    [updateExercise]
  );
  const addSet = useCallback(
    (exerciseKey: number) => updateExercise(exerciseKey, (e) => ({ ...e, sets: [...e.sets, nextDraftSet(e.sets)] })),
    [updateExercise]
  );
  const setNotes = useCallback(
    (key: number, notes: string) => updateExercise(key, (e) => ({ ...e, notes })),
    [updateExercise]
  );
  const openSetMenu = useCallback((exercise: number, set: number) => setSetMenu({ exercise, set }), []);

  // For the ⋮ menu and the superset picker, which aren't memoized: no useCallback needed.
  const addToSuperset = (key: number, partnerKey: number) =>
    setExercises((all) => pairExercises(all, key, partnerKey, Crypto.randomUUID()));
  const removeFromSuperset = (key: number) => setExercises((all) => unpairExercise(all, key));
  const removeExercise = (key: number) => setExercises((all) => normalizeSupersets(removeByKey(all, key)));

  // Edit Workout's photos: a picked file is copied into media/ at once, but the
  // workout only keeps it on Save. Files added in this session that Save didn't keep
  // are deleted when the editor closes, however it closes (Cancel, back, Discard).
  const added = useRef<string[]>([]);
  const saved = useRef(false);
  useEffect(() => () => {
    if (!saved.current) deleteMediaFiles(added.current);
  }, []);
  const mediaSource = useMediaSource((items) => {
    added.current.push(...items.map((m) => m.file));
    setMeta((m) => ({ ...m, media: [...m.media, ...items] }));
  });
  function removeMedia(file: string) {
    // One of this session's own: gone for good. A saved one is deleted after Save.
    if (added.current.includes(file)) {
      deleteMediaFiles([file]);
      added.current = added.current.filter((f) => f !== file);
    }
    setMeta((m) => ({ ...m, media: m.media.filter((x) => x.file !== file) }));
  }

  // Set before saving or going back: a double tap ran two saves at once (overlapping
  // transactions) or went back twice.
  const leaving = useRef(false);

  async function update() {
    if (leaving.current) return;
    leaving.current = true;
    try {
      if (workout) {
        const unused = await saveWorkoutEdit(workoutPayload(workout, name, meta, exercises));
        saved.current = true;
        deleteMediaFiles(unused);
      } else await saveRoutine(routinePayload(id ?? null, folder ?? null, name, exercises));
      router.back();
    } catch (e) {
      console.warn('Save failed', e);
      leaving.current = false;
    }
  }

  function back() {
    if (leaving.current) return;
    leaving.current = true;
    router.back();
  }

  function cancel() {
    if (isDirty()) setDiscarding(true);
    else back();
  }

  function addExercises() {
    openExercisePicker(router, {
      onPicked: async (picked) => {
        const added = await Promise.all(picked.map((e) => newDraftExercise(e)));
        setExercises((all) => [...all, ...added]);
      },
    });
  }

  function replaceExercise(key: number) {
    const old = exercises.find((e) => e.key === key);
    if (!old) return;
    openExercisePicker(router, {
      replacing: { exerciseId: old.exerciseId },
      onPicked: async ([picked]) => {
        const fresh = await newDraftExercise(picked, old.sets.length);
        updateExercise(key, (e) => ({ ...fresh, restSeconds: e.restSeconds, supersetId: e.supersetId }));
      },
    });
  }

  const restExercise = exercises.find((e) => e.key === restFor);
  const menuSet = setMenu && exercises.find((e) => e.key === setMenu.exercise)?.sets.find((s) => s.key === setMenu.set);

  return (
    <Screen style={{ paddingBottom: keyboard }}>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader
        title={editingWorkout ? 'Edit Workout' : creating ? 'Create Routine' : 'Edit Routine'}
        left={<HeaderTextLeft label="Cancel" onPress={cancel} />}
        right={
          <HeaderPillButton
            label={creating || editingWorkout ? 'Save' : 'Update'}
            disabled={!name.trim() || (creating && exercises.length === 0)}
            onPress={update}
          />
        }
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.title}
          value={name}
          onChangeText={setName}
          placeholder={editingWorkout ? 'Workout title' : 'Routine title'}
          placeholderTextColor={COLORS.textSecondary}
          selectionColor={COLORS.primary}
          cursorColor={COLORS.primary}
          autoFocus={creating && !fromWorkout}
        />
        <Divider />

        {editingWorkout && (
          <WorkoutMetaFields
            meta={meta}
            onTime={() => setTimeSheet(Date.now())}
            onDescription={(description) => setMeta((m) => ({ ...m, description }))}
            onAddMedia={mediaSource.open}
            onRemoveMedia={removeMedia}
          />
        )}

        {exercises.length === 0 && (
          <EmptyState
            message="Get started by adding an exercise to your routine."
            icon={<Barbell size={ICON_SIZES.emptyState} color={COLORS.textSecondary} />}
            style={styles.empty}
          />
        )}

        <SupersetBlocks
          exercises={exercises}
          keyOf={(e) => e.key}
          renderExercise={(exercise, hideRest) => (
            <ExerciseEditor
              hideRest={hideRest}
              exercise={exercise}
              onNotes={setNotes}
              onRest={editingWorkout ? undefined : setRestFor}
              onMenu={setExerciseMenu}
              onSetMenu={openSetMenu}
              onSetChange={updateSet}
              onAddSet={addSet}
            />
          )}
        />

        <Button
          label="Add Exercise"
          size="compact"
          icon={<Plus size={ICON_SIZES.lg} color={COLORS.text} />}
          style={styles.addExercise}
          onPress={addExercises}
        />
      </ScrollView>

      <RestTimerSheet
        visible={restFor !== null}
        title="Rest Timer"
        value={restExercise?.restSeconds ?? null}
        onPick={(seconds) => restFor !== null && updateExercise(restFor, (e) => ({ ...e, restSeconds: seconds }))}
        onDismiss={() => setRestFor(null)}
      />

      <SetTypeSheet
        visible={setMenu !== null}
        value={menuSet?.setType}
        onPick={(t) => setMenu && updateSet(setMenu.exercise, setMenu.set, { setType: t })}
        onRemove={() => setMenu && updateExercise(setMenu.exercise, (e) => ({ ...e, sets: removeByKey(e.sets, setMenu.set) }))}
        onDismiss={() => setSetMenu(null)}
      />

      <EditorExerciseMenu
        exerciseKey={exerciseMenu}
        exercises={exercises}
        onDismiss={() => setExerciseMenu(null)}
        onReplace={replaceExercise}
        onRemove={removeExercise}
        onAddToSuperset={setSupersetFor}
        onRemoveFromSuperset={removeFromSuperset}
      />

      <SupersetPickerSheet
        exerciseKey={supersetFor}
        exercises={exercises}
        onPick={addToSuperset}
        onDismiss={() => setSupersetFor(null)}
      />

      {editingWorkout && (
        <TimeSheet
          visible={timeSheet > 0}
          onDismiss={() => setTimeSheet(0)}
          now={timeSheet || meta.startTime}
          startTime={meta.startTime}
          durationSeconds={meta.durationSeconds}
          // Moving the start keeps the duration (unlike a live workout).
          onStart={(startTime) => setMeta((m) => ({ ...m, startTime }))}
          onDuration={(durationSeconds) => setMeta((m) => ({ ...m, durationSeconds }))}
        />
      )}

      {mediaSource.sheet}

      <ConfirmDialog
        visible={discarding}
        message="Are you sure you want to discard your changes?"
        confirmLabel="Discard Changes"
        onConfirm={() => {
          setDiscarding(false);
          back();
        }}
        onCancel={() => setDiscarding(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
  },
  title: {
    marginTop: SPACE.sm,
    paddingHorizontal: LAYOUT.screenMargin,
    paddingVertical: SPACE.md,
    ...TYPE.headingSemibold,
  },
  // An empty new routine.
  empty: {
    marginTop: 0,
    paddingTop: SPACE.xxxl,
    paddingBottom: SPACE.sm,
    paddingHorizontal: SPACE.xxl,
  },
  addExercise: {
    marginTop: SPACE.xxl,
    marginHorizontal: LAYOUT.screenMargin,
  },
});
