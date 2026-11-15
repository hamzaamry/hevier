import { Pressable, StyleSheet, Text } from 'react-native';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';

import { Divider } from './Divider';
import { COLORS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { ICON_SIZES, SAVE_WORKOUT_SIZES } from '@/constants/sizes';
import type { FormRowProps } from './types';

// Save Workout, Change Gym and Create Exercise rows. No side margins: the
// screen's content has them. Without an icon the label lines up with the edge;
// disabled rows are dimmed, with no › and no tap.
export function FormRow({ icon, label, value, disabled = false, onPress }: FormRowProps) {
  return (
    <>
      <Pressable style={[styles.row, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
        {icon}
        <Text style={[styles.label, !!icon && styles.labelAfterIcon]}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        {!disabled && <CaretRight size={ICON_SIZES.sm} color={COLORS.textSecondary} />}
      </Pressable>
      <Divider />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    height: SAVE_WORKOUT_SIZES.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    ...TYPE.row,
  },
  labelAfterIcon: {
    marginLeft: SPACE.md,
  },
  disabled: {
    opacity: 0.5,
  },
  value: {
    flexShrink: 1,
    marginLeft: SPACE.md,
    marginRight: SPACE.xs,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
});
