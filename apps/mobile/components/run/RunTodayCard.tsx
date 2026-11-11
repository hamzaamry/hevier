import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';

import { COLORS, LINE_HEIGHTS, RUN_COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, RUN_SIZES } from '@/constants/sizes';
import { PRESSED_OPACITY } from '@/constants/ui';
import { RUN_CARD_HOME_KICKER, RUN_CARD_NOTE_LINE, RUN_CARD_NOTE_TITLE, RUN_VERDICT_TITLES } from '@/constants/runCopy';
import { slotLabel, verdictLine } from '@/lib/format/run';
import type { RunTodayCardProps } from './types';

// The call for the next run slot in one line; a tap opens the run screen. Until the
// medical note there has been read, it shows no call at all.
export function RunTodayCard({ readiness, now, noteRead, onOpen }: RunTodayCardProps) {
  const color = noteRead ? RUN_COLORS[readiness.verdict] : COLORS.textSecondary;
  const title = noteRead ? RUN_VERDICT_TITLES[readiness.verdict] : RUN_CARD_NOTE_TITLE;
  const line = noteRead ? verdictLine(readiness) : RUN_CARD_NOTE_LINE;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${RUN_CARD_HOME_KICKER}, ${title}. ${line}`}>
      <View style={styles.top}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.kicker}>
          {RUN_CARD_HOME_KICKER}
          {noteRead ? ` · ${slotLabel(readiness.slotMs, now).toUpperCase()}` : ''}
        </Text>
        <CaretRight size={ICON_SIZES.sm} color={COLORS.textSecondary} />
      </View>
      <Text style={[styles.verdict, { color }]}>{title}</Text>
      <Text style={styles.line} numberOfLines={3}>
        {line}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACE.md,
    marginHorizontal: LAYOUT.screenMargin,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  dot: {
    width: RUN_SIZES.cardDot,
    height: RUN_SIZES.cardDot,
    borderRadius: RADIUS.round,
  },
  kicker: {
    flex: 1,
    ...TYPE.xsMedium,
    color: COLORS.textSecondary,
  },
  verdict: {
    marginTop: SPACE.sm,
    ...TYPE.headlineBold,
  },
  line: {
    marginTop: SPACE.xs,
    ...TYPE.callout,
    lineHeight: LINE_HEIGHTS.snug,
    color: COLORS.textSecondary,
  },
});
