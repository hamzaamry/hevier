import { memo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, RADIUS, SPACE } from '@/constants/layout';
import { SIZES } from '@/constants/sizes';
import type { PillProps } from './types';

// Pills are 27.8 tall: this brings the tap area to about 44.
const PILL_HIT_SLOP = { top: HIT_SLOPS.md, bottom: HIT_SLOPS.md, left: HIT_SLOPS.xs, right: HIT_SLOPS.xs };

// A round-ended choice button: grey, or blue when on.
export const Pill = memo(function Pill({ label, active, onPress, raised, accessibilityLabel }: PillProps) {
  return (
    <Pressable
      style={[styles.pill, raised && styles.raised, active && styles.active]}
      onPress={onPress}
      hitSlop={PILL_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: active }}>
      <Text style={TYPE.body}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pill: {
    height: SIZES.pillHeight,
    paddingHorizontal: SPACE.lg,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  raised: {
    backgroundColor: COLORS.raised,
  },
  active: {
    backgroundColor: COLORS.primary,
  },
});
