import { afterEach, describe, expect, it, vi } from 'vitest';
import { GYM_SEARCH } from '@/constants/gym';
import { findNearbyGyms, searchNearby } from './nearby';
import type { Locator } from '@/types/gym';

afterEach(() => vi.useRealTimers());

const answer = (status: number, body: unknown = { elements: [] }) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe('findNearbyGyms', () => {
  it('sends the query form-encoded with the User-Agent', async () => {
    const fetchFn = vi.fn(async () =>
      answer(200, { elements: [{ type: 'node', id: 1, lat: 48.85, lon: 2.35, tags: { name: 'Gym' } }] })
    );
    const gyms = await findNearbyGyms(48.85, 2.35, fetchFn as unknown as typeof fetch);
    expect(gyms.map((g) => g.name)).toEqual(['Gym']);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(GYM_SEARCH.url);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': GYM_SEARCH.userAgent });
    expect(init.body).toBe(`data=${encodeURIComponent('[out:json][timeout:45];nwr["leisure"="fitness_centre"](around:3000,48.85,2.35);out center tags;')}`);
  });

  it('throws on 429', async () => {
    await expect(findNearbyGyms(1, 1, (async () => answer(429)) as unknown as typeof fetch)).rejects.toThrow();
  });

  it('aborts after the timeout', async () => {
    vi.useFakeTimers();
    const hang = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
      })) as unknown as typeof fetch;
    const result = findNearbyGyms(1, 1, hang);
    const caught = expect(result).rejects.toThrow('aborted');
    await vi.advanceTimersByTimeAsync(GYM_SEARCH.timeoutMs);
    await caught;
  });
});

describe('searchNearby', () => {
  const here = { latitude: 48.85, longitude: 2.35 };
  const locator = (over: Partial<Locator> = {}): Locator => ({
    allowed: async () => true,
    switchedOn: async () => true,
    position: async () => here,
    ...over,
  });
  const ok = (async () => answer(200, { elements: [{ type: 'node', id: 1, lat: 48.85, lon: 2.35, tags: { name: 'Gym' } }] })) as unknown as typeof fetch;

  it('lists the gyms around the position', async () => {
    const state = await searchNearby(locator(), ok);
    expect(state.kind === 'done' && state.gyms.map((g) => g.name)).toEqual(['Gym']);
  });

  it('denied when the permission is refused', async () => {
    expect(await searchNearby(locator({ allowed: async () => false }), ok)).toEqual({ kind: 'denied' });
  });

  it('off when the phone location is switched off', async () => {
    expect(await searchNearby(locator({ switchedOn: async () => false }), ok)).toEqual({ kind: 'off' });
  });

  it('off when no position comes in time', async () => {
    vi.useFakeTimers();
    const pending = searchNearby(locator({ position: () => new Promise(() => {}) }), ok);
    await vi.advanceTimersByTimeAsync(GYM_SEARCH.positionTimeoutMs);
    expect(await pending).toEqual({ kind: 'off' });
  });

  it('failed when Overpass fails', async () => {
    const down = (async () => answer(429)) as unknown as typeof fetch;
    expect(await searchNearby(locator(), down)).toEqual({ kind: 'failed' });
  });
});
