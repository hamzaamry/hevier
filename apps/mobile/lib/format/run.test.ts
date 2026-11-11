import { describe, expect, it } from 'vitest';

import { effortLines, gateReason, minutesLabel, paceText, runSeconds, slotLabel, verdictLine } from './run';
import type { Readiness } from '@/types/run';

const readiness = (extra: Partial<Readiness>): Readiness => ({
  slotMs: new Date(2026, 10, 10, 6, 30).getTime(),
  verdict: 'easy',
  gates: [],
  provisional: true,
  confidence: 'medium',
  recentLifting: true,
  legScore: 0,
  load: { acute: 0, chronic: 0, ratio: 1 },
  runs28: 8,
  hardShare28: 0,
  guidance: { minutes: 35, maxMinutes: 52, hardMinutes: null, rpe: [2, 4], paceSecPerKm: null },
  ...extra,
});

describe('run sentences', () => {
  it('gives each reason its numbers', () => {
    expect(gateReason({ id: 'hard_gap', cap: 'easy', detail: { hours: 38.4, ratedHard: 1 } })).toBe('Your last hard run was 38 h ago.');
    expect(gateReason({ id: 'ramp_spike', cap: 'easy', detail: { ratio: 2.14 } })).toBe('Your recent running load is 2.1x your usual.');
    expect(gateReason({ id: 'hard_gap', cap: 'easy', detail: { hours: 29.6, ratedHard: 0 } })).toBe('Your last big run was 30 h ago.');
    expect(gateReason({ id: 'too_much_hard', cap: 'easy', detail: { share: 0.2 } })).toBe('20% of your running minutes lately were hard.');
    expect(gateReason({ id: 'base_first', cap: 'easy', detail: { runs: 1 } })).toContain('Only 1 run in');
  });

  it('an easy run: the talk test, the length and the user’s own pace', () => {
    const r = readiness({ guidance: { minutes: 35, maxMinutes: 52, hardMinutes: null, rpe: [2, 4], paceSecPerKm: [380, 400] } });
    expect(effortLines(r)).toEqual([
      "Easy is RPE 2 to 4. You can say a full sentence without gasping. If you can't, slow down or walk a minute.",
      'About 35 min, up to 52 min.',
      'Your easy runs lately: 6:20 to 6:40 per km.',
    ]);
  });

  it('a quality run: warm-up, blocks of 3 hard minutes, effort 7 to 8', () => {
    const r = readiness({ verdict: 'quality', guidance: { minutes: 35, maxMinutes: 52, hardMinutes: 12, rpe: [7, 8], paceSecPerKm: null } });
    expect(effortLines(r)[0]).toBe(
      'Warm up 10 min easy, then 4 x 3 min at RPE 7 to 8 with 2 min easy jog between, then cool down. Hard means a few words at a time.'
    );
  });

  it('strength only: run-anyway advice after lifting, "easy run or rest" when only football tired the legs', () => {
    const lifted = readiness({ verdict: 'strength_only', guidance: null });
    expect(effortLines(lifted)).toEqual(["If you run anyway, keep it to 20 min at RPE 3 or lower. It is your call; we can't say whether an easy jog helps or hurts."]);
    expect(verdictLine(lifted)).toContain('upper body or rest');
    const football = readiness({ verdict: 'strength_only', guidance: null, recentLifting: false });
    expect(effortLines(football)).toEqual([]);
    expect(verdictLine(football)).toBe('Your legs are still in the heavy window. An easy run or rest is fine.');
  });

  it('rest for pain or illness says see a doctor if it does not settle; other rest keeps "a walk is fine"', () => {
    const pain = readiness({ verdict: 'rest', guidance: null, gates: [{ id: 'ill_or_pain', cap: 'rest', detail: {} }] });
    expect(verdictLine(pain)).toContain('see a doctor');
    expect(verdictLine(pain)).not.toContain('walk');
    const drained = readiness({ verdict: 'rest', guidance: null, gates: [{ id: 'drained_short_sleep', cap: 'rest', detail: { sleep: 5 } }] });
    expect(verdictLine(drained)).toBe('Take it easy. A walk is fine.');
  });

  it('the quality line does not claim fresh legs', () => {
    expect(verdictLine(readiness({ verdict: 'quality' }))).not.toMatch(/fresh/i);
  });

  it('reads the typed length: 45 is 45 minutes, 120 is two hours, seconds are optional', () => {
    expect([runSeconds('45', ''), runSeconds('120', ''), runSeconds('30', '45'), runSeconds('', '40')]).toEqual([2700, 7200, 1845, 40]);
    expect([runSeconds('', ''), runSeconds('0', '0'), runSeconds('30', '60'), runSeconds('3o', ''), runSeconds('-5', ''), runSeconds('4.5', '')]).toEqual([
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });

  it('names the slot by day and time, and writes times and paces', () => {
    const now = new Date(2026, 10, 9, 21);
    expect(slotLabel(new Date(2026, 10, 10, 6, 30).getTime(), now)).toBe('tomorrow 6:30 AM');
    expect(slotLabel(new Date(2026, 10, 9, 23).getTime(), now)).toBe('today 11:00 PM');
    expect(slotLabel(new Date(2026, 10, 13, 6, 30).getTime(), now)).toBe('Fri 6:30 AM');
    expect(minutesLabel(390)).toBe('6:30 AM');
    expect(paceText(365)).toBe('6:05');
  });
});
