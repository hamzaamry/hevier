import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { Desktop } from 'phosphor-react-native/src/icons/Desktop';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { PersonSimple } from 'phosphor-react-native/src/icons/PersonSimple';

import { RunSettingsRows } from '@/components/run/RunSettingsRows';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { getRunSettings, isRunOn, saveRunSettings } from '@/db/run/settings';
import { RUN_SETTINGS_SECTION } from '@/constants/runCopy';
import type { RunSettings } from '@/types/run';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES, SETTINGS_SIZES, SIZES } from '@/constants/sizes';
import { Screen } from '@/components/ui/Screen';
import { GYM_LABELS } from '@/constants/labels';
import { getGymTimeline } from '@/db/gym/gym';
import { currentGym } from '@/lib/gym/timeline';
import { setDrawings, useDrawings } from '@/stores/drawings';

// Settings, opened from the gear on Profile: which figure the exercise
// pictures show (a tap switches it), the gym, Running (the run readiness) and Sync with PC.
export default function SettingsScreen() {
  const router = useRouter();
  const drawings = useDrawings();
  // The gym you train at now (a change made on the Gym screen shows on return).
  const [gym, setGym] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      getGymTimeline()
        .then((t) => setGym(currentGym(t, new Date())?.name ?? null))
        .catch((e) => console.warn('[settings] gym load failed', e));
    }, [])
  );
  const [run, setRun] = useState<RunSettings | null>(null);
  // Whether the run readiness shows: the choice, or (not chosen yet) whether a run was logged.
  const [runOn, setRunOn] = useState(false);
  useFocusEffect(
    useCallback(() => {
      getRunSettings()
        .then((s) => {
          setRun(s);
          return isRunOn(s).then(setRunOn);
        })
        .catch((e) => console.warn('[run] settings load failed', e));
    }, [])
  );
  const changeRun = (patch: Partial<RunSettings>) => {
    if (!run) return;
    const next = { ...run, ...patch };
    setRun(next);
    if (patch.enabled !== undefined) setRunOn(!!patch.enabled);
    saveRunSettings(next).catch((e) => console.warn('[run] settings save failed', e));
  };
  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title="Settings" />
      <ScrollView>
        <Text style={styles.section}>Exercises</Text>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => setDrawings(drawings === 'male' ? 'female' : 'male')}>
          <PersonSimple size={ICON_SIZES.xxl} color={COLORS.text} />
          <Text style={styles.title}>Exercise pictures</Text>
          <Text style={styles.value}>{drawings === 'male' ? 'Male' : 'Female'}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => router.push('/gym')}>
          <MapPin size={ICON_SIZES.xxl} color={COLORS.text} />
          <Text style={styles.title}>{GYM_LABELS.settingsRow}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {gym ?? GYM_LABELS.notSet}
          </Text>
          <CaretRight size={ICON_SIZES.md} color={COLORS.textSecondary} style={styles.caret} />
        </Pressable>
        <Text style={styles.section}>{RUN_SETTINGS_SECTION}</Text>
        {run && <RunSettingsRows settings={run} on={runOn} onChange={changeRun} />}
        <Text style={styles.section}>Data</Text>
        <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => router.push('/sync')}>
          <Desktop size={ICON_SIZES.xxl} color={COLORS.text} />
          <Text style={styles.title}>Sync with PC</Text>
          <CaretRight size={ICON_SIZES.md} color={COLORS.textSecondary} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// Measured on settings.jpg (2.625 px/dp): black 53dp section band with a grey
// label, 60dp grey rows, icon at 16, title at 57.
const styles = StyleSheet.create({
  section: {
    height: SETTINGS_SIZES.sectionHeight,
    paddingHorizontal: LAYOUT.screenMargin,
    textAlignVertical: 'center',
    ...TYPE.row,
    color: COLORS.textSecondary,
  },
  row: {
    height: SIZES.settingsRowHeight,
    paddingHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    flex: 1,
    marginLeft: SPACE.lg,
    ...TYPE.row,
  },
  value: {
    flexShrink: 1,
    ...TYPE.row,
    color: COLORS.textSecondary,
  },
  caret: {
    marginLeft: SPACE.sm,
  },
});
