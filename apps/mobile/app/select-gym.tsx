import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MagnifyingGlass } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { XCircle } from 'phosphor-react-native/src/icons/XCircle';

import { GymListRow } from '@/components/gym/GymListRow';
import { HeaderTextLeft, InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { GYM_NAME_MAX_LENGTH } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { HIT_SLOPS, LAYOUT, RADIUS, SPACE } from '@/constants/layout';
import { ADD_EXERCISE_SIZES, ICON_SIZES } from '@/constants/sizes';
import { getGymTimeline, getGymWorkouts } from '@/db/gym/gym';
import { useNearbyGyms } from '@/hooks/useNearbyGyms';
import { distanceLabel } from '@/lib/gym/overpass';
import { yourGyms } from '@/lib/gym/timeline';
import { monthDay } from '@/lib/format/date';
import { deliverGymPick } from '@/stores/gymPickRequest';
import type { GymChoice, NearbyGym, YourGym } from '@/types/gym';

// Select Gym, opened by the Gym row of Change Gym and Save Workout
// (stores/gymPickRequest.ts): the gyms you have used, gyms near you (only after
// "Use my location"), and typing a name adds it as a new gym.
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function SelectGym() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mine, setMine] = useState<YourGym[]>([]);
  const [query, setQuery] = useState('');
  const { state, search } = useNearbyGyms();
  // A double tap would hand the pick over and go back twice.
  const leaving = useRef(false);

  useEffect(() => {
    Promise.all([getGymTimeline(), getGymWorkouts()]).then(([timeline, workouts]) => setMine(yourGyms(timeline, workouts)));
  }, []);

  const needle = query.trim().toLowerCase();
  const shownMine = useMemo(() => mine.filter((g) => g.name.toLowerCase().includes(needle)), [mine, needle]);
  const canAdd = needle !== '' && !mine.some((g) => same(g.name, query));

  function pick(choice: GymChoice) {
    if (leaving.current) return;
    leaving.current = true;
    deliverGymPick(choice);
    router.back();
  }

  // A nearby gym you already have is that gym, with its records.
  function pickNearby(gym: NearbyGym) {
    const known = mine.find((g) => same(g.name, gym.name));
    pick(known ? { gymId: known.gymId, name: known.name } : { gymId: null, name: gym.name.slice(0, GYM_NAME_MAX_LENGTH) });
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={GYM_LABELS.pickerTitle} left={<HeaderTextLeft label={GYM_LABELS.cancel} onPress={() => router.back()} />} />

      <View style={styles.search}>
        <MagnifyingGlass size={ICON_SIZES.lg} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={GYM_LABELS.search}
          placeholderTextColor={COLORS.textSecondary}
          selectionColor={COLORS.primary}
          cursorColor={COLORS.primary}
          maxLength={GYM_NAME_MAX_LENGTH}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={HIT_SLOPS.lg}>
            <XCircle size={ICON_SIZES.md} weight="fill" color={COLORS.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + SPACE.xxl }}>
        {canAdd && <GymListRow icon="add" title={`Add "${query.trim()}"`} onPress={() => pick({ gymId: null, name: query.trim() })} />}

        {shownMine.length > 0 && <Text style={styles.section}>{GYM_LABELS.yourGyms}</Text>}
        {shownMine.map((g) => (
          <GymListRow
            key={g.gymId}
            icon="gym"
            title={g.name}
            subtitle={g.lastWorkout ? `Last workout ${monthDay(new Date(g.lastWorkout))}` : GYM_LABELS.noWorkouts}
            onPress={() => pick({ gymId: g.gymId, name: g.name })}
          />
        ))}

        <Text style={styles.section}>{GYM_LABELS.nearYou}</Text>
        <GymListRow icon="location" title={GYM_LABELS.useLocation} onPress={search} />
        {state.kind === 'loading' && <Text style={styles.note}>{GYM_LABELS.finding}</Text>}
        {state.kind === 'denied' && <Text style={styles.note}>{GYM_LABELS.denied}</Text>}
        {state.kind === 'failed' && <Text style={styles.note}>{GYM_LABELS.failed}</Text>}
        {state.kind === 'done' && state.gyms.length === 0 && <Text style={styles.note}>{GYM_LABELS.empty}</Text>}
        {state.kind === 'done' &&
          state.gyms
            .filter((g) => g.name.toLowerCase().includes(needle))
            .map((g) => (
              <GymListRow key={g.id} icon="gym" title={g.name} subtitle={g.street ?? undefined} right={distanceLabel(g.meters)} onPress={() => pickNearby(g)} />
            ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // The Add Exercise search: 16 under the header, 36 tall, 16 from the sides.
  search: {
    height: ADD_EXERCISE_SIZES.searchHeight,
    marginTop: SPACE.lg,
    marginHorizontal: LAYOUT.screenMargin,
    paddingHorizontal: SPACE.md,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACE.sm,
    paddingVertical: 0,
    ...TYPE.body,
  },
  // "Your Gyms", like Add Exercise's "Recent Exercises".
  section: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    lineHeight: LINE_HEIGHTS.normal,
    paddingTop: SPACE.xl,
    paddingBottom: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
  },
  note: {
    ...TYPE.body,
    color: COLORS.textSecondary,
    paddingVertical: SPACE.md,
    paddingHorizontal: LAYOUT.screenMargin,
  },
});
