import { Minus } from 'phosphor-react-native/src/icons/Minus';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { BottomSheet, SheetItem, SheetOption, sheetIcon } from '@/components/ui/BottomSheet';

// Add To Superset / Remove From Superset, shared by Log Workout's and the
// routine editor's exercise ⋮ menus, and the sheet that picks the partner.

interface SupersetMenuItemProps<K> {
  exerciseKey: K | null; // the exercise whose ⋮ was tapped
  exercises: { key: K; supersetId: string | null }[];
  later: (action: () => void) => void; // useAfterSheetClose: the picker opens once the menu has slid away
  onDismiss: () => void;
  onAdd: (exerciseKey: K) => void;
  onRemove: (exerciseKey: K) => void;
}

// Remove when the exercise is in a superset, Add when there is another to pair it with.
export function SupersetMenuItem<K extends string | number>({
  exerciseKey,
  exercises,
  later,
  onDismiss,
  onAdd,
  onRemove,
}: SupersetMenuItemProps<K>) {
  const inSuperset = !!exercises.find((e) => e.key === exerciseKey)?.supersetId;
  if (!inSuperset && exercises.length < 2) return null;
  return (
    <SheetItem
      icon={inSuperset ? <Minus {...sheetIcon} /> : <Plus {...sheetIcon} />}
      label={inSuperset ? 'Remove From Superset' : 'Add To Superset'}
      onPress={() => {
        if (exerciseKey !== null) {
          if (inSuperset) onRemove(exerciseKey);
          else later(() => onAdd(exerciseKey));
        }
        onDismiss();
      }}
    />
  );
}

interface SupersetPickerSheetProps<K> {
  exerciseKey: K | null; // the exercise waiting for its partner; null = closed
  exercises: { key: K; name: string }[];
  onPick: (exerciseKey: K, partnerKey: K) => void;
  onDismiss: () => void;
}

// Every other exercise of the workout or routine is offered.
export function SupersetPickerSheet<K extends string | number>({
  exerciseKey,
  exercises,
  onPick,
  onDismiss,
}: SupersetPickerSheetProps<K>) {
  const others = exercises.filter((e) => e.key !== exerciseKey);
  return (
    <BottomSheet visible={exerciseKey !== null} title="Add To Superset" onDismiss={onDismiss}>
      {others.map((e, i) => (
        <SheetOption
          key={e.key}
          first={i === 0}
          label={e.name}
          onPress={() => {
            onDismiss();
            if (exerciseKey !== null) onPick(exerciseKey, e.key);
          }}
        />
      ))}
    </BottomSheet>
  );
}
