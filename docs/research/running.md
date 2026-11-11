# Run Recovery: spec for Hevier

Status: design only, nothing in the repo changed. Written 2026-11-07 against `main` @ b5c4394 (Expo SDK 57, expo-sqlite, vitest 5, migrations up to 010). Migration numbers below were renumbered on 2026-11-08: upstream added 011 to 014 (body weights, device id, openGym update, Lat Pulldown), so the next free number is 015.
User: occasional runner, runs early morning (about 06:30), lifts evening or later, wants to know WHEN to run and HOW HARD.
Numbers in section 6 and 8 were produced by a throwaway reference implementation (not in the repo) so the tests match the formulas.
Source tags: [v] = abstract/record read this session, [m] = from memory, re-check before quoting in-app.

## 0. The design in 10 lines

1. A run is logged like Football: a workout with one built-in `Run` exercise (distance, time, session RPE 1-10 in `sets.rpe`). No new "runs" table.
2. Run load = minutes x session RPE (Foster 2001). Sum per day, then EWMA 7 d vs 28 d. The ratio is a soft guard rail only, never an injury predictor.
3. Leg freshness is NOT re-modelled: we call the existing `recovery()` with `now` set to the planned run time (it already works for future times), then weight the running muscles.
4. Verdict = the most cautious cap among independent gates. Gates only ever lower the verdict, never raise it. Four verdicts: `quality > easy > strength_only > rest`.
5. Without any wearable: runs (duration, distance, RPE), lifting sets, football, a 10 second morning check-in (feel, sleep hours, pain/sick). Sleep, resting HR and HRV come later and can only downgrade quality to easy.
6. The card previews tomorrow's 06:30 slot tonight ("provisional") and the next 5 mornings, so "legs tonight" has a visible price.
7. Effort guidance is RPE and talk-test first, pace only from the user's own past runs.
8. Honest by construction: every verdict lists the gates that fired, a confidence label (never "high"), and what the app cannot see.
9. Everything is pure functions in `lib/training/` plus constants in `constants/run.ts`; DB is read once via the cached `getStatSets()`.
10. Ships in 7 PRs, first two have no UI.

## 1. Product

### 1.1 User stories
- As a runner who lifts at night, tonight I want to see what tomorrow 06:30 looks like if I train legs (what-if), so I can move leg day or the run.
- At 06:20 I want one word (Run quality / Run easy / Strength only / Rest) and one line of effort guidance, in under 5 seconds.
- After a run I log time, distance and how hard it felt in under 15 seconds, from the same flow I already use.
- I want to see if my runs are mostly easy, if this week jumped versus my normal, and which days legs and runs collide.
- I want to know why: "legs: 4 squat sets 10 h ago, still in the heavy window until about 20:00".
- I never want to be told something is a medical fact or that I will get hurt.
- If I have no running history yet, I want a cautious starter suggestion, not an error state.
- I want to turn it off (settings) and have no run UI left behind.

### 1.2 Screens (3)
Routes follow the existing layout (`app/statistics/*.tsx`, modal-style `app/log-workout.tsx`).

**A. Today readiness card** (`app/run/index.tsx`, and a compact version at the top of Statistics > Recovery)
- Header: "Run slot: tomorrow 6:30 am" (setting, default 06:30). Before the slot today it shows today's slot.
- Verdict chip (large) + one sentence + effort line + "Why" (max 3 gate reasons, expandable) + "Not seen by this estimate" footer.
- Check-in row (morning only): feel `fresh | normal | drained`, sleep hours stepper (optional), "legs sore", "pain / sick" toggles.
- 5-day strip: verdict dot per upcoming slot assuming no more lifting or running ("provisional"), with "Next good easy run" and "Next quality run" lines.
- Footer link: "How this works" (static page, same style as `how-sets-count`).

**B. Log run** (`app/run/log.tsx`, opened from the card, Workout tab and the routine "Run" exercise)
- Fields: time (required), distance (optional), RPE as 5 chips with words (below), date/time defaults to now minus duration.
- RPE chips: 2 "very easy", 3 "easy, full sentences", 4 "steady, short sentences", 6 "hard, few words", 8 "very hard", plus a 1-10 picker. Stored in `sets.rpe` exactly as given.
- Post-save: "Legs felt: heavy / ok" (one tap, optional) and what verdict we showed (stored for later audit, see 4.2).
- Pace shown after save; compare against own easy-pace median.

**C. Week and calendar** (`app/run/week.tsx`)
- Top: 8 weekly bars of run load (AU) with the 28 d line; this week highlighted; text "This week is 1.6x your 4 week typical" only if the guard fires.
- Middle: easy / moderate / hard minutes bar for the last 28 days with the "about 80% easy" marker (a reference, not a target).
- Bottom: 14-day strip, each day shows run dots (colour = easy/mod/hard), a leg-session mark (>= 2 effective leg sets, from the existing recovery model) and football. Tap a day to add a hypothetical leg session at 20:00 (light / normal / heavy); the next three mornings re-evaluate live. Nothing is saved.

### 1.3 Copy tone
Plain, second person, short, no hype, no guilt, no "optimal". Estimates are called estimates. Sentence case.

| Verdict | Title | Line |
|---|---|---|
| quality | Run quality | "Legs look fresh and you haven't gone hard lately. One hard session is fine today." |
| easy | Run easy | "A steady, easy run suits today. Keep it conversational." |
| strength_only | Strength only | "Your legs are still in the heavy window. Skip the run; upper body or rest is fine." |
| rest | Rest | "Take it easy today. A walk is fine." |

- Effort: "Easy = RPE 3. You can say a full sentence without gasping. If you can't, slow down or walk a minute."
- Quality: "Warm up 10 min easy, then 4 x 3 min at RPE 7 to 8 with 2 min easy jog between, then 5 min cool-down. About 35 min."
- Confidence line (low): "Not much running history yet, so this leans cautious." (medium): "Based on your last 28 days and your lifting."
- Provisional: "Tomorrow's call, before your check-in. It can change by morning."
- Reasons, e.g.: "Quads: 4 sets last night, red until 8 pm tomorrow." "Last hard run was 38 h ago." "This week's running is 1.6x your normal."
- Never: "you will get injured", "you must", "recovered" as a fact. Prefer "likely", "looks", "estimate".
- Cannot-see footer: "Doesn't know about illness, niggles, stress, how you slept (unless you tell it), heat, hills or other sport. If your body says otherwise, trust it."

## 2. Science that the model rests on (what each constant is justified by)

### 2.1 Load: session RPE x minutes
- Foster et al. 2001, J Strength Cond Res 15(1):109-115, doi 10.1519/00124278-200102000-00019 [v]: session RPE x duration tracks heart-rate based load in steady and non-steady exercise. Haddad et al. 2017, Front Neurosci, doi 10.3389/fnins.2017.00612 [v]: good validity and reliability across sports, usable stand-alone. So no wearable is needed.
- Foster 1998, Med Sci Sports Exerc 30(7):1164-1168, doi 10.1097/00005768-199807000-00023 [v]: illness linked to load, monotony and strain. Used only as inspiration for "mostly the same run every time" copy; no monotony gate in v1.

### 2.2 Acute vs chronic: EWMA, and why it is only a guard rail
- Gabbett 2016, Br J Sports Med 50(5):273-280, doi 10.1136/bjsports-2015-095788 [v]: acute:chronic ratio idea; secondary summaries quote 0.8-1.3 "sweet spot" and > 1.5 "danger" (not checked in the primary paper).
- Hulin et al. 2016, BJSM 50(4):231-236 [v]: elite rugby league, ratio about 1.5 with high acute load linked to more injury; chronic load itself looked protective. Not runners, not hobbyists.
- Williams et al. 2017, BJSM 51(3):209-210 [v] proposes EWMA with 7 and 28 day decay; Murray et al. 2017, BJSM 51(9):749-754, PMID 28003238 [v]: EWMA was more sensitive in 59 elite footballers.
- Criticism, which is why we do NOT show the ratio as risk: Impellizzeri et al. 2020, Int J Sports Physiol Perform 15(6):907-913, doi 10.1123/ijspp.2019-0864 [v] (no causal rationale, statistical artefacts); Impellizzeri et al. 2021, Sports Med 51:581-592, doi 10.1007/s40279-020-01378-6 [v] (argue to dismiss it); Lolli et al. 2019, BJSM 53:921-922, doi 10.1136/bjsports-2017-098110 [v] (mathematical coupling).
- Decision: keep the EWMA ratio as a cheap "this week is unusually big for you" detector that can only push the verdict down to easy. The alternative (nothing) leaves no protection against the one injury pattern most recreational runners know (too much, too soon). The guard fires only with >= 3 runs in 28 d and a floor on chronic load (2.3).
- Banister impulse-response is NOT implemented: needs performance tests and its parameters are ill-conditioned (Hellard et al. 2006, J Sports Sci 24(5):509-520, doi 10.1080/02640410500244697 [v]). EWMA 7/28 is its performance-free cousin (fatigue-like fast term, fitness-like slow term).
- Progression cap: Nielsen et al. 2014, JOSPT, "Excessive progression in weekly running distance", doi 10.2519/jospt.2014.5164 [m]: > 30% weekly increase showed hazard ratio 1.59 (CI 0.96-2.66, p = 0.07) for distance-related injuries, NOT significant [v]. We use 1.3 x longest recent run as a cautious default, labelled convention. The "10% rule" has no support here.

### 2.3 Intensity distribution
- Seiler 2010, Int J Sports Physiol Perform 5:276-291 [v]: observational, elite endurance athletes do roughly 80% low, 20% high intensity, little threshold work. Esteve-Lanao et al. 2005, Med Sci Sports Exerc 37(3):496-504 [v]: in 8 sub-elite runners, time in zone 1 related to race performance (r -0.79 to -0.97). Esteve-Lanao 2007, J Strength Cond Res [v]: 12 runners, more low-intensity work gave larger gains than between-threshold work.
- Stöggl & Sperlich 2014, Front Physiol 5:33, doi 10.3389/fphys.2014.00033 [v]: n = 48 well trained, 9 weeks, polarized gave the largest VO2peak gain. Muñoz et al. 2014, PMID 23752040 [v]: recreational runners, between-group difference not significant in the main analysis. Meta-analysis 2024, Sports Med, doi 10.1007/s40279-024-02034-z [v] (17 studies) exists; effect sizes not read.
- Decision: "hard share of last 28 d minutes < 20%" and "no hard run within 72 h" are defaults. They are convention-level for a hobby runner, not proven prescriptions.
- RPE <-> zone mapping (easy <= 4, moderate 5-6, hard >= 7) is approximate. Easy = can talk comfortably, below the ventilatory/lactate threshold (Reed & Pipe 2014, Curr Opin Cardiol 29(5):475-480, doi 10.1097/HCO.0000000000000097 [v]; talk test works across modes, reliability evidence thinner).

### 2.4 Lifting then running (the user's pattern is the harder direction)
- Doma, Deakin & Bentley 2017, Sports Med 47(11):2187-2200, doi 10.1007/s40279-017-0758-3 [v] and Doma et al. 2019, Sports Med 49(5):669-682, PMID 30847824 [v]: fatigue and muscle damage from a lifting session can carry into later endurance sessions for hours to days (neural recruitment, kinematics, soreness, glycogen).
- Doma et al. 2017 repeated-bout study (Appl Physiol Nutr Metab; JCU record JCU159420) [v from abstract summary]: after lower-body resistance sessions, avoid sub-maximal running for at least 48 h until the third bout; maximal running may need longer. Doma & Deakin 2014 (strength-first order impaired next-day running more than run-first) [m, journal not re-checked].
- Mechanism and size: Marcora & Bosio 2007, Scand J Med Sci Sports 17(6):662-671, doi 10.1111/j.1600-0838.2006.00627.x [v]: muscle damage cut time-trial speed 4% via higher perceived effort, running economy unchanged. Braun & Dutto 2003, Eur J Appl Physiol, PMID 12783232 [v]: 48 h after downhill running (DOMS), economy tested; later work (Chen) reports 4-7% higher O2 cost for up to 3 days after severe eccentric running [secondary]. So the strongest, best-supported cost is "hard running feels worse and is slower", not injury.
- Our leg windows are the lifting windows from `docs/science/recovery.md` (strength/velocity outcomes: Morán-Navarro 2017, Pareja-Blanco 2017/2020, Belcher 2019, Goulart 2021, Bartolomei 2017). Applying them to running is an inference (see 7.3).

### 2.5 Interference effect: why same-day running and lifting is fine
- Schumann et al. 2022, Sports Med 52(3):601-612, doi 10.1007/s40279-021-01587-7 [v]: concurrent training does not blunt hypertrophy or maximal strength; explosive strength gains may be blunted, more so when done in the same session than when separated by >= 3 h. Robineau et al. 2016, J Strength Cond Res 30(3):672-683, PMID 25546450 [v]: 58 rugby players, 0 h gap hurt strength gains, 6 h and 24 h did not; authors advise >= 6 h. Eddens et al. 2018, Sports Med, PMID 28917030 [v]: lifting before endurance favoured lower-body strength (+6.9%); order mattered little for other outcomes. Fyfe et al. 2014, Sports Med 44(6):743-762 [v] review.
- The user's 06:30 run then evening lift gives >= 10 h separation, the friendly case. The app therefore does NOT warn about same-day running and lifting. It only says (hint, tonight, after a hard morning run) "start your first leg sets lighter".

### 2.6 Readiness inputs and their reliability
- Saw, Main & Gastin 2016, BJSM 50(5):281-291, PMID 26423706 [v]: subjective self-report reflected acute and chronic load with better sensitivity than most objective measures. This is why the check-in comes first and wearables are optional.
- HRV: Plews et al. 2013, Sports Med 43:773-781 [v]: use a 7 day rolling mean of ln RMSSD, >= 3 valid readings per week. Bellenger et al. 2016, Sports Med 46(10):1461-1486, doi 10.1007/s40279-016-0484-2 [v]: post-exercise HRV changes are ambiguous (can rise with overreaching). HRV-guided training vs planned training: Granero-Gallegos 2020 (small VO2max effect, PMC7663087) [v]; two 2020/2021 meta-analyses found no significant VO2max advantage [v, secondary]. Conclusion: HRV is a weak, individual, slow signal.
- Wearable sleep: Chinoy et al. 2021, Sleep 44(5), doi 10.1093/sleep/zsaa291 [v]: seven consumer devices vs polysomnography, sleep detection sensitivity >= 0.93, wake specificity 0.18-0.54, stage classification inconsistent. So use total sleep time only, never stages.
- Sleep loss: Craven et al. 2022, Sports Med 52:2669-2690, PMID 35708888 [v]: about -7.5% performance on average with <= 6 h, effects consistent in the evening, morning tasks largely unaffected. A morning run after a short night is therefore capped for caution, not because it's shown to be harmful.
- Resting HR: no primary source read; treated as a weak companion to HRV [m].

## 3. Model

### 3.1 Constants (`constants/run.ts`)
```ts
export const RUN = 'Run';                       // exercise name that marks a run (like FOOTBALL)
export const RUN_EXERCISE_ID = 'run';

// Session RPE (1-10, stored in sets.rpe). Foster 2001.
export const RUN_EASY_MAX_RPE = 4;              // <= 4 easy
export const RUN_HARD_MIN_RPE = 7;              // >= 7 hard; 5-6 moderate
export const RUN_BIG_LOAD = 300;                // AU; a run this big counts as hard for the 72 h gap (e.g. 50 min x 6)
export const RUN_DEFAULT_RPE = 4;               // an imported run saved without RPE

// Load windows (Williams 2017: decay constants 7 and 28 days)
export const RUN_ACUTE_DAYS = 7;
export const RUN_CHRONIC_DAYS = 28;             // lambda = 2 / (N + 1): 0.25 and 2/29
export const RUN_CHRONIC_FLOOR = 20;            // AU/day (about 140 a week); stops tiny bases exploding the ratio
export const RUN_RAMP_CAUTION = 1.3;
export const RUN_RAMP_SPIKE = 1.5;              // soft guard only (see 2.2)
export const RUN_GUARD_MIN_RUNS = 3;            // guard and distribution gates need >= 3 runs in 28 d

// Intensity distribution (convention, see 2.3)
export const RUN_HARD_SHARE_MAX = 0.2;          // of minutes in the last 28 d
export const RUN_HARD_GAP_HOURS = 72;           // no new quality run within 72 h of a hard one
export const RUN_BASE_MIN_RUNS = 3;             // runs in 28 d before quality is offered

// Duration (convention, Nielsen 2014 is not significant)
export const RUN_PROGRESSION = 1.3;             // next run <= 1.3 x longest run in 28 d
export const RUN_MIN_MINUTES = 20;
export const RUN_MAX_MINUTES = 90;
export const RUN_SPIKE_SHORTEN = 0.75;
export const RUN_COMEBACK_DAYS = 28;            // no run for this long = comeback run
export const RUN_QUALITY_HARD_SHARE = 0.35;     // hard minutes in a quality session = 35% of it, clamp 6..16 min
export const RUN_QUALITY_HARD_RANGE = [6, 16] as const;
export const RUN_DEFAULT_MINUTES = 25;          // no history

// Legs for running (weights = how much each muscle matters to running)
export const RUN_LEG_WEIGHTS = { Quadriceps: 1, Hamstrings: 1, Calves: 0.8, Glutes: 0.8, Adductors: 0.3, Abductors: 0.3 } as const;
export const RUN_LEG_POINTS = { ready: 0, recovering: 0.5, fatigued: 1 } as const; // RecoveryState -> points
export const RUN_LEGS_HEAVY = 0.8;              // >= : strength_only
export const RUN_LEGS_PARTIAL = 0.4;            // >= : easy only
export const RUN_LEGS_SORE_BUMP = 0.4;          // "legs sore" tap adds this (max 1)

// Check-in
export const RUN_SLEEP_LOW_H = 6;               // < : no quality (Craven 2022 is about <= 6 h)
export const RUN_SLEEP_VERY_LOW_H = 5.5;        // < with "drained": rest
export const RUN_SLOT_DEFAULT_MINUTES = 6 * 60 + 30;

// Wearables, phase 3 (Plews 2013: 7 d mean of ln RMSSD, >= 3 valid per week, SWC about 0.5 SD)
export const RUN_HRV_BASELINE_DAYS = 28;
export const RUN_HRV_MIN_POINTS_7D = 3;
export const RUN_HRV_SWC_SD = 0.5;
export const RUN_RHR_RISE_BPM = 3;              // assumption, not from a paper
```
Add `distance_km`-based pace helpers in `lib/training/run.ts`, not constants.

### 3.2 Formulas
1. `runLoad = minutes x rpe` (AU). `runKind(rpe) = rpe <= 4 ? 'easy' : rpe >= 7 ? 'hard' : 'moderate'`. A run with `rpe` null uses `RUN_DEFAULT_RPE`.
2. Daily load `L_d` = sum of loads of runs that started on local calendar day d (build days with `new Date(y, m, d)`, not 24 h steps, same reason as `conditioning.ts`). EWMA over the last 120 days (older days are < 1% weight for the 28 d term... 0.931^120 = 0.0002), seed 0:
   `acute_d = acute_{d-1} + 0.25 (L_d - acute_{d-1})`, `chronic_d = chronic_{d-1} + (2/29)(L_d - chronic_{d-1})`.
   Evaluate through the day BEFORE the slot's day. `ratio = acute / max(chronic, RUN_CHRONIC_FLOOR)`.
3. `runs28`, `hardShare28 = minutes with rpe >= 7 / minutes`, both over runs started in the 28 d before the slot.
4. `lastHard` = most recent run with `rpe >= 7 || load >= RUN_BIG_LOAD`. `hoursSinceHard = (slotMs - startMs) / 3.6e6`.
5. Legs: `states = recovery(sets, setEfforts(sets), new Date(slotMs))` (existing function, football included, runs excluded). `legScore = min(1, max over m of RUN_LEG_WEIGHTS[m] x RUN_LEG_POINTS[states.get(m) ?? 'ready'] + (legsSore ? 0.4 : 0))`.
6. Duration: `base = round5(median(durations of last up to 5 runs in 28 d)) or RUN_DEFAULT_MINUTES`; `cap = clamp(round(1.3 x longest28), 20, 90)`; none in 28 d: `cap = target = 20`.
   - easy target = `min(base, cap)`, min 20. With `ramp_spike`: `max(20, round5(0.75 x base))`.
   - quality total = `min(base, cap)`, hard minutes = `clamp(round(0.35 x total), 6, 16)`.

### 3.3 Gates (each returns a cap and a reason id; verdict = lowest cap, default `quality`)
Order of caps: `rest (0) < strength_only (1) < easy (2) < quality (3)`.

| id | fires when | cap |
|---|---|---|
| `ill_or_pain` | check-in sick or pain | rest |
| `drained_short_sleep` | feel = drained AND sleep < 5.5 h | rest |
| `legs_heavy` | legScore >= 0.8 | strength_only |
| `legs_partial` | 0.4 <= legScore < 0.8 | easy |
| `hard_gap` | hoursSinceHard < 72 | easy |
| `ramp_spike` | runs28 >= 3 AND ratio >= 1.5 | easy (+ shorter run) |
| `ramp` | runs28 >= 3 AND 1.3 <= ratio < 1.5 | easy |
| `too_much_hard` | runs28 >= 3 AND hardShare28 >= 0.2 | easy |
| `base_first` | 1 <= runs28 < 3 | easy |
| `comeback` | runs28 = 0 | easy, 20 min |
| `tired` | feel = drained OR sleep < 6 h | easy |
| `autonomic` (phase 3) | HRV and resting HR strain, see 3.5 | easy |

- No gate can raise a verdict. No gate fires `rest` except illness/pain and drained + very short sleep. Wearable data alone can never produce `rest` or `strength_only`.
- `strength_only` means "skip the run today"; the sentence says upper body/rest is fine. If the user insists: "If you run anyway, keep it to 20 min at RPE 3 or lower. Nothing shows an easy jog after leg day is harmful; it just adds little." (Honest: the evidence is about harder running, 2.4.)
- Why `legs_partial` allows easy: windows are for strength/velocity loss after sets to failure; easy running stays well below the effort at which Doma/Marcora found deficits.

### 3.4 Confidence and provisional
- `confidence = runs28 >= 3 && any lifting set in the last 7 d ? 'medium' : 'low'`. There is no 'high'.
- `provisional = no check-in saved for the slot's local date`. Provisional is always true for a slot more than 4 h away. The UI shows "provisional" and the card in the morning invites the check-in.

### 3.5 Wearable inputs (phase 3, optional, downgrade-only)
- `sleepHours` from device total sleep time replaces the manual stepper when present; stages are ignored (Chinoy 2021).
- Strain: `mean7(ln HRV) < mean28(ln HRV) - 0.5 x sd28(ln HRV)` AND `mean3(restingHr) >= mean28(restingHr) + 3 bpm`, with >= 3 valid HRV days in the last 7 and >= 14 in the last 28. Both conditions, to cut false positives. Result: cap easy. Never raises.
- Platform trap: Health Connect (Android) has RMSSD records, HealthKit (iOS) exposes SDNN. Never compare across sources; baselines are per `source` + `kind`. Wrist devices measure HRV mainly asleep; if no nightly value, skip the gate.
- When no wearable is connected the app must look complete, not degraded.

## 4. Data

### 4.1 Run as a workout (migration 015, no new table)
`db/migrations/015_run.ts`, wired into `MIGRATIONS` and `index.test.ts` (version 15):
```ts
export const sql = `
INSERT OR IGNORE INTO exercises (id, name, type, catalogue_id, is_custom, body_part, target_muscle, secondary_muscles, equipment, category)
VALUES ('run', 'Run', 'distance_duration', NULL, 1, 'cardio', 'cardiovascular system', '[]', 'body weight', 'cardio');
`;
```
- `exercises.name` is UNIQUE; the catalogue has a lower-case `run` entry. Verify the import step title-cases or skips on conflict (the same issue `006_football` avoided with `INSERT OR IGNORE`); add a test that `Run` exists exactly once after catalogue import.
- A run is one set: `distance_km`, `duration_seconds`, `rpe` = session RPE (1-10). Precedent: Football saves its rating in `sets.rpe`. `rpeToRir` must not be applied to Run (extend `setRpe` in `lib/training/rpe.ts` like the `FOOTBALL` branch).
- `getStatSets()` must also select `s.distance_km` (add `distanceKm?: number | null` to `StatSet`, `distance_km` to `StatSetRow` and `SELECT_STAT_SETS`).
- Consumers to update (grep `FOOTBALL` shows the full list): `lib/training/effort.ts` `recovery()` (skip `RUN`, as it does football, so 'Cardio' never gets a window), `lib/training/conditioning.ts` (`cardioMinutes`: Run counts `RUN_HARD_MIN_RPE`+ as vigorous 1.0, else moderate 0.5, WHO 2020), `lib/workout/activeWorkout.ts` (rest timer 0 for Run, like football), `components/log-workout/LogExercise.tsx` (RPE chips for Run).
- CSV import (`scripts/import-csv.ts`) and sync need no change: they carry the whole SQLite file.

### 4.2 New tables (migration 016)
`db/migrations/016_run_recovery.ts`:
```sql
CREATE TABLE run_checkins (
  date        TEXT PRIMARY KEY,                       -- local yyyy-mm-dd of the run slot
  feel        TEXT CHECK (feel IN ('fresh','normal','drained')),
  sleep_hours REAL,
  legs_sore   INTEGER NOT NULL DEFAULT 0,
  pain        INTEGER NOT NULL DEFAULT 0,
  sick        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE TABLE run_feedback (                           -- audit trail of the model, never read by it
  workout_id    TEXT PRIMARY KEY REFERENCES workouts(id),
  verdict_shown TEXT CHECK (verdict_shown IN ('rest','strength_only','easy','quality')),
  legs_felt     TEXT CHECK (legs_felt IN ('heavy','ok'))
);
```
- Update `db/migrations/index.test.ts` expected tables (adds `run_checkins`, `run_feedback`; count 13, it is 11 today) and `user_version` 16.
- Settings (slot minutes, on/off) in `app_state` under a new `STORAGE_KEYS.runSettings = 'run.settings'` (JSON). Never rename existing keys (rule in `constants/storage.ts`).

### 4.3 Phase 3 table (migration 017)
```sql
CREATE TABLE readiness_samples (
  id TEXT PRIMARY KEY, date TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('health_connect','healthkit')),
  kind   TEXT NOT NULL CHECK (kind IN ('sleep_minutes','resting_hr','hrv')),
  value REAL NOT NULL,
  UNIQUE (date, source, kind)
);
```

### 4.4 Types (`types/run.ts`)
```ts
import type { RUN_VERDICTS } from '@/constants/run';
export type RunVerdict = (typeof RUN_VERDICTS)[number];   // ['rest','strength_only','easy','quality'] low->high
export type RunKind = 'easy' | 'moderate' | 'hard';
export type Feel = 'fresh' | 'normal' | 'drained';
export interface RunLog { workoutId: string; startMs: number; minutes: number; km: number | null; rpe: number }
export interface CheckIn { date: string; feel: Feel | null; sleepHours: number | null; legsSore: boolean; pain: boolean; sick: boolean }
export interface WearableDay { date: string; sleepHours?: number; restingHr?: number; hrv?: number; source: 'health_connect' | 'healthkit' }
export type GateId = 'ill_or_pain' | 'drained_short_sleep' | 'legs_heavy' | 'legs_partial' | 'hard_gap'
  | 'ramp_spike' | 'ramp' | 'too_much_hard' | 'base_first' | 'comeback' | 'tired' | 'autonomic';
export interface Gate { id: GateId; cap: RunVerdict; detail: Record<string, number | string> } // detail fills the copy
export interface LoadState { acute: number; chronic: number; ratio: number }
export interface Readiness {
  slotMs: number; verdict: RunVerdict; gates: Gate[]; provisional: boolean; confidence: 'low' | 'medium';
  legScore: number; load: LoadState; runs28: number; hardShare28: number;
  guidance: { minutes: number; maxMinutes: number; hardMinutes: number | null; rpe: [number, number]; paceSecPerKm: [number, number] | null };
}
export type LegDayPreset = 'light' | 'normal' | 'heavy';
```

### 4.5 Pure API (`lib/training/run.ts`, `lib/training/runReadiness.ts`; DB glue in `db/run/`)
```ts
// run.ts
runLoad(minutes: number, rpe: number): number
runKind(rpe: number): RunKind
runsOf(sets: StatSet[]): RunLog[]                                       // name === RUN, rpe null -> default
loadState(runs: RunLog[], slotMs: number): LoadState                    // EWMA through the day before the slot
intensityMinutes(runs: RunLog[], slotMs: number): { easy: number; moderate: number; hard: number; hardShare: number; runs: number }
legScore(states: Map<MuscleGroup, RecoveryState>, legsSore?: boolean): number
suggestMinutes(runs: RunLog[], slotMs: number, spike: boolean): { minutes: number; maxMinutes: number }
easyPace(runs: RunLog[], slotMs: number): [number, number] | null       // median s/km of runs rpe <= 4 with km, +-10 s; needs >= 2
// runReadiness.ts
nextSlotMs(now: Date, slotMinutes: number): number                      // today's slot if now is before it, else tomorrow's (local time, DST safe)
readinessAt(input: ReadinessInput, slotMs: number): Readiness
forecast(input: ReadinessInput, fromSlotMs: number, days: number): Readiness[]   // check-in null after day 0
withLegDay(sets: StatSet[], atMs: number, preset: LegDayPreset): StatSet[]       // synthetic sets for the what-if; never persisted
autonomicStrain(days: WearableDay[], nowMs: number): boolean                     // phase 3
interface ReadinessInput { sets: StatSet[]; checkIn: CheckIn | null; wearable: WearableDay[]; }
// db/run/*.ts
getCheckIn(date: string): Promise<CheckIn | null>; saveCheckIn(c: CheckIn): Promise<void>
saveRunFeedback(workoutId: string, verdictShown: RunVerdict, legsFelt: 'heavy' | 'ok' | null): Promise<void>
```
- `withLegDay` presets: light = Quadriceps 2 sets (+ Glutes/Hamstrings/Calves secondary); normal = 4 sets; heavy = 6 sets; `failure: true`, secondary Glutes, Hamstrings, Calves, i.e. 4 sets give Quadriceps 4.0, others 2.0 (matches the worked examples).
- Memoise `readinessAt` per `sets` array like `setEfforts`. `recovery()` is O(sets in the last 7 d + sets scanned); pass `sets.filter(startMs >= slotMs - 8 d)` for forecasts.
- No new third-party code. Hooks: `hooks/useRunReadiness.ts` (reads `getStatSets()`, check-in, settings) refreshes via the existing `historyCache` invalidation when a workout saves.

## 5. Verdict derivation, step by step
1. `slot = nextSlotMs(now, settings.slotMinutes)`.
2. `states = recovery(sets, setEfforts(sets), new Date(slot))`; `legScore`.
3. `runs = runsOf(sets).filter(startMs < slot)`; load, intensity share, `lastHard`.
4. Collect gates from the table in 3.3, using check-in (if any) and wearable data (if any).
5. `verdict = min cap` (or `quality` when none fired). `provisional`, `confidence` per 3.4.
6. Guidance: `quality` -> total, hard minutes, "RPE 7-8 work, RPE <= 3 between"; `easy` -> minutes, "RPE 2-4, talk in full sentences"; `strength_only` / `rest` -> no run target.
7. Forecast: repeat for slot + 1..4 days with `checkIn = null`, same sets, no new runs; "Next easy run" = first day with verdict >= easy, "Next quality run" = first with `quality`.

## 6. Worked examples (verified with the reference implementation)
Common history H1 ("regular occasional runner", all runs at 06:30): D-3 35 min RPE 3; D-6 30/4; D-10 40/3; D-13 30/4; D-17 35/3; D-20 30/4; D-24 40/3; D-27 30/4 (8 runs, about 2 a week, all easy). From it: acute 25.53, chronic 27.26 AU/day, ratio 0.94, runs28 = 8, hardShare 0, base = median of last 5 durations (35,30,40,30,35) = 35 min, cap = round(1.3 x 40) = 52 min. Leg day = back squat-type, 4 sets to failure: Quadriceps 4.0 sets (window 72 h, red 24 h), Glutes, Hamstrings, Calves 2.0 each (48 h, red 24 h). Slot 06:30.

| # | Situation | Legs / load facts | Verdict | Guidance |
|---|---|---|---|---|
| 1 | Leg day started 20:00 last night, slot 06:30 (10.5 h) | all four red: legScore = 1.0 | **Strength only** (`legs_heavy`) | Skip run. Next easy run: Wed 06:30. |
| 1b | same leg day, Wed 06:30 (35 h) | quads recovering 0.5, glutes/calves 0.4: legScore 0.5 | **Run easy** (`legs_partial`) | 35 min, RPE 3. |
| 1c | same, Fri 06:30 (83 h) | all ready, legScore 0 | **Run quality** | 35 min: 12 min hard as 4 x 3 at RPE 7-8. |
| 2 | Upper-body only last night (chest 4, triceps 3, shoulders 3), H1 | legScore 0 | **Run quality** | same as 1c. |
| 3 | Hard run yesterday (40 min RPE 8 = 320 AU), nothing else | hoursSinceHard 24; acute 103.4, chronic 49.7, ratio 2.08 | **Run easy** (`hard_gap`, `ramp_spike`) | Run is optional; if so about 25 min. |
| 4 | Big week: previous 3 weeks 2 x 30 min RPE 3; this week 45/5, 50/5, 50/5, 40/5 (D-6, D-4, D-2, D-1) | ratio 2.10, runs28 = 10 | **Run easy** (`ramp_spike`) | `max(20, round5(0.75 x 45)) = 35` min (not the usual 45). |
| 5 | H1, check-in drained, 5 h sleep | | **Rest** (`drained_short_sleep`) | "Take it easy. A walk is fine." |
| 5b | H1, check-in normal, 5.8 h sleep | | **Run easy** (`tired`) | No quality. |
| 6 | No run in 40 days (last two at D-40, D-44), legs fresh | runs28 = 0, ratio 0 | **Run easy** (`comeback`) | 20 min, RPE 3, walk breaks fine. |
| 7 | Pain tap | | **Rest** (`ill_or_pain`) | disclaimer shown. |
| 8 | 90 min football (normal) started 20:00, slot 06:30 (10.5 h) | hamstrings 0.80 (> 0.6 red), quads 0.70: legScore 1 | **Strength only** | |
| 8b | same game, 34.5 h later | hamstrings 0.628 (still red), quads 0.549 | **Strength only** | football fatigue outlasts a lifting leg day for hamstrings |
| 8c | same game, 40 h later | hamstrings 0.553, quads 0.484 (orange) | **Run easy** | |
| 9 | H1, legs fresh, wearable: 7 d HRV below baseline - 0.5 SD AND rHR +3 bpm | | **Run easy** (`autonomic`) | quality downgraded only |
| 10 | Only 2 runs in 28 d (both easy), legs fresh | runs28 = 2 | **Run easy** (`base_first`) | confidence low |
| 11 | "Legs sore" tap, otherwise H1 | legScore 0 + 0.4 = 0.4 | **Run easy** (`legs_partial`) | |
| 12 | Tonight hint: quality run done this morning (35 min), leg day planned tonight | | verdict n/a | "Start your first leg sets lighter; legs may feel flat." No gate, no evidence of harm at >= 10 h (Schumann 2022). |

Leg-day what-if for the calendar (H1, leg day Mon 20:00 with 'normal'): Tue strength only, Wed easy, Thu easy, Fri quality. With 'light' (2 quad sets): Tue strength only, Wed easy, Thu quality (quads 2 sets window is 48 h; at 59 h all ready). With 'normal' on Wed instead, Fri 06:30 (34.5 h) is only easy: the product value is seeing this before choosing the day.

## 7. Risks, disclaimer, limits of the evidence

### 7.1 Medical disclaimer (shown once on first open, and in "How this works")
"Hevier's run guidance is a training estimate, not medical advice. It can't see illness, injury, medication, heat, or how you actually slept. If you get chest pain, dizziness, unusual breathlessness, or pain that changes how you run, stop and see a doctor. If you have a heart condition or are new to hard exercise, check with a doctor before using the quality suggestions."

### 7.2 Product and engineering risks
- False authority: a red verdict may be wrong for a trained lifter (repeated-bout effect: Doma 2023, already cited in `recovery.md`). Mitigation: gates only downgrade, user can run anyway, `run_feedback` stores verdict + "legs felt" so windows can be audited later (not auto-tuned in v1).
- Over-conservative on leg days: 4 hard quad sets blocks quality for ~83 h. Accept for v1; if feedback shows "ok" legs >> 60% in the partial band, relax `RUN_LEGS_PARTIAL` windows for the final 24 h.
- Ratio noise for occasional runners: floor of 20 AU/day and >= 3 runs. Even so, the day after a big run `ramp_spike` fires; it overlaps `hard_gap` by design and costs nothing (easy day).
- Missing RPE on imported/foreign runs: defaults to RPE 4. State it in the log screen ("no RPE, counted as easy").
- Time zones and DST: ms timestamps for hours, calendar `Date` constructors for days (see `db/dst.test.ts`).
- Football: keeps its own curve; do not add its load to the run EWMA in v1 (different tissue loading). It only enters via `recovery()` legs.
- Health Connect / HealthKit: need a dev build and config plugins; `AGENTS.md` requires reading the Expo SDK 57 docs before any Expo/RN API. Permissions are read-only; nothing leaves the device (same stance as backup sync).
- Scope creep: no plans, no race predictor, no pace-from-VDOT, no HR zones in v1.

### 7.3 What the science does NOT support
- That the acute:chronic ratio predicts running injury in individuals, or that 1.3 / 1.5 are thresholds (Impellizzeri 2020, 2021; Lolli 2019; the data are elite team sport).
- The 10% rule; even 30% was not significant (Nielsen 2014).
- That 80/20 is required for recreational runners; evidence is observational/elite plus small trials with mixed results (Muñoz 2014 not significant).
- That the lifting recovery windows are the right windows for running performance. They come from strength, jump and velocity outcomes in 10-17 mostly young men after sets to failure; running studies show 24-48 h of impaired effort/performance after lower-body lifting (Doma) but with different protocols. We borrow them.
- That an easy run after leg day is harmful. No evidence either way; we say "adds little".
- That same-day lifting and running hurts muscle growth or max strength (Schumann 2022).
- Daily decisions from HRV or resting HR (single-day values are noisy; HRV-guided training gives small or non-significant gains), or from wearable sleep stages (Chinoy 2021).
- Women/menstrual cycle, age, heat, hills, surface, shoes, previous injury: not modelled; most cited samples are young men.
- Any claim that following the verdict prevents injury or improves race times.

## 8. Test plan (vitest, `lib/training/run.test.ts`, `runReadiness.test.ts`, `db/migrations/index.test.ts`, `db/run/run.test.ts`)
Fixtures: build `StatSet` helpers like the ones in `lib/training/effort.test.ts`; `slot = new Date(2026, 10, 10, 6, 30)`; runs at 06:30 on earlier days; lifts at the stated hours before the slot. Use `toBeCloseTo(x, 2)`.

| # | Test | Input | Expected |
|---|---|---|---|
| 1 | `runLoad` | (30, 4), (45, 7) | 120, 315 |
| 2 | `runKind` | 4 / 5 / 6 / 7 | easy / moderate / moderate / hard |
| 3 | `runsOf` skips lifts and football; null RPE becomes 4 | mixed sets | only `Run` rows, rpe 4 |
| 4 | `loadState`, one 120 AU run 1 day before slot | | acute 30.00, chronic 8.28, ratio 1.50 (floor 20) |
| 5 | `loadState`, one 120 AU run 3 days before | | acute 16.88, chronic 7.17 |
| 6 | `loadState` H1 | | acute 25.53, chronic 27.26, ratio 0.94 |
| 7 | DST: runs across a clock change land on the right local days | 2026-10-25 EU / 2026-11-01 US | same loads as a no-DST fixture |
| 8 | `legScore` squat 4 sets, 10.5 h | | 1.0 |
| 9 | `legScore` same, 34.5 h; 58.5 h; 82.5 h | | 0.5; 0.5; 0 |
| 10 | `legScore` 2 sets (quads 2, others 1), 34.5 h | | 0.5 |
| 11 | `legScore` football 90 min normal, 10.5 h / 34.5 h / 40 h | | 1.0 / 1.0 (hams 0.628) / 0.5 |
| 12 | `legScore` legsSore with fresh legs | | 0.4; with heavy legs stays 1.0 (capped) |
| 13 | Gates, example 1 / 1b / 1c | per section 6 | strength_only / easy (`legs_partial`) / quality |
| 14 | Example 2 upper body only | | quality, gates `[]` |
| 15 | Example 3 hard run yesterday | | easy, gates include `hard_gap` and `ramp_spike`, ratio 2.08 |
| 16 | Hard run 72 h ago exactly vs 71.9 h | RPE 8 | 72.0 h: no `hard_gap`; 71.9 h: `hard_gap` |
| 17 | Example 4 spike | | easy, `ramp_spike`; `guidance.minutes` 35, `maxMinutes` 65 |
| 18 | Guard needs >= 3 runs: example 10 | 2 runs | `base_first`, not `ramp*`, confidence low |
| 19 | Example 6 comeback | | easy, minutes 20, maxMinutes 20, gate `comeback` |
| 20 | Example 5 / 5b / 7 | check-ins | rest / easy `tired` / rest |
| 21 | `hardShare28` | 40 hard of 305 min | 0.13; at 0.20 gate `too_much_hard` fires, at 0.19 not |
| 22 | Gates never raise: any gate set, adding a gate never increases the verdict | property test over a table of gate combinations | monotone |
| 23 | Quality guidance for H1 | | minutes 35, hardMinutes 12 (clamp(round(12.25),6,16)), rpe [7, 8] |
| 24 | `suggestMinutes` caps | longest 80 min | cap 90 (round(104) clamped), longest 15 | cap 20 |
| 25 | `easyPace` | 3 easy runs at 6:20, 6:30, 6:40 /km | [380, 400] (median 390, +-10); with 1 run: null |
| 26 | `nextSlotMs` | now 05:59 -> today 06:30; now 06:31 -> tomorrow 06:30; across DST day | local 06:30, correct date |
| 27 | `forecast` after example 1 | 5 days | strength_only, easy, easy, quality, quality; all `provisional: true` |
| 28 | `withLegDay(normal, Mon 20:00)` then `forecast` from Tue | H1 | same as 1, 1b, 1c; input `sets` array not mutated |
| 29 | `autonomicStrain` | 28 d baseline mean ln 4.0 sd 0.1, last 7 d mean 3.94, rHR +3 | true; HRV low but rHR +2 -> false; only 2 HRV points in 7 d -> false |
| 30 | Cross-source safety | baseline from `healthkit`, today `health_connect` | no strain (separate baselines) |
| 31 | `recovery()` ignores `Run`: a lone run set creates no 'Cardio' state | | map has no Cardio entry |
| 32 | `conditioning`: 30 min Run RPE 4 -> 15 vigorous-equivalent min; RPE 8 -> 30 | | 15; 30 |
| 33 | Migration 015/016: tables, `Run` exercise exists once, `user_version` 16, idempotent rerun | sql.js | per `index.test.ts` style |
| 34 | `saveCheckIn` upserts per date; `getCheckIn` null when absent | sql.js wrapper | |

Dev tip: `/check-touched` runs only these files.

## 9. Phasing (PR-sized)
1. **Science + pure model** (no UI, no DB): `docs/science/running.md` (this spec's section 2 and 7.3, in the style of `recovery.md`), `constants/run.ts`, `types/run.ts`, `lib/training/run.ts`, `lib/training/runReadiness.ts`, both `.test.ts` files (tests 1-30). Uses `StatSet` as is (runs faked in tests).
2. **Run exercise + data plumbing**: `db/migrations/015_run.ts`, `db/migrations/index.ts`, `index.test.ts`, `types/stats.ts` (`distanceKm`), `db/stats/queries.ts`, `rows.ts`, `statSets.ts`, `lib/training/effort.ts` (skip Run), `lib/training/conditioning.ts` (+test), `lib/training/rpe.ts` (+test), `lib/workout/activeWorkout.ts`, `constants/labels.ts`. Tests 31-33.
3. **Log run**: `app/run/log.tsx` (or RPE chips inside `components/log-workout/LogExercise.tsx` for `Run`), `constants/run.ts` copy labels, `db/run/feedback.ts`, migration 016 (tables only, if not already shipped with PR5). Home/Workout entry point.
4. **Today card, no check-in yet**: `hooks/useRunReadiness.ts`, `components/run/ReadinessCard.tsx`, `components/run/WhyList.tsx`, `app/run/index.tsx`, compact card in `app/statistics/body.tsx` (Recovery view), settings slot + on/off in `app/settings.tsx`, `constants/storage.ts` (`runSettings`), disclaimer sheet.
5. **Check-in**: migration 016, `db/run/checkins.ts`, `db/run/queries.ts`, `rows.ts`, `components/run/CheckInRow.tsx`, test 34. Gates `tired`, `drained_short_sleep`, `ill_or_pain`, `legs sore`.
6. **Week and calendar**: `app/run/week.tsx`, `components/run/LoadBars.tsx`, `IntensityBar.tsx`, `LegVsRunStrip.tsx` (what-if sheet using `withLegDay`), `lib/training/runWeeks.ts` (+test) for weekly bars. Nice-to-have: evening notification "Tomorrow 6:30: strength only", reusing the notification code in `lib/workoutNotification.ts`.
7. **Wearables (separate, can slip)**: read Expo SDK 57 docs first; Health Connect / HealthKit read-only module + config plugin (`plugins/`), migration 017, `db/run/readiness.ts`, `autonomicStrain` wired into gates, settings toggle and permission copy. Dev build required.

Each PR keeps lint (`warnings fail`) and `npx tsc --noEmit` clean, per `AGENTS.md`.

## 10. Open questions for Malek
- Slot time: single global (06:30) or per weekday? v1 assumes one.
- Should `strength_only` appear when the user has no lifting at all (then it is just "skip the run")? v1 shows "Skip the run today" copy when no sets in the last 7 d, since nothing explains the cap otherwise.
- Do imported Hevy runs exist? If yes, add a one-off migration like `006_football` to map them to `Run`.

## 11. Source list (identifiers)
Foster 2001 doi 10.1519/00124278-200102000-00019 · Foster 1998 doi 10.1097/00005768-199807000-00023 · Haddad 2017 doi 10.3389/fnins.2017.00612 · Gabbett 2016 doi 10.1136/bjsports-2015-095788 (PMC4789704) · Hulin 2016 BJSM 50:231 · Williams 2017 BJSM 51:209 · Murray 2017 PMID 28003238 · Impellizzeri 2020 doi 10.1123/ijspp.2019-0864 · Impellizzeri 2021 doi 10.1007/s40279-020-01378-6 · Lolli 2019 doi 10.1136/bjsports-2017-098110 · Hellard 2006 doi 10.1080/02640410500244697 · Nielsen 2014 doi 10.2519/jospt.2014.5164 [m] · Seiler 2010 IJSPP 5:276 · Esteve-Lanao 2005 MSSE 37:496 · Esteve-Lanao 2007 JSCR · Stöggl & Sperlich 2014 doi 10.3389/fphys.2014.00033 · Muñoz 2014 PMID 23752040 · Polarized meta-analysis 2024 doi 10.1007/s40279-024-02034-z · Reed & Pipe 2014 doi 10.1097/HCO.0000000000000097 · Doma 2017 doi 10.1007/s40279-017-0758-3 · Doma 2019 PMID 30847824 · Marcora & Bosio 2007 doi 10.1111/j.1600-0838.2006.00627.x · Braun & Dutto 2003 PMID 12783232 · Schumann 2022 doi 10.1007/s40279-021-01587-7 (PMC8891239) · Robineau 2016 PMID 25546450 · Eddens 2018 PMID 28917030 · Fyfe 2014 Sports Med 44:743 · Saw 2016 PMID 26423706 · Plews 2013 Sports Med 43:773 · Bellenger 2016 doi 10.1007/s40279-016-0484-2 · Granero-Gallegos 2020 PMC7663087 · Chinoy 2021 doi 10.1093/sleep/zsaa291 · Craven 2022 PMID 35708888 · WHO 2020 (already in the app) · lifting windows: `docs/science/recovery.md`.
