import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';
import { Check } from 'phosphor-react-native/src/icons/Check';

import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ADD_EXERCISE_SIZES, ICON_SIZES } from '@/constants/sizes';
import type { PickerExercise } from '@/types/exercise';
import type { PickerRowProps } from './types';

// The picker's list rows and section headers.

export function rowKey(e: PickerExercise, i: number) {
  return `${e.id}-${i}`;
}

export function renderSectionHeader({ section }: { section: { title: string } }) {
  return section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : <View style={styles.sectionGap} />;
}

export const PickerRow = memo(function PickerRow({ exercise, selected, onPress, onInfo }: PickerRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && !selected && styles.rowPressed]}
      onPress={() => onPress(exercise)}>
      <View>
        {/* ponytail: user media shows only here and on the exercise page; thread media through the other queries if users ask */}
        <ExerciseThumb catalogueId={exercise.catalogueId} media={exercise.media} size={ADD_EXERCISE_SIZES.exerciseThumb} />
        {selected && (
          <View style={styles.badge}>
            <Check size={ICON_SIZES.xxs} weight="bold" color={COLORS.text} />
          </View>
        )}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.name} numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text style={styles.muscle} numberOfLines={1}>
          {exercise.muscle}
        </Text>
      </View>
      {onInfo ? (
        <Pressable style={styles.info} onPress={() => onInfo(exercise)} hitSlop={HIT_SLOPS.xl}>
          <View style={styles.infoDisc}>
            <Text style={styles.infoI}>i</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.info}>
          <CaretRight size={ICON_SIZES.md} color={COLORS.textSecondary} />
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  // "Recent Exercises": 62 from the filters to the first row.
  sectionTitle: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    lineHeight: LINE_HEIGHTS.normal,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
  },
  sectionGap: {
    height: ADD_EXERCISE_SIZES.sectionGapHeight,
  },
  // 80-tall rows: a 56 picture 16 in, name and muscle at 88.4, ⓘ 18 from the right.
  row: {
    height: ADD_EXERCISE_SIZES.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACE.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowSelected: {
    backgroundColor: COLORS.selectedRow,
  },
  rowPressed: {
    backgroundColor: COLORS.surface,
  },
  // Blue ✓ on the picture's top-right corner.
  badge: {
    position: 'absolute',
    top: ADD_EXERCISE_SIZES.badgeTop,
    right: ADD_EXERCISE_SIZES.badgeRight,
    width: ADD_EXERCISE_SIZES.badgeWidth,
    height: ADD_EXERCISE_SIZES.badgeHeight,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  rowText: {
    flex: 1,
    marginLeft: SPACE.lg,
  },
  name: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  muscle: {
    marginTop: SPACE.xs,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.textSecondary,
  },
  info: {
    width: ADD_EXERCISE_SIZES.infoWidth,
    alignItems: 'center',
  },
  // A grey disc with a light "i" (#2C2C2E / #ACAFB4).
  infoDisc: {
    width: ADD_EXERCISE_SIZES.infoDiscWidth,
    height: ADD_EXERCISE_SIZES.infoDiscHeight,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.separator,
  },
  infoI: {
    ...TYPE.xsBold,
    lineHeight: LINE_HEIGHTS.tight,
    color: COLORS.iconMuted,
  },
});
