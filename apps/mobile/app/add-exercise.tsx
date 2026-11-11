import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getActiveWorkout, updateActiveWorkout } from '@/stores/activeWorkoutStore';
import { currentPickRequest, deliverPicks, setInfoPick } from '@/stores/exercisePickRequest';
import { FilterSheet } from '@/components/exercises/FilterSheet';
import { HeaderTextButton, HeaderTextLeft, InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterButton } from '@/components/exercise-picker/FilterButton';
import { PickerRow, renderSectionHeader, rowKey } from '@/components/exercise-picker/PickerRow';
import { EQUIPMENT_SECTIONS, MUSCLE_SECTIONS } from '@/components/exercise-picker/filterSections';
import type { PickerFilter, Replacing } from '@/components/exercise-picker/types';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ADD_EXERCISE_SIZES } from '@/constants/sizes';
import { LIST_RENDERING } from '@/constants/limits';
import { newActiveExercise } from '@/db/activeWorkout/start';
import { getPickerExercises } from '@/db/exercisePicker/pickerExercises';
import { pickerCount, pickerSections } from '@/lib/domain/exerciseSearch';
import { plural } from '@/lib/format/text';
import type { EquipmentGroup } from '@/types/equipment';
import type { MuscleGroup } from '@/types/muscles';
import type { AddExerciseProps, PickerExercise } from '@/types/exercise';

// The Add Exercise / Replace Exercise picker.
//
// /add-exercise                 adds the picked exercises (in the order tapped) to the workout in progress
// /add-exercise?replace=K        swaps exercise K of that workout for the one tapped
// /add-exercise?target=request   hands the picks to the screen that asked (stores/exercisePickRequest.ts)
// <AddExercise browse />          Profile's Exercises list (app/exercises/index.tsx): a tap opens the exercise page
export default function AddExercise({ browse = false }: AddExerciseProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { replace, target } = useLocalSearchParams<{ replace?: string; target?: string }>();
  const [request] = useState(() => (target === 'request' ? currentPickRequest() : null));
  const replaceMode = !!replace || !!request?.replacing;
  const [all, setAll] = useState<PickerExercise[] | null>(null);
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [replacing, setReplacing] = useState<Replacing | null>(() =>
    request?.replacing ? { id: request.replacing.exerciseId, sets: 1 } : null
  );
  // Set before anything navigates: a double tap used to go back twice, closing the
  // routine editor underneath and losing its unsaved changes.
  const leaving = useRef(false);
  const [equipment, setEquipment] = useState<EquipmentGroup[]>([]);
  const [muscles, setMuscles] = useState<MuscleGroup[]>([]);
  const [sheet, setSheet] = useState<PickerFilter | null>(null);

  useEffect(() => {
    getPickerExercises().then(setAll);
    if (replace) {
      getActiveWorkout().then((w) => {
        const e = w?.exercises.find((x) => x.key === replace);
        if (e) setReplacing({ id: e.exerciseId, sets: e.sets.length });
      });
    }
  }, [replace]);

  // The search runs over ~5,600 names: typing stays responsive and the list catches up.
  const search = useDeferredValue(query);
  const sections = useMemo(
    () => (all ? pickerSections(all, { search, equipment, muscles, replacingId: replacing?.id }) : []),
    [all, search, replacing, equipment, muscles]
  );

  // "Show N results": what the list would show with these picks.
  function countWith(eq: EquipmentGroup[], mu: MuscleGroup[]) {
    return all ? pickerCount(all, { search, equipment: eq, muscles: mu }) : 0;
  }

  // Its bests are those of the gym the workout started at.
  async function workoutStart(): Promise<string> {
    return (await getActiveWorkout())?.startTime ?? new Date().toISOString();
  }

  async function choose(exercise: PickerExercise) {
    if (browse) {
      router.push({ pathname: '/exercises/[id]', params: { id: exercise.id } });
      return;
    }
    if (!request?.replacing && !replace) {
      setPicked((p) => (p.includes(exercise.id) ? p.filter((id) => id !== exercise.id) : [...p, exercise.id]));
      return;
    }
    if (leaving.current) return;
    leaving.current = true;
    if (request?.replacing) {
      deliverPicks([exercise]);
      router.back();
      return;
    }
    const fresh = await newActiveExercise(exercise, await workoutStart(), replacing?.sets ?? 1);
    updateActiveWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((e) => (e.key === replace ? { ...fresh, restSeconds: e.restSeconds } : e)),
    }));
    router.back();
  }

  async function addPicked() {
    if (!all) return;
    await addExercises(picked.map((id) => all.find((e) => e.id === id)!));
  }

  async function addExercises(exercises: PickerExercise[]) {
    if (leaving.current) return;
    leaving.current = true;
    if (request) {
      deliverPicks(exercises);
      router.back();
      return;
    }
    const start = await workoutStart();
    const added = await Promise.all(exercises.map((e) => newActiveExercise(e, start)));
    updateActiveWorkout((w) => ({ ...w, exercises: [...w.exercises, ...added] }));
    router.back();
  }

  // ⓘ: the exercise page, whose "Add exercise" adds (or swaps in) just that one.
  function openInfo(exercise: PickerExercise) {
    setInfoPick(() => {
      if (replaceMode) choose(exercise);
      else addExercises([exercise]);
    });
    router.push({ pathname: '/exercises/[id]', params: { id: exercise.id, pick: replaceMode ? 'replace' : 'add' } });
  }

  const noResults = all !== null && sections.length === 0;

  // Stable row callbacks (by exercise) reading the latest choose / openInfo, so a
  // pick redraws only the rows whose selection changed.
  const handlers = useRef({ choose, openInfo });
  useLayoutEffect(() => {
    handlers.current = { choose, openInfo };
  });
  const onRowPress = useCallback((e: PickerExercise) => handlers.current.choose(e), []);
  const onRowInfo = useCallback((e: PickerExercise) => handlers.current.openInfo(e), []);
  const pickedSet = useMemo(() => new Set(picked), [picked]);
  const renderItem = useCallback(
    ({ item }: { item: PickerExercise }) => (
      <PickerRow
        exercise={item}
        selected={pickedSet.has(item.id)}
        onPress={onRowPress}
        onInfo={browse ? undefined : onRowInfo}
      />
    ),
    [pickedSet, onRowPress, onRowInfo, browse]
  );
  const listBottom = useMemo(
    () => ({ paddingBottom: picked.length ? 96 + insets.bottom : 24 + insets.bottom }),
    [picked.length, insets.bottom]
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      {browse ? (
        // No Create button: custom exercises aren't supported yet.
        <InnerHeader title="Exercises" />
      ) : (
        <InnerHeader
          title={replaceMode ? 'Replace Exercise' : 'Add Exercise'}
          left={<HeaderTextLeft label="Cancel" onPress={() => router.back()} />}
          // Create Custom Exercise comes in a later step.
          right={<HeaderTextButton label="Create" onPress={() => {}} />}
        />
      )}

      <SearchField value={query} onChangeText={setQuery} placeholder="Search exercise" autoFocus={!replaceMode && !browse} />

      <View style={styles.filters}>
        <FilterButton
          label="All Equipment"
          picks={equipment}
          onPress={() => setSheet('equipment')}
          onClear={() => setEquipment([])}
        />
        <FilterButton label="All Muscles" picks={muscles} onPress={() => setSheet('muscles')} onClear={() => setMuscles([])} />
      </View>

      {noResults ? (
        <EmptyState
          title={query.trim() ? `Can't find ${query.trim()}` : 'No exercises'}
          message="We don't have that exercise in our database yet."
          // Opens Create Custom Exercise (a later step).
          action={!browse && <Button label="Create Custom Exercise" size="compact" style={styles.emptyButton} />}
          style={styles.empty}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={rowKey}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          {...LIST_RENDERING.exercisePicker}
          contentContainerStyle={listBottom}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
        />
      )}

      <FilterSheet
        title="Equipment"
        sections={EQUIPMENT_SECTIONS}
        visible={sheet === 'equipment'}
        selected={equipment}
        countFor={(picks) => countWith(picks, muscles)}
        onApply={(picks) => {
          setEquipment(picks);
          setSheet(null);
        }}
        onDismiss={() => setSheet(null)}
      />
      <FilterSheet
        title="Muscle Group"
        sections={MUSCLE_SECTIONS}
        visible={sheet === 'muscles'}
        selected={muscles}
        countFor={(picks) => countWith(equipment, picks)}
        onApply={(picks) => {
          setMuscles(picks);
          setSheet(null);
        }}
        onDismiss={() => setSheet(null)}
      />

      {picked.length > 0 && (
        <Button
          label={`Add ${picked.length} ${plural(picked.length, 'exercise')}`}
          size="compact"
          style={[styles.addButton, { bottom: insets.bottom + 12 }]}
          onPress={addPicked}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Two 36-tall buttons 16 under the search, 20.6 apart.
  filters: {
    flexDirection: 'row',
    gap: SPACE.xl,
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
  addButton: {
    position: 'absolute',
    left: ADD_EXERCISE_SIZES.addButtonLeft,
    right: ADD_EXERCISE_SIZES.addButtonRight,
  },
  // "Can't find …" (add-exercise-not-found.jpg).
  empty: {
    marginTop: SPACE.xxl,
    paddingHorizontal: LAYOUT.screenMargin,
  },
  emptyButton: {
    alignSelf: 'stretch',
    marginTop: SPACE.lg,
  },
});
