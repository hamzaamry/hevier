import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { X } from 'phosphor-react-native/src/icons/X';
import { SupersetMenuItem } from '@/components/set-table/SupersetMenu';
import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { COLORS } from '@/constants/theme';
import { ICON_SIZES } from '@/constants/sizes';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import type { EditorExerciseMenuProps } from './types';

// An exercise's ⋮ in the editor: no title, as Log Workout's
// (log-workout-exercise-menu.jpg). Replace and Add To Superset open once it has
// slid away.
export function EditorExerciseMenu({
  exerciseKey,
  exercises,
  onDismiss,
  onReplace,
  onRemove,
  onAddToSuperset,
  onRemoveFromSuperset,
}: EditorExerciseMenuProps) {
  const after = useAfterSheetClose();
  return (
    <BottomSheet visible={exerciseKey !== null} onDismiss={onDismiss} onClosed={after.onClosed}>
      <SheetItem
        first
        icon={<ArrowsClockwise {...sheetIcon} />}
        label="Replace Exercise"
        onPress={() => {
          if (exerciseKey !== null) after.later(() => onReplace(exerciseKey));
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
          if (exerciseKey !== null) onRemove(exerciseKey);
          onDismiss();
        }}
      />
    </BottomSheet>
  );
}
