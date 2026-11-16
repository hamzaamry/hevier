import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { DotsThreeVertical } from 'phosphor-react-native/src/icons/DotsThreeVertical';
import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES, SIZES } from '@/constants/sizes';
import { NOTES_COLLAPSED_LINES } from '@/constants/ui';
import { isLongNote } from '@/lib/domain/exerciseNotes';
import type { ExerciseBlockHeaderProps } from './types';

// The top of an exercise in Log Workout and the editors: picture, blue name,
// ⋯ menu, and the notes box under them.
export function ExerciseBlockHeader({ name, catalogueId, notes, onNotes, onMenu, onOpen, foldLongNotes }: ExerciseBlockHeaderProps) {
  // Decided once when the exercise appears and then only by the user's taps, so
  // typing a long note never folds the box under the cursor.
  const [folded, setFolded] = useState(() => !!foldLongNotes && isLongNote(notes));
  const foldable = !!foldLongNotes && (folded || isLongNote(notes));
  const title = (
    <>
      <ExerciseThumb catalogueId={catalogueId} />
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </>
  );
  return (
    <>
      <View style={styles.titleRow}>
        {onOpen ? (
          <Pressable style={styles.open} onPress={onOpen}>
            {title}
          </Pressable>
        ) : (
          title
        )}
        <Pressable onPress={onMenu} hitSlop={HIT_SLOPS.lg}>
          <DotsThreeVertical size={ICON_SIZES.xxl} weight="bold" color={COLORS.text} />
        </Pressable>
      </View>

      {folded ? (
        <Pressable onPress={() => setFolded(false)}>
          <Text style={styles.notes} numberOfLines={NOTES_COLLAPSED_LINES}>
            {notes}
          </Text>
        </Pressable>
      ) : (
        <TextInput
          style={styles.notes}
          value={notes}
          onChangeText={onNotes}
          placeholder="Add notes here..."
          placeholderTextColor={COLORS.textSecondary}
          selectionColor={COLORS.primary}
          cursorColor={COLORS.primary}
          multiline
        />
      )}
      {foldable && (
        <Pressable onPress={() => setFolded(!folded)} hitSlop={HIT_SLOPS.lg} style={styles.toggle}>
          <Text style={styles.toggleText}>{folded ? 'Show more' : 'Show less'}</Text>
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACE.lg,
    paddingRight: SPACE.md,
  },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginLeft: SPACE.md,
    ...TYPE.titleMedium,
    color: COLORS.primary,
  },
  notes: {
    marginTop: SPACE.sm,
    marginHorizontal: LAYOUT.screenMargin,
    padding: 0,
    minHeight: SIZES.notesHeight,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  toggle: {
    alignSelf: 'flex-start',
    marginTop: SPACE.xs,
    marginHorizontal: LAYOUT.screenMargin,
  },
  toggleText: {
    ...TYPE.bodyMedium,
    color: COLORS.primary,
  },
});
