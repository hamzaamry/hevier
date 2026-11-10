import { describe, expect, it } from 'vitest';
import { distanceLabel, overpassQuery, parseOverpass } from './overpass';

// Overpass answers { elements: [...] }; a node has lat/lon, a way has center.
const LAT = 48.85;
const LON = 2.35;
const node = (id: number, name: string | undefined, dLat: number, tags: Record<string, string> = {}) => ({
  type: 'node',
  id,
  lat: LAT + dLat,
  lon: LON,
  tags: { ...(name ? { name } : {}), ...tags },
});

describe('overpassQuery', () => {
  it('asks for fitness centres around the position', () => {
    expect(overpassQuery(48.85, 2.35)).toBe('[out:json][timeout:15];nwr["leisure"="fitness_centre"](around:3000,48.85,2.35);out center tags;');
  });
});

describe('parseOverpass', () => {
  it('node and way (center) results, skips nameless, uses brand, sorts by distance, keeps the street', () => {
    const gyms = parseOverpass(
      {
        elements: [
          node(1, 'Far Gym', 0.02),
          { type: 'way', id: 2, center: { lat: LAT + 0.001, lon: LON }, tags: { name: 'Way Gym', 'addr:street': 'Rue de Bercy' } },
          node(3, undefined, 0.0005), // no name, no brand
          node(4, undefined, 0.002, { brand: 'Basic-Fit' }),
          { type: 'node', id: 5, tags: { name: 'No Position' } },
        ],
      },
      LAT,
      LON
    );
    expect(gyms.map((g) => g.name)).toEqual(['Way Gym', 'Basic-Fit', 'Far Gym']);
    expect(gyms[0]).toMatchObject({ id: 'way2', street: 'Rue de Bercy' });
    expect(gyms[0].meters).toBeGreaterThan(100);
    expect(gyms[0].meters).toBeLessThan(120);
    expect(gyms[1].street).toBeNull();
  });

  it('keeps the nearest of names that match ignoring case', () => {
    const gyms = parseOverpass({ elements: [node(1, 'basic-fit', 0.01), node(2, 'Basic-Fit', 0.001)] }, LAT, LON);
    expect(gyms.map((g) => g.id)).toEqual(['node2']);
  });

  it('caps at 15', () => {
    const elements = Array.from({ length: 30 }, (_, i) => node(i, `Gym ${i}`, i / 1000));
    expect(parseOverpass({ elements }, LAT, LON)).toHaveLength(15);
  });

  it('[] on garbage', () => {
    for (const bad of [null, undefined, 'x', 3, {}, { elements: 'no' }, { elements: [null, 4, 'a'] }]) {
      expect(parseOverpass(bad, LAT, LON)).toEqual([]);
    }
  });
});

describe('distanceLabel', () => {
  it('296 → 300 m, 1234 → 1.2 km', () => {
    expect(distanceLabel(296)).toBe('300 m');
    expect(distanceLabel(1234)).toBe('1.2 km');
  });
});
