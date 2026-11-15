import { StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { EXERCISE_PAGE_SIZES } from '@/constants/sizes';
import { ExerciseClip } from './ExerciseClip';
import { shared } from './styles';
import type { ExerciseTabProps } from './types';

// The catalogue's description and steps.
export function HowToTab({ detail }: ExerciseTabProps) {
  return (
    <>
      <ExerciseClip catalogueId={detail.catalogueId} media={detail.media} />
      <View style={shared.body}>
        <Text style={shared.name}>{detail.name}</Text>
        {detail.description ? <Text style={styles.howtoText}>{detail.description}</Text> : null}
        {detail.instructions.length === 0 && !detail.description && (
          <EmptyState message="No instructions for this exercise." note />
        )}
        {detail.instructions.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.howtoText}>{step}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  howtoText: {
    flex: 1,
    marginTop: SPACE.md,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  step: {
    flexDirection: 'row',
    gap: SPACE.md,
  },
  stepNumber: {
    marginTop: SPACE.md,
    width: EXERCISE_PAGE_SIZES.stepNumberWidth,
    ...TYPE.bodySemibold,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.primary,
  },
});
