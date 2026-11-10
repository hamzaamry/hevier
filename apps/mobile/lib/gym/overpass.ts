import { EARTH_RADIUS_METERS, GYM_SEARCH } from '@/constants/gym';
import { MS_PER_SECOND } from '@/constants/time';
import type { NearbyGym } from '@/types/gym';

// Gyms near a position, from OpenStreetMap's Overpass API: the query it is
// asked and how its answer is read. Anything unexpected reads as "no gyms".

const METERS_PER_KM = 1000;
const ROUND_TO_METERS = 10;

export function overpassQuery(lat: number, lon: number): string {
  const timeout = GYM_SEARCH.timeoutMs / MS_PER_SECOND;
  return `[out:json][timeout:${timeout}];nwr["leisure"="fitness_centre"](around:${GYM_SEARCH.radiusMeters},${lat},${lon});out center tags;`;
}

// Straight-line distance (haversine).
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

function nearbyGym(element: unknown, lat: number, lon: number): NearbyGym | null {
  if (!isObject(element)) return null;
  const tags = isObject(element.tags) ? element.tags : {};
  const name = text(tags.name) ?? text(tags.brand);
  // A node has its own position, a way or relation a centre.
  const at = typeof element.lat === 'number' ? element : isObject(element.center) ? element.center : null;
  if (!name || !at || typeof at.lat !== 'number' || typeof at.lon !== 'number') return null;
  return {
    id: `${String(element.type)}${String(element.id)}`,
    name,
    street: text(tags['addr:street']),
    meters: distanceMeters(lat, lon, at.lat, at.lon),
  };
}

// Nearest first; of several with the same name (a chain's many entrances) only
// the nearest.
export function parseOverpass(json: unknown, lat: number, lon: number): NearbyGym[] {
  if (!isObject(json) || !Array.isArray(json.elements)) return [];
  const gyms = json.elements
    .map((e) => nearbyGym(e, lat, lon))
    .filter((g): g is NearbyGym => g !== null)
    .sort((a, b) => a.meters - b.meters);
  const seen = new Set<string>();
  return gyms
    .filter((g) => {
      const key = g.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, GYM_SEARCH.maxResults);
}

// "300 m", "1.2 km"
export function distanceLabel(meters: number): string {
  if (meters < METERS_PER_KM) return `${Math.round(meters / ROUND_TO_METERS) * ROUND_TO_METERS} m`;
  return `${(meters / METERS_PER_KM).toFixed(1)} km`;
}
