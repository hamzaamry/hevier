<p align="center">
  <img src="docs/images/banner.png" alt="Hevier: workout tracker for Android" width="760">
</p>

<p align="center">
  <a href="https://github.com/hamzaamry/hevier/actions/workflows/ci.yml"><img src="https://github.com/hamzaamry/hevier/actions/workflows/ci.yml/badge.svg" alt="Checks"></a>
  <a href="https://sonarcloud.io/summary/new_code?id=hamzaamry_hevier"><img src="https://sonarcloud.io/api/project_badges/measure?project=hamzaamry_hevier&metric=alert_status" alt="Quality gate"></a>
  <a href="https://sonarcloud.io/summary/new_code?id=hamzaamry_hevier"><img src="https://sonarcloud.io/api/project_badges/measure?project=hamzaamry_hevier&metric=coverage" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-008CFF" alt="License: AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/platform-Android-1C1C1E" alt="Platform: Android">
</p>

<p align="center">
  <b>Log your sets fast, follow a training cycle, and see what your training does to each muscle.</b><br>
  Everything stays on your phone. No account, no ads, no subscription.
</p>

> **Unofficial.** Hevier is a hobby project inspired by the Hevy app. It is not
> affiliated with, endorsed by or connected to Hevy or its makers. "Hevy" is
> their trademark. Hevier contains no Hevy code or assets.

<table align="center">
  <tr>
    <td align="center" valign="top"><img src="docs/images/screens/home.png" alt="Home: next workout in your cycle and your feed" width="230"><br><sub><b>Home</b> · next in your cycle</sub></td>
    <td align="center" valign="top"><img src="docs/images/screens/log-workout.png" alt="Log Workout with the rest timer running" width="230"><br><sub><b>Log Workout</b> · rest timer, last session's numbers</sub></td>
    <td align="center" valign="top"><img src="docs/images/screens/recovery.png" alt="Recovery map: which muscles are ready" width="230"><br><sub><b>Recovery map</b> · what's ready to train</sub></td>
  </tr>
</table>

## Why Hevier

- **Every feature is free.** Long-range charts, set counts per muscle and the
  advanced statistics often sit behind a subscription elsewhere. Here they're
  part of the app, and the code is open.
- **Your data stays yours.** It lives on the phone in a SQLite database. No
  sign-up, no cloud, no tracking. Back it up to your own PC when you want.
- **Numbers with sources.** How sets are counted and how long a muscle stays
  tired come from published studies, each one cited in
  [`docs/science/`](docs/science/).
- **It works with the app closed.** The rest timer runs in the notification, with
  buttons, and four home-screen widgets keep your week in view.

## Features

### Logging
- Sets with weight and reps, time or distance; **warm-up** and **failure** sets
- **Rest timer** per exercise, with a buzz and a chime when it's over
- **Live PR medals** the moment a set beats your best: heaviest weight,
  estimated 1RM, best set volume, most reps, longest time or distance
- **"Reps left"** after your last set, so the app knows how hard it was
- **Per-hand weight** for dumbbell exercises
- A **clock** with a timer and a stopwatch, and Keep Awake while you train
- Edit, copy or delete a past workout, save one as a routine, or log a workout
  for a past day from the calendar

### Routines and cycle
- Routines in folders, reordered by drag and drop
- A **training cycle** (Upper A → Lower A → Upper B → …) that tells you what's
  next, on Home and in a widget
- After a workout, offers to update the routine with what you actually did

### Statistics, all free

<table align="center">
  <tr>
    <td align="center" valign="top"><img src="docs/images/screens/statistics.png" alt="Body graph: sets per muscle this week in research-based zones" width="230"><br><sub><b>Body graph</b> · sets per muscle this week</sub></td>
    <td align="center" valign="top"><img src="docs/images/screens/distribution.png" alt="Muscle distribution radar, compared with the period before, and push/pull balance" width="230"><br><sub><b>Muscle distribution</b> · vs. the period before</sub></td>
    <td align="center" valign="top"><img src="docs/images/screens/advanced-statistics.png" alt="Advanced statistics: all open, no subscription" width="230"><br><sub><b>Advanced statistics</b> · no lock icons</sub></td>
  </tr>
</table>

- **Body graph**: this week's sets per muscle, in zones from below maintenance
  to growth
- **Recovery map**: how recovered each muscle is right now
- **Muscle distribution** radar, compared with the period before
- **Push / pull balance**, with a warning when one side runs far ahead
- **Set count per muscle group**, main exercises and a **monthly report**
- Profile chart of duration, volume or reps over the last 15 or 30 days, 3 or
  6 months, a year or all time
- Exercise pages with progress charts, personal records and history

### Based on research, not guesses

<img src="docs/images/screens/how-sets-count.png" alt="How sets are counted, explained in the app" width="230" align="right">

Most apps count every set the same. Hevier counts what builds muscle, and
every rule names the study it comes from ([`docs/science/`](docs/science/)):

- **Hard sets count.** A set at failure or within 3 reps of it counts fully;
  easier sets count less (Robinson et al. 2024). Warm-ups get a small credit.
- **Helper muscles count half.** Your triceps in a bench press get half a set,
  the way that best fits 67 studies (Pelland et al. 2024).
- **Zones with sources.** 3 hard sets a week **maintains** a muscle (Bickel et
  al. 2011); 4 or more is the smallest dose shown to make it **grow**
  (Pelland et al. 2024).
- **Recovery windows from recovery studies.** One hard set leaves a muscle
  tired for about a day, four or more for up to three days.

It's an estimate, and the app says so. Where the research has gaps, the notes
say that too.

<br clear="right">

### 5,600+ exercises

<img src="docs/images/screens/exercises.png" alt="Exercise search: many variations of each movement" width="230" align="right">

The library has **5,600+ exercises** with their muscles and step-by-step
instructions (from [openGym](#credits)): every common movement in barbell,
dumbbell, cable, machine, band and bodyweight versions. Search by name, filter
by equipment or muscle, and each one gets its own page with your progress
chart, records and history.

<br clear="right">

### Cardio counts too
Cardio sessions feed a **Conditioning** card that tracks your weekly minutes
against the WHO guideline (75 minutes of vigorous activity a week, or twice
that at a moderate pace). It shows when you've met it, without pushing for more.

### Notification and widgets

<p align="center">
  <img src="docs/images/screens/notification.png" alt="Workout notification with rest countdown and Skip, -15s, +15s buttons" width="480">
</p>

- An ongoing **workout notification** shows the next set and the rest
  countdown, with **Complete Set**, **Skip**, **-15s** and **+15s** buttons that
  work even when the app is in the background
- **Home-screen widgets**: this month's calendar, weekly volume, next in cycle,
  and the recovery map

<p align="center">
  <img src="docs/images/screens/widgets.png" alt="Four home-screen widgets: calendar, weekly volume, next in cycle, recovery" width="480">
</p>

### Your data
- **Import** your history from a Hevy CSV export
- **Hevier Sync**: a small PC program that keeps a backup of the phone over
  Wi-Fi or a USB cable, and can restore it
- Everything lives on the phone: no account, no server, no tracking

<sub>Screenshots use demo data. Exercise pictures aren't part of this repository
(see [Exercise pictures](#exercise-pictures)), so the app shows a placeholder
instead.</sub>

## Getting started

You need Node.js 22+, [pnpm](https://pnpm.io) (`corepack enable` gives you the
right version), the Android SDK, and an emulator or an Android phone with
USB debugging on. The app has its own native modules, so it doesn't run in
Expo Go: build it once with

```bash
pnpm install
pnpm android        # expo run:android, from apps/mobile
```

After that, `pnpm mobile` (`expo start`) serves code changes to the installed app.

Checks (types, lint, tests, for every package through Turborepo):

```bash
pnpm check
```

They also run before every commit: `pnpm install` turns on the git hook in
`.githooks/pre-commit`.

### Import your Hevy history (optional)

In Hevy, export your workouts as CSV, then with the device connected:

```bash
apps/mobile/scripts/load-device.sh path/to/workouts.csv
```

This **replaces** the app's data on the device. Hevy's export has workouts
only, so make your routines in the app.

- **Units:** pounds and miles are converted to kg and km.
- **Time zone:** Hevy's dates have no time zone, so they're read in this
  computer's zone (printed when the import runs). If you trained elsewhere:
  `HEVIER_TIMEZONE=Europe/Paris scripts/load-device.sh path/to/workouts.csv`
- **No numbers:** an exercise logged without weight, reps, time or distance
  (like Stretching) is left out, and the import says so.
- **Bad rows:** skipped and listed.
- **Safety:** if nothing can be read, or more than 1 row in 10 is skipped,
  the import stops and your app's data is left alone.

### Exercise pictures

The exercise stills and clips are licensed by Gym visual to openGym only, so
they are **not** in this repository. Without them the app shows a placeholder.
If you have your own licensed copy, put it in `packages/catalogue/media/` and
`apps/mobile/scripts/load-device.sh` copies it onto the device.

### Hevier Sync (PC backup)

```bash
pnpm install
pnpm sync
```

Scan the QR code it shows from the app (Profile → Settings → Sync with PC).
Backups go to `~/HevierBackup`. Settings, what it keeps and its safety model:
[apps/sync/README.md](apps/sync/README.md).

### Release build on your phone

```bash
cd apps/mobile
npx expo prebuild --platform android
(cd android && ./gradlew assembleRelease)
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`install -r` installs over the old app and keeps its data. The build is signed
with the key described in `~/.config/hevier/keystore.properties` (`storeFile`,
`storePassword`, `keyAlias`, `keyPassword`), or with the debug key if that file
doesn't exist. Keep your key safe: an update signed with another key can't be
installed over the old app, and uninstalling wipes its data.

A release build isn't debuggable unless you prebuild with `HEVIER_DEBUGGABLE=1`.
`apps/mobile/scripts/load-device.sh` needs that to copy data in, but it also lets anyone
with the phone on USB read the app's data.

## Project layout

```
apps/
  mobile/            the Android app (Expo)
    app/             screens (Expo Router)
    components/      screen pieces, by feature; shared ones in components/ui/
    lib/             plain logic: formatting, stats, training maths
    db/              database access by topic, and migrations
    constants/       colours, sizes, labels, training numbers
    types/           every type and interface
    hooks/ stores/   React hooks and shared state
    modules/         native Kotlin: workout notification, home-screen widgets
    scripts/         import, device loading, design tools
  sync/              Hevier Sync, the PC backup program
  web/               landing page (not built yet)
packages/
  shared/            the sync protocol, used by the app and Hevier Sync
  catalogue/         the exercise catalogue from openGym
  config-typescript/ shared tsconfig
  config-eslint/     shared eslint config
```

## Contributing

Pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) has the code
rules and the checks to run first.

## Licence

Hevier is free software under the [GNU AGPL v3.0](LICENSE). The bundled exercise
catalogue comes from openGym, which is AGPL too.

## Credits

See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for the full list:

- Exercise catalogue: [openGym](https://github.com/DuarteSantos8/openGym) (AGPL-3.0),
  partly from ExerciseDB via hasaneyldrm/exercises-dataset (MIT)
- Body map: [MuscleMap](https://github.com/Jsplice/MuscleMap) (MIT)
- Figtree font (SIL Open Font License), Phosphor icons (MIT), Lucide icon (ISC)
