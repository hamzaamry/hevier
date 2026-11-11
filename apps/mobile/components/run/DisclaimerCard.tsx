import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { RUN_DISCLAIMER, RUN_DISCLAIMER_BUTTON, RUN_DISCLAIMER_TITLE } from '@/constants/runCopy';
import type { DisclaimerCardProps } from './types';

// The whole run screen until this has been read: the guidance is an estimate, not medical
// advice. No call is shown before it.
export function DisclaimerCard({ onAccept }: DisclaimerCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        {RUN_DISCLAIMER_TITLE}
      </Text>
      <Text style={styles.text}>{RUN_DISCLAIMER}</Text>
      <Button label={RUN_DISCLAIMER_BUTTON} onPress={onAccept} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACE.lg,
    padding: LAYOUT.cardPadding,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.surface,
  },
  title: {
    ...TYPE.titleSemibold,
  },
  text: {
    marginTop: SPACE.md,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  button: {
    marginTop: SPACE.xl,
  },
});
