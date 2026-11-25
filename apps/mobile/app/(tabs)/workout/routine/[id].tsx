import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { InnerHeader } from '@/components/ui/InnerHeader';
import { MoreButton } from '@/components/routines/RoutineList';
import { RoutineMenu } from '@/components/routines/RoutineMenu';
import { useStartWorkout } from '@/hooks/useStartWorkout';
import { Screen } from '@/components/ui/Screen';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { RoutineChart } from '@/components/routine-page/RoutineChart';
import { RoutineExerciseBlock } from '@/components/routine-page/RoutineExerciseBlock';
import { SupersetBlocks } from '@/components/workout/SupersetBlocks';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, RADIUS, SPACE } from '@/constants/layout';
import { ROUTINE_PAGE_SIZES } from '@/constants/sizes';
import { getRoutinePage } from '@/db/routines/page';
import type { RoutinePage } from '@/types/routine';

// A routine's page: Start Routine, the progress chart and each exercise's sets. The chart and the
// exercise blocks live in components/routine-page/.

export default function RoutineScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { start, dialog: startDialog } = useStartWorkout();
  const [page, setPage] = useState<RoutinePage | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const reload = useCallback(() => {
    if (id) getRoutinePage(id).then(setPage);
  }, [id]);
  useFocusEffect(reload);
  const openExercise = useCallback((exerciseId: string) => router.push(`/exercises/${exerciseId}`), [router]);

  return (
    <Screen>
      <InnerHeader
        title="Routine"
        right={
          <View style={styles.more}>
            <MoreButton onPress={() => setMenuOpen(true)} />
          </View>
        }
      />
      {page && (
        <ScrollView contentContainerStyle={SCREEN_STYLES.content}>
          <Text style={styles.name}>{page.name}</Text>
          <Pressable style={({ pressed }) => [styles.start, pressed && styles.pressed]} onPress={() => start(page.id)}>
            <Text style={TYPE.bodyMedium}>Start Routine</Text>
          </Pressable>

          <RoutineChart sessions={page.sessions} />

          <View style={styles.exercisesRow}>
            <Text style={styles.exercisesLabel}>Exercises</Text>
            <Pressable hitSlop={HIT_SLOPS.md} onPress={() => router.push({ pathname: '/routine-editor', params: { id: page.id } })}>
              <Text style={styles.editLabel}>Edit Routine</Text>
            </Pressable>
          </View>

          <SupersetBlocks
            padded
            exercises={page.exercises}
            keyOf={(exercise) => exercise.id}
            renderExercise={(exercise, hideRest) => (
              <RoutineExerciseBlock exercise={exercise} onOpen={openExercise} hideRest={hideRest} />
            )}
          />
        </ScrollView>
      )}

      {startDialog}

      <RoutineMenu
        routine={menuOpen && page ? page : null}
        onClose={() => setMenuOpen(false)}
        onDuplicated={() => router.back()}
        onDeleted={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  more: {
    paddingRight: SPACE.lg,
  },
  name: {
    marginTop: SPACE.lg,
    ...TYPE.headingSemibold,
    lineHeight: LINE_HEIGHTS.loose,
  },
  start: {
    height: ROUTINE_PAGE_SIZES.startHeight,
    marginTop: SPACE.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  exercisesRow: {
    marginTop: SPACE.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: SPACE.xxs,
  },
  exercisesLabel: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.textSecondary,
  },
  editLabel: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.primary,
  },
});
