import { useCallback, useMemo, useState } from 'react';
import { AppState, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { BodyFigure, recoveryView, volumeView } from '@/components/body/BodyFigure';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { MetricPills } from '@/components/ui/MetricPills';
import { RunTodayCard } from '@/components/run/RunTodayCard';
import { useRunReadiness } from '@/hooks/useRunReadiness';
import { SevenDayStrip } from '@/components/stats/SevenDayStrip';
import { ConditioningCard } from '@/components/stats/ConditioningCard';
import { AdvancedStatsList } from '@/components/stats/AdvancedStatsList';
import { TYPE } from '@/constants/theme';
import { VIEW_DEFAULTS } from '@/constants/defaults';
import { LAYOUT, SPACE } from '@/constants/layout';
import { BODY_VIEWS } from '@/constants/stats';
import { getStatSets } from '@/db/stats/statSets';
import { hardSets, recovery, setEfforts } from '@/lib/training/effort';
import { conditioning } from '@/lib/training/conditioning';
import { hardWindow, lastSevenDays } from '@/lib/stats/stats';
import type { BodyView, StatSet } from '@/types/stats';

// Statistics: the last 7 days with the muscles they worked, then the Advanced statistics.
// The body shows hard sets against weekly target zones, or (toggle) how
// recovered each muscle is now (lib/training/effort.ts), then the Conditioning card.
// Pieces: components/stats/.

export default function StatisticsScreen() {
  const router = useRouter();
  const run = useRunReadiness();
  const [sets, setSets] = useState<StatSet[] | null>(null);
  const [view, setView] = useState<BodyView>(VIEW_DEFAULTS.statisticsBody);
  // When the data was loaded: "now" for the 7 days, recovery and this week's
  // cardio. Loaded again when the app comes back to this screen: Android
  // doesn't reopen it, so it used to stay on the day it was first opened.
  const [loadedAt, setLoadedAt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = () =>
        getStatSets().then((s) => {
          setSets(s);
          setLoadedAt(Date.now());
        });
      load();
      const sub = AppState.addEventListener('change', (state) => state === 'active' && load());
      return () => sub.remove();
    }, [])
  );

  // As of when the data was loaded, like recovery below.
  const days = useMemo(() => (sets ? lastSevenDays(sets, new Date(loadedAt)) : []), [sets, loadedAt]);
  const efforts = useMemo(() => (sets ? setEfforts(sets) : []), [sets]);
  const weights = useMemo(() => efforts.map((e) => e.weight), [efforts]);
  const cardio = useMemo(() => (sets ? conditioning(sets, new Date(loadedAt)) : null), [sets, loadedAt]);
  const figure = useMemo(() => {
    if (!sets || days.length === 0) return null;
    if (view === 'hard') return volumeView(hardSets(sets, weights, ...hardWindow(days)));
    return recoveryView(recovery(sets, efforts, new Date(loadedAt)));
  }, [sets, days, efforts, weights, view, loadedAt]);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title="Statistics" />
      <ScrollView contentContainerStyle={styles.content}>
        {run.data?.on && (
          <RunTodayCard
            readiness={run.data.readiness}
            now={run.data.now}
            noteRead={run.data.settings.disclaimerSeen}
            onOpen={() => router.push('/run')}
          />
        )}
        <Text style={styles.graphTitle}>Last 7 days body graph</Text>
        <SevenDayStrip days={days} />
        <MetricPills options={BODY_VIEWS} value={view} onChange={setView} style={styles.views} />
        <View style={styles.figure}>{figure && <BodyFigure shades={figure.shades} legend={figure.legend} />}</View>
        {cardio && <ConditioningCard cardio={cardio} />}
        <AdvancedStatsList />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: SPACE.xxxl,
  },
  graphTitle: {
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
    ...TYPE.title,
  },
  // As the Profile's Duration / Volume / Reps pills.
  views: {
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    gap: SPACE.lg,
  },
  figure: {
    marginTop: SPACE.lg,
    marginBottom: SPACE.xxl,
    alignItems: 'center',
  },
});
