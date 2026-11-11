# Audit summary

A short version of the code audit done on 2026-11-07 against `main` at `b5c4394`
(before the monorepo move). Paths here use the current layout. The audit used the
old paths (`lib/`, `backup-server/`, `shared/`, `package-lock.json`); they map to
`apps/mobile/lib/`, `apps/sync/`, `packages/shared/` and `pnpm-lock.yaml`.

Re-checked on 2026-11-08 against the monorepo branch after upstream `main` at
`28face9` (PR #2: body weight, onboarding, native tab bar, migrations 011 to 014,
openGym data update) was merged in. Every finding below is still open. Two
entries were updated for that merge: A-17 (the guard also compares the newest
workout date now) and P-01 (the profile query moved).

This is a summary, not the raw file. The raw audit had line numbers, repro notes
and a list of proposed PRs, and its proof tests lived outside the repo (10 tests,
all passing). What is kept here: every finding, its severity, how sure the audit
was, and which roadmap item owns it. Line numbers are left out because they drift;
search the file named in "Where".

## How to read it

- **Severity:** high, med, low. Nothing was critical.
- **Confidence:**
  - `confirmed`: the code was read and the claim was shown with a test, or the code leaves no doubt.
  - `likely`: the code path was read but not run end to end (often needs a device).
  - `suspected`: reasoned from the code, needs measuring.
- **Status:** every finding was still open when this summary was written and when it was re-checked after the upstream merge (see above). Check the
  code before you rely on one, and check [ROADMAP.md](../../ROADMAP.md) for the item
  that owns it.
- Findings marked `likely` or `suspected` are not bugs until someone reproduces
  them. Reproduce first, then fix, then add a test.

## Baseline

On a fresh clone the old `npm run check` failed at `tsc` with 3 errors that were
not the contributor's (a missing `backup-server` install, an RN `setInterval`
typing clash, a library type error). Once Expo's generated types existed and the
sync server was installed, types, lint and 358 tests were clean. Overall line
coverage was 43 percent with screens and components included. The monorepo move
(R-01) removes the extra install. The generated types are still needed: run
`pnpm mobile` once.

On 2026-11-08, with upstream `main` at `28face9` merged in, `pnpm check` passes
with 391 tests (366 in the app, 15 in Hevier Sync, 10 in the shared package).

## Bugs

| ID | Sev | Conf | Where | Problem | Roadmap |
|---|---|---|---|---|---|
| A-10 | high | likely | `apps/mobile/lib/sync/expoIO.ts`, `apps/mobile/lib/sync/restore.ts`, `apps/mobile/app/sync.tsx` | Restore deletes the live database and media before copying the new files in. A failure in between leaves the phone with no data, and the screen shows nothing. The message "your phone's data was not changed" is only true before that step. | R-04 |
| A-11 | high | likely | `apps/mobile/app/_layout.tsx`, `apps/mobile/lib/sync/client.ts`, `apps/mobile/lib/sync/expoIO.ts` | A quiet sync that finishes during a restore download deletes the staged restore files, so the restore then fails after the live data was already removed. Nothing stops the two from overlapping. | R-04 |
| A-12 | med | confirmed | `apps/sync/store.ts` | The PC swaps `current/` with two renames. A crash or a Windows lock between them leaves no `current/`, the PC says "No backup yet", and the next commit deletes the only good copy. | R-06 |
| A-13 | med | confirmed | `apps/mobile/db/migrations/index.ts`, `apps/mobile/db/migrations/009_warmup_sets.ts` | A migration and its version bump are not in one transaction. A crash halfway through the table rebuild in 009 leaves a stray table, and every later launch fails. Migration 013 (a long list of updates) runs the same way. | R-05 |
| A-14 | med | likely | `apps/mobile/modules/workout-notification/android/` (`WorkoutNotificationService.kt`) | The service can stop itself without calling `startForeground`, which makes Android throw and crash the app. `startForeground` itself is not guarded. | R-07 |
| A-15 | med | likely | `apps/mobile/modules/home-widgets/android/` (`RedrawScheduler.kt`, `Widgets.kt`, manifest) | The midnight redraw alarm is not booked again after a reboot or a date or time zone change, so widgets show stale days until the app opens. | R-07 |
| A-16 | med | suspected | `apps/mobile/lib/sync/client.ts` | Uploads and `/commit` have no timeout. A PC that sleeps mid-upload can leave the spinner running and block later quiet syncs. | R-04 |
| A-17 | med | confirmed | `packages/shared/sync-protocol.ts` | The "wiped phone" guard compares workout counts, and since PR #2 also the start of the newest workout (`older`). Deleting one workout, or the newest one, makes every quiet sync refuse until "Send anyway". Delete one and add one is not detected by the count. | R-06 |
| A-18 | med | confirmed | `apps/mobile/lib/stats/records.ts`, `apps/mobile/db/records/queries.ts` | Warm-up sets are not excluded from records. A heavy warm-up can fire the PR toast and raise the bests that later sets must beat. Needs a product decision first. | R-12 |
| A-19 | low | confirmed | `apps/mobile/lib/stats/profileCharts.ts` | `barScale` loops forever if any value is `NaN` or `Infinity`, which hangs the JS thread. `NaN` is reachable from an unparseable end time. | R-08 |
| A-20 | low | confirmed | `apps/mobile/lib/format/setFormat.ts`, `apps/mobile/lib/format/duration.ts` | Number parsing accepts hex, exponents, negatives and fractions for reps and seconds, so a stray input can store negative volume. | R-08 |
| A-21 | med | likely | `apps/mobile/scripts/import/parseCsv.ts`, `apps/mobile/scripts/import-csv.ts` | The CSV import expects metric headers (an imperial export throws with no context), parses dates in the machine's time zone, aborts on a distance-only exercise, and can merge two same-title workouts. | R-39 |
| A-22 | low | confirmed | `apps/mobile/components/exercise-page/HistoryTab.tsx`, `apps/mobile/db/exerciseStats/history.ts` | An exercise logged twice in one workout gives duplicate React keys. | R-28 |
| A-23 | low | suspected | `apps/mobile/db/transaction.ts` | Only transactions are queued. A plain write from another task can run inside an open transaction and be rolled back with it. | R-36 |
| A-24 | low | suspected | `apps/mobile/db/activeWorkout/draft.ts`, `apps/mobile/stores/activeWorkoutStore.ts` | A corrupt or old-shape draft is parsed with no check, loading retries forever and the draft is unreachable. | R-16 |
| A-25 | low | suspected | `apps/mobile/modules/workout-notification/android/` (`RestAlert.kt`) | `MediaPlayer.create` can return null and there is no error listener, so audio focus may never be released. | R-07 |
| A-26 | low | confirmed | `apps/mobile/lib/workout/rotation.ts`, `apps/mobile/db/rotation/cycle.ts` | The next routine in the cycle is found by title. Two routines with one name stick, and a rename resets the cycle. | R-36 |
| A-27 | low | confirmed | `apps/mobile/app.json` | `userInterfaceStyle` is `automatic` but the app is dark only, so keyboards and dialogs can render light. | R-09 |
| A-28 | low | suspected | `apps/mobile/modules/workout-notification/android/` (`NotificationViews.kt`) | Workout and exercise names show on the lock screen. | R-07 |
| A-29 | low | suspected | `apps/mobile/modules/workout-notification/android/` (`NotificationViews.kt`) | The exercise picture is decoded full size on the main thread, and a failed first decode is never retried. | R-07 |

## Security

| ID | Sev | Conf | Where | Problem | Roadmap |
|---|---|---|---|---|---|
| A-01 | high | confirmed | `apps/mobile/app/pair.tsx`, `apps/mobile/lib/sync/pairing.ts`, `apps/mobile/app.json` | `hevier://pair?host=...&key=...` is a registered link. Opening it from a web page or QR code saves the pairing with no confirmation and no check that the host is on the LAN. The next quiet sync then sends the whole database and all photos to that host. A parse test shows `evil.example.com` is accepted. Not run end to end on a device. | R-03 |
| A-02 | med | likely | `apps/mobile/app.json`, `apps/mobile/lib/sync/pairing.ts`, `apps/sync/README.md` | Sync is plain HTTP on the LAN and cleartext is allowed for the whole app. The key and data can be sniffed on shared Wi-Fi. Documented as accepted; a hardening item that needs a design decision. | R-35 |
| A-03 | low | confirmed | `apps/sync/server.ts`, `packages/shared/sync-protocol.ts` | Key compared with `!==`, no body size limit, malformed JSON gives a 500, `begin` does not validate all fields, `isValidPath` accepts `media/.`. All need the key, so this is robustness, not an auth bypass. Path traversal is not possible. | R-06 |
| A-04 | low | confirmed | `apps/mobile/lib/sync/pairing.ts` | `decodeURIComponent` throws on a stray `%`, and the port is only checked to be above 0. | R-03 |
| A-05 | low | confirmed | `apps/mobile/lib/perfProbe.ts`, `apps/mobile/app/_layout.tsx` | `hevier://anything?perf=<seconds>` starts a render loop in release builds. | R-09 |
| A-06 | low | confirmed | `pnpm-lock.yaml` (was `package-lock.json`) | `npm audit` reported 23 findings (6 high), almost all transitive Expo tooling. The count is from the old npm lockfile; re-run `pnpm audit` before quoting it. | R-09 |

Checked and fine: `isValidPath` blocks traversal, the widget receivers are the
standard exported pair and only redraw, the midnight and action receivers are not
exported, release signing reads keys from `~/.config/hevier/keystore.properties`,
and `debuggable` is off by default.

## Performance

| ID | Sev | Conf | Where | Problem | Roadmap |
|---|---|---|---|---|---|
| P-01 | med | suspected | `apps/mobile/db/feed/cards.ts`, `apps/mobile/db/stats/statSets.ts`, `apps/mobile/db/sessions/sessions.ts` (was `db/profile/queries.ts`) | Home, Profile and statistics load every set ever into JS, and one workout page forces the full list. About 50k rows after ten years of training. Not measured. | R-36 |
| P-02 | med | likely | `apps/mobile/components/exercise-page/HistoryTab.tsx` | Every session renders in a plain `ScrollView`, and set badges are recomputed per set. Unbounded for a popular exercise. | R-28 |
| P-03 | low | suspected | `apps/mobile/app/log-workout.tsx` | The screen root subscribes to the whole active workout, so each keystroke re-renders it. | R-36 |
| P-04 | low | suspected | `apps/mobile/lib/refreshHomeWidgets.ts` | 169 recovery evaluations on every background transition; the memo is keyed by a fresh array. | R-36 |
| P-05 | low | confirmed | `apps/sync/usb.ts` | Runs `adb devices` every 3 seconds forever, even when adb is not installed. | R-06 |

## Accessibility

| ID | Sev | Conf | Where | Problem | Roadmap |
|---|---|---|---|---|---|
| Y-01 | med | confirmed | `apps/mobile/components/`, `apps/mobile/app/` | 2 of 128 `.tsx` files set any accessibility prop. About 100 `Pressable`s have no role or label, including icon-only controls such as the set badge, play and stop, and the done check. TalkBack says "unlabelled button", so logging a workout is not operable. | R-13, R-14 |
| Y-02 | low | suspected | `apps/mobile/constants/sizes.ts` | Rows and some icons are below 48 dp. `hitSlop` covers part of it. | R-14 |
| Y-03 | low | suspected | whole app | No font scale limits and fixed row heights, so large system fonts can clip set rows. | R-14 |
| Y-04 | low | suspected | `apps/mobile/constants/theme.ts` | Recovery state relies on colour, and the body figure has no text alternative. | R-14 |

## iOS blockers

There is no `ios/` folder (Continuous Native Generation), so these are config and
gating gaps, not compile errors. The two Kotlin modules are Android only and the
JS wrappers use optional native modules, so an iOS build runs without them.

| ID | Sev | Conf | Where | Problem | Roadmap |
|---|---|---|---|---|---|
| I-01 | med | likely | `apps/mobile/app.json` | The `ios` block has no bundle identifier and no `Info.plist` keys for local-network sync (App Transport Security and the local network prompt). Behaviour for IP-literal hosts needs a device check. | R-22 |
| I-02 | med | confirmed | `apps/mobile/app/sync.tsx`, `apps/mobile/lib/sync/client.ts` | "Sync over USB cable" uses `adb reverse` and is shown on every platform. | R-22 |
| I-03 | med | confirmed | `apps/mobile/modules/` | The rest notification and the four widgets exist only on Android, so iOS has no rest alert while the app is in the background. | R-32, R-33 |
| I-05 | low | confirmed | `apps/mobile/package.json` | `expo-symbols` and `expo-web-browser` are never imported, and the web target is unused. | R-09 |

I-04 and I-06 in the raw audit were "no action" notes and are left out.

## Test gaps

Logic with 0 percent coverage at audit time: `apps/mobile/lib/sync/expoIO.ts`,
`apps/mobile/stores/clockStore.ts`, `stores/perHand.ts`, `stores/profilePhoto.ts`,
`stores/exercisePickRequest.ts`, `apps/mobile/lib/refreshHomeWidgets.ts`,
`apps/mobile/lib/prFeedback.ts`, `apps/mobile/lib/workoutMedia.ts`,
`apps/mobile/hooks/`. In order of risk:

| ID | Gap | Roadmap |
|---|---|---|
| T-01 | `replaceAll` and `cleanup` interplay (A-10, A-11) is untested. | R-04 |
| T-02 | Active workout store: set timer, begin while writes pending, adjust rest, failed-load retry. | R-16 |
| T-03 | Clock store, per-hand, profile photo, exercise pick request. | R-16 |
| T-04 | Widget refresh, save guard, notification hook. | R-16 |
| T-05 | Backup store: commit failure and `old/` recovery, concurrent `begin`. | R-06 |
| T-06 | Backup server: malformed JSON, missing entries, oversized body. | R-06 |
| T-07 | Migrations: fail halfway and re-run. | R-05 |
| T-08 | Records: warm-up, negative, duplicate exercise in a workout. | R-12 |
| T-09 | `barScale` with NaN and Infinity. | R-08 |
| T-10 | Set input parsing: hex, exponent, negative, fractional. | R-08 |
| T-11 | CSV import: missing headers, imperial export, time zone, distance-only. | R-39 |
| T-12 | Pairing: bad percent escapes, port range, host allow-list. | R-03 |

## Dead code and small items

- `expo-symbols`, `expo-web-browser`: zero imports.
- `expo-build-properties` is listed twice in the `plugins` of `apps/mobile/app.json`.
- `apps/mobile/lib/perfProbe.ts` ships in release builds (A-05).
- `apps/mobile/app/+html.tsx` and the web config: no web support in practice.
- `shouldAskRating` in `apps/mobile/lib/workout/activeWorkout.ts` returns
  `boolean | undefined` under a `boolean` signature.

## Caveats

- Several `likely` and `suspected` findings need a device or a measurement. The
  audit did not have a device.
- The raw audit's PR plan assumed the old single-package layout. The roadmap
  re-cuts those PRs by concern and keeps the audit's suggested order: pairing,
  restore, migrations, backup server, then the rest.
- Counts such as "2 of 128 files" and "23 audit findings" are from the audit date.
