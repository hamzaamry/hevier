import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'phosphor-react-native/src/icons/Check';

import { COLORS, TYPE } from '@/constants/theme';
import { BORDER_WIDTHS, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, RUN_SIZES } from '@/constants/sizes';
import { RUN_EFFORT_WORDS } from '@/constants/labels';
import { RUN_EFFORT_CHOICES, RUN_EFFORT_SCALE_ROWS } from '@/constants/run';
import { RUN_EFFORT_OTHER } from '@/constants/runCopy';
import type { EffortPickerProps } from './types';

// How hard a run felt: five choices with the talk test in words, or any number
// on the 1–10 scale. Tap the picked one again to clear it.
export function EffortPicker({ value, onChange }: EffortPickerProps) {
  const pick = (n: number) => onChange(value === n ? null : n);
  return (
    <View>
      {RUN_EFFORT_CHOICES.map((n) => (
        <Pressable
          key={n}
          style={[styles.choice, value === n && styles.choiceOn]}
          onPress={() => pick(n)}
          accessibilityRole="button"
          accessibilityLabel={`${n}, ${RUN_EFFORT_WORDS[n]}`}
          accessibilityState={{ selected: value === n }}>
          <Text style={styles.number}>{n}</Text>
          <Text style={styles.words}>{RUN_EFFORT_WORDS[n]}</Text>
          {value === n && <Check size={ICON_SIZES.md} weight="bold" color={COLORS.primary} />}
        </Pressable>
      ))}
      <Text style={styles.other}>{RUN_EFFORT_OTHER}</Text>
      {RUN_EFFORT_SCALE_ROWS.map((row) => (
        <View key={row[0]} style={styles.scale}>
          {row.map((n) => (
            <Pressable
              key={n}
              style={[styles.chip, value === n && styles.chipOn]}
              onPress={() => pick(n)}
              accessibilityRole="button"
              accessibilityLabel={String(n)}
              accessibilityState={{ selected: value === n }}>
              <Text style={TYPE.body}>{n}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  choice: {
    height: RUN_SIZES.effortChipHeight,
    marginTop: SPACE.sm,
    paddingHorizontal: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    borderRadius: RADIUS.md,
    borderWidth: BORDER_WIDTHS.hairline,
    borderColor: COLORS.surface,
    backgroundColor: COLORS.surface,
  },
  choiceOn: {
    borderColor: COLORS.primary,
  },
  number: {
    width: SPACE.xl,
    ...TYPE.rowSemibold,
  },
  words: {
    flex: 1,
    ...TYPE.body,
  },
  other: {
    marginTop: SPACE.lg,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  scale: {
    marginTop: SPACE.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    width: RUN_SIZES.touchTarget,
    height: RUN_SIZES.touchTarget,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  chipOn: {
    backgroundColor: COLORS.primary,
  },
});
