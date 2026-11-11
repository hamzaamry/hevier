import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

import { searchNearby } from '@/lib/gym/nearby';
import type { Locator, NearbyState } from '@/types/gym';

const locator: Locator = {
  allowed: async () => (await Location.requestForegroundPermissionsAsync()).status === 'granted',
  switchedOn: () => Location.hasServicesEnabledAsync(),
  // No Google "Location Accuracy" popup on every search.
  position: async () =>
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false })).coords,
};

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
    setState({ kind: 'loading' });
    void searchNearby(locator).then((next) => {
      if (latest.current === mine) setState(next);
    });
  }, []);

  return { state, search };
}
