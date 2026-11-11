import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { ArrowsClockwise } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { ClipboardText } from 'phosphor-react-native/src/icons/ClipboardText';
import { PersonSimpleRun } from 'phosphor-react-native/src/icons/PersonSimpleRun';
import { Plus } from 'phosphor-react-native/src/icons/Plus';

import { ActionBar } from '@/components/ui/ActionBar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FolderAddIcon } from '@/components/ui/Icons';
import { NameDialog } from '@/components/ui/NameDialog';
import { AddRoutineBox, FolderHeader, RoutineCard } from '@/components/routines/RoutineList';
import { RoutineMenu } from '@/components/routines/RoutineMenu';
import { DragItem, DragScrollView, useRoutineDrag } from '@/components/routines/RoutineDrag';
import { useStartWorkout } from '@/hooks/useStartWorkout';
import { buildDragItems, routinesById } from '@/lib/routineDrop';
import { FolderMenuSheet } from '@/components/workout-tab/FolderMenuSheet';
import { HeaderIconButton, TabHeader } from '@/components/ui/TabHeader';
import { COLORS, TYPE } from '@/constants/theme';
import { createFolder, deleteFolder, getRoutineOverview, moveRoutine, renameFolder, setFolderCollapsed } from '@/db/routines/folders';
import { movedOverview } from '@/lib/workout/routineOverview';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES, WORKOUT_TAB_SIZES } from '@/constants/sizes';
import { SCROLL_EVENTS } from '@/constants/motion';
import { RUN_LOG_TITLE } from '@/constants/runCopy';
import { isRunOn } from '@/db/run/settings';
import { noop } from '@/lib/misc';
import type { DragListItem, RoutineFolder, RoutineOverview, RoutineSummary } from '@/types/routine';
import { Screen } from '@/components/ui/Screen';
import { useScrolledDivider } from '@/hooks/useScrolledDivider';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';

// The Workout tab: start a workout, the cycle, and the routines by folder.
export default function WorkoutTab() {
  const router = useRouter();
  const { start, dialog: startDialog } = useStartWorkout();
  const [overview, setOverview] = useState<RoutineOverview | null>(null);
  const { scrolled, onScroll } = useScrolledDivider();
  // Routine whose ⋯ sheet is open.
  const [menuRoutine, setMenuRoutine] = useState<RoutineSummary | null>(null);
  // Folder whose ⋯ sheet is open, the one waiting for delete confirmation, and the Create/Rename dialog.
  const [menuFolder, setMenuFolder] = useState<RoutineFolder | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<RoutineFolder | null>(null);
  const [nameDialog, setNameDialog] = useState<{ folder: RoutineFolder | null } | null>(null);
  // Runs once the sheet has slid away (e.g. open the delete confirmation).
  const afterSheet = useAfterSheetClose();

  const [runOn, setRunOn] = useState(false);

  const reload = useCallback(() => {
    getRoutineOverview().then(setOverview);
    isRunOn()
      .then(setRunOn)
      .catch((e) => console.warn('[run] setting check failed', e));
  }, []);
  useFocusEffect(reload);

  // Hold a routine and drag it to another folder or spot (components/routines/RoutineDrag.tsx).
  // The list is one flat run: folder name, its cards (or the empty box), next folder…
  const items = useMemo(() => (overview ? buildDragItems(overview) : []), [overview]);
  const routineById = useMemo(() => (overview ? routinesById(overview) : new Map<string, RoutineSummary>()), [overview]);
  const { drag, overlay, scrollRef, listRef } = useRoutineDrag({
    items,
    // Shown in its new place at once, then saved.
    onDrop: (routineId, folderId, index) => {
      setOverview((o) => (o ? movedOverview(o, routineId, folderId, index) : o));
      moveRoutine(routineId, folderId, index).then(reload);
    },
    renderGhost: (id) => {
      const routine = routineById.get(id);
      return routine ? <RoutineCard routine={routine} onPress={noop} onStart={noop} onMore={noop} /> : null;
    },
  });

  const toggleFolder = useCallback(
    async (folderId: string | null, collapsed: boolean) => {
      await setFolderCollapsed(folderId, !collapsed);
      reload();
    },
    [reload]
  );

  // The routine editor in create mode; nothing is saved before its Save.
  // A folder's "Add New Routine" / empty-folder box puts it in that folder.
  const newRoutine = useCallback(
    (folderId: string | null = null) => {
      router.push({ pathname: '/routine-editor', params: folderId ? { folder: folderId } : {} });
    },
    [router]
  );
  // start is new on every render (useStartWorkout); the list below reads the latest through a ref.
  const startRef = useRef(start);
  useLayoutEffect(() => {
    startRef.current = start;
  });

  // A folder menu option runs once its sheet has slid away.
  function fromFolderMenu(action: () => void) {
    afterSheet.later(action);
    setMenuFolder(null);
  }

  // A double tap on the dialogs' buttons would delete or create twice.
  const busy = useRef(false);
  async function confirmDeleteFolder() {
    if (!deletingFolder || busy.current) return;
    busy.current = true;
    try {
      await deleteFolder(deletingFolder.id);
    } catch (e) {
      console.warn('Delete folder failed', e);
    } finally {
      busy.current = false;
    }
    setDeletingFolder(null);
    reload();
  }

  async function saveFolderName(name: string) {
    if (busy.current) return;
    busy.current = true;
    const folder = nameDialog?.folder;
    try {
      if (folder) await renameFolder(folder.id, name);
      else await createFolder(name);
    } catch (e) {
      console.warn('Save folder failed', e);
    } finally {
      busy.current = false;
    }
    setNameDialog(null);
    reload();
  }

  // The whole list, rebuilt only when the routines change: opening a sheet or a
  // dialog, or the scroll divider, no longer redraws every card.
  const list = useMemo(() => {
    const folderOf = (id: string | null) => overview?.folders.find((f) => f.id === id) ?? null;
    const renderItem = (item: DragListItem) => {
      if (item.kind === 'header') {
        const folder = folderOf(item.folderId);
        if (!folder) {
          return (
            <FolderHeader
              title="My Routines"
              collapsed={!!item.collapsed}
              onToggle={() => toggleFolder(null, !!item.collapsed)}
            />
          );
        }
        // No count on an empty folder: "Test", not "Test (0)".
        return (
          <FolderHeader
            title={folder.routines.length > 0 ? `${folder.name} (${folder.routines.length})` : folder.name}
            collapsed={folder.collapsed}
            onToggle={() => toggleFolder(folder.id, folder.collapsed)}
            onMore={() => setMenuFolder(folder)}
          />
        );
      }
      if (item.kind === 'box') {
        return item.folderId ? (
          <View style={styles.emptyFolder}>
            <AddRoutineBox onPress={() => newRoutine(item.folderId)} />
          </View>
        ) : (
          <AddRoutineBox onPress={() => newRoutine()} />
        );
      }
      const routine = routineById.get(item.key);
      if (!routine) return null;
      return (
        <RoutineCard
          routine={routine}
          onPress={() => router.push(`/workout/routine/${routine.id}`)}
          onStart={() => startRef.current(routine.id)}
          onMore={() => setMenuRoutine(routine)}
        />
      );
    };
    return items.map((item, i) => (
      <DragItem key={item.key} drag={drag} index={i} draggable={item.kind === 'card'}>
        {renderItem(item)}
      </DragItem>
    ));
  }, [overview, items, routineById, drag, toggleFolder, newRoutine, router]);

  return (
    <Screen>
      <TabHeader title="Workout" onTitlePress={noop} divider={scrolled} />
      <Animated.View ref={listRef} style={styles.list} collapsable={false} onLayout={drag.onListLayout}>
        <DragScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          onContentSizeChange={drag.onContentSize}
          onScroll={onScroll}
          scrollEventThrottle={SCROLL_EVENTS.throttleMs}>
          <ActionBar
            style={styles.startEmpty}
            icon={<Plus size={ICON_SIZES.lg} color={COLORS.text} />}
            label="Start Empty Workout"
            onPress={() => start(null)}
          />
          {runOn && (
            <ActionBar
              style={styles.startEmpty}
              icon={<PersonSimpleRun size={ICON_SIZES.xxl} color={COLORS.text} />}
              label={RUN_LOG_TITLE}
              onPress={() => router.push('/run/log')}
            />
          )}

          <View style={styles.routinesRow}>
            <Text style={TYPE.titleSemibold}>Routines</Text>
            <HeaderIconButton onPress={() => setNameDialog({ folder: null })}>
              <FolderAddIcon color={COLORS.text} />
            </HeaderIconButton>
          </View>

          {/* Half-width New Routine; Cycle takes the right half. */}
          <View style={styles.newRoutineRow}>
            <ActionBar
              style={styles.halfWidth}
              icon={<ClipboardText size={ICON_SIZES.xxl} color={COLORS.text} />}
              label="New Routine"
              onPress={() => newRoutine()}
            />
            <ActionBar
              style={styles.halfWidth}
              icon={<ArrowsClockwise size={ICON_SIZES.xl} color={COLORS.text} />}
              label="Cycle"
              onPress={() => router.push('/cycle')}
            />
          </View>

          {list}
        </DragScrollView>
        {overlay}
      </Animated.View>

      {startDialog}

      <RoutineMenu routine={menuRoutine} onClose={() => setMenuRoutine(null)} onDuplicated={reload} onDeleted={reload} />

      <FolderMenuSheet
        folder={menuFolder}
        onDismiss={() => setMenuFolder(null)}
        onClosed={afterSheet.onClosed}
        onReorder={() => fromFolderMenu(() => router.push('/reorder-folders'))}
        onRename={(folder) => fromFolderMenu(() => setNameDialog({ folder }))}
        onAddRoutine={(folder) => fromFolderMenu(() => newRoutine(folder.id))}
        onDelete={(folder) => fromFolderMenu(() => setDeletingFolder(folder))}
      />

      <ConfirmDialog
        visible={deletingFolder !== null}
        message="Deleting this folder will move all its routines into the 'My Routines' folder."
        confirmLabel="Delete"
        onConfirm={confirmDeleteFolder}
        onCancel={() => setDeletingFolder(null)}
      />

      <NameDialog
        visible={nameDialog !== null}
        title={nameDialog?.folder ? 'Rename Folder' : 'Create New Folder'}
        placeholder={nameDialog?.folder?.name ?? 'New Folder'}
        onSave={saveFolderName}
        onCancel={() => setNameDialog(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  // ~103dp of space under the last item when scrolled to the end.
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: 102.9,
  },

  startEmpty: {
    marginTop: SPACE.sm,
    marginHorizontal: LAYOUT.screenMargin,
  },
  routinesRow: {
    height: WORKOUT_TAB_SIZES.routinesRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: SPACE.lg,
    paddingRight: SPACE.sm,
  },
  newRoutineRow: {
    flexDirection: 'row',
    gap: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
  halfWidth: {
    flex: 1,
  },
  // Space under an empty folder's dashed box before the next folder.
  emptyFolder: {
    marginTop: SPACE.xxs,
    marginBottom: SPACE.xl,
  },
});
