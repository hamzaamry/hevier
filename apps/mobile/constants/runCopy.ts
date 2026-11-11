import type { Feel, GateId, LegsFelt, RunVerdict } from '@/types/run';

// Every word of the run readiness screens (app/run/, components/run/). Plain,
// second person, no hype: estimates are called estimates, and nothing says an
// injury will happen or that anyone is "recovered". Parts in {braces} are filled
// in by lib/format/run.ts.

export const RUN_VERDICT_TITLES: Record<RunVerdict, string> = {
  quality: 'Run quality',
  easy: 'Run easy',
  strength_only: 'Strength only',
  rest: 'Rest',
};

export const RUN_VERDICT_LINES: Record<RunVerdict, string> = {
  quality: "Nothing is flagged and you haven't gone hard lately. One hard session is fine.",
  easy: 'A steady, easy run is a good fit. Keep it conversational.',
  strength_only: 'Your legs are still in the heavy window. Skip the run; upper body or rest is fine.',
  rest: 'Take it easy. A walk is fine.',
};

// Rest because of pain or illness: no "a walk is fine".
export const RUN_REST_PAIN_LINE =
  'Skip the run. If the pain or illness does not settle, or you get chest pain or dizziness, see a doctor.';

// Under a dot in the 5-day strip.
export const RUN_VERDICT_SHORT: Record<RunVerdict, string> = {
  quality: 'Quality',
  easy: 'Easy',
  strength_only: 'Strength',
  rest: 'Rest',
};

// Strength only after football alone, with no lifting in the last week: there is no strength session to point at.
export const RUN_NO_LIFTING_LINE = 'Your legs are still in the heavy window. An easy run or rest is fine.';

export const RUN_EASY_EFFORT = 'Easy is RPE 2 to 4. You can say a full sentence without gasping. If you can\'t, slow down or walk a minute.';
export const RUN_QUALITY_EFFORT =
  'Warm up {warmup} min easy, then {blocks} x {block} min at RPE {rpeLow} to {rpeHigh} with {recovery} min easy jog between, then cool down. Hard means a few words at a time.';
export const RUN_ANYWAY = "If you run anyway, keep it to {minutes} min at RPE {rpe} or lower. It is your call; we can't say whether an easy jog helps or hurts.";
export const RUN_LENGTH = 'About {minutes} min, up to {max} min.';
export const RUN_PACE = 'Your easy runs lately: {from} to {to} per km.';

export const RUN_PROVISIONAL = "Tomorrow's call, before your check-in. It can change by morning.";
export const RUN_PROVISIONAL_TODAY = 'Before your check-in. It can change once you tell it how you feel.';
export const RUN_CONFIDENCE: Record<'low' | 'medium', string> = {
  low: 'Not much running history yet, so this leans cautious.',
  medium: 'Based on your last 28 days and your lifting.',
};
export const RUN_CANNOT_SEE =
  "Doesn't know about illness, niggles, stress, how you slept (unless you tell it), heat, hills or other sport. If your body says otherwise, trust it.";

export const RUN_GATE_REASONS: Record<GateId, string> = {
  ill_or_pain: 'You marked pain or illness.',
  drained_short_sleep: 'Drained after {sleep} h of sleep.',
  legs_heavy: 'Your legs are still in the heavy window after recent leg or football work.',
  legs_partial: 'Your legs may not be fully back yet, so no hard running.',
  hard_gap: 'Your last hard run was {hours} h ago.',
  ramp_spike: 'Your recent running load is {ratio}x your usual.',
  ramp: 'Your recent running load is a bit above your usual ({ratio}x).',
  too_much_hard: '{percent}% of your running minutes lately were hard.',
  base_first: 'Only {runs} {runWord} in the last 4 weeks, so build a base of easy runs first.',
  comeback: 'No runs in the last 4 weeks. Start short and easy.',
  tired: 'Short on sleep or feeling drained, so no hard running.',
};

// hard_gap when the last run was not rated hard but was big (minutes × effort).
export const RUN_BIG_RUN_REASON = 'Your last big run was {hours} h ago.';

export const RUN_FORECAST_TITLE = 'Next 5 mornings';
export const RUN_FORECAST_NOTE = 'Assumes no more lifting or running. Each day can change with a check-in.';
export const RUN_NEXT_EASY = 'Next easy run';
export const RUN_NEXT_QUALITY = 'Next quality run';
export const RUN_NEXT_NONE = 'not in the next 5 days';

export const RUN_TODAY = 'today';
export const RUN_TOMORROW = 'tomorrow';
export const RUN_CHECK_IN_TITLE = 'Check-in';
export const RUN_CHECK_IN_NOTE = 'For {when}. Change it in the morning if things change.';
export const RUN_FEEL_LABELS: Record<Feel, string> = { fresh: 'Fresh', normal: 'Normal', drained: 'Drained' };
export const RUN_SLEEP_LABEL = 'Sleep';
export const RUN_SLEEP_UNSET = 'Add';
export const RUN_LEGS_SORE_LABEL = 'Legs sore';
export const RUN_PAIN_LABEL = 'Pain';
export const RUN_SICK_LABEL = 'Sick';
export const RUN_LESS_SLEEP = 'Less sleep';
export const RUN_MORE_SLEEP = 'More sleep';
export const RUN_EARLIER_SLOT = 'Earlier run time';
export const RUN_LATER_SLOT = 'Later run time';

export const RUN_LEGS_FELT_TITLE = 'How did your legs feel?';
export const RUN_LEGS_FELT_LABELS: Record<LegsFelt, string> = { heavy: 'Heavy', ok: 'Fine' };

export const RUN_DISCLAIMER_TITLE = 'Before you start';
export const RUN_DISCLAIMER =
  "Hevier's run guidance is a training estimate, not medical advice. It can't see illness, injury, medication, heat, or how you actually slept. If you get chest pain, dizziness, unusual breathlessness, or pain that changes how you run, stop and see a doctor. If you have a heart condition or are new to hard exercise, check with a doctor before using the quality suggestions.";
export const RUN_DISCLAIMER_BUTTON = 'Got it';
export const RUN_NOT_MEDICAL = 'A training estimate, not medical advice.';
// The card on Statistics until the note above has been read: no call is shown before that.
export const RUN_CARD_NOTE_TITLE = 'Run readiness';
export const RUN_CARD_NOTE_LINE = 'Read a short note first, then get a call for your run slot.';

export const RUN_SCREEN_TITLE = 'Run';
export const RUN_LOG_TITLE = 'Log run';
export const RUN_HOW_TITLE = 'How this works';
export const RUN_HOW_LINK = 'How this works';
export const RUN_LOG_LINK = 'Log a run';
export const RUN_WHY_TITLE = 'Why';
export const RUN_WHY_MORE = 'More';
export const RUN_WHY_LESS = 'Less';
export const RUN_NOTHING_FLAGGED = 'Nothing is holding you back.';

export const RUN_LOG_FIELDS = {
  time: 'Time',
  minutes: 'min',
  seconds: 'sec',
  distance: 'Distance (km)',
  effort: 'How hard did it feel?',
  when: 'When',
};
export const RUN_LOG_PLACEHOLDERS = { minutes: '30', seconds: '00', distance: '0.0' };
export const RUN_LOG_ERROR = "Couldn't save the run. Try again.";
export const RUN_LOG_A11Y = { minutes: 'Minutes', seconds: 'Seconds', distance: 'Distance in kilometres' };
export const RUN_LOG_WHEN_LABELS = { now: 'Just finished', yesterday: 'Yesterday' };
export const RUN_LOG_SAVE = 'Save run';
export const RUN_LOG_NO_EFFORT = 'No effort picked: it counts as easy.';
export const RUN_LOG_SAVED = 'Run saved';
export const RUN_LOG_DONE = 'Done';
export const RUN_LOG_PACE = '{pace} per km';
export const RUN_LOG_PACE_EASY = ' Your easy runs lately: {from} to {to}.';

export const RUN_EFFORT_OTHER = 'Or pick a number';

export const RUN_SETTINGS_SECTION = 'Running';
export const RUN_SETTINGS_TOGGLE = 'Run readiness';
export const RUN_SETTINGS_TOGGLE_NOTE = 'A call each morning on whether to run, and how hard.';
export const RUN_SETTINGS_SLOT = 'Run time';

export const RUN_CARD_KICKER = 'Run slot';
export const RUN_CARD_HOME_KICKER = 'RUN';

export const RUN_HOW_SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What it does',
    body: 'Each morning it makes one call for your run slot: run quality, run easy, strength only, or rest. It is the most cautious answer of several checks, and it always lists the checks that fired.',
  },
  {
    title: 'Your legs',
    body: 'It reuses the recovery windows from the Recovery view, looked at the time you plan to run. Legs that score as rested allow a hard run, legs that may still be tired keep it easy, and legs still in the heavy window point to strength work or rest. Those windows come from lifting studies and are borrowed here, so treat them as a rough guide.',
  },
  {
    title: 'Your running',
    body: 'Each run counts as minutes times how hard it felt (RPE out of 10), the idea behind session-RPE load. A short and a long average of that load show whether this week is unusually big for you. It can only push the call down to easy, and it is not an injury predictor. A hard run also keeps the next three days easy, and the call stays easy while hard running is a big share of your minutes. A run is dated when its workout started, so one at the end of a longer workout counts as earlier than it was.',
  },
  {
    title: 'Your check-in',
    body: 'How you feel, how long you slept and any pain are your own report, and they only ever lower the call. Pain or illness means rest, and if it does not settle, see a doctor.',
  },
  {
    title: 'How hard to run',
    body: 'Easy means you can talk in full sentences. Hard means a few words at a time. Pace is only shown from your own easy runs, never a target.',
  },
  {
    title: 'What it cannot see',
    body: RUN_CANNOT_SEE,
  },
];
