import { getDb } from '@/db/client';
import type { LegsFelt, RunVerdict } from '@/types/run';
import { UPSERT_RUN_FEEDBACK } from './queries';

// What the app said before a run, and how the legs felt after. Kept to look at
// later; the readiness never reads it.
export async function saveRunFeedback(workoutId: string, verdictShown: RunVerdict, legsFelt: LegsFelt | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(UPSERT_RUN_FEEDBACK, [workoutId, verdictShown, legsFelt]);
}
