import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { Medal } from '@/components/workout/PrToast';
import { usePerHand } from '@/stores/perHand';
import { setBadges, setValue } from '@/lib/format/setFormat';
import { SetBadge } from '@/components/set-table/SetBadge';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { EXERCISE_MENU_LABELS, WORKOUT_COLUMN_LABELS } from '@/constants/labels';
import { BORDER_WIDTHS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, SIZES, WORKOUT_PAGE_SIZES } from '@/constants/sizes';
import type { WorkoutExerciseBlockProps } from './types';

// One exercise of a saved workout, as on the routine page, with its sets in a
// striped table; sets that beat a record get a medal.
// Memoized: the menu sheet opening doesn't redraw every set table.
export const WorkoutExerciseBlock = memo(function WorkoutExerciseBlock({ exercise, onOpen }: WorkoutExerciseBlockProps) {
  const badges = setBadges(exercise.sets.map((s) => s.setType));
  const perHand = !!usePerHand(exercise.exerciseId);
  return (
    <View style={styles.exercise}>
      <Pressable style={styles.exerciseTitle} onPress={() => onOpen(exercise.exerciseId)}>
        <ExerciseThumb catalogueId={exercise.catalogueId} />
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.name}
        </Text>
        {exercise.archived && <Text style={styles.archived}>{EXERCISE_MENU_LABELS.archived}</Text>}
      </Pressable>
      {exercise.notes ? <Text style={styles.notes}>{exercise.notes}</Text> : null}

      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, styles.setCell]}>SET</Text>
        <Text style={styles.headerCell}>{WORKOUT_COLUMN_LABELS[exercise.type]}</Text>
      </View>
      {exercise.sets.map((set, i) => (
        <View key={i} style={[styles.setRow, i % 2 === 0 && styles.striped]}>
          <SetBadge setType={set.setType} label={badges[i]} style={styles.setCell} />
          <Text style={styles.value}>{setValue(exercise.type, set, perHand)}</Text>
          {set.record && <Medal size={ICON_SIZES.md} />}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  exercise: {
    marginTop: SPACE.md,
    marginBottom: SPACE.md,
  },
  exerciseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // A small outlined tag after the name.
  archived: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    borderWidth: BORDER_WIDTHS.thin,
    borderColor: COLORS.track,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACE.xs,
    marginLeft: SPACE.sm,
  },
  exerciseName: {
    flex: 1,
    marginLeft: SPACE.lg,
    ...TYPE.titleMedium,
    color: COLORS.primary,
  },
  notes: {
    marginTop: SPACE.sm,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  tableHeader: {
    marginTop: SPACE.md,
    height: SIZES.tableHeaderHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCell: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  // Centred in the first 38.8, as on the routine page.
  setCell: {
    width: WORKOUT_PAGE_SIZES.setCellWidth,
    marginRight: SPACE.md,
    textAlign: 'center',
  },
  // Rows run edge to edge so the stripes do.
  setRow: {
    height: WORKOUT_PAGE_SIZES.setRowHeight,
    marginHorizontal: -LAYOUT.screenMargin,
    paddingHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
  },
  striped: {
    backgroundColor: COLORS.surface,
  },
  value: {
    flex: 1,
    ...TYPE.body,
  },
});
