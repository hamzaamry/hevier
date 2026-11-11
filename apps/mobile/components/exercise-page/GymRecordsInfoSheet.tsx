import { StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import type { GymRecordsInfoSheetProps } from './types';

export function GymRecordsInfoSheet({ visible, gymName, onDismiss }: GymRecordsInfoSheetProps) {
  return (
    <BottomSheet visible={visible} title="Records per gym" onDismiss={onDismiss}>
      <View style={styles.body}>
        <Text style={styles.text}>
          Machine and cable weights differ from one gym to another, so these records only count your workouts at {gymName}.
        </Text>
        <Text style={styles.text}>On the chart, the yellow dashed line marks a gym change. Workouts at other gyms are faded.</Text>
        <Text style={styles.text}>{'"All gyms" is your best over every gym.'}</Text>
        <Text style={[styles.text, styles.note]}>Change your gym in Settings → Gym.</Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    padding: SPACE.lg,
    gap: SPACE.md,
  },
  text: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  note: {
    color: COLORS.textSecondary,
  },
});
