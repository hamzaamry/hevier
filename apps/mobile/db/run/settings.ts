import { DEFAULT_RUN_SETTINGS } from '@/constants/defaults';
import { RUN } from '@/constants/run';
import { STORAGE_KEYS } from '@/constants/storage';
import { getJson, setJson } from '@/db/appState/appState';
import { getDb } from '@/db/client';
import { runIsOn } from '@/lib/training/run';
import type { RunSettings } from '@/types/run';
import { SELECT_ANY_RUN } from './queries';

// Run settings, one JSON value in app_state. A setting added later falls back to its default.
export async function getRunSettings(): Promise<RunSettings> {
  const saved = await getJson<Partial<RunSettings>>(STORAGE_KEYS.runSettings);
  return { ...DEFAULT_RUN_SETTINGS, ...(saved ?? {}) };
}

export async function saveRunSettings(settings: RunSettings): Promise<void> {
  await setJson(STORAGE_KEYS.runSettings, settings);
}

export async function hasLoggedRun(): Promise<boolean> {
  const db = await getDb();
  return (await db.getFirstAsync(SELECT_ANY_RUN, [RUN])) !== null;
}

// Whether the run screens show (lib/training/run.ts runIsOn): without loading the whole history.
export async function isRunOn(settings?: RunSettings): Promise<boolean> {
  const s = settings ?? (await getRunSettings());
  const hasRun = s.enabled === null && (await hasLoggedRun()); // only asked when it decides
  return runIsOn(s.enabled, hasRun);
}
