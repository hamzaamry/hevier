import { useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Archive } from 'phosphor-react-native/src/icons/Archive';
import { ArrowCounterClockwise } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { PencilSimple } from 'phosphor-react-native/src/icons/PencilSimple';

import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import { EXERCISE_MENU_LABELS as L } from '@/constants/labels';
import { COLORS } from '@/constants/theme';
import { HIT_SLOPS } from '@/constants/layout';
import { ICON_SIZES } from '@/constants/sizes';
import { archiveExercise, restoreExercise } from '@/db/exercises/write';
import type { ExerciseDetail } from '@/types/exercise';

// The ⋯ of an exercise the user made: Edit and Archive, or Restore once archived.
// Archiving leaves the page (the exercise is gone from the lists); restoring
// stays and calls onChanged to reload it.
export function useExerciseMenu(detail: ExerciseDetail | null, onChanged: () => void) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const afterMenu = useAfterSheetClose();
  const busy = useRef(false);

  function then(action: () => void) {
    afterMenu.later(action);
    setOpen(false);
  }

  async function run(write: (id: string) => Promise<void>, after: () => void) {
    if (!detail || busy.current) return;
    busy.current = true;
    try {
      await write(detail.id);
      after();
    } finally {
      busy.current = false;
    }
  }

  const button = detail?.userCreated ? (
    <Pressable onPress={() => setOpen(true)} hitSlop={HIT_SLOPS.md} accessibilityLabel={L.more}>
      <DotsThree size={ICON_SIZES.xxl} weight="bold" color={COLORS.text} />
    </Pressable>
  ) : null;

  const menu = detail?.userCreated ? (
    <>
      <BottomSheet visible={open} onDismiss={() => setOpen(false)} onClosed={afterMenu.onClosed}>
        {detail.archived ? (
          <SheetItem
            first
            icon={<ArrowCounterClockwise {...sheetIcon} />}
            label={L.restore}
            onPress={() => then(() => run(restoreExercise, onChanged))}
          />
        ) : (
          <>
            <SheetItem
              first
              icon={<PencilSimple {...sheetIcon} />}
              label={L.edit}
              onPress={() => then(() => router.push({ pathname: '/exercise-editor', params: { id: detail.id } }))}
            />
            <SheetItem
              icon={<Archive {...sheetIcon} color={COLORS.danger} />}
              label={L.archive}
              destructive
              onPress={() => then(() => setConfirming(true))}
            />
          </>
        )}
      </BottomSheet>
      <ConfirmDialog
        visible={confirming}
        message={L.archiveMessage(detail.name)}
        confirmLabel={L.archive}
        onConfirm={() =>
          run(archiveExercise, () => {
            setConfirming(false);
            router.back();
          })
        }
        onCancel={() => setConfirming(false)}
      />
    </>
  ) : null;

  return { button, menu };
}
