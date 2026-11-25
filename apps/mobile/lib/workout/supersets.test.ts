import { describe, expect, it } from 'vitest';
import { endsSuperset, normalizeSupersets, orderKeepingSupersets, pairExercises, supersetBlocks, unpairExercise } from './supersets';

const exercise = (key: string, supersetId: string | null = null) => ({ key, supersetId });
const order = (list: { key: string }[]) => list.map((e) => e.key);

describe('supersets', () => {
  it('pairs two exercises, putting the picked one right under the other', () => {
    const list = [exercise('a'), exercise('b'), exercise('c'), exercise('d')];
    expect(order(pairExercises(list, 'a', 'd', 'g'))).toEqual(['a', 'd', 'b', 'c']);
    expect(pairExercises(list, 'a', 'd', 'g').map((e) => e.supersetId)).toEqual(['g', 'g', null, null]);
    expect(order(pairExercises(list, 'c', 'b', 'g'))).toEqual(['a', 'c', 'b', 'd']);
  });

  it('takes the partner out of its old superset, which stops being one', () => {
    const list = [exercise('a', 'old'), exercise('b', 'old'), exercise('c')];
    const paired = pairExercises(list, 'c', 'a', 'new');
    expect(order(paired)).toEqual(['b', 'c', 'a']);
    expect(paired.map((e) => e.supersetId)).toEqual([null, 'new', 'new']);
  });

  it('removing one leaves the partner alone, with no superset', () => {
    const list = [exercise('a', 'g'), exercise('b', 'g'), exercise('c')];
    expect(unpairExercise(list, 'a').map((e) => e.supersetId)).toEqual([null, null, null]);
    expect(order(unpairExercise(list, 'a'))).toEqual(['a', 'b', 'c']);
  });

  it('drops a group id left on a single exercise', () => {
    const list = [exercise('a', 'g'), exercise('b')];
    expect(normalizeSupersets(list).map((e) => e.supersetId)).toEqual([null, null]);
  });

  it('groups a consecutive superset into one block, and leaves a single exercise on its own', () => {
    const list = [exercise('a'), exercise('b', 'g'), exercise('c', 'g'), exercise('d', 'g'), exercise('e', 'h'), exercise('f', 'k'), exercise('g', 'k')];
    expect(supersetBlocks(list).map((block) => [block.supersetId, order(block.exercises)])).toEqual([
      [null, ['a']],
      ['g', ['b', 'c', 'd']],
      [null, ['e']],
      ['k', ['f', 'g']],
    ]);
  });

  it('knows which exercise of the pair ends it, for the rest timer', () => {
    const list = [exercise('a', 'g'), exercise('b', 'g'), exercise('c')];
    expect(endsSuperset(list, 'a')).toBe(false);
    expect(endsSuperset(list, 'b')).toBe(true);
    expect(endsSuperset(list, 'c')).toBe(true);
    expect(endsSuperset([exercise('a', 'g')], 'a')).toBe(true); // a group of one is none
  });

  it('keeps a superset together when the order is changed', () => {
    const list = [exercise('a', 'g'), exercise('b', 'g'), exercise('c'), exercise('d')];
    expect(order(orderKeepingSupersets(list, ['c', 'b', 'd', 'a']))).toEqual(['c', 'b', 'a', 'd']);
    expect(order(orderKeepingSupersets(list, ['d', 'b', 'c', 'a']))).toEqual(['d', 'b', 'a', 'c']);
    // No superset: the given order.
    expect(order(orderKeepingSupersets([exercise('a'), exercise('b')], ['b', 'a']))).toEqual(['b', 'a']);
    // Unknown keys are skipped.
    expect(order(orderKeepingSupersets([exercise('a'), exercise('b')], ['x', 'b', 'a']))).toEqual(['b', 'a']);
  });

  it('leaves the list as is when pairing an exercise with itself or a missing one', () => {
    const list = [exercise('a', 'g'), exercise('b', 'g')];
    expect(pairExercises(list, 'a', 'a', 'new')).toBe(list);
    expect(pairExercises(list, 'a', 'x', 'new')).toBe(list);
  });
});
