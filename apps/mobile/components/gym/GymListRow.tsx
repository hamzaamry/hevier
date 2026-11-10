import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Buildings } from 'phosphor-react-native/src/icons/Buildings';
import { MapPin } from 'phosphor-react-native/src/icons/MapPin';
import { Plus } from 'phosphor-react-native/src/icons/Plus';

import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { ICON_SIZES, SELECT_GYM_SIZES } from '@/constants/sizes';
import type { GymListRowProps } from './types';

// A row of Select Gym, like the Add Exercise rows: a round picture, the name
// with a grey line under it, and grey text on the right. "Use my location" and
// "Add …" are blue, with no disc behind their icon.
export function GymListRow({ title, subtitle, right, icon, onPress }: GymListRowProps) {
  const link = icon !== 'gym';
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.rowPressed]} onPress={onPress}>
      <View style={[styles.avatar, link && styles.avatarLink]}>
        {icon === 'gym' && <Buildings size={ICON_SIZES.lg} color={COLORS.textSecondary} />}
        {icon === 'location' && <MapPin size={ICON_SIZES.xl} color={COLORS.primary} />}
        {icon === 'add' && <Plus size={ICON_SIZES.xl} color={COLORS.primary} />}
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, link && styles.titleLink]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <Text style={styles.right}>{right}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: SELECT_GYM_SIZES.rowHeight,
    paddingHorizontal: SPACE.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowPressed: {
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: SELECT_GYM_SIZES.avatar,
    height: SELECT_GYM_SIZES.avatar,
    borderRadius: SELECT_GYM_SIZES.avatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  avatarLink: {
    backgroundColor: 'transparent',
  },
  text: {
    flex: 1,
    marginLeft: SPACE.lg,
  },
  title: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  titleLink: {
    color: COLORS.primary,
  },
  subtitle: {
    marginTop: SPACE.xs,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
  right: {
    marginLeft: SPACE.md,
    ...TYPE.caption,
    color: COLORS.textSecondary,
  },
});
