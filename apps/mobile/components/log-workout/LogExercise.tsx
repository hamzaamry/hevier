import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowsLeftRight } from 'phosphor-react-native/src/icons/ArrowsLeftRight';
import { Info } from 'phosphor-react-native/src/icons/Info';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { Timer } from 'phosphor-react-native/src/icons/Timer';
import { togglePerHand, usePerHand } from '@/stores/perHand';
import { setBadges } from '@/lib/format/setFormat';
import { ExerciseBlockHeader } from '@/components/set-table/ExerciseBlockHeader';
import { OptionRow } from '@/components/set-table/OptionRow';
import { SetTableHeader } from '@/components/set-table/SetTableHeader';
import { Button } from '@/components/ui/Button';
import { COLORS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, LOG_WORKOUT_SIZES } from '@/constants/sizes';
import { LOG_WORKOUT_LIMITS } from '@/constants/limits';
import { FOOTBALL_RATING_LABELS, RUN_EFFORT_LABEL, RUN_EFFORT_WORDS } from '@/constants/labels';
import { FOOTBALL_RATINGS } from '@/constants/football';
import { RUN_EFFORT_CHOICES } from '@/constants/run';
import { SET_FIELDS } from '@/constants/setFields';
import { restOf } from '@/db/workoutSettings';
import { restLabel } from '@/lib/format/duration';
import { setRecords } from '@/lib/stats/records';
import { shouldAskEffort, shouldAskRating, shouldAskRepsLeft } from '@/lib/workout/activeWorkout';
import { SetRow } from './SetRow';
import type { LogExerciseProps } from './types';

// One exercise of the live workout: header, rest and per-hand rows, the set
// table, the reps-left / how-hard chips and Add Set.
// memo: redrawn only when its exercise (or the settings, or its ▶ timer) changes.
export const LogExercise = memo(function LogExercise({ exercise, settings, timer, actions }: LogExerciseProps) {
  const fields = SET_FIELDS[exercise.type];
  // Dumbbell weight per hand (db/perHand/perHand.ts): its own row switches it; null = no switch.
  const perHand = usePerHand(exercise.exerciseId);
  const last = exercise.sets[exercise.sets.length - 1];
  const badges = setBadges(exercise.sets.map((s) => s.setType));
  return (
    <View style={styles.exercise}>
      {/* Picture and name open the exercise page, as on the routine page. */}
      <ExerciseBlockHeader
        name={exercise.name}
        catalogueId={exercise.catalogueId}
        notes={exercise.notes}
        onNotes={(notes) => actions.notes(exercise.key, notes)}
        onMenu={() => actions.menu(exercise.key)}
        onOpen={() => actions.open(exercise.exerciseId)}
      />

      <OptionRow
        icon={<Timer size={ICON_SIZES.lg} weight="light" color={COLORS.primary} />}
        label={`Rest Timer: ${restLabel(restOf(exercise.restSeconds, settings))}`}
        onPress={() => actions.rest(exercise.key)}
      />

      {perHand !== null && (
        <OptionRow
          icon={<ArrowsLeftRight size={ICON_SIZES.lg} weight="light" color={COLORS.primary} />}
          label={`Weight: ${perHand ? 'Per hand' : 'Total'}`}
          onPress={() => togglePerHand(exercise.exerciseId)}
          style={styles.perHandRow}
        />
      )}

      <SetTableHeader fields={fields} perHand={!!perHand} layout="log" style={styles.tableHeader} />

      {exercise.sets.map((set, index) => (
        <SetRow
          key={set.key}
          exerciseKey={exercise.key}
          type={exercise.type}
          set={set}
          badge={badges[index]}
          previous={exercise.previous[index]}
          perHand={!!perHand}
          medal={set.done && setRecords(exercise.type, exercise.bests ?? null, exercise.sets, set.key).length > 0}
          showPlay={exercise.type === 'duration' && settings.inlineTimer}
          timerStartedAt={timer?.setKey === set.key ? timer.startedAt : null}
          actions={actions}
        />
      ))}

      {/* One tap, or ignore it. Tap again to clear. */}
      {last && shouldAskRepsLeft(fields, last, settings) && (
        <View style={styles.chips}>
          <Pressable style={styles.chipsLabel} onPress={actions.repsLeftInfo} hitSlop={HIT_SLOPS.md}>
            <Text style={styles.hint}>Reps left?</Text>
            <Info size={ICON_SIZES.sm} color={COLORS.textSecondary} />
          </Pressable>
          {LOG_WORKOUT_LIMITS.repsLeftChoices.map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, last.rir === n && styles.chipOn]}
              onPress={() => actions.setChange(exercise.key, last.key, { rir: last.rir === n ? null : n })}
              hitSlop={HIT_SLOPS.xs}>
              <Text style={styles.chipText}>{n === 4 ? '4+' : n}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {last && shouldAskRating(exercise) && (
        <View style={styles.chips}>
          <Text style={[styles.hint, styles.chipsLabel]}>How hard?</Text>
          {FOOTBALL_RATINGS.map((r) => (
            <Pressable
              key={r}
              style={[styles.chip, styles.ratingChip, last.rating === r && styles.chipOn]}
              onPress={() => actions.setChange(exercise.key, last.key, { rating: last.rating === r ? null : r })}
              hitSlop={HIT_SLOPS.xs}>
              <Text style={styles.chipText}>{FOOTBALL_RATING_LABELS[r]}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {last && shouldAskEffort(exercise) && (
        <View style={styles.chips}>
          <Text style={[styles.hint, styles.chipsLabel]}>{RUN_EFFORT_LABEL}</Text>
          {RUN_EFFORT_CHOICES.map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, last.effort === n && styles.chipOn]}
              onPress={() => actions.setChange(exercise.key, last.key, { effort: last.effort === n ? null : n })}
              hitSlop={HIT_SLOPS.md}
              accessibilityRole="button"
              accessibilityLabel={`${n}, ${RUN_EFFORT_WORDS[n]}`}
              accessibilityState={{ selected: last.effort === n }}>
              <Text style={styles.chipText}>{n}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <Button
        label="Add Set"
        variant="secondary"
        size="compact"
        icon={<Plus size={ICON_SIZES.lg} color={COLORS.text} />}
        style={styles.addSet}
        onPress={() => actions.addSet(exercise.key)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  exercise: {
    paddingTop: SPACE.md,
    paddingBottom: SPACE.lg,
  },
  perHandRow: {
    marginTop: SPACE.sm,
  },
  tableHeader: {
    marginBottom: SPACE.xs,
  },
  chips: {
    marginTop: SPACE.sm,
    marginHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.sm,
  },
  chipsLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  hint: {
    ...TYPE.callout,
    color: COLORS.textSecondary,
  },
  chip: {
    width: LOG_WORKOUT_SIZES.repsLeftChipWidth,
    height: LOG_WORKOUT_SIZES.repsLeftChipHeight,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  ratingChip: {
    width: undefined,
    paddingHorizontal: SPACE.md,
  },
  chipOn: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    ...TYPE.callout,
  },
  addSet: {
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
});
