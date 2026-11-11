import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { CheckInRow } from '@/components/run/CheckInRow';
import { DisclaimerCard } from '@/components/run/DisclaimerCard';
import { ForecastStrip } from '@/components/run/ForecastStrip';
import { ReadinessCard } from '@/components/run/ReadinessCard';
import { HeaderTextButton, InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { useRunReadiness } from '@/hooks/useRunReadiness';
import { dayKey } from '@/lib/date';
import { COLORS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, SPACE } from '@/constants/layout';
import { RUN_HOW_LINK, RUN_LOG_LINK, RUN_NOT_MEDICAL, RUN_SCREEN_TITLE, RUN_TODAY, RUN_TOMORROW } from '@/constants/runCopy';

// Run: should I run at the next run slot, and how hard (lib/training/runReadiness.ts).
// The call, how to run, why, the 5 mornings ahead, and the 10-second check-in. Until the
// medical note has been read, only the note shows: no call comes before it.
export default function RunScreen() {
  const router = useRouter();
  const { data, updateCheckIn, updateSettings } = useRunReadiness();

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={RUN_SCREEN_TITLE} right={<HeaderTextButton label={RUN_LOG_LINK} onPress={() => router.push('/run/log')} />} />
      {data && (
        <ScrollView contentContainerStyle={SCREEN_STYLES.content}>
          {data.settings.disclaimerSeen ? (
            <>
              <ReadinessCard readiness={data.readiness} now={data.now} />
              <CheckInRow
                checkIn={data.checkIn}
                when={dayKey(new Date(data.slotMs)) === dayKey(data.now) ? RUN_TODAY : RUN_TOMORROW}
                onChange={updateCheckIn}
              />
              <ForecastStrip days={data.days} />
              <View style={styles.footer}>
                <Pressable onPress={() => router.push('/run/how-it-works')} hitSlop={HIT_SLOPS.xl} accessibilityRole="link">
                  <Text style={styles.link}>{RUN_HOW_LINK}</Text>
                </Pressable>
                <Text style={styles.small}>{RUN_NOT_MEDICAL}</Text>
              </View>
            </>
          ) : (
            <DisclaimerCard onAccept={() => updateSettings({ disclaimerSeen: true })} />
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: SPACE.xl,
    gap: SPACE.md,
  },
  link: {
    ...TYPE.callout,
    color: COLORS.primary,
  },
  small: {
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
});
