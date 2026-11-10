import { afterEach, describe, expect, it, vi } from 'vitest';
import { GYM_SEARCH } from '@/constants/gym';
import { findNearbyGyms } from './nearby';

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
    expect(init.body).toBe(`data=${encodeURIComponent('[out:json][timeout:15];nwr["leisure"="fitness_centre"](around:3000,48.85,2.35);out center tags;')}`);
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
