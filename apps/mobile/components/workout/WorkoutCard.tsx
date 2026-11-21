import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { DotsThree } from 'phosphor-react-native/src/icons/DotsThree';
import { ImageSquare } from 'phosphor-react-native/src/icons/ImageSquare';
import { Play } from 'phosphor-react-native/src/icons/Play';

import { Avatar } from '@/components/ui/Avatar';
import { ExerciseThumb } from '@/components/exercises/ExerciseThumb';
import { Medal } from './PrToast';
import { COLORS, LINE_HEIGHTS, TYPE, withAlpha } from '@/constants/theme';
import { durationLabel } from '@/lib/format/feed';
import { volumeLabel } from '@/lib/format/weight';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ICON_SIZES, WORKOUT_CARD_SIZES } from '@/constants/sizes';
import { WORKOUT_CARD_LIMITS } from '@/constants/limits';
import { plural } from '@/lib/format/text';
import { mediaUri } from '@/lib/workoutMedia';
import { Stat } from '@/components/ui/Stat';
import type { WorkoutCardProps, WorkoutSummaryProps } from './types';
import type { MediaItem } from '@/types/workout';

// A workout card (Home feed, Profile).

// Memoized with id-based callbacks, so a long list doesn't redraw every card.
export const WorkoutCard = memo(function WorkoutCard({
  workout,
  username,
  name,
  when,
  onOpen,
  onMenu,
  band = false,
}: WorkoutCardProps) {
  const more = workout.exercises.length - WORKOUT_CARD_LIMITS.shownExercises;
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={() => onOpen(workout.id)}>
      <WorkoutSummary workout={workout} username={username} name={name} when={when} onMenu={() => onMenu(workout.id)} />

      {workout.cover && <WorkoutCover cover={workout.cover} count={workout.mediaCount} />}

      <View style={styles.divider} />

      <View style={styles.exercises}>
        {workout.exercises.slice(0, WORKOUT_CARD_LIMITS.shownExercises).map((e, i) => (
          <View key={i} style={styles.exercise}>
            <ExerciseThumb catalogueId={e.catalogueId} size={WORKOUT_CARD_SIZES.exerciseThumb} />
            <Text style={styles.exerciseText} numberOfLines={1}>
              {e.sets.length} {plural(e.sets.length, 'set')} {e.name}
            </Text>
          </View>
        ))}
      </View>
      {more > 0 && (
        <Text style={styles.more}>
          See {more} more {plural(more, 'exercise')}
        </Text>
      )}

      <View style={band ? styles.band : [styles.divider, styles.bottomDivider]} />
    </Pressable>
  );
});

// The card's cover: the workout's chosen photo or video, else its first photo
// (lib/workout/cover.ts), and a count of the ones it doesn't show.
function WorkoutCover({ cover, count }: { cover: MediaItem; count: number }) {
  return (
    <View style={styles.cover}>
      {cover.kind === 'photo' ? (
        <Image source={{ uri: mediaUri(cover.file) }} style={styles.coverImage} resizeMode="cover" />
      ) : (
        <View style={[styles.coverImage, styles.coverVideo]}>
          <Play size={WORKOUT_CARD_SIZES.coverPlayIcon} weight="fill" color={COLORS.text} />
        </View>
      )}
      {count > 1 && (
        <View style={styles.coverBadge}>
          <ImageSquare size={WORKOUT_CARD_SIZES.coverBadgeIcon} color={COLORS.text} />
          <Text style={styles.coverBadgeLabel}>+{count - 1}</Text>
        </View>
      )}
    </View>
  );
}

// Who, when, title, and Time / Volume / Records: the top of a card and of the workout page.
export function WorkoutSummary({
  workout,
  username,
  name,
  when,
  onMenu,
}: WorkoutSummaryProps) {
  return (
    <>
      <View style={styles.top}>
        <Avatar name={name} size={WORKOUT_CARD_SIZES.avatar} />
        <View style={styles.who}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          <Text style={styles.when}>{when}</Text>
        </View>
        {onMenu && (
          <Pressable style={styles.menu} onPress={onMenu} hitSlop={HIT_SLOPS.lg}>
            <DotsThree size={ICON_SIZES.xxl} weight="bold" color={COLORS.text} />
          </Pressable>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {workout.title}
      </Text>

      <View style={styles.stats}>
        <Stat label="Time" value={durationLabel(workout.durationSeconds)} style={styles.timeStat} />
        <Stat label="Volume" value={volumeLabel(workout.volumeKg)} style={styles.stat} />
        {workout.records > 0 && (
          <Stat label="Records" value={String(workout.records)} icon={<Medal size={ICON_SIZES.md} />} style={styles.stat} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: LAYOUT.screenMargin,
    paddingTop: SPACE.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  who: {
    flex: 1,
    marginLeft: SPACE.md,
  },
  username: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
  },
  when: {
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.textSecondary,
  },
  // ⋯ centred 27 + 9 from the right edge.
  menu: {
    marginRight: SPACE.sm,
  },
  title: {
    marginTop: SPACE.md,
    ...TYPE.titleSemibold,
    lineHeight: LINE_HEIGHTS.relaxed,
  },
  stats: {
    marginTop: SPACE.sm,
    flexDirection: 'row',
  },
  // Columns at 16 / 94.5 / 176.8 from the screen edge.
  stat: {
    minWidth: WORKOUT_CARD_SIZES.statMinWidth,
  },
  timeStat: {
    minWidth: WORKOUT_CARD_SIZES.timeStatMinWidth,
  },
  cover: {
    marginTop: SPACE.md,
    aspectRatio: WORKOUT_CARD_SIZES.coverAspect,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverVideo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    right: WORKOUT_CARD_SIZES.coverBadgeOffset,
    bottom: WORKOUT_CARD_SIZES.coverBadgeOffset,
    height: WORKOUT_CARD_SIZES.coverBadgeHeight,
    paddingHorizontal: WORKOUT_CARD_SIZES.coverBadgePadding,
    borderRadius: RADIUS.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: WORKOUT_CARD_SIZES.coverBadgeGap,
    backgroundColor: withAlpha(COLORS.black, 0.6),
  },
  coverBadgeLabel: {
    ...TYPE.captionMedium,
    color: COLORS.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: SPACE.md,
    backgroundColor: COLORS.separator,
  },
  // First picture 16.4 under the divider, then one every 58.
  exercises: {
    paddingTop: SPACE.sm,
  },
  exercise: {
    marginTop: SPACE.sm,
    height: WORKOUT_CARD_SIZES.exerciseHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseText: {
    flex: 1,
    marginLeft: SPACE.lg,
    ...TYPE.body,
  },
  more: {
    marginTop: SPACE.md,
    textAlign: 'center',
    ...TYPE.body,
    lineHeight: LINE_HEIGHTS.normal,
    color: COLORS.textSecondary,
  },
  bottomDivider: {
    marginTop: SPACE.lg,
  },
  band: {
    height: WORKOUT_CARD_SIZES.bandHeight,
    marginTop: SPACE.lg,
    marginHorizontal: -LAYOUT.screenMargin,
    backgroundColor: COLORS.surface,
  },
});
