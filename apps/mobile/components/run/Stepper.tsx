import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Plus } from 'phosphor-react-native/src/icons/Plus';

import { COLORS, TYPE } from '@/constants/theme';
import { RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, RUN_SIZES } from '@/constants/sizes';
import type { StepperProps } from './types';

// − value +, for the sleep hours and the run time. The labels say what each button does.
export function Stepper({ label, minusLabel, plusLabel, onMinus, onPlus }: StepperProps) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.button} onPress={onMinus} accessibilityRole="button" accessibilityLabel={minusLabel}>
        <Minus size={ICON_SIZES.sm} weight="bold" color={COLORS.text} />
      </Pressable>
      <Text style={styles.label} accessibilityLiveRegion="polite">
        {label}
      </Text>
      <Pressable style={styles.button} onPress={onPlus} accessibilityRole="button" accessibilityLabel={plusLabel}>
        <Plus size={ICON_SIZES.sm} weight="bold" color={COLORS.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs,
  },
  button: {
    width: RUN_SIZES.touchTarget,
    height: RUN_SIZES.touchTarget,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.track,
  },
  label: {
    minWidth: RUN_SIZES.stepperLabel,
    textAlign: 'center',
    ...TYPE.bodyMedium,
  },
});
