import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Buildings } from 'phosphor-react-native/src/icons/Buildings';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { PencilSimple } from 'phosphor-react-native/src/icons/PencilSimple';
import { X } from 'phosphor-react-native/src/icons/X';

import { DaySheet } from '@/components/gym/DaySheet';
import { GymTimelineRow } from '@/components/gym/GymTimelineRow';
import { BottomSheet, SheetItem, sheetIcon } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InnerHeader } from '@/components/ui/InnerHeader';
import { NameDialog } from '@/components/ui/NameDialog';
import { Screen } from '@/components/ui/Screen';
import { GYM_NAME_MAX_LENGTH } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES, SETTINGS_SIZES, SIZES } from '@/constants/sizes';
import { deleteGymChange, getGymTimeline, getGymWorkouts, moveGymChange, namePreviousGym, renameGym } from '@/db/gym/gym';
import { useAfterSheetClose } from '@/hooks/useAfterSheetClose';
import { dateOfDayKey, dayKey } from '@/lib/date';
import { monthDay } from '@/lib/format/date';
import { currentGym, deleteMessage, gymStretches } from '@/lib/gym/timeline';
import type { GymStretch, GymTimeline } from '@/types/gym';

// Settings → Gym: the gym you train at now, Change Gym, and the history of every
// gym with a ⋯ menu to rename it, move its date or delete the change.
export default function GymScreen() {
  const router = useRouter();
  const [data, setData] = useState<{ timeline: GymTimeline; stretches: GymStretch[] } | null>(null);
  // The stretch whose ⋯ sheet is open (kept while the sheet slides out), then what its options open.
  const [menu, setMenu] = useState<GymStretch | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [naming, setNaming] = useState<GymStretch | null>(null);
  const [moving, setMoving] = useState<GymStretch | null>(null);
  const [deleting, setDeleting] = useState<{ stretch: GymStretch; message: string } | null>(null);
  const afterSheet = useAfterSheetClose();
  // A double tap on a dialog's button would write twice.
  const busy = useRef(false);

  const reload = useCallback(() => {
    Promise.all([getGymTimeline(), getGymWorkouts()])
      .then(([timeline, workouts]) => setData({ timeline, stretches: gymStretches(timeline, workouts, new Date()) }))
      .catch((e) => console.warn('[gym] load failed', e));
  }, []);
  useFocusEffect(reload);

  async function write(action: () => Promise<void>, close: () => void) {
    if (busy.current) return;
    busy.current = true;
    try {
      await action();
      close();
      reload();
    } finally {
      busy.current = false;
    }
  }

  function fromMenu(action: () => void) {
    afterSheet.later(action);
    setMenuOpen(false);
  }

  if (!data) {
    return (
      <Screen>
        <Stack.Screen options={{ headerShown: false }} />
        <InnerHeader title={GYM_LABELS.screenTitle} />
      </Screen>
    );
  }
  const { timeline, stretches } = data;
  const now = currentGym(timeline, new Date());
  const since = stretches.find((s) => s.current)?.from ?? null;
  const takenDays = (except: string | null) => timeline.changes.filter((c) => c.id !== except).map((c) => c.day);

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={GYM_LABELS.screenTitle} />
      <ScrollView>
        <Text style={styles.band}>{GYM_LABELS.currentGym}</Text>
        <View style={styles.currentRow}>
          <Buildings size={ICON_SIZES.xxl} color={COLORS.text} />
          <Text style={styles.currentName} numberOfLines={1}>
            {now?.name ?? GYM_LABELS.notSet}
          </Text>
          {since && <Text style={styles.since}>since {monthDay(dateOfDayKey(since))}</Text>}
        </View>
        <Button
          label={GYM_LABELS.changeGym}
          icon={<MapPin size={ICON_SIZES.md} color={COLORS.text} />}
          style={styles.changeButton}
          onPress={() => router.push('/change-gym')}
        />

        {stretches.length > 0 && (
          <>
            <Text style={styles.band}>{GYM_LABELS.history}</Text>
            {stretches.map((s, i) => (
              <GymTimelineRow
                key={s.changeId ?? 'previous'}
                stretch={s}
                first={i === 0}
                last={i === stretches.length - 1}
                onMenu={(stretch) => {
                  setMenu(stretch);
                  setMenuOpen(true);
                }}
              />
            ))}
          </>
        )}
        <Text style={styles.footer}>{GYM_LABELS.footer}</Text>
      </ScrollView>

      <BottomSheet visible={menuOpen} title={menu?.name} onDismiss={() => setMenuOpen(false)} onClosed={afterSheet.onClosed}>
        {menu && (
          <>
            {/* The Previous gym only gets a name; a gym that starts at the beginning has no date to move or change to delete. */}
            <SheetItem
              first
              icon={<PencilSimple {...sheetIcon} />}
              label={menu.changeId === null ? GYM_LABELS.namePrevious : GYM_LABELS.rename}
              onPress={() => fromMenu(() => setNaming(menu))}
            />
            {menu.changeId !== null && menu.from !== null && (
              <>
                <SheetItem icon={<CalendarBlank {...sheetIcon} />} label={GYM_LABELS.changeDate} onPress={() => fromMenu(() => setMoving(menu))} />
                <SheetItem
                  destructive
                  icon={<X {...sheetIcon} color={COLORS.danger} />}
                  label={GYM_LABELS.delete}
                  onPress={() =>
                    fromMenu(() => {
                      // The workouts go back to the gym before this one.
                      const before = stretches[stretches.indexOf(menu) + 1]?.name ?? GYM_LABELS.previousGym;
                      setDeleting({ stretch: menu, message: deleteMessage(menu, before) });
                    })
                  }
                />
              </>
            )}
          </>
        )}
      </BottomSheet>

      <NameDialog
        visible={naming !== null}
        title={naming?.changeId === null ? GYM_LABELS.namePrevious : GYM_LABELS.renameTitle}
        placeholder={naming?.changeId === null ? GYM_LABELS.namePlaceholder : (naming?.name ?? '')}
        isValid={(text) => text.length > 0 && text.length <= GYM_NAME_MAX_LENGTH}
        onSave={(name) =>
          naming &&
          write(() => (naming.changeId === null ? namePreviousGym(name) : renameGym(naming.gymId!, name)), () => setNaming(null))
        }
        onCancel={() => setNaming(null)}
      />

      <DaySheet
        visible={moving !== null}
        day={moving?.from ?? dayKey(new Date())}
        takenDays={takenDays(moving?.changeId ?? null)}
        onDone={(day) => moving && write(() => moveGymChange(moving.changeId!, day), () => setMoving(null))}
        onDismiss={() => setMoving(null)}
      />

      <ConfirmDialog
        visible={deleting !== null}
        message={deleting?.message ?? ''}
        confirmLabel={GYM_LABELS.deleteConfirm}
        onConfirm={() => deleting && write(() => deleteGymChange(deleting.stretch.changeId!), () => setDeleting(null))}
        onCancel={() => setDeleting(null)}
      />
    </Screen>
  );
}

// The Settings look: a black band with a grey label, then 60dp grey rows.
const styles = StyleSheet.create({
  band: {
    height: SETTINGS_SIZES.sectionHeight,
    paddingHorizontal: LAYOUT.screenMargin,
    textAlignVertical: 'center',
    ...TYPE.row,
    color: COLORS.textSecondary,
  },
  currentRow: {
    height: SIZES.settingsRowHeight,
    paddingHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  currentName: {
    flex: 1,
    marginLeft: SPACE.lg,
    ...TYPE.row,
  },
  since: {
    marginLeft: SPACE.md,
    ...TYPE.body,
    color: COLORS.textSecondary,
  },
  changeButton: {
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
  },
  footer: {
    marginTop: SPACE.lg,
    paddingHorizontal: LAYOUT.screenMargin,
    paddingBottom: SPACE.xxxl,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
});
