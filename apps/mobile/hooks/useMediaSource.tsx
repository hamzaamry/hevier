import { useState } from 'react';
import { Camera } from 'phosphor-react-native/src/icons/Camera';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';

import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import { pickMedia, takeMedia } from '@/lib/workoutMedia';
import type { MediaItem } from '@/types/workout';

// "+ Add" on a saved workout's photos: a sheet to choose the gallery or the
// camera, then what was picked goes to `onPicked`.
export function useMediaSource(onPicked: (items: MediaItem[]) => void) {
  const [visible, setVisible] = useState(false);
  // The picker opens once the sheet has slid away.
  const afterSheet = useAfterSheetClose();

  function choose(pick: () => Promise<MediaItem[] | null>) {
    afterSheet.later(async () => {
      try {
        const items = await pick();
        if (items) onPicked(items);
      } catch (e) {
        console.warn('[media] pick failed', e);
      }
    });
    setVisible(false);
  }

  const sheet = (
    <BottomSheet visible={visible} onDismiss={() => setVisible(false)} onClosed={afterSheet.onClosed}>
      <SheetItem first icon={<ImageSquare {...sheetIcon} />} label="Gallery" onPress={() => choose(pickMedia)} />
      <SheetItem icon={<Camera {...sheetIcon} />} label="Camera" onPress={() => choose(takeMedia)} />
    </BottomSheet>
  );

  return { open: () => setVisible(true), sheet };
}
