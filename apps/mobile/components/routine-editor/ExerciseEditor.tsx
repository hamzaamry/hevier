import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ArrowsLeftRight } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { Timer } from 'phosphor-react-native/src/icons/Timer';
import { togglePerHand, usePerHand } from '@/stores/perHand';
import { setBadges } from '@/lib/format/setFormat';
import { ExerciseBlockHeader } from '@/components/set-table/ExerciseBlockHeader';
import { OptionRow } from '@/components/set-table/OptionRow';
import { SetBadge } from '@/components/set-table/SetBadge';
import { PreviousCell, SetInputs } from '@/components/set-table/SetInputs';
import { SetTableHeader } from '@/components/set-table/SetTableHeader';
import { SET_COLUMNS } from '@/components/set-table/columns';
import { Button } from '@/components/ui/Button';
import { COLORS } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, SIZES } from '@/constants/sizes';
import { SET_FIELDS } from '@/constants/setFields';
import { restLabel } from '@/lib/format/duration';
import type { ExerciseEditorProps } from './types';

// One exercise in the routine editor: header, rest and per-hand rows, its sets.
// memo, and every callback takes keys: typing in a set redraws only this exercise.
export const ExerciseEditor = memo(function ExerciseEditor({
  exercise,
  onNotes,
  onRest,
  onMenu,
  onSetMenu,
  onSetChange,
  onAddSet,
  hideRest,
}: ExerciseEditorProps) {
  const key = exercise.key;
  const fields = SET_FIELDS[exercise.type];
  const badges = setBadges(exercise.sets.map((s) => s.setType));
  // Dumbbell weight per hand (db/perHand/perHand.ts): its own row switches it; null = no switch.
  const perHand = usePerHand(exercise.exerciseId);
  return (
    <View style={styles.exercise}>
      <ExerciseBlockHeader
        name={exercise.name}
        catalogueId={exercise.catalogueId}
        notes={exercise.notes ?? ''}
        onNotes={(notes) => onNotes(key, notes)}
        onMenu={() => onMenu(key)}
      />

      {onRest && !hideRest && (
        <OptionRow
          icon={<Timer size={ICON_SIZES.lg} weight="light" color={COLORS.primary} />}
          label={`Rest Timer: ${restLabel(exercise.restSeconds)}`}
          onPress={() => onRest(key)}
        />
      )}

      {perHand !== null && (
        <OptionRow
          icon={<ArrowsLeftRight size={ICON_SIZES.lg} weight="light" color={COLORS.primary} />}
          label={`Weight: ${perHand ? 'Per hand' : 'Total'}`}
          onPress={() => togglePerHand(exercise.exerciseId)}
          style={onRest && styles.perHandRow}
        />
      )}

      <SetTableHeader fields={fields} perHand={!!perHand} layout="editor" />

      {exercise.sets.map((set, index) => (
        <View key={set.key} style={styles.setRow}>
          <Pressable style={[styles.setBox, SET_COLUMNS.editor.set]} onPress={() => onSetMenu(key, set.key)}>
            <SetBadge setType={set.setType} label={badges[index]} />
          </Pressable>
          <PreviousCell type={exercise.type} previous={exercise.previous[index]} perHand={!!perHand} layout="editor" />
          <SetInputs
            type={exercise.type}
            set={set}
            perHand={!!perHand}
            layout="editor"
            onChange={(change) => onSetChange(key, set.key, change)}
          />
        </View>
      ))}

      <Button
        label="Add Set"
        variant="secondary"
        size="compact"
        icon={<Plus size={ICON_SIZES.lg} color={COLORS.text} />}
        style={styles.addSet}
        onPress={() => onAddSet(key)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  exercise: {
    paddingTop: SPACE.xl,
  },
  perHandRow: {
    marginTop: SPACE.sm,
  },
  setRow: {
    marginTop: SPACE.md,
    height: SIZES.setRowHeight,
  },
  setBox: {
    height: SIZES.setRowHeight,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  addSet: {
    marginTop: SPACE.xl,
    marginHorizontal: LAYOUT.screenMargin,
  },
});
