import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { Play } from 'phosphor-react-native/src/icons/Play';
import { Plus } from 'phosphor-react-native/src/icons/Plus';
import { X } from 'phosphor-react-native/src/icons/X';

import { COLORS, TYPE, withAlpha } from '@/constants/theme';
import { mediaUri } from '@/lib/workoutMedia';
import { HIT_SLOPS, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, MEDIA_STRIP_SIZES, SIZES } from '@/constants/sizes';
import type { DashedProps, MediaStripProps } from './types';

// "Add a photo / video" (Save Workout, the workout page, Edit Workout):
// a dashed box; once something is picked, a row of tiles with ✕, and a small
// dashed + to add more. Videos show as a dark tile with ▶. Without onAdd it
// only shows the tiles.

function roundedRectPath(width: number, height: number, r: number) {
  return [
    `M ${r} 0`,
    `H ${width - r}`,
    `A ${r} ${r} 0 0 1 ${width} ${r}`,
    `V ${height - r}`,
    `A ${r} ${r} 0 0 1 ${width - r} ${height}`,
    `H ${r}`,
    `A ${r} ${r} 0 0 1 0 ${height - r}`,
    `V ${r}`,
    `A ${r} ${r} 0 0 1 ${r} 0`,
    'Z',
  ].join(' ');
}

function Dashed({ radius }: DashedProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Measured on a View: an Svg's own onLayout doesn't report.
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height}>
          <Path
            d={roundedRectPath(size.width - 2 * MEDIA_STRIP_SIZES.inset, size.height - 2 * MEDIA_STRIP_SIZES.inset, radius)}
            x={MEDIA_STRIP_SIZES.inset}
            y={MEDIA_STRIP_SIZES.inset}
            fill="none"
            stroke={COLORS.textSecondary}
            strokeWidth={1.1}
            strokeDasharray="4 3.5"
          />
        </Svg>
      )}
    </View>
  );
}

export function MediaStrip({
  media,
  onAdd,
  onRemove,
}: MediaStripProps) {
  if (media.length === 0) {
    if (!onAdd) return null;
    return (
      <Pressable style={styles.box} onPress={onAdd}>
        <Dashed radius={8} />
        <ImageSquare size={ICON_SIZES.xxl} color={COLORS.text} />
        <Text style={styles.boxLabel}>Add a photo / video</Text>
      </Pressable>
    );
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
      {media.map((m) => (
        <View key={m.file} style={styles.tile}>
          {m.kind === 'photo' ? (
            <Image source={{ uri: mediaUri(m.file) }} style={styles.tileImage} resizeMode="cover" />
          ) : (
            <View style={[styles.tileImage, styles.video]}>
              <Play size={ICON_SIZES.xxxl} weight="fill" color={COLORS.text} />
            </View>
          )}
          {onRemove && (
            <Pressable style={styles.remove} onPress={() => onRemove(m.file)} hitSlop={HIT_SLOPS.md}>
              <X size={ICON_SIZES.xxs} weight="bold" color={COLORS.text} />
            </Pressable>
          )}
        </View>
      ))}
      {onAdd && (
        <Pressable style={[styles.tile, styles.addTile]} onPress={onAdd}>
          <Dashed radius={8} />
          <Plus size={ICON_SIZES.xxl} color={COLORS.text} />
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  box: {
    height: MEDIA_STRIP_SIZES.boxHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  boxLabel: {
    ...TYPE.body,
  },
  strip: {
    gap: SPACE.sm,
  },
  tile: {
    width: MEDIA_STRIP_SIZES.tile,
    height: MEDIA_STRIP_SIZES.tile,
  },
  tileImage: {
    width: MEDIA_STRIP_SIZES.tile,
    height: MEDIA_STRIP_SIZES.tile,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  video: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    position: 'absolute',
    top: MEDIA_STRIP_SIZES.removeTop,
    right: MEDIA_STRIP_SIZES.removeRight,
    width: SIZES.smallButton,
    height: SIZES.smallButton,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(COLORS.black, 0.6),
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
