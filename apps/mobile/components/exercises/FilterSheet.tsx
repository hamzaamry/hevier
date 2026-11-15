import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { BORDER_WIDTHS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { FILTER_SHEET_SIZES } from '@/constants/sizes';
import { plural } from '@/lib/format/text';
import { Button } from '@/components/ui/Button';
import type { FilterSheetProps, ShowButtonProps } from './types';

// The Equipment / Muscle Group sheets: a tall sheet of 2-column cards (picture + name), several can be picked;
// Clear Filters / "Show N results" at the bottom. The picks apply only on
// Show; closing the sheet another way leaves the filter as it was.
// Also Create Exercise's pickers: `single` (a tap picks and closes) or `applyLabel`.


export function FilterSheet<K extends string>({
  title,
  sections,
  visible,
  selected,
  countFor,
  applyLabel,
  single = false,
  onApply,
  onDismiss,
}: FilterSheetProps<K>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [picks, setPicks] = useState<K[]>(selected);
  // Start from the filter in use each time the sheet opens.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setPicks(selected);
  }

  // The sheet reaches up to the search box (77 under the status bar).
  const bodyHeight = height - insets.top - 77.4 - 65 - insets.bottom - 8;

  function toggle(key: K) {
    if (single) {
      onApply([key]);
      return;
    }
    setPicks((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  return (
    <BottomSheet visible={visible} title={title} bare onDismiss={onDismiss}>
      <View style={{ height: bodyHeight }}>
        <ScrollView contentContainerStyle={styles.content}>
          {sections.map((section, i) => (
            <View key={i}>
              {section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null}
              <View style={styles.grid}>
                {section.options.map((o) => {
                  const on = picks.includes(o.key);
                  return (
                    <Pressable
                      key={o.key}
                      style={({ pressed }) => [styles.card, on && styles.cardOn, pressed && !on && styles.cardPressed]}
                      onPress={() => toggle(o.key)}>
                      {o.icon}
                      <Text style={styles.cardLabel} numberOfLines={2}>
                        {o.key}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        {!single && (
          <View style={styles.bar}>
            {/* applyLabel: a picker, not a filter (Create Exercise's Secondary muscles). */}
            <Button
              label={applyLabel ? 'Clear' : 'Clear Filters'}
              variant="neutral"
              size="compact"
              style={styles.barButton}
              onPress={() => setPicks([])}
            />
            <ShowButton picks={picks} countFor={countFor} applyLabel={applyLabel} onApply={onApply} />
          </View>
        )}
      </View>
    </BottomSheet>
  );
}

// Its own component so the count (a pass over every exercise) runs only while the
// sheet is on screen, not on each render of the picker behind it.
function ShowButton<K extends string>({
  picks,
  countFor,
  applyLabel,
  onApply,
}: ShowButtonProps<K>) {
  const count = countFor?.(picks) ?? 0;
  return (
    <Button
      label={applyLabel ?? `Show ${count.toLocaleString('en-US')} ${plural(count, 'result')}`}
      size="compact"
      style={styles.barButton}
      onPress={() => onApply(picks)}
    />
  );
}

const SELECTED_FILL = COLORS.selectedChip;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: LAYOUT.screenMargin,
    paddingBottom: SPACE.lg,
  },
  // "Upper Body": 25 under the divider, cards 18 below it.
  sectionTitle: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    lineHeight: LINE_HEIGHTS.normal,
    marginTop: SPACE.lg,
    marginBottom: SPACE.sm,
  },
  // Cards 67 tall, 16 apart; the first row 16 under the divider.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACE.lg,
    paddingTop: SPACE.lg,
  },
  card: {
    width: '47.6%',
    height: FILTER_SHEET_SIZES.cardHeight,
    paddingLeft: SPACE.sm,
    paddingRight: SPACE.sm,
    borderRadius: RADIUS.card,
    borderWidth: BORDER_WIDTHS.thin,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.separator,
  },
  cardOn: {
    borderColor: COLORS.primary,
    backgroundColor: SELECTED_FILL,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardLabel: {
    flex: 1,
    marginLeft: SPACE.sm,
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.snug,
  },
  // Clear Filters / Show N results: 40 tall, the card columns' width.
  bar: {
    flexDirection: 'row',
    gap: SPACE.lg,
    paddingHorizontal: LAYOUT.screenMargin,
    paddingTop: SPACE.md,
  },
  barButton: {
    flex: 1,
  },
});
