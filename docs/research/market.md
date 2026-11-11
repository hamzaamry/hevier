# Hevier market research (as of 2026-11-07)

Scope: workout-tracker market plus the running/recovery side, for Hevier (AGPL, free, local-first,
Android, Expo/RN). Read-only research; the repo was not modified.

## 0. Evidence quality (read first)

- **Reddit was not reachable.** WebFetch refuses reddit.com and old.reddit.com; WebSearch rejects
  reddit.com as a domain filter. I got Reddit signal only through two mirror snapshots
  (reddit.sentinel-team.org, r/whoop) and search-result snippets. **No r/Hevy, r/weightroom,
  r/AdvancedRunning, r/androidapps or r/selfhosted thread was read directly.** Complaint ranking
  in section 2 is therefore built from: GitHub issues (read via `gh api`), product feedback
  boards (Bevel, Caliber), Garmin forum, vendor changelogs, app-store aggregators and review blogs.
- Many "review" pages are SEO or competitor content (SensAI, Soma, Dr. Muscle, FindYourEdge,
  Boostcamp's own comparisons). I flag these as `[vendor]`. Prices come from them often; verify in store.
- Trustpilot has zero Hevy reviews; Play/App Store review text was not retrievable. Hevy's own
  site claims 4.9 stars and 630k+ ratings (self-reported).
- Items marked `[memory]` come from my background knowledge, not from a fetched source. Verify.

## 1. Per-app snapshots

### Hevy (the app Hevier is inspired by)
- **Pricing:** Free is permanent, no ads, unlimited logging. Free caps: **4 routines, 7 custom
  exercises, 3 months of graph history**. Pro: $2.99/mo (a $3.99 SKU also lists), $23.99/yr,
  **$74.99 lifetime**. Pro adds unlimited routines/custom exercises/history, sets-per-muscle,
  warm-up calculator, advanced measurements, **Hevy Trainer** (generated plans, Pro).
  Sources: https://www.hevyapp.com/best-workout-tracker-app/ (self-published),
  https://www.sensai.fit/blog/hevy-review-2026 [vendor]
- **Platforms:** iOS, Android, Apple Watch, Wear OS, web (hevy.com), Hevy Coach for trainers.
- **Integrations:** Strava (one-way, full sets/reps/weight since June 2026), Apple Health, Health
  Connect, ChatGPT app. Community update: https://www.hevyapp.com/community-updates/july-26/
- **Standouts:** social feed/leaderboards, huge user base (17M+ claimed), supersets, RPE, set types,
  plate/warm-up calculators, monthly report, muscle distribution, Liquid Glass (iOS) and Material 3 (Android)
  redesign, near-weekly releases.
- **Weaknesses:** free caps; no recovery or readiness input anywhere (Trainer inputs are experience,
  goal, equipment, frequency; no sleep/HRV); no per-muscle recovery estimate; cannot set different rest
  timers for warm-up vs working sets; Trainer uses a fixed progression rule; export format
  compatibility not promised; Wear OS heart rate reportedly not written to Health Connect (one 2024
  user report, may be fixed). Roadmap lists notes, "gyms in Hevy", single vs double weight logging.
  Sources: sensai review above, https://redlib.belloworld.it/r/Hevy/comments/1bx93ha/samsung_health_integration/lhh735t/?context=3

### Strong
- **Pricing:** accounts free "forever" (Strong's own site). Free: unlimited logging, **3 routines**,
  charts Pro-only. Pro $4.99/mo, $19.99/6mo, $29.99/yr, $99.99 lifetime [vendor:
  https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison]. https://www.strong.app/
- **Platforms:** iOS, Android, Apple Watch (full logger).
- **Standouts:** "Think less. Lift more." speed and minimalism; 4.9 stars, ~125k App Store reviews (self-reported).
- **Weaknesses:** exported CSV cannot be re-imported into Strong [vendor: soma-web.pages.dev];
  watch sync drops/overwrites in reviews (https://marlvel.ai/apps/com-cameronchow-strong/reviews,
  aggregator); iOS update regressions and CSV-export-behind-Pro claims come from one Unstar
  aggregate with undisclosed sample size (https://unstar.app/blog/strava-strong-fitbod-nike-run-club-peloton-apple-fitness-workout-apps-ranked-2026) - treat as weak.
  No programming, no social.

### JEFIT
- **Pricing:** Elite $12.99/mo or $69.99/yr (JEFIT's own comparison). Free tier: ad-supported per
  third parties; JEFIT claims no ads on free; 7 custom exercises, 27,000+ free plans, estimated
  1RM/PRs. Elite: Adaptive Plan (12-week auto-built), periodization, progressive-overload engine,
  400+ pro plans. https://www.jefit.com/blog/jefit-vs-caliber (vendor claims)
- **Platforms:** iOS, Android, web, Apple Watch, Wear OS. 1,400+ exercises with video. Opt-in social.
  13M+ users claimed.
- **Weaknesses:** price is ~5x Hevy Pro; ratings of 3.9/5 on a review site
  (https://www.garagegymreviews.com/equipment/jefit); little hard complaint evidence found.

### Fitbod
- **Pricing:** **no free tier**; 7-day trial then $15.99/mo or $95.99/yr (up from $12.99/$79.99).
  New logging blocked after trial ends; past workouts stay viewable. [vendor:
  https://www.sensai.fit/blog/fitbod-review-2026]
- **Platforms:** iOS, Android, Apple Watch, Wear OS. 1,600+ exercises.
- **Standouts:** algorithmic workout generation, plate-aware weights, imports Apple Health/Health
  Connect/Strava activity to adjust muscle-recovery estimates; no HRV/sleep input.
- **Weaknesses:** price increases (Clarity/Kimola summaries), repetitive workouts ("same back
  workout every week") and "algorithm is broken" quote carried by a competitor blog
  (https://dr-muscle.com/fitbod-app-review-alternative/ [vendor]); billing/refund friction (App Store
  subscriptions) and slow support on Trustpilot (3.2/5, 39 reviews:
  https://www.trustpilot.com/review/fitbod.me); history locked after cancel (Unstar).

### Liftosaur (closest philosophical sibling: AGPL)
- **Pricing:** core app free. Premium $4.99/mo, $39.99/yr, $99.99 lifetime (US App Store, Oct 2026).
  Premium unlocks graphs, plate calculator, muscle views, Week Insights, rest-timer notifications,
  Apple Watch, API/MCP. [vendor: https://www.sensai.fit/blog/liftosaur-review]. Open source:
  https://github.com/astashov/liftosaur
- **Platforms:** PWA wrapped as iOS/Android, plus web editor. Optional account (data stays local without
  it; with it, stored on AWS Oregon).
- **Standouts:** Liftoscript (scriptable progression), built-in 5/3/1, GZCLP etc., Week Stats with
  adjustable per-muscle set targets (https://www.liftosaur.com/blog/posts/liftosaur-overview/).
- **Weaknesses (developer's own words, via the vendor review):** "too complicated/steep learning
  curve"; no Garmin/Strava/Wear OS; ~6,000 MAU end of 2025; no recovery adjustment; reported
  lag after June 2026 rewrite. Open GitHub issues most requested: F-Droid release (12 thumbs up),
  Docker/self-hosting (8), non-Google/Apple subscription method (6), muscle distribution chart,
  Garmin Connect integration, i18n. https://github.com/astashov/liftosaur/issues

### FitNotes
- **Pricing:** free, no ads; optional paid "Supporter" upgrade for some customization [third-party
  roundup: https://www.gostay.fit/blog/best-free-workout-tracker-android]. Android only.
  https://www.fitnotesapp.com/
- **Standouts:** the reference "offline, no-nonsense" Android logger; CSV export; backups to local
  storage / Drive-Dropbox per Play listing.
- **Weaknesses:** no cloud sync, backup is manual (Android Authority review
  https://cellphoneplans.androidauthority.com/CellPhones/Guides/fitnotes-app-review), dated UI,
  no watch, no recovery or science layer. This is Hevier's most direct Android incumbent.

### Boostcamp
- **Pricing:** Pro $59.99/yr (7-day trial) or $14.99/mo (an $11.99 SKU also appears). **No lifetime.**
  Free tier unusually generous: 11,000-14,000 programs, auto progression of programs, full
  tracker with RPE/RIR, custom program builder. Pro: Strength Score, volume heatmap, personalized
  programs, exclusive coach programs. https://www.boostcamp.app/ (own page lists "Auto Progression
  (Pro)" which contradicts the SensAI table; verify)
- **Platforms:** iOS, iPad, Android, Vision; no Apple Watch app (SensAI).
- **Weaknesses:** price vs Hevy/Strong; one aggregator reviewer disliked features moving from free
  to Pro (tiny sample). Strength: program library is the real moat.

### StrengthLog
- **Pricing:** free, unlimited logging, 600+ exercises. Premium adds advanced stats, full program
  catalog, RPE/RIR logging, %1RM programs. US iOS: $16.90/mo, $37.90/3mo, $109/yr (price tracker, July
  2026; high). 4.9 stars on iOS (3.1k), 4.76 on Play (11k).
  https://apppricinglab.com/iap/apple/1434229662, https://www.strengthlog.com/
- Weakness: highest annual price of the group; no social; thin independent review coverage.

### Gymbook / Setgraph-style minimalists
- **Setgraph:** free with IAP, minimal-tap logging, auto rest timer, plates calculator, 1RM, AI
  workout generator, ~4.7 stars (own marketing + aggregators; pricing disputed, ~$4.99/mo cited).
  iOS-first. https://apps.apple.com/us/app/id1209781676
- **Gymbook:** very little independent coverage found; I cannot characterize it. Evidence thin.
- Newer privacy/offline entrants (all vendor claims): GYMPLY (open source, local, 4,000+
  exercises, Android), LibreFit, Train Libre/Hypertrack, FitLog X (Android, no account), FitSteps
  (one-time purchase), GymPaper (iPhone, no account). Lists:
  https://mobile-squad.com/guides/best-offline-workout-tracker-apps-2026/,
  https://www.gostay.fit/blog/best-free-workout-tracker-android. **The "private offline logger"
  slot is getting crowded** - Hevier must differentiate on science and recovery, not just privacy.

### openGym (catalogue source and itself a self-hostable tracker)
- AGPL tracker; v1.4.0 shipped a 5,632-exercise catalogue, one file per exercise, PR-friendly.
  Media (stills/animations) credited to Gym visual, licensed "openGym only", not AGPL; another mirror
  calls ownership disputed (Gym visual vs ExerciseDB). https://newreleases.io/project/github/DuarteSantos8/openGym/release/v1.4.0
- Open issues show what self-hosters ask for: native iOS + Apple Health/Watch (10 thumbs up, closed),
  F-Droid (10), Health Connect sync, export finished workout as Garmin .fit, body-weight in load for
  pull-ups/dips, MCP write support. https://github.com/DuarteSantos8/openGym/issues
- **Risk for Hevier:** the README already states pictures are not redistributed; any landing page or
  store screenshot that shows exercise stills could breach that licence. Use placeholders.

### Strava (running side)
- **Pricing:** Premium $11.99/mo or $79.99/yr (US, aggregator pricing; one Reddit snapshot claims a
  newer $94.99/yr - unverified). Strava+Runna bundle $149.99/yr (annual only), ~$50 cheaper than both
  separately. https://the5krunner.com/2026/10/14/is-runna-free/
- **Strength:** May 2026 overhaul: native strength log (sets/reps/weight), automatic muscle maps,
  5 share formats; 14 partners incl. Hevy, Fitbod, JEFIT, Garmin, WHOOP, Runna, Caliber.
  Whether it is paywalled was not stated. https://9to5mac.com/2026/05/21/strava-adds-dedicated-strength-training-support-for-sets-reps-weight-and-muscle-groups/
- **Policy note:** since Nov 2024 third-party apps may show Strava data only to that user and may not feed it
  to AI models (https://the5krunner.com/2024/11/20/strava-issues-clarification/). Fits a local-first app, but check terms.
- Weakness: community pressure; paywalled analysis; plans are running-only.

### Runna
- **Pricing:** $19.99/mo or $119.99/yr (US). Free = week 1 of any plan only. Owned by Strava.
  https://www.runna.com/, https://the5krunner.com/2026/10/14/is-runna-free/
- **Standouts:** coach-built plans, strength + mobility sessions bundled, Garmin/Apple sync.
- **Weaknesses:** price, plans cap at marathon (ultras flagged), app freezes and audio-cue problems,
  support delays (Trustpilot, e.g. https://www.trustpilot.com/review/runna.com?page=2). A secondary
  source claims the Wall Street Journal reported Runna-related injuries (Feb 2026); not verified.

### Garmin Training Readiness
- Inputs per Garmin manual: sleep score, recovery time, HRV status, acute load, 3-night sleep
  history, 3-day stress history. https://www8.garmin.com/manuals/webhelp/GUID-31D23DBB-57C2-4DF7-A0C9-8D1A00AB4BE7/EN-US/GUID-C21BE0C8-A08E-4DA1-B6C6-2E0E2DDDB372.html
- Strength: manual says rep counting is arm-based, leg moves may not count, one move per set.
  Forum users call Garmin strength "basic": https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/418320/strength-training-integration-with-hevy-app-improved-workout-tracking-experience/2030521
- **Competitive signal:** Garmin was surveying users (April 2026) about a per-muscle recovery map,
  strength-vs-cardio load ratio, neuromuscular readiness and a strength balance score. Not
  confirmed shipping. https://the5krunner.com/2026/04/02/garmin-strength-training-features-survey/
  Hevier already ships two of these concepts in software; Garmin would need a Garmin watch.

### WHOOP
- $199 One / $239 Peak / $359 Life per year (aggregators; verify). Recovery score, strain, HRV.
  Has a Strength Trainer, but users complain it lacks exercises, a rest timer and watch control, and
  ask for a Hevy integration (r/whoop snapshots:
  https://reddit.sentinel-team.org/posts/1tupgln/snapshots/2026-06-02T16%3A12%3A54.332359Z,
  https://reddit.sentinel-team.org/posts/1pw0jmh/snapshots/2025-12-27T01%3A00%3A57.159564Z).
  Whoop's "97% rep repeatability" is its own claim.

### Apple Training Load (watchOS 11+)
- Free with watchOS 11. Effort 1-10 x duration, 28-day baseline vs 7-day; running/cycling rated
  automatically, **strength must be rated by hand**. Critiques: rating does not learn from
  corrections, no exact numbers shown, HR-only. https://dcrainmaker.com/2024/07/apples-training-load-vitals-watchos11.html

### intervals.icu
- Fitness/Fatigue/Form = CTL (42-day) / ATL (7-day) / TSB; open math, power users.
  https://forum.intervals.icu/t/calculate-needed-training-load/5788/16 . Pricing and how it
  scores strength load were not confirmed in this research (I believe it is free with optional
  support `[memory]`). Takeaway: runners accept transparent load maths if explained.

### Hybrid-athlete apps (lifting + running)
- Edge (findyouredge.app), HybridX, Hybrid Training Plan, RYVOLVE, HYBRD. Mostly iOS, new, and
  reviewed mainly by themselves (FindYourEdge ranks itself #1). Pitch: schedule interference
  between runs and lifts. No independent test of any such claim found.
  https://www.findyouredge.app/news/best-app-for-hybrid-athletes (vendor)
- Science baseline: concurrent training does not blunt hypertrophy or maximal strength overall;
  explosive strength may be attenuated, more so in the same session (Schumann 2022, Sports Med);
  running-specific fiber-level decrement in type I fibers is preliminary (Lundberg 2022); Wilson 2012
  found decrements with running, not cycling. Source summary:
  https://www.fisiologiadelejercicio.com/wp-content/uploads/2022/12/Compatibility-of-Concurrent-Aerobic-and-Strength-Training.pdf

### Adjacent: Gentler Streak and Bevel
- **Gentler Streak** (iOS): recovery-first, rest days count toward streaks, activity-status toggle for
  injury/illness, analysis on device, no accounts, Apple Design Award. The closest model for
  "runner recovery" tone. https://gentlerstories.com/gentlerstreak/
- **Bevel:** aggregates wearables, scores strain/recovery, 2.5M members claimed; its "strength
  training strain" request has 65 votes and asks for Hevy/Strong import.
  https://feedback.bevel.health/feature-requests/p/strength-training-strain

## 2. Complaint themes, ranked by recurrence in the evidence I could reach

Ranking = number of independent apps/sources where the theme appeared. Confidence given.

1. **Paywalls, free-tier caps and price creep (very high; ~10 apps).**
   - Hevy caps free at 4 routines/7 custom exercises/3 months of graphs; Strong at 3 routines with
     charts Pro; JEFIT free is capped on custom exercises; Liftosaur gates graphs and muscle views;
     Boostcamp gates analytics; Fitbod has no free tier and went $12.99 to $15.99/mo; Runna is
     week-1-only; Strava gates analysis. Sources: https://www.sensai.fit/blog/fitness-app-pricing-free-tier-comparison,
     https://www.sensai.fit/blog/boostcamp-vs-hevy-vs-liftosaur-2026 (both vendor), Kimola summary
     "price keeps increasing without noticeable improvements"
     (https://kimola.com/reports/unlock-insights-fitbod-app-customer-feedback-analysis-app-store-us-156948).
   - Also "features that used to be free" moved to Pro (Boostcamp reviewer, thin).
   - Counter-evidence: Hevy's low price ($74.99 lifetime) makes this milder for Hevy than for others.
   - Confidence: high on the caps (official), medium on sentiment (no Reddit read).

2. **Strength data and endurance/recovery data live in different apps (high).**
   - Garmin forum thread: users want to log in Hevy while the watch records HR, merged into one
     activity, and want HRV/recovery next to Hevy ("so they don't switch apps").
   - Bevel board: 65 votes for strength strain; wants Hevy/Strong import.
   - r/whoop snapshots: users hand-copy Hevy workouts into Whoop's AI, ask for a Hevy integration;
     one commenter says the Strava strength integration "doesn't work".
   - Strava needed 14 partner integrations to make strength credible.
   - Sources: Garmin forum URL above; https://feedback.bevel.health/feature-requests/p/strength-training-strain;
     Whoop snapshots above.

3. **Wearable/watch sync reliability (high on iOS, medium overall).**
   - Strong: watch drops, late resume, overwrite of phone version by older watch version (aggregator
     reviews: https://marlvel.ai/apps/com-cameronchow-strong/reviews). Strong release notes keep
     fixing Live Sync.
   - Liftosaur: watch/phone not syncing, Health Connect "Couldn't sync workout" error.
   - openGym: iPhone/Watch lag when a session is driven from both (issue 882).
   - Hevy: Wear OS heart rate not reaching Health Connect (one 2024 report); Hevy 1.30.30 fixed rest
     alarm not firing in background on some Android 14 devices (https://www.apkmirror.com/?p=5750362).
   - Garmin: some watches (Tactix) cannot run Hevy.

4. **No recovery awareness inside the lifting log (medium-high).**
   - Hevy Trainer, Fitbod, Liftosaur all lack HRV/sleep/readiness inputs (SensAI reviews, vendor).
   - Garmin users ask for recovery context in Hevy (forum). Garmin itself is surveying a muscle
     recovery map. Apple Training Load treats strength as a manual rating.
   - Concurrent-training advice for runners: treat lifting as a hard session and give ~48 h before
     the next hard day (Outside:
     https://run.outsideonline.com/training/getting-started/ask-pete-when-should-i-schedule-resistance-training/).
     Coaches disagree about stacking, so it is a real user question with no tool answering it.

5. **Exercise library gaps and custom-exercise limits (medium).**
   - Garmin users cannot find their gym's machines; want custom exercises with photos.
   - Hevy/JEFIT free cap custom exercises at 7; Whoop Strength Trainer is missing many Hevy exercises.
   - openGym/Liftosaur issues ask for translations (Chinese names, i18n) and custom images.
   - Hevier's 5,600+ catalogue answers this directly, but only if media licensing is resolved.

6. **Algorithm/programming quality and over-complexity (medium).**
   - Fitbod repeats workouts and ignores soreness (Trustpilot and aggregator quotes, Kimola).
   - Hevy Trainer uses a mechanical progression rule and does not explain stalls.
   - Liftosaur's scripting is called too complicated by its own author.
   - Sources: https://www.trustpilot.com/review/fitbod.me, SensAI Hevy/Liftosaur reviews (vendor).

7. **Data lock-in and portability (medium).**
   - Strong CSV cannot be re-imported; Fitbod history locked after cancel (Unstar, weak);
     Caliber board asks to import Hevy's CSV when switching
     (https://feedback.caliberstrong.com/b/7vz226vy/feature-ideas/strava-integration); Hevy does not
     promise export compatibility. Hevier's Hevy CSV import + PC backup directly address this.

8. **UX regressions and reliability after redesigns (medium).**
   - Runna freezes/audio cues; Liftosaur lag after rewrite; Whoop Strength Trainer "death by a
     thousand paper cuts"; Strong iOS update regressions (weak aggregate).

9. **Billing, cancellation and support friction (medium, concentrated on subscription apps).**
   - Fitbod (App Store billing, refunds), Runna ("months later and nothing changes"), Strava
     price clarifications. Sources: https://www.sikayetvar.com/en/fitbod-us/fitbod-charged-me-after-cancellation-and-made-gettinga-refund-difficult,
     Runna Trustpilot above.

10. **Self-hosting / F-Droid / no-Google-account demand (low-medium, niche but vocal).**
    - Liftosaur F-Droid (12 thumbs up) and Docker (8), non-Google/Apple payment (6); openGym F-Droid (10).
    - Only GitHub issue counts; r/selfhosted not reachable.

11. **Safety of generated run plans (low, unverified).** Runna injury claims came via one secondary
    source. Do not use this in marketing without a primary source.

## 3. Feature-gap matrix

Legend: Y = yes free, $ = behind paywall/trial, N = no, ~ = partial, ? = not verified.
"Hevier" column reflects the repo README.md (Android only, v1.0).

| Feature | Hevier | Hevy | Strong | JEFIT | Fitbod | Liftosaur | FitNotes | Boostcamp | StrengthLog | Strava | Runna | Garmin | Whoop |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Unlimited routines free | Y | N (4) | N (3) | ? | $ | Y | Y | Y | Y | n/a | n/a | n/a | n/a |
| Long-range charts free | Y | N (3 mo) | $ | ? | $ | $ | Y | ~ | ~ | $ | n/a | Y | $ |
| Sets per muscle per week | Y | $ | N | ? | ~ | $ | N | $ | $ | ~ | N | ~ | N |
| Per-muscle recovery map | Y | N | N | ? | ~ | N | N | N | N | N | N | ~ (survey) | N |
| Evidence-cited science docs | Y | N | N | N | N | N | N | N | N | N | N | N | ~ |
| Cardio/football in same log | ~ (minutes) | ~ | N | ~ | N | ~ | ~ | N | ~ | Y | Y | Y | Y |
| Weekly cardio guideline card | Y (WHO) | N | N | N | N | N | N | N | N | N | N | ~ | N |
| Run distance/pace/GPS | N | N | N | ~ | N | N | N | N | N | Y | Y | Y | Y |
| Running load / readiness | N | N | N | N | N | N | N | N | N | $ | $ | Y | Y |
| Strength + run combined load | N | N | N | N | ~ | N | N | N | N | ~ | ~ | ~ | ~ |
| Rest timer in notification | Y | Y | Y | ? | Y | $ | ~ | Y | ? | n/a | n/a | n/a | N |
| Home-screen widgets | Y (4) | ? | ? | ? | ? | N | N | ? | ? | ~ | ? | n/a | ? |
| Program library / auto progression | N | $ (Trainer) | N | $ | $ | Y/$ | N | Y (free+Pro) | $ | n/a | Y | N | N |
| Social feed | N | Y | N | Y | N | ~ | N | ~ | N | Y | ~ | ~ | ~ |
| No account / fully local | Y | N | N | N | N | ~ (optional) | Y | N | ? | N | N | N | N |
| Open source | Y | N | N | N | N | Y | N | N | N | N | N | N | N |
| iOS | N | Y | Y | Y | Y | Y | N | Y | Y | Y | Y | Y | Y |
| Watch app | N | Y | Y | Y | Y | $ | N | N | ? | Y | Y | Y | Y |
| Health Connect / HealthKit | N | Y | ? | ? | Y | Y/N | ? | Y (Apple) | ? | Y | Y | Y | Y |
| Strava sync | N | Y | ? | Y | Y | N | N | ? | ? | n/a | Y | Y | Y |
| Hevy CSV import | Y | n/a | ~ | ? | ? | Y | ? | ? | ? | N | N | N | N |
| Own-PC backup (no cloud) | Y | N | N | N | N | N | ~ | N | N | N | N | N | N |
| Plate/warm-up calculators | ? | $ | $ | ? | Y | $ | ? | ? | ? | n/a | n/a | n/a | n/a |
| Exercise count | 5,600+ | n/d | n/d | 1,400+ | 1,600+ | n/d | n/d | n/d | 600+ | n/a | n/a | n/a | n/a |

Reading the matrix: Hevier's unique cells are "recovery map + cited science + free + no account +
PC backup + open". Its blanks are all platform and data-source gaps (iOS, watch, Health Connect,
Strava, GPS runs), plus programs and social.

## 4. Top 15 opportunities, ranked by impact / effort

Impact reasoning is tied to the complaint themes (T1-T11 = section 2 numbers).

1. **Run logging that feeds the existing recovery map (runner-recovery MVP).** Manual or
   Health-Connect-imported runs (duration, distance, effort 1-10) add a leg-weighted fatigue curve to the
   Recovery map, mirroring how `football.ts` already works (full for 24 h, half-life 30 h). Evidence:
   T2, T4, Garmin survey, concurrent-training advice. Effort: low-medium (extend existing model).
   Risk: the downhill/long-run recovery numbers rest on small lab studies (soreness 3-5 days, CK ~5-8
   days, https://pmc.ncbi.nlm.nih.gov/articles/PMC2697134/ and related); document gaps the way
   `docs/science/recovery.md` already does.
2. **"Can I lift legs today?" and "hard-day budget" card.** One answer combining leg recovery from lifts
   and runs. Nobody free offers this (Garmin has no lifting side, Hevy has no recovery). Impact high,
   effort low once #1 exists.
3. **Health Connect import (Android runs, steps, HR, weight) with write-back of lifts.** Closes the "data in
   different apps" gap (T2) for the largest Android sources (Garmin, Samsung, Fitbit, Strava via
   Health Connect). Effort: medium (needs a community Expo module or custom Kotlin; the repo already has
   native Kotlin modules). **Risk:** Play requires a Health Connect permissions declaration and form
   (https://developer.android.com/health-and-fitness/health-connect/declare-access) and apps are reviewed;
   Health Connect is not ideal for live data. Heart rate from Wear OS was unreliable in Hevy per one report.
4. **FIT/GPX/TCX file import for runs (no API, fully local).** Sidesteps API gatekeeping and fits the
   local-first promise. Garmin export from Connect, Strava bulk export and Apple exports all supply files.
   Effort: low-medium. Evidence: openGym issue about FIT export, T2. Garmin's own developer program
   was paused for new approvals and is business-only (https://tryterra.co/blog/garmin-connect-developer-program-pause), so file import is the realistic Garmin path.
5. **Export lifts as FIT/CSV to the user's own tools.** Lower priority than #4 but cheap: gives users an exit and lets intervals.icu or
   Strava ingest strength. Strava's API forbids AI use and limits display (verify before using OAuth).
6. **Free plate calculator, warm-up calculator and per-exercise-type rest timers** (verify what exists).
   Hevy and Strong put these behind Pro; Hevy users specifically ask for separate warm-up rest timers.
   Effort: low. Evidence: T1, Hevy limitations.
7. **Built-in free program library with simple auto-progression (5/3/1, GZCLP, PPL, linear).**
   Boostcamp's 11,000+ free programs and Liftosaur's built-ins prove the demand; Hevy has no library and puts
   Trainer behind Pro. Ship a curated set of ~15 plain-JSON programs, not a scripting language
   (Liftosaur's complexity is its own top complaint, T6). Effort: medium. Licensing: program ideas are
   public domain templates, but do not copy Boostcamp content.
8. **Transparent "load" model for lifting + running with a published method page.** Show
   weekly hard sets + run effort-minutes in one chart with a plain explanation, like intervals.icu
   fitness/fatigue but readable. **Do not market ACWR as injury prediction**: Impellizzeri et al. show
   the ratio has methodological problems (https://link.springer.com/article/10.1007%2Fs40279-020-01280-1,
   search-snippet summary). Use descriptive load ("more than you usually do"), not risk scores.
9. **iOS version.** Would triple the addressable market and satisfies the most-requested thing in open
   source siblings (openGym #90, 10 thumbs up). **Hard:** Expo can build it, but the Kotlin widgets and
   notification are Android-only (rewrite in SwiftUI/WidgetKit/ActivityKit), Apple Developer fee, HealthKit
   needs different code, and "local-first + backup server" must work with iOS background limits.
   Effort: high. Do after the product-market-fit proof on Android.
10. **Wear OS companion (log set, start rest timer, show next set).** Hevy/Strong/JEFIT/Fitbod all have
    watches; Liftosaur gates its watch app behind Premium. Hard: separate Compose-for-Wear app,
    phone-watch sync bugs are a top complaint (T3). Effort: high. Consider "notification actions"
    already shipped as the 80% solution.
11. **Own-data UX: scheduled auto-backup to a folder/Drive/WebDAV plus one-tap restore and full
    CSV/JSON export.** Local-first apps lose users when a phone dies (FitNotes' manual backup
    complaint). Hevier Sync exists but needs a PC; add an Android Storage Access Framework target.
    Effort: low-medium. Evidence: T7, FitNotes review.
12. **F-Droid and reproducible-build release.** 12 thumbs up on Liftosaur #243 and 10 on openGym #325;
    matches the AGPL audience and costs little. Risk: Health Connect library is closed-source-adjacent,
    check F-Droid anti-features. Effort: low-medium.
13. **Translations (i18n) of UI and exercise names.** Repeated requests in openGym (Chinese names) and
    Liftosaur (#637). The catalogue is per-file and PR-friendly, so community can contribute. Effort:
    medium. Evidence: T5.
14. **Estimated 1RM / strength-score style single number, RIR/RPE-aware.** Boostcamp Pro sells a
    "Strength Score"; StrengthLog and Setgraph tout 1RM trends. Hevier already has "reps left". Make a
    free one-number progress metric. Effort: low-medium.
15. **Optional "coach export" / read-only share link rendered locally** (a static HTML/PDF report
    of the month). Gives a social-lite hook without servers (Hevy's moat is its social network and
    leaderboards, which Hevier should not chase). Effort: low. Evidence: weak; treat as nice-to-have.

Things I would not build near-term: AI workout generator (Fitbod's and Hevy Trainer's weak spot is
repetition and no reasoning; costs money to run and conflicts with no-server), social feed,
cloud accounts.

## 5. Landing page positioning

### Strongest honest claims (all verifiable from the repo)
1. "Every feature free, forever. No account, no ads." Contrast with the specific caps above (Hevy
   4 routines/3-month graphs; Strong 3 routines; Fitbod no free tier). Use concrete numbers, cite them as
   "at time of writing", avoid naming-and-shaming prices that may have changed.
2. "Your data never leaves your phone." Back with SQLite, no network permission needed for core use
   (verify before claiming "no INTERNET permission"), plus Hevier Sync to your own PC.
3. "Numbers with sources." Hard-set counting, helper muscles at half, zones and recovery windows each link to a
   study in `docs/science/`. No competitor found that publishes this.
4. "Knows when your legs are ready" (recovery map; strengthened if #1 ships).
5. "Switch from Hevy in a minute" (Hevy CSV import). Say "Unofficial; not affiliated" prominently
   (already in README).
6. "Open source (AGPL), 5,600+ exercises."

### Objections to answer
- "Android only?" Say so on the hero ("Android today; iOS on the roadmap"), do not hide it.
- "Will I lose my data if I lose my phone?" Show backup story (PC sync, SAF backup if built).
- "Is the science real?" Link to docs and state limits (small studies, estimates); the README does this well.
- "Who maintains it?" Show release cadence, CI, quality gate, contributing guide; say it is a hobby project honestly.
- "No watch / no social?" Frame as focus: "built for logging, not likes". Do not overclaim.
- "No exercise pictures?" Disclose licence limit; do not show stills.
- "Is it a Hevy knock-off?" Use "inspired by", never "Hevy alternative" in the title tag; avoid their trademark
  in ads. "Hevy" in comparison copy is fine if factual.

### Messaging angles (pick one lead)
- **Lead (recommended): "Train hard. Recover smart."** Free recovery map and evidence-based sets;
  extends naturally to runners once #1 ships.
- **Privacy/ownership:** "A gym log you own." Crowded (FitNotes, GYMPLY, FitLog X, GymPaper) - use as support, not lead.
- **Free:** "Everything the Pro tier sells, free." Strong with the lifter audience; mind price drift.
- **Science:** "Counts what builds muscle." Differentiating; needs plain language, not paper citations in the hero.
- **For runners who lift:** "Know if today is a leg day." Hybrid niche has only new, self-reviewed apps.

### Reference landing pages (what each does well)
All fetched in this session unless noted; style notes come from page text, not screenshots, so
check visuals yourself.
1. **Things (Cultured Code)** https://culturedcode.com/things/ - the "Apple-native" model: one
   scrolling page, icon-headed sections, device collage, Apple Design Award quotes, no price wall.
   Borrow: calm spacing, device collage, press-quote blockquotes, free-trial-first CTA.
2. **Gentler Streak** https://gentlerstories.com/gentlerstreak/ - recovery-first tone, award
   badges, "analysis runs on your iPhone, no accounts" privacy block, testimonials that name behaviors
   (took rest days). Closest to Hevier's runner-recovery story. Borrow: privacy-as-headline,
   non-punitive copy, multi-horizon (day/10-day/30-day) visuals.
3. **Apple Fitness+** https://www.apple.com/apple-fitness-plus/ - short rhythmic copy, frame-sequence
   hero, metric callouts. Borrow: sparse hero headline, big product frame, one repeated CTA, FAQ at end.
4. **Strong** https://www.strong.app/ - "Think less. Lift more." Notebook metaphor; huge ratings
   proof; minimal. Borrow: one-line promise, ratings strip, "everything you need, nothing you don't" feature list.
5. **Boostcamp** https://www.boostcamp.app/ - program cards with ratings, Reddit endorsements as proof, FAQ
   with a candid comparison to Strong/Hevy/Fitbod. Borrow: honest comparison FAQ and community quotes (once Hevier has real ones).
6. **Bevel** https://www.bevel.health/ - "works with" logo strip, phone mockups, privacy block
   ("never sell your data"), strain/sleep/recovery trio. Borrow: three-score hero pattern for recovery.
7. **Liftosaur** https://www.liftosaur.com/ - "Google Sheets and Strong in the same app": a single
   analogy to explain a complex product; QR code + web app link. Borrow: analogy headline and QR download.
8. **Runna** https://www.runna.com/ - hero with free-trial line and ratings, interactive "Hit your PB" tool,
   plan finder. Borrow: one interactive toy in the page (e.g. "enter your week, see your leg-recovery bar").
- Hevy's own page (https://www.hevyapp.com/) is conversion-heavy and text-listy; useful as a baseline for
  what to beat, not copy. Strava (https://www.strava.com/) is photo-led community. Oura/Whoop/Fitbod pages
  returned 403 and were not analysed; consider reviewing them manually for "glossy" ideas.
- **Static-site implementation hint (not researched):** an interactive recovery-map demo on the page
  (SVG body map reacting to a slider) would be the single strongest "show, don't tell" asset, because
  competitors only show static screenshots in the text I reviewed.

## 6. Recommended roadmap

### Now (0-8 weeks, low effort, high leverage)
1. Runner-recovery MVP: add Run as a first-class exercise (duration, distance, effort 1-10, optional
   downhill/long flag), legs-weighted fatigue curve in `lib/training/`, document it in `docs/science/running.md`
   with the same "Gaps" honesty. (#1, #2)
2. Landing page v1 with the recovery-map demo, free/private/science claims, Android-first honesty. (section 5)
3. Free calculators/timers gaps (plate, warm-up, per-set-type rest) after confirming what exists. (#6)
4. Backup upgrade: SAF/Drive/WebDAV auto-backup and full JSON/CSV export. (#11)
5. FIT/GPX import for runs. (#4)

### Next (2-6 months)
6. Health Connect import (and write-back of lifts), including Play declaration. (#3)
7. Curated free program library with simple auto-progression; no scripting language. (#7)
8. "Load" view combining lifting and running with plain-language explanation, no injury-risk claims. (#8)
9. F-Droid release, translations pipeline, 1RM/strength-score metric. (#12, #13, #14)
10. Public roadmap and a tiny feedback board (GitHub Discussions) so signal is captured; this research could not read Reddit.

### Later (6+ months, high effort or uncertain)
11. Wear OS companion. (#10)
12. iOS port (native widgets/notification parity, HealthKit). (#9)
13. Optional Strava upload/OAuth (check Nov 2024 terms; AI use banned) and Garmin-via-file only unless Garmin's developer
    program reopens to individuals.
14. Local-only shareable monthly report. (#15)

### Validation steps before committing big items
- Post two or three questions in r/AdvancedRunning and r/Hevy-style communities by hand (I could not): "How do
  you decide whether to lift legs after a long run?" and "Which Hevy Pro limit annoys you?" Use the answers to
  re-rank section 4.
- Check Google Play and App Store review text for Hevy, Strong, FitNotes manually (not retrievable here).
- Verify competitor prices in the stores before using any number in public copy.

## 7. Remaining gaps
- Gymbook, intervals.icu pricing and strength handling, Strava strength paywall status: unconfirmed.
- Landing-page visual claims inferred from page text only; no screenshots viewed.
