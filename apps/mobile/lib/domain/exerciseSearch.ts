import { RECENT_EXERCISES_LIMIT } from '@/constants/training';
import { SEARCH_ALIASES, SEARCH_NICKNAMES } from '@/constants/exercise';
import { PICKER_SECTION_LABELS } from '@/constants/labels';
import type { EquipmentGroup } from '@/types/equipment';
import type { MuscleGroup } from '@/types/muscles';
import type { PickerExercise, PickerQuery, PickerSection } from '@/types/exercise';

// The exercise picker's search, filters, Recent and Suggested, worked out in
// memory from the list db/exercisePicker/pickerExercises.ts loads.

// The All Equipment / All Muscles filters: an exercise passes when it is in
// one of the picked groups of each filter (an empty filter lets all through).
// A muscle counts when it is the main one or one of the others the exercise
// works (rows work the lats too); those working it as the main one come first.
// Stretches and the like come after every workout exercise.
export function filterExercises(
  all: PickerExercise[],
  equipment: readonly EquipmentGroup[],
  muscles: readonly MuscleGroup[]
): PickerExercise[] {
  const shown = equipment.length === 0 ? all : all.filter((e) => equipment.includes(e.equipment));
  if (muscles.length === 0) return stretchesLast(shown);
  const main = shown.filter((e) => muscles.includes(e.muscle));
  const also = shown.filter((e) => !muscles.includes(e.muscle) && e.secondary.some((m) => muscles.includes(m)));
  return stretchesLast([...main, ...also]);
}

function stretchesLast(list: PickerExercise[]): PickerExercise[] {
  return [...list.filter((e) => !e.stretch), ...list.filter((e) => e.stretch)];
}

// Recent Exercises: done before, latest first.
export function recentExercises(all: PickerExercise[], limit = RECENT_EXERCISES_LIMIT): PickerExercise[] {
  return all
    .filter((e) => e.lastDone)
    .sort((a, b) => b.lastDone!.localeCompare(a.lastDone!))
    .slice(0, limit);
}

// Every word typed must start a word of the name, in any order ("curl dumb"
// finds "Bicep Curl (Dumbbell)", "row" doesn't find "Narrow"). Case, accents,
// punctuation and a plural "s" don't count ("Pull-ups" = "pull up" = "pullup"),
// gym short forms are spelled out (SEARCH_ALIASES), and the equipment filter's
// group counts as words of the name ("machine" finds "Face Pull").
// From 3 typed words on, names missing one of them come after the full
// matches, so one extra word ("Lateral raise (DB, standing)") doesn't hide
// "Lateral Raise (Dumbbell)"; with no full match, the names with the most
// words (at least half) are shown.
// Order: most words matched, done most, workout exercises before stretches,
// names starting with the first word, the shortest (the plain move before its
// variants), then A-Z.
export function searchExercises(all: PickerExercise[], query: string): PickerExercise[] {
  const typed = searchWords(query).flatMap((w) => SEARCH_ALIASES[w] ?? [w]);
  if (typed.length === 0) return all;
  const scored = all.map((e) => {
    const s = searchable(e);
    return { e, s, hits: countHits(s.keys, typed) };
  });
  const best = scored.reduce((m, f) => Math.max(m, f.hits), 0);
  const least = Math.max(Math.ceil(typed.length / 2), typed.length >= 3 ? best - 1 : best, 1);
  const first = typed[0];
  const starts = (s: Searchable) => (s.words[0]?.startsWith(first) ? 0 : 1);
  return scored
    .filter((f) => f.hits >= least)
    .sort(
      (a, b) =>
        b.hits - a.hits ||
        b.e.timesDone - a.e.timesDone ||
        Number(a.e.stretch) - Number(b.e.stretch) ||
        starts(a.s) - starts(b.s) ||
        a.s.words.length - b.s.words.length ||
        collator.compare(a.e.name, b.e.name)
    )
    .map((f) => f.e);
}

// How many typed words a name has. Two typed words that make one of its words
// together count as both ("pull down" finds "Lat Pulldown").
// Each word is tried alone and joined to the next, keeping the better count.
function countHits(keys: string[], typed: string[], from = 0): number {
  if (from >= typed.length) return 0;
  const has = (w: string) => keys.some((k) => k.startsWith(w));
  const alone = (has(typed[from]) ? 1 : 0) + countHits(keys, typed, from + 1);
  if (from + 1 < typed.length && has(typed[from] + typed[from + 1])) {
    return Math.max(alone, 2 + countHits(keys, typed, from + 2));
  }
  return alone;
}

// Lowercase words without accents or punctuation, a final "s" dropped.
function searchWords(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

// A name's words, plus each two in a row joined ("pull up" -> "pullup"), the
// equipment group's words and its gym nicknames (SEARCH_NICKNAMES). Worked out
// once per exercise: each keystroke searches ~5,400 names, and the filters make
// new lists of the same exercises.
interface Searchable {
  words: string[];
  keys: string[];
}
function searchable(e: PickerExercise): Searchable {
  let s = searchCache.get(e);
  if (!s) {
    const words = searchWords(e.name);
    const joined = words.slice(1).map((w, i) => words[i] + w);
    const equipment = e.equipment === 'None' || e.equipment === 'Other' ? [] : searchWords(e.equipment);
    const nicknames = SEARCH_NICKNAMES.filter(([match]) => match.test(e.name)).flatMap(([, also]) => searchWords(also));
    s = { words, keys: [...words, ...joined, ...equipment, ...nicknames] };
    searchCache.set(e, s);
  }
  return s;
}

const searchCache = new WeakMap<PickerExercise, Searchable>();
const collator = new Intl.Collator();

// Suggested Exercises when replacing: the same muscle, the most done first,
// never a stretch.
export function suggestedExercises(all: PickerExercise[], replacing: { id: string; muscle: MuscleGroup }, limit = 3) {
  return all
    .filter((e) => e.id !== replacing.id && e.muscle === replacing.muscle && !e.stretch)
    .sort((a, b) => b.timesDone - a.timesDone || a.name.localeCompare(b.name))
    .slice(0, limit);
}

// The picker's list: while searching, one untitled section of matches; else
// Suggested (when replacing), Recent, then All. Empty sections are left out.
export function pickerSections(all: PickerExercise[], q: PickerQuery): PickerSection[] {
  const shown = filterExercises(all, q.equipment, q.muscles);
  if (q.search.trim()) {
    const found = searchExercises(shown, q.search);
    return found.length ? [{ title: '', data: found }] : [];
  }
  const out: PickerSection[] = [];
  if (q.replacingId) {
    const current = all.find((e) => e.id === q.replacingId);
    const suggested = current ? suggestedExercises(shown, current) : [];
    if (suggested.length) out.push({ title: PICKER_SECTION_LABELS.suggested, data: suggested });
  }
  const recent = recentExercises(shown);
  if (recent.length) out.push({ title: PICKER_SECTION_LABELS.recent, data: recent });
  if (shown.length) out.push({ title: PICKER_SECTION_LABELS.all, data: shown });
  return out;
}

// "Show N results" in a filter sheet: how many the list would show.
export function pickerCount(all: PickerExercise[], q: PickerQuery): number {
  const shown = filterExercises(all, q.equipment, q.muscles);
  return q.search.trim() ? searchExercises(shown, q.search).length : shown.length;
}
