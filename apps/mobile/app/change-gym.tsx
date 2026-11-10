import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CalendarBlank } from 'phosphor-react-native/src/icons/CalendarBlank';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';

import { DaySheet } from '@/components/gym/DaySheet';
import { GymFormRow } from '@/components/gym/GymFormRow';
import { HeaderPillButton, InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { GYM_LABELS } from '@/constants/labels';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { ICON_SIZES } from '@/constants/sizes';
import { addGymChange } from '@/db/gym/gym';
import { dateOfDayKey, dayKey } from '@/lib/date';
import { fullDate } from '@/lib/format/date';
import { openGymPicker } from '@/stores/gymPickRequest';
import type { GymChoice } from '@/types/gym';

// Settings → Gym → Change Gym: from which day, and which gym. Save stays grey
// until a gym is picked. Workouts from that day on count at the new gym.
export default function ChangeGym() {
  const router = useRouter();
  const [day, setDay] = useState(() => dayKey(new Date()));
  const [choice, setChoice] = useState<GymChoice | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  // A double tap on Save would write twice.
  const saving = useRef(false);

  async function save() {
    if (!choice || saving.current) return;
    saving.current = true;
    try {
      await addGymChange(day, choice);
      router.back();
    } finally {
      saving.current = false;
    }
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={GYM_LABELS.changeGym} right={<HeaderPillButton label="Save" disabled={!choice} onPress={save} />} />
      <View style={styles.rows}>
        <GymFormRow
          icon={<CalendarBlank size={ICON_SIZES.xxl} color={COLORS.text} />}
          label={GYM_LABELS.formDate}
          value={fullDate(dateOfDayKey(day))}
          onPress={() => setDateOpen(true)}
        />
        <GymFormRow
          icon={<MapPin size={ICON_SIZES.xxl} color={COLORS.text} />}
          label={GYM_LABELS.formGym}
          value={choice?.name ?? GYM_LABELS.select}
          onPress={() => openGymPicker(router, setChoice)}
        />
      </View>
      <Text style={styles.note}>{GYM_LABELS.formNote}</Text>

      <DaySheet
        visible={dateOpen}
        day={day}
        takenDays={[]}
        onDone={(picked) => {
          setDay(picked);
          setDateOpen(false);
        }}
        onDismiss={() => setDateOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  rows: {
    paddingHorizontal: LAYOUT.screenMargin,
  },
  note: {
    marginTop: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
});
