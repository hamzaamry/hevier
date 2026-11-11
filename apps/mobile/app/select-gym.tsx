import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GymListRow } from '@/components/gym/GymListRow';
import { HeaderTextLeft, InnerHeader } from '@/components/ui/InnerHeader';
import { NameDialog } from '@/components/ui/NameDialog';
import { Screen } from '@/components/ui/Screen';
import { SearchField } from '@/components/ui/SearchField';
import { GYM_NAME_MAX_LENGTH } from '@/constants/gym';
import { GYM_LABELS } from '@/constants/labels';
import { COLORS, LINE_HEIGHTS, TYPE } from '@/constants/theme';
import { LAYOUT, SPACE } from '@/constants/layout';
import { getGymTimeline, getGymWorkouts } from '@/db/gym/gym';
import { useNearbyGyms } from '@/hooks/useNearbyGyms';
import { distanceLabel } from '@/lib/gym/overpass';
import { choiceOfName, sameGymName, yourGyms } from '@/lib/gym/timeline';
import { monthDay } from '@/lib/format/date';
import { deliverGymPick } from '@/stores/gymPickRequest';
import type { GymChoice, NearbyGym, YourGym } from '@/types/gym';

// Select Gym, opened by the Gym rows of Change Gym and Save Workout (stores/gymPickRequest.ts).

export default function SelectGym() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [mine, setMine] = useState<YourGym[]>([]);
  const [query, setQuery] = useState('');
  const { state, search } = useNearbyGyms();
  const [adding, setAdding] = useState(false);
  // A double tap would hand the pick over and go back twice.
  const leaving = useRef(false);

  useEffect(() => {
    Promise.all([getGymTimeline(), getGymWorkouts()]).then(([timeline, workouts]) => setMine(yourGyms(timeline, workouts)));
  }, []);

  const needle = query.trim().toLowerCase();
  const shownMine = useMemo(() => mine.filter((g) => g.name.toLowerCase().includes(needle)), [mine, needle]);
  const canAdd = needle !== '' && !mine.some((g) => sameGymName(g.name, query));

  function pick(choice: GymChoice) {
    if (leaving.current) return;
    leaving.current = true;
    deliverGymPick(choice);
    router.back();
  }

  // A nearby gym you already have is that gym, with its records.
  function pickNearby(gym: NearbyGym) {
    pick(choiceOfName(mine, gym.name));
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader title={GYM_LABELS.pickerTitle} left={<HeaderTextLeft label={GYM_LABELS.cancel} onPress={() => router.back()} />} />

      <SearchField value={query} onChangeText={setQuery} placeholder={GYM_LABELS.search} maxLength={GYM_NAME_MAX_LENGTH} />

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + SPACE.xxl }}>
        {canAdd ? (
          <GymListRow icon="add" title={`Add "${query.trim()}"`} onPress={() => pick(choiceOfName(mine, query))} />
        ) : (
          <GymListRow icon="add" title={GYM_LABELS.addGym} onPress={() => setAdding(true)} />
        )}

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
        {state.kind === 'off' && <Text style={styles.note}>{GYM_LABELS.locationOff}</Text>}
        {state.kind === 'failed' && <Text style={styles.note}>{GYM_LABELS.failed}</Text>}
        {state.kind === 'done' && state.gyms.length === 0 && <Text style={styles.note}>{GYM_LABELS.empty}</Text>}
        {state.kind === 'done' &&
          state.gyms
            .filter((g) => g.name.toLowerCase().includes(needle))
            .map((g) => (
              <GymListRow key={g.id} icon="gym" title={g.name} subtitle={g.street ?? undefined} right={distanceLabel(g.meters)} onPress={() => pickNearby(g)} />
            ))}
      </ScrollView>

      <NameDialog
        visible={adding}
        title={GYM_LABELS.addGym}
        placeholder={GYM_LABELS.namePlaceholder}
        isValid={(text) => text.trim().length > 0 && text.trim().length <= GYM_NAME_MAX_LENGTH}
        onSave={(name) => {
          setAdding(false);
          pick(choiceOfName(mine, name));
        }}
        onCancel={() => setAdding(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
