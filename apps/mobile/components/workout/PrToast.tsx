import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { X } from 'phosphor-react-native/src/icons/X';

import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { COLORS, LINE_HEIGHTS, PR_COLORS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, PR_TOAST_SIZES, SIZES } from '@/constants/sizes';
import { PR_TOAST_MOTION } from '@/constants/motion';
import { GYM_LABELS } from '@/constants/labels';
import type { MedalProps, PrToastProps } from './types';

// Personal records while logging: a medal in the set box and a toast over the header.

const GOLD = PR_COLORS.gold; // the record line in the toast
const MEDAL = PR_COLORS.medal;
const RIBBON = PR_COLORS.ribbon;

// The medal: a gold disc over two ribbon tails. Pops in when the set is ticked.
// With `label` ("PR") written on the disc, as on the "Nice work!" cards.
export function Medal({ size = 28, label }: MedalProps) {
  const [scale] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, ...PR_TOAST_MOTION.medalSpring, useNativeDriver: true }).start();
  }, [scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M8.2 13.5 L4.6 21.2 L7.6 20.6 L9.4 23 L12 16.6 Z" fill={RIBBON} />
        <Path d="M15.8 13.5 L19.4 21.2 L16.4 20.6 L14.6 23 L12 16.6 Z" fill={RIBBON} />
        <Circle cx={12} cy={9.2} r={7.6} fill={MEDAL} />
        {label && (
          <SvgText x={12} y={11.6} fontSize={6.6} fontWeight="bold" fill={PR_COLORS.ink} textAnchor="middle">
            {label}
          </SvgText>
        )}
      </Svg>
    </Animated.View>
  );
}

// Drops in from above with a spring, stays a few seconds, slides back up.
// A new record replaces the one showing.
export function PrToast({ toast, onDone }: PrToastProps) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  function hide() {
    Animated.timing(progress, { toValue: 0, duration: PR_TOAST_MOTION.hideMs, useNativeDriver: true }).start(({ finished }) => {
      if (finished) onDoneRef.current();
    });
  }

  useEffect(() => {
    if (!toast) return;
    progress.setValue(0);
    Animated.spring(progress, { toValue: 1, ...PR_TOAST_MOTION.dropSpring, useNativeDriver: true }).start();
    const t = setTimeout(hide, PR_TOAST_MOTION.shownMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.id]);

  if (!toast) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-160, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Animated.View
      style={[styles.toast, { top: insets.top + 32.5, opacity: progress, transform: [{ translateY }, { scale }] }]}>
      <ExerciseThumb catalogueId={toast.catalogueId} size={PR_TOAST_SIZES.exerciseThumb} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {toast.name}
        </Text>
        {toast.records.map((r) => (
          <Text key={r.kind} style={styles.record} numberOfLines={1}>
            {r.label} - {r.value}
          </Text>
        ))}
        {toast.gym && (
          <Text style={styles.gym} numberOfLines={1}>
            {GYM_LABELS.recordsAt.toLowerCase()} {toast.gym}
          </Text>
        )}
      </View>
      <Pressable style={styles.close} onPress={hide} hitSlop={HIT_SLOPS.lg}>
        <X size={ICON_SIZES.xxs} weight="bold" color={COLORS.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: PR_TOAST_SIZES.toastLeft,
    right: PR_TOAST_SIZES.toastRight,
    minHeight: PR_TOAST_SIZES.toastMinHeight,
    paddingVertical: SPACE.sm,
    paddingLeft: SPACE.sm,
    paddingRight: SPACE.lg,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.raised,
    elevation: 8,
    zIndex: 10,
  },
  text: {
    flex: 1,
    marginLeft: SPACE.lg,
  },
  name: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  record: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: GOLD,
  },
  // Which gym the records are from, on machine and cable exercises.
  gym: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  // A small ✕ disc on the bottom-right corner, half outside the toast.
  close: {
    position: 'absolute',
    right: PR_TOAST_SIZES.closeRight,
    bottom: PR_TOAST_SIZES.closeBottom,
    width: SIZES.smallButton,
    height: SIZES.smallButton,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.raised,
  },
});
