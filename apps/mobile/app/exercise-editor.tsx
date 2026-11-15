import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { HeaderPillButton, HeaderTextLeft, InnerHeader } from '@/components/ui/InnerHeader';
import { Screen } from '@/components/ui/Screen';
import { Divider } from '@/components/ui/Divider';
import { FormRow } from '@/components/ui/FormRow';
import { BottomSheet, SheetOption } from '@/components/ui/BottomSheet';
import { SCREEN_STYLES } from '@/components/ui/screenStyles';
import { FilterSheet } from '@/components/exercises/FilterSheet';
import { MediaStrip } from '@/components/workout/MediaStrip';
import { MuscleIcon } from '@/components/exercises/FilterIcons';
import { EQUIPMENT_SECTIONS, MUSCLE_SECTIONS } from '@/components/exercise-picker/filterSections';
import { useMediaSource } from '@/hooks/useMediaSource';
import { EXERCISE_TYPES } from '@/constants/exercise';
import { EXERCISE_EDITOR_LABELS as L, EXERCISE_TYPE_LABELS } from '@/constants/labels';
import { COLORS, TYPE } from '@/constants/theme';
import { SPACE } from '@/constants/layout';
import { EDIT_PROFILE_SIZES, SIZES } from '@/constants/sizes';
import { getExerciseForEdit } from '@/db/exercises/read';
import { createExercise, findByName, NameTakenError, restoreExercise, updateExercise } from '@/db/exercises/write';
import { secondaryOptions } from '@/lib/domain/exerciseInput';
import { deleteMediaFiles } from '@/lib/workoutMedia';
import { setCreatedExercise } from '@/stores/exercisePickRequest';
import { reloadPerHand } from '@/stores/perHand';
import type { EquipmentGroup } from '@/types/equipment';
import type { ExerciseInput } from '@/types/exercise';
import type { MuscleGroup } from '@/types/muscles';
import type { MediaItem } from '@/types/workout';

// Create Exercise (/exercise-editor, ?name= prefills it from the picker's search)
// and Edit Exercise (?id=). Built like Edit Profile: Cancel / title / Save pill,
// then rows that open the picker's Equipment and Muscle sheets in pick mode.
// Nothing is saved until Save; a photo or video picked meanwhile is copied into
// media/ at once and deleted again if the screen closes without saving it.

type Sheet = 'equipment' | 'primary' | 'secondary' | 'type';

interface Draft extends Omit<ExerciseInput, 'equipment' | 'primary'> {
  equipment: EquipmentGroup | null;
  primary: MuscleGroup | null;
}

const EMPTY: Draft = { name: '', type: 'weight_reps', equipment: null, primary: null, secondary: [], media: null };

export default function ExerciseEditor() {
  const router = useRouter();
  const { id, name: prefill } = useLocalSearchParams<{ id?: string; name?: string }>();
  const [draft, setDraft] = useState<Draft | null>(id ? null : { ...EMPTY, name: prefill ?? '' });
  const [typeLocked, setTypeLocked] = useState(false);
  // The exercise found with the typed name, for the name it was looked up for.
  const [taken, setTaken] = useState<{ name: string; id: string; archived: boolean } | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // Files picked on this screen; whichever isn't saved is deleted on close.
  const picked = useRef<string[]>([]);
  const saved = useRef<string | null>(null);
  const leaving = useRef(false);

  useEffect(() => {
    if (!id) return;
    getExerciseForEdit(id).then((e) => {
      if (!e) return;
      setDraft(e.input);
      setTypeLocked(e.typeLocked);
    });
  }, [id]);

  useEffect(
    () => () => deleteMediaFiles(picked.current.filter((f) => f !== saved.current)),
    []
  );

  const name = draft?.name.trim() ?? '';
  useEffect(() => {
    if (!name) return;
    let current = true;
    findByName(name, id).then((found) => current && setTaken(found && { name, ...found }));
    return () => {
      current = false;
    };
  }, [name, id]);
  // Only an answer for the name in the box counts (a slower one may arrive late).
  const clash = taken && taken.name === name ? taken : null;

  const media = useMediaSource(
    ([item]: MediaItem[]) => {
      picked.current.push(item.file);
      update({ media: item });
    },
    { single: true }
  );

  function update(change: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...change } : d));
  }

  function pickPrimary(primary: MuscleGroup) {
    update({ primary, secondary: draft!.secondary.filter((g) => g !== primary) });
    setSheet(null);
  }

  const valid = !!name && !!draft?.equipment && !!draft.primary && !clash;

  async function save() {
    if (!valid || !draft?.equipment || !draft.primary || leaving.current) return;
    leaving.current = true;
    const input: ExerciseInput = { ...draft, equipment: draft.equipment, primary: draft.primary };
    saved.current = input.media?.file ?? null;
    try {
      if (id) {
        const replaced = await updateExercise(id, input);
        if (replaced) deleteMediaFiles([replaced]);
      } else {
        setCreatedExercise(await createExercise(input));
      }
      reloadPerHand();
      router.back();
    } catch (e) {
      // Nothing was written: the form stays, Save works again.
      saved.current = null;
      leaving.current = false;
      if (!(e instanceof NameTakenError)) {
        console.warn('[exercise] save failed', e);
        return;
      }
      const found = await findByName(input.name, id);
      setTaken(found && { name: input.name.trim(), ...found });
    }
  }

  // The name is an archived exercise's: bring that one back instead (the picker ticks it).
  async function restoreClash() {
    if (!clash || leaving.current) return;
    leaving.current = true;
    await restoreExercise(clash.id);
    setCreatedExercise(clash.id);
    router.back();
  }

  return (
    <Screen>
      <Stack.Screen options={{ headerShown: false }} />
      <InnerHeader
        title={id ? L.editTitle : L.createTitle}
        left={<HeaderTextLeft label={L.cancel} onPress={() => router.back()} />}
        right={<HeaderPillButton label={L.save} disabled={!valid} onPress={save} />}
      />
      {draft && (
        <ScrollView contentContainerStyle={SCREEN_STYLES.content} keyboardShouldPersistTaps="handled">
          <View style={styles.media}>
            <MediaStrip
              media={draft.media ? [draft.media] : []}
              onAdd={draft.media ? undefined : media.open}
              onRemove={() => update({ media: null })}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{L.name}</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(v) => update({ name: v })}
              placeholder={L.namePlaceholder}
              placeholderTextColor={COLORS.textSecondary}
              selectionColor={COLORS.primary}
              cursorColor={COLORS.primary}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus={!id && !prefill}
            />
          </View>
          <Divider />
          {clash && !clash.archived && <Text style={styles.error}>{L.nameTaken}</Text>}
          {clash?.archived && !id && (
            <Text style={styles.error}>
              {L.nameArchived}{' '}
              <Text style={styles.link} onPress={restoreClash}>
                {L.restore}
              </Text>
            </Text>
          )}
          {clash?.archived && id && <Text style={styles.error}>{L.nameTaken}</Text>}

          <FormRow icon={null} label={L.equipment} value={draft.equipment ?? L.select} onPress={() => setSheet('equipment')} />
          <FormRow
            icon={draft.primary ? <MuscleIcon group={draft.primary} /> : null}
            label={L.primary}
            value={draft.primary ?? L.select}
            onPress={() => setSheet('primary')}
          />
          {draft.primary && (
            <FormRow
              icon={null}
              label={L.secondary}
              value={draft.secondary.length ? draft.secondary.join(', ') : L.none}
              onPress={() => setSheet('secondary')}
            />
          )}
          <FormRow
            icon={null}
            label={L.type}
            value={EXERCISE_TYPE_LABELS[draft.type]}
            onPress={() => !typeLocked && setSheet('type')}
          />
          {typeLocked && <Text style={styles.note}>{L.typeLocked}</Text>}
        </ScrollView>
      )}

      {draft && (
        <>
          <FilterSheet
            title={L.equipment}
            sections={EQUIPMENT_SECTIONS}
            visible={sheet === 'equipment'}
            selected={draft.equipment ? [draft.equipment] : []}
            single
            onApply={([equipment]) => {
              update({ equipment });
              setSheet(null);
            }}
            onDismiss={() => setSheet(null)}
          />
          <FilterSheet
            title={L.primary}
            sections={MUSCLE_SECTIONS}
            visible={sheet === 'primary'}
            selected={draft.primary ? [draft.primary] : []}
            single
            onApply={([primary]) => pickPrimary(primary)}
            onDismiss={() => setSheet(null)}
          />
          {draft.primary && (
            <FilterSheet
              title={L.secondary}
              sections={[{ options: secondaryOptions(draft.primary).map((key) => ({ key, icon: <MuscleIcon group={key} /> })) }]}
              visible={sheet === 'secondary'}
              selected={draft.secondary}
              applyLabel={L.done}
              onApply={(secondary) => {
                update({ secondary });
                setSheet(null);
              }}
              onDismiss={() => setSheet(null)}
            />
          )}
          <BottomSheet visible={sheet === 'type'} title={L.type} onDismiss={() => setSheet(null)}>
            {EXERCISE_TYPES.map((type, i) => (
              <SheetOption
                key={type}
                first={i === 0}
                label={EXERCISE_TYPE_LABELS[type]}
                selected={draft.type === type}
                onPress={() => {
                  update({ type });
                  setSheet(null);
                }}
              />
            ))}
          </BottomSheet>
        </>
      )}
      {media.sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  media: {
    marginTop: SPACE.lg,
    marginBottom: SPACE.md,
  },
  // Name: the Edit Profile field.
  field: {
    height: SIZES.formRowHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: EDIT_PROFILE_SIZES.labelWidth,
    ...TYPE.body,
  },
  input: {
    flex: 1,
    ...TYPE.body,
    padding: 0,
  },
  error: {
    ...TYPE.small,
    color: COLORS.danger,
    marginTop: SPACE.xs,
  },
  link: {
    color: COLORS.primary,
  },
  note: {
    ...TYPE.small,
    color: COLORS.textSecondary,
    marginTop: SPACE.xs,
  },
});
