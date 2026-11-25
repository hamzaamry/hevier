import { Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { supersetBlocks } from '@/lib/workout/supersets';

// A superset is one card: the word once on top, its exercises stacked with a
// "No rest" line between them. Only the last exercise shows its rest timer
// (`hideRest` is true for the others). A lone exercise stays on the page as is.
// Every exercise is keyed by `keyOf`, so adding, removing or pairing one
// doesn't redraw the others from scratch.

interface SupersetBlocksProps<T> {
  exercises: T[];
  keyOf: (exercise: T) => string | number;
  renderExercise: (exercise: T, hideRest: boolean) => ReactNode;
  padded?: boolean; // the screen already has side margins and its exercises don't pad themselves
}

export function SupersetBlocks<T extends { supersetId: string | null }>({
  exercises,
  keyOf,
  renderExercise,
  padded = false,
}: SupersetBlocksProps<T>) {
  return supersetBlocks(exercises).map(({ supersetId, exercises: members }) => {
    if (!supersetId) {
      const [exercise] = members; // a block with no superset is always one exercise
      return <Fragment key={keyOf(exercise)}>{renderExercise(exercise, false)}</Fragment>;
    }
    const caption = [styles.caption, padded && styles.captionPadded];
    return (
      <View key={`superset-${supersetId}`} style={[styles.card, padded && styles.cardPadded]}>
        <Text style={caption}>Superset</Text>
        {members.map((exercise, i) => (
          <Fragment key={keyOf(exercise)}>
            {i > 0 && <Text style={caption}>No rest</Text>}
            {renderExercise(exercise, i < members.length - 1)}
          </Fragment>
        ))}
      </View>
    );
  });
}

// The "Superset" and "No rest" captions, shared with the feed card.
export const supersetTextStyle = {
  ...TYPE.caption,
  color: COLORS.textSecondary,
  textTransform: 'uppercase' as const,
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACE.sm,
    marginTop: SPACE.md,
    paddingBottom: SPACE.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  cardPadded: {
    marginHorizontal: 0,
    paddingHorizontal: SPACE.md,
  },
  caption: {
    ...supersetTextStyle,
    marginHorizontal: LAYOUT.screenMargin,
    marginTop: SPACE.md,
  },
  captionPadded: {
    marginHorizontal: 0,
  },
});
