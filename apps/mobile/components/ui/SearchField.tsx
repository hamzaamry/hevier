import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { XCircle } from 'phosphor-react-native/src/icons/XCircle';

import { COLORS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, SIZES } from '@/constants/sizes';
import type { SearchFieldProps } from './types';

export function SearchField({ value, onChangeText, placeholder, autoFocus, maxLength }: SearchFieldProps) {
  return (
    <View style={styles.search}>
      <MagnifyingGlass size={ICON_SIZES.lg} color={COLORS.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        selectionColor={COLORS.primary}
        cursorColor={COLORS.primary}
        autoFocus={autoFocus}
        maxLength={maxLength}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} hitSlop={HIT_SLOPS.lg}>
          <XCircle size={ICON_SIZES.md} weight="fill" color={COLORS.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    height: SIZES.searchHeight,
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    marginLeft: SPACE.sm,
    paddingVertical: 0,
    ...TYPE.body,
  },
});
