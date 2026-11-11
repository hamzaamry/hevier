import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { EffortPicker } from '@/components/run/EffortPicker';
import { Button } from '@/components/ui/Button';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { logRun } from '@/db/run/logRun';
import { saveRunFeedback } from '@/db/run/feedback';
import { useRunReadiness } from '@/hooks/useRunReadiness';
import { fill, paceText, runSeconds } from '@/lib/format/run';
import { parseNumber } from '@/lib/format/setFormat';
import { easyPace, runsOf } from '@/lib/training/run';
import { loggedRunStartMs, verdictShownAt } from '@/lib/training/runReadiness';
import { COLORS, TYPE } from '@/constants/theme';
import { RADIUS, SPACE } from '@/constants/layout';
import { RUN_SIZES } from '@/constants/sizes';
import { RUN_EASY_MAX_RPE, RUN_LEGS_FELT, RUN_LOG_WHEN } from '@/constants/run';
import {
  RUN_LEGS_FELT_LABELS,
  RUN_LEGS_FELT_TITLE,
  RUN_LOG_A11Y,
  RUN_LOG_DONE,
  RUN_LOG_ERROR,
  RUN_LOG_FIELDS,
  RUN_LOG_NO_EFFORT,
  RUN_LOG_PACE,
  RUN_LOG_PACE_EASY,
  RUN_LOG_PLACEHOLDERS,
  RUN_LOG_SAVE,
  RUN_LOG_SAVED,
  RUN_LOG_TITLE,
  RUN_LOG_WHEN_LABELS,
} from '@/constants/runCopy';
import type { LegsFelt, RunLogWhen, SavedRun } from '@/types/run';

// Log a run in a few taps: minutes (and seconds), distance, when, and how hard it felt. It is
// saved like any workout with a Run set; afterwards the pace, and how the legs felt (optional).
export default function LogRunScreen() {
  const router = useRouter();
  const { data } = useRunReadiness();
  const [minutes, setMinutes] = useState('');
  const [secondsText, setSecondsText] = useState('');
  const [km, setKm] = useState('');
  const [rpe, setRpe] = useState<number | null>(null);
  const [when, setWhen] = useState<RunLogWhen>('now');
  const [saved, setSaved] = useState<SavedRun | null>(null);
  const [legsFelt, setLegsFelt] = useState<LegsFelt | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const seconds = runSeconds(minutes, secondsText);

  const save = async () => {
    if (!data || seconds === null || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const parsed = parseNumber(km);
      const distance = parsed !== null && parsed > 0 ? parsed : null;
      const startMs = loggedRunStartMs(when, new Date(), seconds, data.settings.slotMinutes);
      const verdictShown = verdictShownAt(data.sets, startMs, data.settings.slotMinutes);
      const easy = easyPace(runsOf(data.sets), startMs);
      const workoutId = await logRun({ startMs, seconds, km: distance, rpe, verdictShown });
      const pace = distance ? Math.round(seconds / distance) : null;
      setSaved({
        workoutId,
        verdictShown,
        pace: pace ? fill(RUN_LOG_PACE, { pace: paceText(pace) }) : null,
        easy: pace && easy && (rpe ?? 0) <= RUN_EASY_MAX_RPE ? fill(RUN_LOG_PACE_EASY, { from: paceText(easy[0]), to: paceText(easy[1]) }) : null,
      });
    } catch (e) {
      console.warn('Run not saved', e);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const pickLegs = (felt: LegsFelt) => {
    if (!saved) return;
    const next = legsFelt === felt ? null : felt;
    setLegsFelt(next);
    saveRunFeedback(saved.workoutId, saved.verdictShown, next).catch((e) =>
      console.warn('[run] feedback save failed', e)
    );
  };

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={RUN_LOG_TITLE} />
      <ScrollView contentContainerStyle={SCREEN_STYLES.content} keyboardShouldPersistTaps="handled">
        {saved ? (
          <View>
            <Text style={styles.savedTitle}>{RUN_LOG_SAVED}</Text>
            {saved.pace && (
              <Text style={styles.savedLine}>
                {saved.pace}.{saved.easy}
              </Text>
            )}
            <Text style={styles.label}>{RUN_LEGS_FELT_TITLE}</Text>
            <View style={styles.pills}>
              {RUN_LEGS_FELT.map((felt) => (
                <Pill key={felt} label={RUN_LEGS_FELT_LABELS[felt]} active={legsFelt === felt} onPress={() => pickLegs(felt)} />
              ))}
            </View>
            <Button label={RUN_LOG_DONE} onPress={() => router.back()} style={styles.button} />
          </View>
        ) : (
          <View>
            <Text style={styles.label}>{RUN_LOG_FIELDS.time}</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeBox]}
                value={minutes}
                onChangeText={setMinutes}
                placeholder={RUN_LOG_PLACEHOLDERS.minutes}
                placeholderTextColor={COLORS.textSecondary}
                selectionColor={COLORS.primary}
                keyboardType="number-pad"
                maxLength={4}
                accessibilityLabel={RUN_LOG_A11Y.minutes}
              />
              <Text style={styles.unit}>{RUN_LOG_FIELDS.minutes}</Text>
              <TextInput
                style={[styles.input, styles.timeBox]}
                value={secondsText}
                onChangeText={setSecondsText}
                placeholder={RUN_LOG_PLACEHOLDERS.seconds}
                placeholderTextColor={COLORS.textSecondary}
                selectionColor={COLORS.primary}
                keyboardType="number-pad"
                maxLength={2}
                accessibilityLabel={RUN_LOG_A11Y.seconds}
              />
              <Text style={styles.unit}>{RUN_LOG_FIELDS.seconds}</Text>
            </View>
            <Text style={styles.label}>{RUN_LOG_FIELDS.distance}</Text>
            <TextInput
              style={styles.input}
              value={km}
              onChangeText={setKm}
              placeholder={RUN_LOG_PLACEHOLDERS.distance}
              placeholderTextColor={COLORS.textSecondary}
              selectionColor={COLORS.primary}
              keyboardType="decimal-pad"
              accessibilityLabel={RUN_LOG_A11Y.distance}
            />
            <Text style={styles.label}>{RUN_LOG_FIELDS.when}</Text>
            <View style={styles.pills}>
              {RUN_LOG_WHEN.map((w) => (
                <Pill key={w} label={RUN_LOG_WHEN_LABELS[w]} active={when === w} onPress={() => setWhen(w)} />
              ))}
            </View>
            <Text style={styles.label}>{RUN_LOG_FIELDS.effort}</Text>
            <EffortPicker value={rpe} onChange={setRpe} />
            {rpe === null && <Text style={styles.hint}>{RUN_LOG_NO_EFFORT}</Text>}
            {failed && (
              <Text style={styles.error} accessibilityLiveRegion="polite">
                {RUN_LOG_ERROR}
              </Text>
            )}
            <Button label={RUN_LOG_SAVE} onPress={save} disabled={seconds === null || !data} busy={busy} style={styles.button} />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: SPACE.xl,
    marginBottom: SPACE.sm,
    ...TYPE.callout,
    color: COLORS.textSecondary,
  },
  input: {
    height: RUN_SIZES.inputHeight,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    ...TYPE.rowMedium,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  timeBox: {
    width: RUN_SIZES.minutesBoxWidth,
    textAlign: 'center',
  },
  unit: {
    marginRight: SPACE.md,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  hint: {
    marginTop: SPACE.md,
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
  error: {
    marginTop: SPACE.md,
    ...TYPE.callout,
    color: COLORS.danger,
  },
  button: {
    marginTop: SPACE.xl,
  },
  savedTitle: {
    marginTop: SPACE.xl,
    ...TYPE.headlineBold,
  },
  savedLine: {
    marginTop: SPACE.sm,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
});
