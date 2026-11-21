# Contributing to Hevier

Thanks for helping. This page covers how to set up, where code goes and the
rules the codebase follows. Setup itself is in the [README](README.md#build-from-source).

## Before you open a pull request

This must pass:

```bash
pnpm check   # turbo run check: types (tsc), lint (eslint, warnings fail), tests (vitest), every package
```

The repo is a pnpm + Turborepo monorepo (see [Repo layout](#repo-layout)).
Install with `pnpm install` from the root; Turborepo caches each package's
result, so a second run only redoes what changed. One package:
`pnpm turbo run check --filter=@hevier/mobile` or `pnpm turbo run test --filter=@hevier/sync`.
The type check needs Expo's generated types (`apps/mobile/expo-env.d.ts`,
`.expo/types/`): run `pnpm mobile` once so Expo writes them.

The same checks run before every commit (`.githooks/pre-commit`, turned on by
`pnpm install`). Unused variables, imports and parameters fail: remove them,
or prefix a parameter you must keep with `_`.

GitHub runs the same checks on every pull request (`.github/workflows/check.yml`),
then a [SonarQube Cloud](https://sonarcloud.io) scan: bugs, code smells,
duplication, security hotspots, and test coverage on the lines you changed.
Coverage counts the logic (`apps/mobile/lib/`, `db/`, `stores/`,
`scripts/import/`, `apps/sync/`, `packages/shared/`); screens, components and
hooks have no unit tests and don't count (see `sonar-project.properties`). New
logic needs tests: `pnpm test:coverage` shows what they cover.

### Screenshots

Every pull request shows its change with screenshots in the description (the
pull request template has a Screenshots section for them):

- **Bug fix:** before and after, side by side, so the reviewer sees what was
  wrong and that it's gone.
- **Feature:** the feature in use: each new screen and the main steps through
  it, on an emulator or phone.
- **Chore** (scripts, tooling, build, dependencies): a screenshot of the
  result, such as a script's output, the command running, or the build passing.

A change with nothing to show skips this rule (a dependency bump, a config
tweak, a rename, a refactor that changes nothing on screen). Say so in the
description: "No screenshots: nothing changes on screen."

Keep one change per pull request, and one change per commit. Write commit
messages that say what changed, in plain words, with the prefix the
[Releases](#releases) section explains: the prefix sets the next version.

## Releases

Nobody picks a version and nobody pushes a tag. Every push to `main` runs
[`release.yml`](.github/workflows/release.yml), which reads the commits
since the last release, decides the next version with
[`.github/scripts/next-version.mjs`](.github/scripts/next-version.mjs) and, when the commits
warrant one, pushes the tag, opens the GitHub Release and builds the signed APK
with [`release-apk.yml`](.github/workflows/release-apk.yml). If the keystore
secrets are missing the release stays a draft, so an unsigned build is never
published.

The tag is the version. `apps/mobile/app.json` is stamped during the build, so
the number committed there is not the last release; a local build reports what
is in the file.

### The title rule

Squash merges turn the pull request title into the commit on `main`, so the
title is what sets the version. Write it as:

```
type(scope): what changed
```

- `type` is one of `feat`, `fix`, `perf`, `revert`, `refactor`, `docs`, `test`,
  `build`, `ci`, `chore`, `style`, in lower case.
- `(scope)` is optional: the screen or area, like `(workout)` or `(sync)`.
- `!` before the colon marks a major release (see below). Use it rarely.
- After `: ` comes a short sentence in plain words.

Good: `feat(workout): add a rest timer`, `fix(search): keep filters after a
rename`, `ci: check pull request titles`. Bad: `Update stuff`, `Feat: Timer`,
`feat add timer`.

The `Commit message` job in [`check.yml`](.github/workflows/check.yml) enforces
this on every pull request, before types, tests and Sonar run. A title that
does not match fails the check and cannot merge. Edit the title and the check
re-runs by itself.

### What bumps the version

| Prefix | Version | Use it for |
| --- | --- | --- |
| `feat:` | minor, `1.1.0` | something a person can see: a screen, a flow, a setting, the Hevy import, file backup, starter plans, pounds |
| `fix:` | patch, `1.0.1` | a bug, wording, styling |
| `perf:` | patch | faster with the same screens |
| `revert:` | patch | undoing a change |
| `docs:`, `test:`, `build:`, `ci:`, `chore:`, `style:`, `refactor:` | no release | nothing a user installs changes |

The highest bump in the batch wins: one `feat:` among five `fix:` commits makes
a minor. The first release is `1.0.0`.

When you are not sure between patch and minor, choose minor.

### When it is a major

`2.0.0` is not for a new table or column. The app runs every pending migration
when it opens, so a phone on the first schema catches up to the current one, and
people skip releases. A new column or table ships in a minor, or in a patch when
no screen changed.

Write `feat!:` (or add a `BREAKING CHANGE:` line to the message) only for a
break the app cannot repair on its own:

- **Sync:** an old phone and a new PC backup, in either direction, cannot talk
  to each other.
- **Migration:** the database only reaches the current schema after passing
  through a specific version, so a phone that skipped releases breaks.
- **Signing key:** the app is signed with a new key. Android will not install it
  over the old app, so the workouts are lost unless people export them first.

Anything else stays a minor. A major is rare on purpose.

### Checking and rebuilding

See what the next release would be, without releasing:

```bash
node .github/scripts/next-version.mjs
```

Rebuild a tag without changing the version (a failed build, a fixed workflow):

```bash
gh workflow run release-apk.yml --ref v1.0.1
```

To republish after a failed build, re-run the `Release` workflow for that commit
(`gh run rerun <run-id>`): it finds the tag at `HEAD` and keeps the same
version.

## Native code

The app has two local native modules in Kotlin (`apps/mobile/modules/workout-notification`,
`apps/mobile/modules/home-widgets`) and a config plugin
(`apps/mobile/plugins/withHevierRelease.js`). After changing any of them,
rebuild the app:

```bash
pnpm android
```

The `apps/mobile/android/` folder is generated by Expo: don't edit it by hand,
change `apps/mobile/app.json` or a plugin instead.

After adding, moving or renaming files, restart Metro with
`pnpm mobile --clear`. A stale cache can show a black screen or
"Unable to resolve".

## Repo layout

| Package | What lives there |
|---|---|
| `apps/mobile` (`@hevier/mobile`) | The Expo app |
| `apps/sync` (`@hevier/sync`) | Hevier Sync, the PC backup program |
| `apps/web` | Landing page (empty for now) |
| `packages/shared` (`@hevier/shared`) | The sync protocol, imported by the app and Hevier Sync |
| `packages/catalogue` (`@hevier/catalogue`) | The exercise catalogue from openGym |
| `packages/config-typescript`, `packages/config-eslint` | Shared tsconfig and eslint config |

Inside `apps/mobile`:

| Folder | What lives there |
|---|---|
| `app/` | Screens (Expo Router: each file is a route) |
| `components/<feature>/` | Pieces of one screen or feature; shared ones in `components/ui/` |
| `hooks/` | React hooks |
| `stores/` | Shared state that lives outside a screen (the workout in progress, the clock) |
| `lib/` | Plain logic with no database or UI: formatting, stats, training maths |
| `db/<topic>/` | Database access, one folder per topic |
| `db/migrations/` | Database migrations, numbered |
| `constants/` | Every fixed value: colours, sizes, labels, training numbers |
| `types/` | Every type and interface |
| `modules/` | Native Kotlin modules |
| `scripts/` | Import, device loading, design tools |

Packages are used by name (`@hevier/shared/sync-protocol`), never by relative
path across packages. Add a dependency on another package with `"workspace:*"`.
Add an Expo library with `npx expo install <name>` from `apps/mobile`.

## Code rules

- **Values live in `constants/`.** No colours, sizes or numbers typed into a
  screen. Constants are `UPPER_SNAKE`, their keys `camelCase`:
  `COLORS.surface`, `SPACE.md`, `LOG_WORKOUT_SIZES.setRowHeight`. All sizes are
  in `constants/sizes.ts`, grouped by component.
- **Types live in a types file**, even one used by a single file: shared types
  in `types/<topic>.ts`, a feature's own in `types.ts` in its folder. Component
  props too.
- **A type that is a list of choices is built from a constant**, never typed
  twice:

  ```ts
  // constants/workout.ts
  export const SET_TYPES = ['warmup', 'normal', 'failure'] as const;
  // types/workout.ts
  export type SetType = (typeof SET_TYPES)[number];
  ```

- **SQL text lives only in `db/<topic>/queries.ts`**, row shapes in
  `db/<topic>/rows.ts`. The code that runs a query has no SQL in it, and the
  maths on the results goes in `lib/`.
- **Imports use `@/`** inside `apps/mobile` (`@/constants/time`, not
  `../../constants/time`). Same-folder imports (`./x`) stay relative. Other
  packages are imported by name: `@hevier/shared/sync-protocol`,
  `@hevier/catalogue/exercises.json`.
- **Reuse before you add.** Check `lib/format/` for dates, durations and
  weights, and `components/ui/` for sheets, dialogs, headers and lists, before
  writing a new one.
- **Pure logic gets a test** in a `*.test.ts` file next to it.
- **Comments say why**, in short plain sentences. Describe what the app does,
  not where an idea came from.

## Database changes

Add a new numbered file in `apps/mobile/db/migrations/` (`015_….ts`) and list it in
`apps/mobile/db/migrations/index.ts`. Never change a migration that has shipped: phones
have already run it. Add a test in `apps/mobile/db/migrations/index.test.ts`.

## Exercise pictures and clips

The exercise media (`packages/catalogue/media/`) is licensed by Gym visual to openGym
only. It is gitignored: never commit it, and don't put any of it in issues,
pull requests or screenshots.

## Hevy

Hevier is an unofficial hobby project inspired by Hevy. Don't add Hevy's code,
images, icons or text, or screenshots of the Hevy app, to this repository.

## Licence

Hevier is under the [GNU AGPL v3.0](LICENSE). By sending a contribution you
agree that it is released under the same licence.
