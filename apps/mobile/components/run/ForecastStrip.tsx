import { StyleSheet, Text, View } from 'react-native';

import { COLORS, RUN_COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { RUN_SIZES } from '@/constants/sizes';
import {
  RUN_FORECAST_NOTE,
  RUN_FORECAST_TITLE,
  RUN_NEXT_EASY,
  RUN_NEXT_NONE,
  RUN_NEXT_QUALITY,
  RUN_VERDICT_SHORT,
} from '@/constants/runCopy';
import { firstAtLeast } from '@/lib/training/runReadiness';
import { weekdayShort } from '@/lib/format/run';
import type { Readiness } from '@/types/run';
import type { ForecastStripProps } from './types';

// The next mornings at a glance, assuming no more lifting or running (so what a
// leg day tonight costs shows up here), and the first easy and quality mornings.
export function ForecastStrip({ days }: ForecastStripProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{RUN_FORECAST_TITLE}</Text>
      <View style={styles.row}>
        {days.map((d) => (
          <View key={d.slotMs} style={styles.day}>
            <Text style={styles.weekday}>{weekdayShort(d.slotMs)}</Text>
            <View style={[styles.dot, { backgroundColor: RUN_COLORS[d.verdict] }]} />
            <Text style={styles.verdict}>{RUN_VERDICT_SHORT[d.verdict]}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.next}>
        {RUN_NEXT_EASY}: <Text style={styles.when}>{whenOf(firstAtLeast(days, 'easy'))}</Text>
      </Text>
      <Text style={styles.next}>
        {RUN_NEXT_QUALITY}: <Text style={styles.when}>{whenOf(firstAtLeast(days, 'quality'))}</Text>
      </Text>
      <Text style={styles.note}>{RUN_FORECAST_NOTE}</Text>
    </View>
  );
}

function whenOf(day: Readiness | null): string {
  return day ? weekdayShort(day.slotMs) : RUN_NEXT_NONE;
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
  row: {
    marginTop: SPACE.lg,
    marginBottom: SPACE.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: SPACE.sm,
  },
  weekday: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  dot: {
    width: RUN_SIZES.forecastDot,
    height: RUN_SIZES.forecastDot,
    borderRadius: RADIUS.round,
  },
  verdict: {
    ...TYPE.mini,
  },
  next: {
    marginTop: SPACE.sm,
    ...TYPE.callout,
    color: COLORS.textSecondary,
  },
  when: {
    ...TYPE.calloutMedium,
    color: COLORS.text,
  },
  note: {
    marginTop: SPACE.md,
    ...TYPE.small,
    color: COLORS.textSecondary,
  },
});
