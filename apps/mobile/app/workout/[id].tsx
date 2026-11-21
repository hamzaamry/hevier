import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Star } from 'phosphor-react-native/src/icons/Star';
import { Trash } from 'phosphor-react-native/src/icons/Trash';

import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { MediaStrip } from '@/components/workout/MediaStrip';
import { MoreButton } from '@/components/routines/RoutineList';
import { WorkoutSummary } from '@/components/workout/WorkoutCard';
import { useWorkoutMenu } from '@/components/workout/WorkoutMenu';
import { Screen } from '@/components/ui/Screen';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { MuscleSplit } from '@/components/workout-page/MuscleSplit';
import { WorkoutExerciseBlock } from '@/components/workout-page/WorkoutExerciseBlock';
import { shared } from '@/components/workout-page/styles';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { ICON_SIZES } from '@/constants/sizes';
import { LAYOUT, SPACE } from '@/constants/layout';
import { getWorkoutCard } from '@/db/feed/cards';
import { getProfileNames } from '@/db/profile/names';
import { addWorkoutMedia, removeWorkoutMedia, setWorkoutCover } from '@/db/workouts/media';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import { useMediaSource } from '@/hooks/useMediaSource';
import { deleteMediaFiles } from '@/lib/workoutMedia';
import { getStatSets } from '@/db/stats/statSets';
import { muscleSplit } from '@/lib/stats/stats';
import { longDateTime } from '@/lib/format/date';
import type { WorkoutCardData } from '@/types/feed';
import type { SplitPart } from '@/types/stats';

// A saved workout, opened from a card on Home or the Profile: the card's summary, the muscle
// split, then each exercise with its sets (components/workout-page/).
export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<WorkoutCardData | null>(null);
  const [profile, setProfile] = useState<{ name: string; username: string } | null>(null);
  const [split, setSplit] = useState<SplitPart[]>([]);
  const { openMenu, menu } = useWorkoutMenu(() => router.back());
  const openExercise = useCallback((exerciseId: string) => router.push(`/exercises/${exerciseId}`), [router]);
  // Photos and videos: adding is the action itself (no Save), a ✕ asks first.
  const [removing, setRemoving] = useState<string | null>(null);
  // A photo or video tapped on the strip: its menu.
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const afterSheet = useAfterSheetClose();
  const reload = useCallback(() => {
    if (id) getWorkoutCard(id).then(setWorkout).catch((e) => console.warn('[workout] reload failed', e));
  }, [id]);
  const mediaSource = useMediaSource(async (items) => {
    if (!id) return;
    try {
      await addWorkoutMedia(id, items);
      reload();
    } catch (e) {
      console.warn('[media] add failed', e);
      deleteMediaFiles(items.map((m) => m.file)); // no row, so no use for the copies
    }
  });
  // Only an explicitly picked file can be removed: the default cover (the first
  // photo) has nothing to clear.
  const sheetIsCover = sheetFor !== null && workout?.coverFile === sheetFor;
  async function saveCover(cover: string | null) {
    const target = sheetFor;
    setSheetFor(null);
    if (!id || !target) return;
    try {
      await setWorkoutCover(id, cover);
      reload();
    } catch (e) {
      console.warn('[media] cover failed', e);
    }
  }
  function deleteFromSheet() {
    const file = sheetFor;
    setSheetFor(null);
    if (file) afterSheet.later(() => setRemoving(file));
  }
  async function confirmRemove() {
    const file = removing;
    setRemoving(null);
    if (!id || !file) return;
    try {
      await removeWorkoutMedia(id, file);
      deleteMediaFiles([file]);
      reload();
    } catch (e) {
      console.warn('[media] remove failed', e);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getProfileNames().then(setProfile);
      if (!id) return;
      getWorkoutCard(id).then(setWorkout);
      getStatSets().then((sets) => setSplit(muscleSplit(sets.filter((s) => s.workoutId === id))));
    }, [id])
  );

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader
        title="Workout Detail"
        right={
          workout && (
            <View style={styles.more}>
              <MoreButton onPress={() => openMenu(workout.id)} />
            </View>
          )
        }
      />
      {workout && profile && (
        <ScrollView contentContainerStyle={[SCREEN_STYLES.content, styles.contentTop]}>
          <WorkoutSummary workout={workout} username={profile.username} name={profile.name} when={longDateTime(new Date(workout.startTime))} />
          {/* What was written and added on the Save Workout page. */}
          {!!workout.description && <Text style={styles.description}>{workout.description}</Text>}
          <View style={styles.media}>
            <MediaStrip
              media={workout.media ?? []}
              onAdd={mediaSource.open}
              onSelect={setSheetFor}
              coverFile={workout.cover?.file ?? null}
            />
          </View>
          <View style={shared.divider} />
          {split.length > 0 && <MuscleSplit split={split} />}
          <Text style={shared.section}>Workout</Text>
          {workout.exercises.map((e, i) => (
            <WorkoutExerciseBlock key={i} exercise={e} onOpen={openExercise} />
          ))}
        </ScrollView>
      )}
      {menu}
      {mediaSource.sheet}
      <BottomSheet
        visible={sheetFor !== null}
        title={workout?.media?.find((m) => m.file === sheetFor)?.kind === 'video' ? 'Video' : 'Photo'}
        onDismiss={() => setSheetFor(null)}
        onClosed={afterSheet.onClosed}>
        <SheetItem
          first
          icon={<Star {...sheetIcon} />}
          label={sheetIsCover ? 'Remove as cover' : 'Set as cover'}
          onPress={() => saveCover(sheetIsCover ? null : sheetFor)}
        />
        <SheetItem
          icon={<Trash {...sheetIcon} size={ICON_SIZES.lg} color={COLORS.danger} />}
          label="Delete"
          destructive
          onPress={deleteFromSheet}
        />
      </BottomSheet>
      <ConfirmDialog
        visible={removing !== null}
        message="Are you sure you want to delete this photo or video?"
        confirmLabel="Delete"
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  more: {
    paddingRight: SPACE.lg,
  },
  contentTop: {
    paddingTop: SPACE.lg,
  },
  description: {
    marginTop: SPACE.sm,
    marginHorizontal: LAYOUT.screenMargin,
    ...TYPE.callout,
    lineHeight: LINE_HEIGHTS.normal,
  },
  media: {
    marginTop: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
  },
});
