import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SQLiteDatabase } from 'expo-sqlite';
import { fakeDb, freshDb, raw, rows } from '@/db/testDb';

// appState.ts on an in-memory sql.js database, as in routines.test.ts.
vi.mock('@/db/client', () => ({ getDb: async () => fakeDb }));

const { getJson, getString, getStrings, insertString, remove, setJson, setString } = await import('./appState');

const stored = () => rows<{ key: string; value: string }>('SELECT key, value FROM app_state ORDER BY key');

beforeEach(async () => {
  await freshDb();
});

describe('app_state', () => {
  it('a missing key reads as null', async () => {
    expect(await getString('a')).toBeNull();
    expect(await getJson('a')).toBeNull();
  });

  it('keeps a plain string as it is', async () => {
    await setString('a', '1');
    expect(stored()).toEqual([{ key: 'a', value: '1' }]);
    expect(await getString('a')).toBe('1');
    await setString('a', '0');
    expect(await getString('a')).toBe('0');
  });

  it('saves JSON and reads it back', async () => {
    await setJson('ids', ['x', 'y']);
    expect(stored()).toEqual([{ key: 'ids', value: '["x","y"]' }]);
    expect(await getJson<string[]>('ids')).toEqual(['x', 'y']);
  });

  it('insertString fails when the key is already saved', async () => {
    await insertString('id', 'one');
    await expect(insertString('id', 'two')).rejects.toThrow();
    expect(await getString('id')).toBe('one');
  });

  it('reads several keys at once, leaving out the missing ones', async () => {
    await setString('a', '1');
    await setString('b', '2');
    const values = await getStrings(['a', 'b', 'c']);
    expect([...values.entries()].sort()).toEqual([
      ['a', '1'],
      ['b', '2'],
    ]);
  });

  it('removes one key or several', async () => {
    await setString('a', '1');
    await setString('b', '2');
    await setString('c', '3');
    await remove('a');
    expect(stored().map((r) => r.key)).toEqual(['b', 'c']);
    await remove(['b', 'c']);
    expect(stored()).toEqual([]);
  });

  it('uses the db handle it is given', async () => {
    const calls: string[] = [];
    const handle = {
      ...fakeDb,
      async runAsync(sqlText: string, params: unknown[] = []) {
        calls.push(sqlText);
        raw.run(sqlText, params as never);
      },
    } as unknown as SQLiteDatabase;
    await setJson('k', { a: 1 }, handle);
    await remove('k', handle);
    expect(calls).toHaveLength(2);
    expect(stored()).toEqual([]);
  });
});
