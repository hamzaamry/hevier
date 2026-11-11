import { useCallback, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { getCheckIn, saveCheckIn } from '@/db/run/checkIns';
import { getRunSettings, saveRunSettings } from '@/db/run/settings';
import { getStatSets } from '@/db/stats/statSets';
import { dayKey } from '@/lib/date';
import { applyCheckIn, runIsOn, runsOf } from '@/lib/training/run';
import { forecast, nextRunSlotMs } from '@/lib/training/runReadiness';
import { RUN, RUN_FORECAST_DAYS } from '@/constants/run';
import type { CheckIn, CheckInChange, RunLoaded, RunScreenData, RunSettings } from '@/types/run';

async function load(): Promise<{ loaded: RunLoaded; checkIn: CheckIn | null }> {
  const [settings, sets] = await Promise.all([getRunSettings(), getStatSets()]);
  const now = new Date();
  const slotMs = nextRunSlotMs(now, settings.slotMinutes, runsOf(sets));
  return { loaded: { settings, sets, now, slotMs }, checkIn: await getCheckIn(dayKey(new Date(slotMs))) };
}

// The run readiness for the next run slot and the mornings after it, loaded again when
// the screen is focused and when the app comes back. `data` is null until the first load.
// The check-in lives here while it is typed: every tap shows at once, builds on the
// last one (never on what was loaded), and is saved in order.
export function useRunReadiness() {
  const [loaded, setLoaded] = useState<RunLoaded | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const latest = useRef<CheckIn | null>(null);
  const writes = useRef<Promise<void>>(Promise.resolve());

  const reload = useCallback(async () => {
    await writes.current;
    const next = await load();
    latest.current = next.checkIn;
    setCheckIn(next.checkIn);
    setLoaded(next.loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      const sub = AppState.addEventListener('change', (state) => state === 'active' && reload());
      return () => sub.remove();
    }, [reload])
  );

  const data = useMemo<RunScreenData | null>(() => {
    if (!loaded) return null;
    const { settings, sets, now, slotMs } = loaded;
    const days = forecast({ sets, checkIn }, slotMs, RUN_FORECAST_DAYS, settings.slotMinutes);
    const on = runIsOn(settings.enabled, sets.some((s) => s.name === RUN));
    return { settings, on, sets, checkIn, now, slotMs, readiness: days[0], days };
  }, [loaded, checkIn]);

  const updateCheckIn = useCallback(
    (change: CheckInChange) => {
      if (!loaded) return;
      const next = applyCheckIn(latest.current, change, dayKey(new Date(loaded.slotMs)));
      latest.current = next;
      setCheckIn(next);
      writes.current = writes.current.then(() => saveCheckIn(next)).catch((e) => console.warn('Check-in not saved', e));
    },
    [loaded]
  );

  const updateSettings = useCallback(
    async (patch: Partial<RunSettings>) => {
      if (!loaded) return;
      await saveRunSettings({ ...loaded.settings, ...patch });
      await reload();
    },
    [loaded, reload]
  );

  return { data, reload, updateCheckIn, updateSettings };
}
