import { COMBO, MUSCLE_RULES, RULE_CATEGORIES } from '@/constants/muscleRules';
import { MUSCLE_OF_SECONDARY, MUSCLE_OF_TARGET, SECONDARY_WORD_OF } from '@/constants/muscles';
import type { CatalogueEntry, MuscleRule } from '@/types/import';

// The rule for an exercise's movement, if any (see constants/muscleRules.ts).
export function ruleFor(e: CatalogueEntry): MuscleRule | null {
  if (!RULE_CATEGORIES.includes(e.category ?? '')) return null;
  const name = e.name.toLowerCase();
  if (COMBO.test(name)) return null;
  const rule = MUSCLE_RULES.find((r) => r.match.test(name) && !r.exclude?.test(name));
  // The name says the movement, the main muscle must agree (a lunge "with
  // biceps curl" is not a curl).
  return rule && e.target && rule.targets.includes(e.target) ? rule : null;
}

// The exercise with its movement's muscle fixes applied.
export function applyMuscleRules(e: CatalogueEntry): CatalogueEntry {
  const rule = ruleFor(e);
  if (!rule) return e;
  const target = rule.main ?? e.target ?? '';
  const primary = MUSCLE_OF_TARGET[target];
  // A main muscle replaced by the rule's stays as a secondary one.
  const old = e.target && e.target !== target ? SECONDARY_WORD_OF[MUSCLE_OF_TARGET[e.target]] : undefined;
  const secondary = [...(old ? [old] : []), ...(e.secondaryMuscles ?? [])].filter((w, i, all) => {
    const g = MUSCLE_OF_SECONDARY[w.toLowerCase()];
    // With a new main muscle: not that one again, and the old one only once.
    if (old && g && (g === primary || all.findIndex((x) => MUSCLE_OF_SECONDARY[x.toLowerCase()] === g) !== i)) return false;
    return !g || !rule.drop.includes(g);
  });
  for (const [group, word] of Object.entries(rule.need)) {
    if (group === primary) continue;
    if (!secondary.some((w) => MUSCLE_OF_SECONDARY[w.toLowerCase()] === group)) secondary.push(word);
  }
  return { ...e, target, secondaryMuscles: secondary };
}
