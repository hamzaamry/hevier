import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { findNearbyGyms } from '@/lib/gym/nearby';
import type { NearbyState } from '@/types/gym';

// "Use my location" on Select Gym. The position is asked for only when
// search() is called, used for one request and never kept.
export function useNearbyGyms(): { state: NearbyState; search: () => void } {
  const [state, setState] = useState<NearbyState>({ kind: 'idle' });
  // The latest search; an older one finishing after it, or after leaving the screen, is ignored.
  const latest = useRef(0);
  useEffect(
    () => () => {
      latest.current = -1;
    },
    []
  );

  const search = useCallback(() => {
    const mine = ++latest.current;
    const show = (next: NearbyState) => {
      if (latest.current === mine) setState(next);
    };
    show({ kind: 'loading' });
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return show({ kind: 'denied' });
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        show({ kind: 'done', gyms: await findNearbyGyms(coords.latitude, coords.longitude) });
      } catch {
        show({ kind: 'failed' });
      }
    })();
  }, []);

  return { state, search };
}
