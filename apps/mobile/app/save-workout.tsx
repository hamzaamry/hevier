import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CalendarDots } from 'phosphor-react-native/src/icons/CalendarDots';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { X } from 'phosphor-react-native/src/icons/X';

import { updateActiveWorkout, useActiveWorkout, useNow } from '@/stores/activeWorkoutStore';
import { GymFormRow } from '@/components/gym/GymFormRow';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NameDialog } from '@/components/ui/NameDialog';
import { DurationSheet } from '@/components/workout/DurationSheet';
import { HeaderPillButton, InnerHeader } from '@/components/ui/InnerHeader';
import { MediaStrip } from '@/components/workout/MediaStrip';
import { elapsedLabel } from '@/lib/format/duration';
import { deleteMediaFiles, pickMedia } from '@/lib/workoutMedia';
import { COLORS, TYPE } from '@/constants/theme';
import { elapsedSeconds, needsBodyWeight, workoutStats } from '@/lib/workout/activeWorkout';
import { parseBodyWeight } from '@/lib/domain/bodyWeight';
import { addBodyWeight } from '@/db/bodyWeight/bodyWeight';
import { useBodyWeight } from '@/hooks/useBodyWeight';
import { HIT_SLOPS, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, SAVE_WORKOUT_SIZES, SIZES } from '@/constants/sizes';
import { GYM_LABELS } from '@/constants/labels';
import { getGymTimeline } from '@/db/gym/gym';
import { dateTimeLabel } from '@/lib/format/date';
import { gymName, workoutGym } from '@/lib/gym/timeline';
import { openGymPicker } from '@/stores/gymPickRequest';
import type { GymTimeline } from '@/types/gym';
import { volumeLabel } from '@/lib/format/weight';
import { Screen } from '@/components/ui/Screen';
import { Divider } from '@/components/ui/Divider';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { Stat } from '@/components/ui/Stat';
import { UpdateRoutineSheet } from '@/components/save-workout/UpdateRoutineSheet';
import { useSaveGuard } from '@/hooks/useSaveGuard';

// Save Workout after Finish: title, Duration / Volume / Sets, photos /
// videos, description, date, Discard. The clock stands still while here and runs on
// again if the user goes back to Log Workout (hooks/useSaveGuard.ts). Nothing
// is saved before Save. With a body weight exercise done and no body weight
// logged yet, Save asks for it first (Skip saves without).
export default function SaveWorkout() {
  const router = useRouter();
  const workout = useActiveWorkout();
  const now = useNow(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const { update, closeUpdate, save, finish, discard, gymAsk, answerGym, closeGymAsk } = useSaveGuard(workout);
  // For the Gym row: the gym of the workout's day, when the user has changed gym.
  const [timeline, setTimeline] = useState<GymTimeline | null>(null);
  useEffect(() => {
    getGymTimeline().then(setTimeline);
  }, []);
  const { bodyWeight, reload: reloadBodyWeight } = useBodyWeight();
  const [askingBodyWeight, setAskingBodyWeight] = useState(false);

  if (!workout) return <Screen />;
  const stats = workoutStats(workout, bodyWeight);

  function onSave() {
    if (workout && needsBodyWeight(workout, bodyWeight)) setAskingBodyWeight(true);
    else void save(); // never rejects: useSaveGuard logs a failed save
  }
  const start = new Date(workout.startTime);
  const gymValue =
    workout.gym?.name ??
    (timeline && timeline.changes.length > 0 ? gymName(timeline, workoutGym(timeline, workout.startTime, null)) : GYM_LABELS.select);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title="Save Workout" right={<HeaderPillButton label="Save" onPress={onSave} />} />
      <ScrollView contentContainerStyle={SCREEN_STYLES.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <TextInput
            style={styles.title}
            value={workout.title}
            onChangeText={(title) => updateActiveWorkout((w) => ({ ...w, title }))}
            placeholder="Workout title"
            placeholderTextColor={COLORS.textSecondary}
          />
          {workout.title.length > 0 && (
            <Pressable style={styles.clear} onPress={() => updateActiveWorkout((w) => ({ ...w, title: '' }))} hitSlop={HIT_SLOPS.md}>
              <X size={ICON_SIZES.xs} weight="bold" color={COLORS.text} />
            </Pressable>
          )}
        </View>

        <View style={styles.stats}>
          <Stat
            label="Duration"
            value={elapsedLabel(elapsedSeconds(workout, now))}
            size="large"
            blue
            onPress={() => setTimeOpen(true)}
            style={styles.stat}
          />
          <Stat label="Volume" value={volumeLabel(stats.volumeKg)} size="large" style={styles.stat} />
          <Stat label="Sets" value={String(stats.sets)} size="large" style={styles.stat} />
        </View>
        <Divider />

        <View style={styles.media}>
          <MediaStrip
            media={workout.media ?? []}
            onAdd={async () => {
              try {
                const picked = await pickMedia();
                if (picked) updateActiveWorkout((w) => ({ ...w, media: [...(w.media ?? []), ...picked] }));
              } catch (e) {
                console.warn('[media] pick failed', e);
              }
            }}
            onRemove={(file) => {
              deleteMediaFiles([file]);
              updateActiveWorkout((w) => ({ ...w, media: (w.media ?? []).filter((m) => m.file !== file) }));
            }}
          />
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.description}
          value={workout.description ?? ''}
          onChangeText={(description) => updateActiveWorkout((w) => ({ ...w, description }))}
          placeholder="How did your workout go? Leave some notes here..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
        />
        <Divider />

        <Pressable style={styles.row} onPress={() => setTimeOpen(true)}>
          <CalendarDots size={ICON_SIZES.xxl} color={COLORS.text} />
          <Text style={styles.rowLabel}>Date</Text>
          <Text style={styles.rowValue}>{dateTimeLabel(start)}</Text>
          <CaretRight size={ICON_SIZES.sm} color={COLORS.textSecondary} />
        </Pressable>
        <Divider />
        <GymFormRow
          icon={<MapPin size={ICON_SIZES.xxl} color={COLORS.text} />}
          label={GYM_LABELS.formGym}
          value={gymValue}
          onPress={() => openGymPicker(router, (gym) => updateActiveWorkout((w) => ({ ...w, gym })))}
        />

        <Pressable style={styles.discard} onPress={() => setDiscarding(true)} hitSlop={HIT_SLOPS.md}>
          <Text style={styles.discardLabel}>Discard Workout</Text>
        </Pressable>
      </ScrollView>

      <DurationSheet workout={workout} visible={timeOpen} onDismiss={() => setTimeOpen(false)} noPause />
      <ConfirmDialog
        visible={gymAsk !== null}
        tone="primary"
        message={gymAsk?.message ?? ''}
        confirmLabel={GYM_LABELS.changedGym}
        cancelLabel={GYM_LABELS.justThisWorkout}
        onConfirm={() => answerGym(true)}
        onCancel={() => answerGym(false)}
        onDismiss={closeGymAsk}
      />
      <UpdateRoutineSheet update={update} onUpdate={(routine) => finish(routine)} onKeep={() => finish()} onDismiss={closeUpdate} />
      <NameDialog
        visible={askingBodyWeight}
        title="Your body weight (kg)"
        message="Pull-ups, dips and other body weight exercises count it as weight lifted."
        placeholder="e.g. 80"
        keyboardType="decimal-pad"
        isValid={(text) => parseBodyWeight(text) !== null}
        cancelLabel="Skip"
        onSave={async (text) => {
          const kg = parseBodyWeight(text);
          setAskingBodyWeight(false);
          try {
            if (kg !== null) await addBodyWeight(kg);
            await reloadBodyWeight();
          } catch (e) {
            console.warn('[body weight] save failed', e);
          }
          void save();
        }}
        onCancel={() => {
          setAskingBodyWeight(false);
          void save();
        }}
        onDismiss={() => setAskingBodyWeight(false)}
      />
      <ConfirmDialog
        visible={discarding}
        message="Are you sure you want to discard the workout in progress?"
        confirmLabel="Discard Workout"
        cancelLabel="Cancel"
        onConfirm={() => {
          setDiscarding(false);
          discard();
        }}
        onCancel={() => setDiscarding(false)}
      />
    </Screen>
  );
}

// Measured on save-workout.jpg (2.625 px/dp).
const styles = StyleSheet.create({
  titleRow: {
    marginTop: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    padding: 0,
    ...TYPE.headlineBold,
  },
  clear: {
    width: SIZES.smallButton,
    height: SIZES.smallButton,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.separator,
  },
  stats: {
    marginTop: SPACE.xl,
    paddingBottom: SPACE.lg,
    flexDirection: 'row',
  },
  stat: {
    width: SAVE_WORKOUT_SIZES.statWidth,
  },
  media: {
    marginTop: SPACE.lg,
  },
  label: {
    marginTop: SPACE.xl,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  description: {
    marginTop: SPACE.xs,
    marginBottom: SPACE.md,
    padding: 0,
    minHeight: SAVE_WORKOUT_SIZES.descriptionMinHeight,
    ...TYPE.body,
  },
  row: {
    height: SAVE_WORKOUT_SIZES.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    marginLeft: SPACE.md,
    ...TYPE.row,
  },
  rowValue: {
    marginRight: SPACE.xs,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
  discard: {
    marginTop: SPACE.xl,
    alignSelf: 'center',
  },
  discardLabel: {
    ...TYPE.row,
    color: COLORS.danger,
  },
});
