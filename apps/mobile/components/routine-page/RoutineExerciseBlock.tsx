import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Timer } from 'phosphor-react-native/src/icons/Timer';

import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { setBadges } from '@/lib/format/setFormat';
import { SetBadge } from '@/components/set-table/SetBadge';
import { OptionRow } from '@/components/set-table/OptionRow';
import { COLORS, TYPE } from '@/constants/theme';
import { SET_FIELD_LABELS } from '@/constants/labels';
import { SPACE } from '@/constants/layout';
import { ICON_SIZES, ROUTINE_PAGE_SIZES, SIZES } from '@/constants/sizes';
import { clock, restLabel } from '@/lib/format/duration';
import { plannedNumber } from '@/lib/stats/routineMetrics';
import type { ExerciseType } from '@/types/exercise';
import type { PlannedColumn, RoutineExerciseBlockProps } from './types';

// Which columns each kind of exercise shows.
const COLUMNS: Record<ExerciseType, PlannedColumn[]> = {
  weight_reps: [
    { label: SET_FIELD_LABELS.weight, value: (s) => plannedNumber(s.weightKg) },
    { label: SET_FIELD_LABELS.reps, value: (s) => plannedNumber(s.reps) },
  ],
  reps_only: [{ label: SET_FIELD_LABELS.reps, value: (s) => plannedNumber(s.reps) }],
  duration: [{ label: SET_FIELD_LABELS.time, value: (s) => clock(s.durationSeconds) || '-' }],
  distance_duration: [
    { label: SET_FIELD_LABELS.km, value: (s) => plannedNumber(s.distanceKm) },
    { label: SET_FIELD_LABELS.time, value: (s) => clock(s.durationSeconds) || '-' },
  ],
};

// Value columns, positioned inside the 16dp padding (centres 123 and 230 from the screen edge).
const COLUMN_STYLES = [
  { left: ROUTINE_PAGE_SIZES.firstColumnLeft, width: ROUTINE_PAGE_SIZES.valueColumnWidth },
  { left: ROUTINE_PAGE_SIZES.secondColumnLeft, width: ROUTINE_PAGE_SIZES.valueColumnWidth },
] as const;

// One exercise of the routine: its picture and name (tap: the exercise page),
// the rest timer, then the planned sets.
export const RoutineExerciseBlock = memo(function RoutineExerciseBlock({ exercise, onOpen, hideRest }: RoutineExerciseBlockProps) {
  const columns = COLUMNS[exercise.type];
  const badges = setBadges(exercise.sets.map((s) => s.setType));
  const showRest = !!exercise.restSeconds && !hideRest;
  return (
    <View style={styles.exercise}>
      <Pressable style={styles.exerciseTitle} onPress={() => onOpen(exercise.exerciseId)}>
        <ExerciseThumb catalogueId={exercise.catalogueId} />
        <Text style={styles.exerciseName} numberOfLines={1}>
          {exercise.name}
        </Text>
      </Pressable>

      {showRest ? (
        <OptionRow
          icon={<Timer size={ICON_SIZES.lg} weight="light" color={COLORS.primary} />}
          label={`Rest Timer: ${restLabel(exercise.restSeconds)}`}
          style={styles.restRow}
        />
      ) : null}

      <View style={[styles.tableHeader, showRest ? styles.tableAfterRest : null]}>
        <Text style={[styles.cell, styles.setCell, styles.headerCell]}>SET</Text>
        {columns.map((c, i) => (
          <Text key={c.label} style={[styles.cell, COLUMN_STYLES[i], styles.headerCell]}>
            {c.label}
          </Text>
        ))}
      </View>
      {exercise.sets.map((set, i) => (
        <View key={set.setIndex} style={styles.setRow}>
          <SetBadge setType={set.setType} label={badges[i]} style={[styles.cell, styles.setCell]} />
          {columns.map((c, j) => (
            <Text key={c.label} style={[styles.cell, COLUMN_STYLES[j], styles.value]}>
              {c.value(set)}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  exercise: {
    marginBottom: SPACE.lg,
  },
  exerciseTitle: {
    marginTop: SPACE.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    flex: 1,
    marginLeft: SPACE.lg,
    ...TYPE.titleMedium,
    color: COLORS.primary,
  },
  restRow: {
    marginTop: SPACE.md,
  },
  tableHeader: {
    marginTop: SPACE.md,
    flexDirection: 'row',
    height: SIZES.tableHeaderHeight,
    alignItems: 'center',
  },
  tableAfterRest: {
    marginTop: SPACE.lg,
  },
  setRow: {
    flexDirection: 'row',
    height: ROUTINE_PAGE_SIZES.setRowHeight,
    alignItems: 'center',
  },
  cell: {
    position: 'absolute',
    textAlign: 'center',
  },
  // Column centres (from the screen edge): 35.4, 123, 230.
  setCell: {
    left: 0,
    width: ROUTINE_PAGE_SIZES.setCellWidth,
  },
  headerCell: {
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  value: {
    ...TYPE.body,
  },
});
