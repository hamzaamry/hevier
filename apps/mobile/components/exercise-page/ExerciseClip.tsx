import { memo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Barbell } from 'phosphor-react-native/src/icons/Barbell';
import { Pause } from 'phosphor-react-native/src/icons/Pause';
import { Play } from 'phosphor-react-native/src/icons/Play';

import { COLORS } from '@/constants/theme';
import { HIT_SLOPS, RADIUS } from '@/constants/layout';
import { EXERCISE_PAGE_SIZES, ICON_SIZES } from '@/constants/sizes';
import { STORAGE_FOLDERS } from '@/constants/storage';
import { mediaIdFor } from '@/lib/domain/drawings';
import { mediaUri as userMediaUri } from '@/lib/workoutMedia';
import { useDrawings } from '@/stores/drawings';
import type { CatalogueMediaKind, ClipVideoProps, ExerciseClipProps } from './types';

function mediaUri(kind: CatalogueMediaKind, mediaId: string, ext: string): string | null {
  const file = new File(Paths.document, STORAGE_FOLDERS.catalogue, kind, `${mediaId}.${ext}`);
  return file.exists ? file.uri : null;
}

function ClipVideo({ uri }: ClipVideoProps) {
  const [playing, setPlaying] = useState(true);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <>
      <VideoView player={player} style={styles.clipMedia} contentFit="contain" nativeControls={false} />
      <Pressable
        style={styles.pause}
        hitSlop={HIT_SLOPS.lg}
        onPress={() => {
          if (playing) player.pause();
          else player.play();
          setPlaying(!playing);
        }}>
        {playing ? <Pause size={ICON_SIZES.xs} weight="fill" color={COLORS.text} /> : <Play size={ICON_SIZES.xs} weight="fill" color={COLORS.text} />}
      </Pressable>
    </>
  );
}

// The exercise's clip on a loop, muted, with ⏸ / ▶; the still when there's no
// clip, a plain barbell for custom exercises; a user's exercise plays its own
// photo or video.
// Memoized: it checks the files on disk, so not on every chart tap.
export const ExerciseClip = memo(function ExerciseClip({ catalogueId, media }: ExerciseClipProps) {
  const drawings = useDrawings();
  const mediaId = catalogueId ? mediaIdFor(catalogueId, drawings) : null;
  const own = media ? userMediaUri(media.file) : null;
  const clip = media?.kind === 'video' ? own : mediaId ? mediaUri('clip', mediaId, 'mp4') : null;
  const still = media?.kind === 'photo' ? own : mediaId ? mediaUri('still', mediaId, 'webp') : null;
  return (
    <View style={styles.clip}>
      {clip ? (
        <ClipVideo uri={clip} />
      ) : still ? (
        <Image source={{ uri: still }} style={styles.clipMedia} resizeMode="contain" />
      ) : (
        <Barbell size={ICON_SIZES.mediaPlaceholder} color={COLORS.textSecondary} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  // The clip: full width, 232 tall, on white.
  clip: {
    height: EXERCISE_PAGE_SIZES.clipHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  clipMedia: {
    width: '100%',
    height: '100%',
  },
  pause: {
    position: 'absolute',
    top: EXERCISE_PAGE_SIZES.pauseTop,
    right: EXERCISE_PAGE_SIZES.pauseRight,
    width: EXERCISE_PAGE_SIZES.pauseWidth,
    height: EXERCISE_PAGE_SIZES.pauseHeight,
    borderRadius: RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.mediaButton,
  },
});
