import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, LINE_HEIGHTS, RUN_COLORS, TYPE, withAlpha } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { RUN_SIZES } from '@/constants/sizes';
import { RUN_WHY_PREVIEW } from '@/constants/run';
import {
  RUN_CANNOT_SEE,
  RUN_CARD_KICKER,
  RUN_CONFIDENCE,
  RUN_NOTHING_FLAGGED,
  RUN_PROVISIONAL,
  RUN_PROVISIONAL_TODAY,
  RUN_VERDICT_TITLES,
  RUN_WHY_LESS,
  RUN_WHY_MORE,
  RUN_WHY_TITLE,
} from '@/constants/runCopy';
import { Divider } from '@/components/ui/Divider';
import { dayKey } from '@/lib/date';
import { effortLines, gateReason, slotLabel, verdictLine } from '@/lib/format/run';
import type { ReadinessCardProps } from './types';

// The call for the next run slot: the verdict, one sentence, how hard to run, the
// reasons it came out that way, and what the estimate cannot see.
export function ReadinessCard({ readiness, now }: ReadinessCardProps) {
  const [showAll, setShowAll] = useState(false);
  const color = RUN_COLORS[readiness.verdict];
  const reasons = readiness.gates.map(gateReason);
  const shown = showAll ? reasons : reasons.slice(0, RUN_WHY_PREVIEW);
  const today = dayKey(new Date(readiness.slotMs)) === dayKey(now);

  return (
    <View style={styles.card}>
      <Text style={styles.kicker}>
        {RUN_CARD_KICKER}: {slotLabel(readiness.slotMs, now)}
      </Text>
      <View style={[styles.chip, { backgroundColor: withAlpha(color, 0.16) }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.verdict, { color }]}>{RUN_VERDICT_TITLES[readiness.verdict]}</Text>
      </View>
      <Text style={styles.line}>{verdictLine(readiness)}</Text>
      {readiness.provisional && <Text style={styles.note}>{today ? RUN_PROVISIONAL_TODAY : RUN_PROVISIONAL}</Text>}

      {effortLines(readiness).map((text) => (
        <Text key={text} style={styles.effort}>
          {text}
        </Text>
      ))}

      <View style={styles.divider}>
        <Divider />
      </View>
      <View style={styles.whyHeader}>
        <Text style={styles.whyTitle}>{RUN_WHY_TITLE}</Text>
        {reasons.length > RUN_WHY_PREVIEW && (
          <Pressable
            onPress={() => setShowAll(!showAll)}
            hitSlop={HIT_SLOPS.xl}
            accessibilityRole="button"
            accessibilityLabel={RUN_WHY_TITLE}
            accessibilityState={{ expanded: showAll }}>
            <Text style={styles.more}>{showAll ? RUN_WHY_LESS : RUN_WHY_MORE}</Text>
          </Pressable>
        )}
      </View>
      {shown.length === 0 ? <Text style={styles.reason}>{RUN_NOTHING_FLAGGED}</Text> : null}
      {shown.map((text) => (
        <Text key={text} style={styles.reason}>
          {text}
        </Text>
      ))}

      <Text style={styles.note}>{RUN_CONFIDENCE[readiness.confidence]}</Text>
      <Text style={styles.note}>{RUN_CANNOT_SEE}</Text>
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
  kicker: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  chip: {
    marginTop: SPACE.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.pill,
  },
  dot: {
    width: RUN_SIZES.verdictDot,
    height: RUN_SIZES.verdictDot,
    borderRadius: RADIUS.round,
  },
  verdict: {
    ...TYPE.headlineBold,
  },
  line: {
    marginTop: SPACE.md,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  effort: {
    marginTop: SPACE.md,
    ...TYPE.callout,
    lineHeight: LINE_HEIGHTS.snug,
    color: COLORS.textSecondary,
  },
  divider: {
    marginTop: SPACE.lg,
    marginBottom: SPACE.md,
  },
  whyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whyTitle: {
    ...TYPE.rowSemibold,
  },
  more: {
    ...TYPE.callout,
    color: COLORS.primary,
  },
  reason: {
    marginTop: SPACE.sm,
    ...TYPE.callout,
    lineHeight: LINE_HEIGHTS.snug,
  },
  note: {
    marginTop: SPACE.md,
    ...TYPE.small,
    lineHeight: LINE_HEIGHTS.snug,
    color: COLORS.textSecondary,
  },
});
