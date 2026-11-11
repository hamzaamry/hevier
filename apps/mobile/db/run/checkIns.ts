import { getDb } from '@/db/client';
import { RUN_FEELS } from '@/constants/run';
import type { CheckIn, Feel } from '@/types/run';
import { SELECT_CHECK_IN, UPSERT_CHECK_IN } from './queries';
import type { CheckInRow } from './rows';

// The morning check-in for a run slot's day (yyyy-mm-dd); null when none was saved.
export async function getCheckIn(date: string): Promise<CheckIn | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CheckInRow>(SELECT_CHECK_IN, [date]);
  if (!row) return null;
  return {
    date: row.date,
    feel: (RUN_FEELS as readonly string[]).includes(row.feel ?? '') ? (row.feel as Feel) : null,
    sleepHours: row.sleep_hours,
    legsSore: row.legs_sore === 1,
    pain: row.pain === 1,
    sick: row.sick === 1,
  };
}

// One per day: saving again replaces it.
export async function saveCheckIn(c: CheckIn, now = new Date()): Promise<void> {
  const db = await getDb();
  await db.runAsync(UPSERT_CHECK_IN, [c.date, c.feel, c.sleepHours, +c.legsSore, +c.pain, +c.sick, now.toISOString()]);
}
