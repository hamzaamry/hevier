import type { ExerciseType } from '@/types/exercise';
import type { CatalogueEntry } from '@/types/import';

// Leading name words -> Hevy's "(Equipment)" suffix. Longest prefixes first so
// "ez barbell" wins over "barbell".
const EQUIPMENT_PREFIXES: [string, string][] = [
  ['resistance band', 'Band'],
  ['olympic barbell', 'Barbell'],
  ['smith machine', 'Smith Machine'],
  ['medicine ball', 'Medicine Ball'],
  ['ez barbell', 'EZ Bar'],
  ['trap bar', 'Trap Bar'],
  ['dumbbells', 'Dumbbell'],
  ['dumbbell', 'Dumbbell'],
  ['barbell', 'Barbell'],
  ['kettlebell', 'Kettlebell'],
  ['landmine', 'Landmine'],
  ['weighted', 'Weighted'],
  ['suspender', 'Suspension'],
  ['cable', 'Cable'],
  ['lever', 'Machine'],
  ['sled', 'Machine'],
  ['smith', 'Smith Machine'],
  ['band', 'Band'],
];

const LOWERCASE_WORDS = new Set(['a', 'an', 'and', 'at', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);
// Short forms written in capitals ("EZ Bar", not "Ez Bar").
const UPPERCASE_WORDS = new Set(['ez', 'rdl', 'sz', 'trx', 'bosu', 'hiit', 'tvs']);

function titleCase(text: string): string {
  return text
    .split(' ')
    .filter((w) => w !== '')
    .map((w, i) =>
      UPPERCASE_WORDS.has(w)
        ? w.toUpperCase()
        : i > 0 && LOWERCASE_WORDS.has(w)
          ? w
          : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(' ');
}

// "dumbbell bench press"               -> "Bench Press (Dumbbell)"
// "cable straight arm pulldown (with rope)" -> "Straight Arm Pulldown - With Rope (Cable)"
// "dumbbell hammer curl v. 2"          -> "Hammer Curl V2 (Dumbbell)"
// The figure ("(male)") is left out, a "pov" (camera side) is a "view", and
// "version 2" is "V2".
export function toHevyName(catalogueName: string): string {
  let rest = catalogueName
    .trim()
    .toLowerCase()
    .replace(/\((fe)?male\)|\b(fe)?male\b/g, ' ')
    .replace(/\bpov\b/g, 'view')
    .replace(/\bversion (\d+)/g, 'v$1')
    .replace(/\(\s*\)/g, ' ');

  let detail = '';
  const paren = rest.match(/\s*\(([^)]*)\)/);
  if (paren) {
    detail = paren[1];
    rest = rest.replace(paren[0], ' ');
  }
  rest = rest.replace(/\bv\.\s*(\d+)/, 'v$1').replace(/\s+/g, ' ').trim();

  let equipment = '';
  for (const [prefix, label] of EQUIPMENT_PREFIXES) {
    if (rest.startsWith(prefix + ' ')) {
      equipment = label;
      rest = rest.slice(prefix.length + 1);
      break;
    }
  }

  let name = titleCase(rest);
  if (detail) name += ` - ${titleCase(detail)}`;
  if (equipment) name += ` (${equipment})`;
  return name;
}

const DISTANCE_CARDIO = /\b(run|running|walk|walking|jog|bike|cycling|treadmill|elliptical|row|rowing|swim|ski|stepmill|hike)\b/;

export function catalogueExerciseType(entry: CatalogueEntry): ExerciseType {
  const name = entry.name.toLowerCase();
  if (entry.category === 'cardio') {
    return DISTANCE_CARDIO.test(name) ? 'distance_duration' : 'duration';
  }
  if (['isometric', 'stretching', 'mobility', 'yoga'].includes(entry.category ?? '')) return 'duration';
  if (entry.equipment === 'body weight') return 'reps_only';
  return 'weight_reps';
}
