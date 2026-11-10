import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';

import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { GYM_SIZES, ICON_SIZES } from '@/constants/sizes';
import { stretchLabel } from '@/lib/gym/timeline';
import type { GymTimelineRowProps } from './types';

// One stretch of the Gym screen's history: a dot on a line (blue for the
// current gym), the gym's name with its dates and workouts, and ⋯.
export function GymTimelineRow({ stretch, first, last, onMenu }: GymTimelineRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.railColumn}>
        {/* The line runs through the row, and starts and ends at the first and last dot. */}
        <View style={[styles.rail, first && styles.railFirst, last && styles.railLast, first && last && styles.railNone]} />
        <View style={[styles.dot, stretch.current && styles.dotCurrent]} />
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {stretch.name}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {stretchLabel(stretch)}
        </Text>
      </View>
      <Pressable style={styles.menu} onPress={() => onMenu(stretch)}>
        <DotsThree size={ICON_SIZES.xxl} weight="bold" color={COLORS.textSecondary} />
      </Pressable>
    </View>
  );
}

const DOT_TOP = SPACE.lg;

const styles = StyleSheet.create({
  row: {
    paddingLeft: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  railColumn: {
    width: GYM_SIZES.railColumn,
    alignItems: 'center',
  },
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: GYM_SIZES.rail,
    backgroundColor: COLORS.separator,
  },
  railFirst: {
    top: DOT_TOP + GYM_SIZES.dot / 2,
  },
  railLast: {
    bottom: undefined,
    height: DOT_TOP + GYM_SIZES.dot / 2,
  },
  railNone: {
    display: 'none',
  },
  dot: {
    marginTop: DOT_TOP,
    width: GYM_SIZES.dot,
    height: GYM_SIZES.dot,
    borderRadius: GYM_SIZES.dot / 2,
    backgroundColor: COLORS.track,
  },
  dotCurrent: {
    backgroundColor: COLORS.primary,
  },
  text: {
    flex: 1,
    marginLeft: SPACE.md,
    paddingVertical: SPACE.md,
  },
  name: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  label: {
    marginTop: SPACE.xs,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  menu: {
    width: GYM_SIZES.menuHit,
    height: GYM_SIZES.menuHit,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
