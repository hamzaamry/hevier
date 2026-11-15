import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { takeInfoPick } from '@/stores/exercisePickRequest';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { ExercisePageTabs } from '@/components/exercise-page/ExercisePageTabs';
import { SummaryTab } from '@/components/exercise-page/SummaryTab';
import { HistoryTab } from '@/components/exercise-page/HistoryTab';
import { HowToTab } from '@/components/exercise-page/HowToTab';
import { useExerciseMenu } from '@/components/exercise-page/ExerciseMenu';
import type { ExercisePageTab } from '@/components/exercise-page/types';
import { COLORS, TYPE } from '@/constants/theme';
import { RADIUS } from '@/constants/layout';
import { EXERCISE_PAGE_SIZES } from '@/constants/sizes';
import { getExerciseDetail } from '@/db/exerciseStats/detail';
import type { ExerciseDetail } from '@/types/exercise';

// An exercise's page: Summary, History and How to.
// Opened from an exercise name on the routine page, or from ⓘ in the picker
// (?pick=1), which adds a floating "Add exercise" button.
// The tabs live in components/exercise-page/.

export default function ExercisePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, pick } = useLocalSearchParams<{ id: string; pick?: string }>();
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);
  const [tab, setTab] = useState<ExercisePageTab>('summary');

  // Again on each return, so an edit made in Edit Exercise shows.
  const load = useCallback(() => {
    if (id) getExerciseDetail(id).then(setDetail);
  }, [id]);
  useFocusEffect(load);
  const { button: menuButton, menu } = useExerciseMenu(detail, load);

  const picking = pick === 'add' || pick === 'replace';
  // Once only: a double tap went back twice, closing the picker's caller too.
  const added = useRef(false);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={detail?.name ?? ''} right={menuButton} />
      <ExercisePageTabs tab={tab} onTab={setTab} />

      {detail && (
        // Keyed by tab: each tab opens at its top.
        <ScrollView key={tab} contentContainerStyle={{ paddingBottom: (picking ? 80 : 24) + insets.bottom }}>
          {tab === 'summary' && <SummaryTab detail={detail} />}
          {tab === 'history' && <HistoryTab detail={detail} />}
          {tab === 'howto' && <HowToTab detail={detail} />}
        </ScrollView>
      )}

      {picking && detail && (
        <Pressable
          style={({ pressed }) => [styles.addButton, { bottom: insets.bottom + 16.4 }, pressed && styles.pressed]}
          onPress={() => {
            if (added.current) return;
            added.current = true;
            const handler = takeInfoPick();
            router.back();
            handler?.(detail.id);
          }}>
          <Text style={TYPE.bodyMedium}>{pick === 'replace' ? 'Replace exercise' : 'Add exercise'}</Text>
        </Pressable>
      )}
      {menu}
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Floating, 16 from the sides and the bottom, 47.6 tall.
  addButton: {
    position: 'absolute',
    left: EXERCISE_PAGE_SIZES.addButtonLeft,
    right: EXERCISE_PAGE_SIZES.addButtonRight,
    height: EXERCISE_PAGE_SIZES.addButtonHeight,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  pressed: {
    opacity: 0.8,
  },
});
