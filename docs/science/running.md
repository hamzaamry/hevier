# Running: how the run readiness decides

This is the thinking behind the **Run** screen. Code: `lib/training/run.ts`, `lib/training/runReadiness.ts`,
every number in `constants/run.ts`. It is a training estimate, not medical advice.

Only claims whose source was opened and read are cited. Where there is no source, the number says
**convention** or **judgement**: someone had to pick a value, nothing measured it. Tune it, don't trust it.

## What the call is made of

The call for a run slot is the most cautious answer of several independent checks. A check can only lower
the call (quality, then easy, then strength only, then rest), never raise it, and every check that fired is
listed with the call.

| Check | Fires when | Calls | Basis |
|---|---|---|---|
| legs | a running muscle is still red (heavy window) or orange (recovering) on the Recovery view, looked at the slot time | strength only, or easy | the lifting windows in `docs/science/recovery.md`, borrowed (see below) |
| hard run | a hard run (effort 7+, or minutes × effort of 300+) started under 72 h before | easy | convention |
| big week | the 7 day load average is 1.3x or more the 28 day one, with 3+ runs | easy | convention (see "Load") |
| too much hard | 20% or more of the last 28 days' running minutes were hard, with 3+ runs | easy | convention |
| few runs | fewer than 3 runs in 28 days | easy | convention |
| check-in | drained, under 6 h of sleep, pain or illness | easy, or rest | see "Check-in" |

## Load: minutes times how hard it felt

A run counts as minutes × session RPE (1 to 10). Smoothed over 7 and 28 days, the ratio is a rough
"is this week unusually big for you".

- **Foster et al. 2001**, *J Strength Cond Res* 15(1):109-115 (PMID 11708692).
  - Session RPE was compared with a heart-rate based score in steady and interval cycling and in basketball.
  - It tracked the heart-rate score closely in both, and the authors call it a valid way to quantify
    training across many exercise types. That is why no wearable is needed.
- **Impellizzeri et al. 2020**, *Int J Sports Physiol Perform* 15(6):907-913 (PMID 32502973).
  - The acute:chronic ratio is not supported as a causal factor for injury: "There is no evidence supporting
    the use of ACWR in training-load-management systems", and the ratio brings statistical artefacts.
- **Lolli et al. 2019**, *Br J Sports Med* 53(15):921-922 (PMID 29101104), an editorial: mathematical coupling
  makes the conventional ratio correlate spuriously.

So the ratio is **never shown as a risk and never predicts anything**. It is kept as a cheap guard against
a sudden jump, can only move the call down to easy, and needs 3 runs and a floor on the long average
(`RUN_CHRONIC_FLOOR`) so a tiny base cannot inflate it. The 1.3 and 1.5 limits are conventions.

## Lifting, then running

The user's pattern is lifting in the evening and running early the next morning.

- **Doma, Deakin & Bentley 2017**, *Sports Med* 47(11):2187-2200 (PMID 28702901), a review.
  - A single resistance session can leave fatigue that impairs later endurance work if recovery is
    short, for hours to days.
  - Proposed mechanisms: altered neural recruitment, a higher energy cost of movement, soreness, and
    lower muscle glycogen.
  - It says nothing exact enough to set hours from. The windows come from `docs/science/recovery.md`
    (strength and jump outcomes), and applying them to running is an inference.
- **Schumann et al. 2022**, *Sports Med* 52(3):601-612 (PMID 34757594), a meta-analysis of 43 studies.
  - Combining aerobic and strength training did not significantly change maximal strength or muscle size.
  - Explosive strength dropped a little, more when both were done in one session than when at least 3 h
    apart. So running in the morning and lifting at night is the friendly case, and the app does not
    warn about it.

### Leg scores (`RUN_LEG_LOAD`): a judgement

Each running muscle's state adds to a score from 0 to 1, and the worst muscle counts. Red scores 1 on
quadriceps and hamstrings, 0.8 on calves and glutes, 0.3 on adductors and abductors. Orange scores 0.5 on
quadriceps and hamstrings, 0.4 on calves and glutes, 0.15 on adductors and abductors. From 0.8 the call is
strength only, from 0.4 it is easy, below that it is not held back by the legs.

Nothing measured these numbers. They put the muscles that carry running first and the small stabilisers
last. The effect to know about: four hard quad sets (window 72 h) keep a quality run off the table until
the quadriceps leave the window, about 83 h later. That is cautious on purpose, because the feature is
health-adjacent, and probably too cautious for someone who squats every week. Relaxing it should wait
for `run_feedback` (what was shown, and how the legs felt after) to show legs "ok" far more often than
"heavy" in that band. The table is there to be edited.

## Check-in

- **Craven et al. 2022**, *Sports Med* 52(11):2669-2690 (PMID 35708888), a meta-analysis of 69 publications.
  - Sleep loss of 6 h or less reduced performance by about 7.6% on average.
  - Afternoon and evening tasks were consistently affected, while morning tasks were largely unaffected.
  - So a short night caps the morning run at easy as a precaution (`RUN_SLEEP_LOW_H`), not because
    the evidence shows harm. Drained and under 5.5 h is rest (`RUN_SLEEP_VERY_LOW_H`): convention.
- Pain or illness means rest. This is a safety default, not a finding. The screen tells the person to see a
  doctor if it does not settle.

## How hard to run: the talk test

- **Reed & Pipe 2014**, *Curr Opin Cardiol* 29(5):475-480 (PMID 25010379), a review.
  - Being able to talk comfortably suggests an effort below the ventilatory or lactate threshold, and
    not being able to suggests above it. It gave consistent results across walking, jogging, cycling and
    other modes, and may be impractical for high-intensity intervals.
- Easy is therefore described as full sentences, hard as a few words, with effort 2 to 4 for easy and 7 to 8
  for hard (an approximate mapping). Pace is only ever shown from the user's own easy runs.

## Conventions with no source

Easy runs for 80% of minutes, the 72 h gap after a hard run, a longer run at most 1.3x the longest of the last
4 weeks, 20 to 90 minutes, a 35% hard share in a quality session, and the first-run suggestion of 20 minutes.
All are defaults for a hobby runner and live in `constants/run.ts`.

## What the app does not know

Illness, injury, medication, heat, hills, stress, women's cycle, age, previous injury, other sport, how
the person actually slept unless told, and whether following the call changes injury or race times.
Nothing here claims it does.
