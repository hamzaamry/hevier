import { Pressable, StyleSheet, Text } from 'react-native';
import { CaretRight } from 'phosphor-react-native/src/icons/CaretRight';

import { Divider } from './Divider';
import { COLORS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { ICON_SIZES, SAVE_WORKOUT_SIZES } from '@/constants/sizes';
import type { FormRowProps } from './types';

// Save Workout and Change Gym rows. No side margins: the screen's content has them.
export function FormRow({ icon, label, value, onPress }: FormRowProps) {
  return (
    <>
      <Pressable style={styles.row} onPress={onPress}>
        {icon}
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <CaretRight size={ICON_SIZES.sm} color={COLORS.textSecondary} />
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
    marginLeft: SPACE.md,
    ...TYPE.row,
  },
  value: {
    flexShrink: 1,
    marginLeft: SPACE.md,
    marginRight: SPACE.xs,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
});
