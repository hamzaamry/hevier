import { StyleSheet, Text, View } from 'react-native';

import { Toggle } from '@/components/ui/Toggle';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { SIZES } from '@/constants/sizes';
import { MINUTES_PER_DAY, RUN_SLOT_STEP_MINUTES } from '@/constants/run';
import {
  RUN_EARLIER_SLOT,
  RUN_LATER_SLOT,
  RUN_SETTINGS_SLOT,
  RUN_SETTINGS_TOGGLE,
  RUN_SETTINGS_TOGGLE_NOTE,
} from '@/constants/runCopy';
import { minutesLabel } from '@/lib/format/run';
import { Stepper } from './Stepper';
import type { RunSettingsRowsProps } from './types';

// Settings → Running: turn the run readiness on or off, and when the run usually is.
export function RunSettingsRows({ settings, on, onChange }: RunSettingsRowsProps) {
  const moveSlot = (by: number) =>
    onChange({ slotMinutes: (settings.slotMinutes + by + MINUTES_PER_DAY) % MINUTES_PER_DAY });
  return (
    <>
      <View style={styles.row}>
        <View style={styles.text}>
          <Text style={styles.title}>{RUN_SETTINGS_TOGGLE}</Text>
          <Text style={styles.note}>{RUN_SETTINGS_TOGGLE_NOTE}</Text>
        </View>
        <Toggle value={on} onChange={(enabled) => onChange({ enabled })} />
      </View>
      {on && (
        <View style={styles.row}>
          <Text style={[styles.title, styles.text]}>{RUN_SETTINGS_SLOT}</Text>
          <Stepper
            label={minutesLabel(settings.slotMinutes)}
            minusLabel={RUN_EARLIER_SLOT}
            plusLabel={RUN_LATER_SLOT}
            onMinus={() => moveSlot(-RUN_SLOT_STEP_MINUTES)}
            onPlus={() => moveSlot(RUN_SLOT_STEP_MINUTES)}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: SIZES.settingsRowHeight,
    paddingVertical: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.lg,
    backgroundColor: COLORS.surface,
  },
  text: {
    flex: 1,
  },
  title: {
    ...TYPE.row,
  },
  note: {
    marginTop: SPACE.xxs,
    ...TYPE.small,
    lineHeight: LINE_HEIGHTS.compact,
    color: COLORS.textSecondary,
  },
});
