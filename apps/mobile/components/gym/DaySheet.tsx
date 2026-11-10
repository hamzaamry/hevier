import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { WheelPicker } from '@/components/ui/WheelPicker';
import { GYM_DATE_YEARS_BACK } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { COLORS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { DURATION_SHEET_SIZES, GYM_SIZES } from '@/constants/sizes';
import { MONTH_NAMES } from '@/constants/time';
import { clampedDayKey, dateOfDayKey, daysInMonth } from '@/lib/date';
import { weekdayDate } from '@/lib/format/date';
import type { DaySheetProps } from './types';

// The Date sheet of the gym screens: the Duration sheet's scroll wheels, with
// day, month and year. Any day up to today. Done saves the day shown.
export function DaySheet({ visible, day, takenDays, onDone, onDismiss }: DaySheetProps) {
  const [picked, setPicked] = useState(day);
  // Each opening starts from the day it is given.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setPicked(day);
  }

  const thisYear = new Date().getFullYear();
  const date = dateOfDayKey(picked);
  const year = date.getFullYear();
  const month = date.getMonth();
  // Back to the picked day's year when it is older than the wheel goes.
  const firstYear = Math.min(thisYear - GYM_DATE_YEARS_BACK, year);
  const years = Array.from({ length: thisYear - firstYear + 1 }, (_, i) => String(firstYear + i));
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => String(i + 1));

  const taken = takenDays.includes(picked);

  return (
    <BottomSheet visible={visible} title={GYM_LABELS.dateSheet} bare onDismiss={onDismiss}>
      <View style={styles.row}>
        <Text style={styles.label}>{GYM_LABELS.formDate}</Text>
        <Text style={styles.value}>{`${weekdayDate(date)}, ${year}`}</Text>
      </View>
      <View style={styles.wheels}>
        <WheelPicker
          items={days}
          index={date.getDate() - 1}
          width={GYM_SIZES.dayWheel}
          onChange={(i) => setPicked(clampedDayKey(year, month, i + 1, new Date()))}
        />
        <WheelPicker items={MONTH_NAMES} index={month} flex={1} onChange={(i) => setPicked(clampedDayKey(year, i, date.getDate(), new Date()))} />
        <WheelPicker
          items={years}
          index={year - firstYear}
          width={GYM_SIZES.yearWheel}
          onChange={(i) => setPicked(clampedDayKey(firstYear + i, month, date.getDate(), new Date()))}
        />
      </View>
      {taken && <Text style={styles.taken}>{GYM_LABELS.dayTaken}</Text>}
      <Button label={GYM_LABELS.done} disabled={taken} style={styles.done} onPress={() => onDone(picked)} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: {
    height: DURATION_SHEET_SIZES.rowHeight,
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...TYPE.body,
  },
  value: {
    ...TYPE.body,
    color: COLORS.primary,
  },
  wheels: {
    marginVertical: SPACE.xl,
    marginHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    gap: SPACE.lg,
  },
  taken: {
    marginBottom: SPACE.md,
    marginHorizontal: LAYOUT.screenMargin,
    textAlign: 'center',
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  done: {
    marginHorizontal: LAYOUT.screenMargin,
    marginBottom: SPACE.lg,
  },
});
