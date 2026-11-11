import { StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { RUN_FEELS, RUN_SLEEP_MAX_H, RUN_SLEEP_MIN_H, RUN_SLEEP_START_H, RUN_SLEEP_STEP_H } from '@/constants/run';
import {
  RUN_CHECK_IN_NOTE,
  RUN_CHECK_IN_TITLE,
  RUN_FEEL_LABELS,
  RUN_LEGS_SORE_LABEL,
  RUN_LESS_SLEEP,
  RUN_MORE_SLEEP,
  RUN_PAIN_LABEL,
  RUN_SICK_LABEL,
  RUN_SLEEP_LABEL,
  RUN_SLEEP_UNSET,
} from '@/constants/runCopy';
import { fill } from '@/lib/format/run';
import { Stepper } from './Stepper';
import type { CheckInRowProps } from './types';

// The 10-second check-in: how you feel, how long you slept, anything sore or off.
// Every tap is saved on its own, and the call above updates. Each tap builds on the
// last one (a function of the check-in as it is), so quick taps never undo each other.
export function CheckInRow({ checkIn, when, onChange }: CheckInRowProps) {
  const sleep = checkIn?.sleepHours ?? null;
  // Below the least it clears the hours again.
  const stepSleep = (by: number) =>
    onChange((c) => {
      const hours = (c.sleepHours ?? RUN_SLEEP_START_H) + by;
      return { sleepHours: hours < RUN_SLEEP_MIN_H ? null : Math.min(hours, RUN_SLEEP_MAX_H) };
    });
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{RUN_CHECK_IN_TITLE}</Text>
      <Text style={styles.note}>{fill(RUN_CHECK_IN_NOTE, { when })}</Text>
      <View style={styles.pills}>
        {RUN_FEELS.map((feel) => (
          <Pill
            key={feel}
            raised
            label={RUN_FEEL_LABELS[feel]}
            active={checkIn?.feel === feel}
            onPress={() => onChange((c) => ({ feel: c.feel === feel ? null : feel }))}
          />
        ))}
      </View>
      <View style={styles.sleepRow}>
        <Text style={styles.label}>{RUN_SLEEP_LABEL}</Text>
        {sleep === null ? (
          <Pill raised label={RUN_SLEEP_UNSET} active={false} accessibilityLabel={`${RUN_SLEEP_LABEL}: ${RUN_SLEEP_UNSET}`} onPress={() => onChange({ sleepHours: RUN_SLEEP_START_H })} />
        ) : (
          <Stepper
            label={`${sleep} h`}
            minusLabel={RUN_LESS_SLEEP}
            plusLabel={RUN_MORE_SLEEP}
            onMinus={() => stepSleep(-RUN_SLEEP_STEP_H)}
            onPlus={() => stepSleep(RUN_SLEEP_STEP_H)}
          />
        )}
      </View>
      <View style={styles.pills}>
        <Pill raised label={RUN_LEGS_SORE_LABEL} active={!!checkIn?.legsSore} onPress={() => onChange((c) => ({ legsSore: !c.legsSore }))} />
        <Pill raised label={RUN_PAIN_LABEL} active={!!checkIn?.pain} onPress={() => onChange((c) => ({ pain: !c.pain }))} />
        <Pill raised label={RUN_SICK_LABEL} active={!!checkIn?.sick} onPress={() => onChange((c) => ({ sick: !c.sick }))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACE.lg,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  title: {
    ...TYPE.rowSemibold,
  },
  note: {
    marginTop: SPACE.xs,
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
  pills: {
    marginTop: SPACE.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACE.sm,
  },
  sleepRow: {
    marginTop: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...TYPE.body,
  },
});
