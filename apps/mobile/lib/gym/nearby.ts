import { GYM_SEARCH } from '@/constants/gym';
import type { Locator, NearbyGym, NearbyState } from '@/types/gym';
import { overpassQuery, parseOverpass } from './overpass';

// Asks Overpass for the gyms around a position. Throws when it can't be
// reached, answers with an error (429 = too many requests) or takes too long.
export async function findNearbyGyms(lat: number, lon: number, fetchFn: typeof fetch = fetch): Promise<NearbyGym[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GYM_SEARCH.timeoutMs);
  try {
    const response = await fetchFn(GYM_SEARCH.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': GYM_SEARCH.userAgent },
      body: `data=${encodeURIComponent(overpassQuery(lat, lon))}`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass answered ${response.status}`);
    return parseOverpass(await response.json(), lat, lon);
  } finally {
    clearTimeout(timer);
  }
}

export async function searchNearby(locator: Locator, fetchFn: typeof fetch = fetch): Promise<NearbyState> {
  try {
    if (!(await locator.allowed())) return { kind: 'denied' };
    if (!(await locator.switchedOn())) return { kind: 'off' };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), GYM_SEARCH.positionTimeoutMs);
    });
    const coords = await Promise.race([locator.position(), late]).finally(() => clearTimeout(timer));
    if (!coords) return { kind: 'off' };
    return { kind: 'done', gyms: await findNearbyGyms(coords.latitude, coords.longitude, fetchFn) };
  } catch {
    return { kind: 'failed' };
  }
}
