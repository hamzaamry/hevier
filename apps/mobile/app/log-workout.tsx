import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'phosphor-react-native/src/icons/Plus';

import {
  adjustRest,
  discardActiveWorkout,
  onPr,
  peekActiveWorkout,
  reloadWorkoutSettings,
  stopSetTimer,
  toggleSetDone,
  useActiveWorkout,
  useUntil,
} from '@/stores/activeWorkoutStore';
import { ClockSheet } from '@/components/workout/ClockSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DurationSheet } from '@/components/workout/DurationSheet';
import { PrToast } from '@/components/workout/PrToast';
import { ReorderExercises } from '@/components/workout/ReorderExercises';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { ExerciseMenuSheet } from '@/components/log-workout/ExerciseMenuSheet';
import { LogExercise } from '@/components/log-workout/LogExercise';
import { SupersetBlocks } from '@/components/workout/SupersetBlocks';
import { LogHeader } from '@/components/log-workout/LogHeader';
import { RepsLeftInfoSheet } from '@/components/log-workout/RepsLeftInfoSheet';
import { RestBar } from '@/components/log-workout/RestBar';
import { WorkoutStatsRow } from '@/components/log-workout/WorkoutStatsRow';
import {
  addSet,
  addToSuperset,
  playSet,
  removeFromSuperset,
  removeSet,
  reorderExercises,
  updateExercise,
  updateSet,
} from '@/components/log-workout/workoutOps';
import type { ExerciseActions } from '@/components/log-workout/types';
import { RestTimerSheet } from '@/components/set-table/RestTimerSheet';
import { SupersetPickerSheet } from '@/components/set-table/SupersetMenu';
import { SetTypeSheet } from '@/components/set-table/SetTypeSheet';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Screen } from '@/components/ui/Screen';
import { COLORS } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES } from '@/constants/sizes';
import { DEFAULT_WORKOUT_SETTINGS } from '@/constants/defaults';
import { KEEP_AWAKE_TAGS } from '@/constants/storage';
import { restOf } from '@/db/workoutSettings';
import { useKeepAwake } from '@/hooks/useKeepAwake';
import { hasCompletedSets, workoutStats } from '@/lib/workout/activeWorkout';
import type { PrToastData } from '@/types/records';
import type { WorkoutSettings } from '@/types/workoutSettings';

// Log Workout: the workout in progress. It is a
// draft saved on every change: ⌄ (or Back) just leaves it running.
// The pieces are in components/log-workout/.

export default function LogWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const workout = useActiveWorkout();
  const [restFor, setRestFor] = useState<string | null>(null);
  const [setMenu, setSetMenu] = useState<{ exercise: string; set: string } | null>(null);
  const [repsLeftInfo, setRepsLeftInfo] = useState(false);
  const [exerciseMenu, setExerciseMenu] = useState<string | null>(null);
  // Add To Superset: the exercise waiting for its partner.
  const [supersetFor, setSupersetFor] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'discard' | 'empty' | null>(null);
  const [durationOpen, setDurationOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [prToast, setPrToast] = useState<PrToastData | null>(null);
  const [reordering, setReordering] = useState(false);
  // Finish already tapped: a second tap would open Save Workout twice.
  const leaving = useRef(false);
  // Workout Settings, read again on coming back from that screen. ✓ reads
  // them from the store, which waits for this read rather than use defaults.
  const [settings, setSettings] = useState<WorkoutSettings>(DEFAULT_WORKOUT_SETTINGS);
  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
      reloadWorkoutSettings().then(setSettings);
    }, [])
  );
  useKeepAwake(settings.keepAwake, KEEP_AWAKE_TAGS.logWorkout);

  // A record on ✓ or on a ▶ stopwatch's ■ (the store decides, PR alerts on).
  useEffect(() => onPr((pr) => setPrToast({ id: Date.now(), ...pr })), []);

  // Rows call these with their keys; the same functions on every render, so
  // typing in one set redraws only that set's exercise and row.
  const actions = useMemo<ExerciseActions>(
    () => ({
      notes: (exerciseKey, notes) => updateExercise(exerciseKey, (e) => ({ ...e, notes })),
      rest: setRestFor,
      open: (exerciseId) => router.push(`/exercises/${exerciseId}`),
      menu: setExerciseMenu,
      setMenu: (exercise, set) => setSetMenu({ exercise, set }),
      setChange: updateSet,
      toggleDone: (exerciseKey, setKey) =>
        toggleSetDone(exerciseKey, setKey).catch((e) => console.warn('[logWorkout] ✓ failed', e)),
      play: playSet,
      stop: () => stopSetTimer().catch((e) => console.warn('[logWorkout] ■ failed', e)),
      deleteSet: removeSet,
      addSet,
      repsLeftInfo: () => setRepsLeftInfo(true),
    }),
    [router]
  );
  const openDuration = useCallback(() => setDurationOpen(true), []);

  const resting = useUntil(workout?.restEndsAt ?? null);

  if (!workout) {
    return <Screen />;
  }

  const done = workoutStats(workout).sets;
  const totalSets = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  const setTimer = workout.setTimer ?? null;

  // Finish opens Save Workout, which saves it (app/save-workout.tsx).
  function finish() {
    if (leaving.current) return;
    const w = peekActiveWorkout();
    if (!w || !hasCompletedSets(w)) {
      setDialog('empty');
      return;
    }
    leaving.current = true;
    router.push('/save-workout');
  }

  const restExercise = workout.exercises.find((e) => e.key === restFor);
  const menuSet =
    setMenu && workout.exercises.find((e) => e.key === setMenu.exercise)?.sets.find((s) => s.key === setMenu.set);

  return (
    <Screen style={{ paddingBottom: keyboard }}>
      <Stack.Screen options={{ headerShown: false }} />
      <LogHeader
        workout={workout}
        progress={totalSets ? done / totalSets : 0}
        onBack={() => router.back()}
        onClock={() => setClockOpen(true)}
        onFinish={finish}
      />

      {/* Duration · Volume · Sets stay pinned under the header while the exercises scroll. */}
      <WorkoutStatsRow workout={workout} onDuration={openDuration} />
      <Divider />

      <ScrollView contentContainerStyle={{ paddingBottom: resting ? 120 : 48 }} keyboardShouldPersistTaps="handled">
        <SupersetBlocks
          exercises={workout.exercises}
          keyOf={(e) => e.key}
          renderExercise={(exercise, hideRest) => (
            <LogExercise
              hideRest={hideRest}
              exercise={exercise}
              settings={settings}
              // Only the exercise whose set is counting down gets the ▶ timer.
              timer={setTimer && exercise.sets.some((s) => s.key === setTimer.setKey) ? setTimer : null}
              actions={actions}
            />
          )}
        />

        <Button
          label="Add Exercise"
          size="compact"
          icon={<Plus size={ICON_SIZES.lg} color={COLORS.text} />}
          style={styles.addExercise}
          onPress={() => router.push('/add-exercise')}
        />
        <View style={styles.bottomRow}>
          <Button
            label="Settings"
            variant="secondary"
            size="compact"
            style={styles.settings}
            onPress={() => router.push('/workout-settings')}
          />
          <Button
            label="Discard Workout"
            variant="secondary"
            size="compact"
            danger
            style={styles.discardButton}
            onPress={() => setDialog('discard')}
          />
        </View>
      </ScrollView>

      {resting && (
        <RestBar restEndsAt={workout.restEndsAt} restTotal={workout.restTotal} insetBottom={insets.bottom} onAdjust={adjustRest} />
      )}

      <PrToast toast={prToast} onDone={() => setPrToast(null)} />

      <ClockSheet visible={clockOpen} onDismiss={() => setClockOpen(false)} />

      <DurationSheet workout={workout} visible={durationOpen} onDismiss={() => setDurationOpen(false)} />

      <RestTimerSheet
        visible={restFor !== null}
        title="Rest Timer"
        value={restExercise ? restOf(restExercise.restSeconds, settings) || null : null}
        // OFF is saved as 0, so it stays off even with a default rest timer.
        onPick={(seconds) => restFor && updateExercise(restFor, (e) => ({ ...e, restSeconds: seconds ?? 0 }))}
        onDismiss={() => setRestFor(null)}
      />

      <SetTypeSheet
        visible={setMenu !== null}
        value={menuSet?.setType}
        onPick={(t) => setMenu && updateSet(setMenu.exercise, setMenu.set, { setType: t })}
        onRemove={() => setMenu && removeSet(setMenu.exercise, setMenu.set)}
        onDismiss={() => setSetMenu(null)}
      />

      <RepsLeftInfoSheet visible={repsLeftInfo} onDismiss={() => setRepsLeftInfo(false)} />

      <ExerciseMenuSheet
        exerciseKey={exerciseMenu}
        exercises={workout.exercises}
        onDismiss={() => setExerciseMenu(null)}
        onReorder={() => setReordering(true)}
        onReplace={(key) => router.push({ pathname: '/add-exercise', params: { replace: key } })}
        onAddToSuperset={setSupersetFor}
        onRemoveFromSuperset={removeFromSuperset}
      />

      <SupersetPickerSheet
        exerciseKey={supersetFor}
        exercises={workout.exercises}
        onPick={addToSuperset}
        onDismiss={() => setSupersetFor(null)}
      />

      <ReorderExercises
        exercises={workout.exercises}
        visible={reordering}
        onCancel={() => setReordering(false)}
        onDone={(keys) => {
          reorderExercises(keys);
          setReordering(false);
        }}
      />

      <ConfirmDialog
        visible={dialog === 'discard'}
        message="Are you sure you want to discard the workout in progress?"
        confirmLabel="Discard Workout"
        onConfirm={() => {
          setDialog(null);
          discardActiveWorkout();
          router.back();
        }}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'empty'}
        message="You haven't completed any sets yet. Tap ✓ next to a set when you've done it."
        confirmLabel="OK"
        tone="primary"
        cancelLabel="Discard Workout"
        onConfirm={() => setDialog(null)}
        onCancel={() => setDialog('discard')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addExercise: {
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: SPACE.lg,
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
  settings: {
    flex: 189.7,
  },
  discardButton: {
    flex: 173.7,
  },
});
