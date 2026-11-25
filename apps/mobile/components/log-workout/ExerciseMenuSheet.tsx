import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { ArrowsDownUp } from 'phosphor-react-native/src/icons/ArrowsDownUp';
import { X } from 'phosphor-react-native/src/icons/X';
import { SupersetMenuItem } from '@/components/set-table/SupersetMenu';
import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { COLORS } from '@/constants/theme';
import { ICON_SIZES } from '@/constants/sizes';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import { removeExercise } from './workoutOps';
import type { ExerciseMenuSheetProps } from './types';

// An exercise's ⋮ menu: no title.
// Reorder, Replace and Add To Superset open once the sheet has slid away.
export function ExerciseMenuSheet({
  exerciseKey,
  exercises,
  onDismiss,
  onReorder,
  onReplace,
  onAddToSuperset,
  onRemoveFromSuperset,
}: ExerciseMenuSheetProps) {
  const after = useAfterSheetClose();
  return (
    <BottomSheet visible={exerciseKey !== null} onDismiss={onDismiss} onClosed={after.onClosed}>
      <SheetItem
        first
        icon={<ArrowsDownUp {...sheetIcon} />}
        label="Reorder Exercises"
        onPress={() => {
          after.later(onReorder);
          onDismiss();
        }}
      />
      <SheetItem
        icon={<ArrowsClockwise {...sheetIcon} />}
        label="Replace Exercise"
        onPress={() => {
          if (exerciseKey) after.later(() => onReplace(exerciseKey));
          onDismiss();
        }}
      />
      <SupersetMenuItem
        exerciseKey={exerciseKey}
        exercises={exercises}
        later={after.later}
        onDismiss={onDismiss}
        onAdd={onAddToSuperset}
        onRemove={onRemoveFromSuperset}
      />
      <SheetItem
        icon={<X {...sheetIcon} size={ICON_SIZES.lg} color={COLORS.danger} />}
        label="Remove Exercise"
        destructive
        onPress={() => {
          if (exerciseKey) removeExercise(exerciseKey);
          onDismiss();
        }}
      />
    </BottomSheet>
  );
}
