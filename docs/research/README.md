# Research

The research behind [ROADMAP.md](../../ROADMAP.md). Read the caveats below before
you quote any of it. It is a snapshot from 2026-11-07, not a source of truth.

| File | What it is | Feeds |
|---|---|---|
| [market.md](market.md) | Other workout and running apps, what users complain about, a feature matrix, 15 ranked opportunities, landing page positioning | R-10, R-19 to R-24, R-27, R-29 to R-31, R-34, R-37, R-38 |
| [running.md](running.md) | Design spec for run recovery: the model, constants, data, screens, tests and 7 PR-sized phases | R-11, R-17, R-18, R-25, R-26, R-27 |
| [ios.md](ios.md) | What works on iOS today, how to port the notification and widgets, build and signing options, a PR plan | R-22, R-32, R-33 |
| [audit-summary.md](audit-summary.md) | Every finding of the code audit (bugs, security, performance, accessibility, iOS, test gaps), with severity and confidence | R-03 to R-09, R-12 to R-16, R-22, R-28, R-32, R-33, R-35, R-36, R-39 |

## Caveats

- **Reddit could not be read.** The fetch tool refuses reddit.com, and search would
  not filter by it. No r/Hevy, r/weightroom, r/AdvancedRunning, r/androidapps or
  r/selfhosted thread was read directly. The complaint ranking in `market.md`
  comes from GitHub issues, product feedback boards, a Garmin forum, changelogs,
  app-store aggregators and review blogs. Treat the ranking as a lead, then
  check it with real users (R-02 adds a way to propose changes).
- **Many review pages are vendor content** (competitor blogs, self-rankings).
  `market.md` tags them `[vendor]`. Prices come mostly from those pages: check
  the store before you use a number in public copy.
- **Items tagged `[memory]` in `market.md` are not sourced.** They come from the
  researcher's background knowledge.
- **Citations tagged `[m]` in `running.md` are from memory and were not
  re-checked.** `[v]` means the abstract or record was read. Re-check every `[m]`
  citation before you quote it in the app or in docs. This includes the Nielsen
  2014 running-progression paper and the Doma and Deakin 2014 order study.
- **`running.md` is design only.** Nothing in it is built. The worked examples and
  test numbers were produced by a throwaway reference implementation that is not
  in the repo, so the first implementation PR must reproduce them or explain why not.
- **`ios.md` mixes sources.** Items tagged `[know]` are Apple platform behaviour
  from memory (developer.apple.com could not be fetched) and each has a Simulator
  check in the plan. Free-account App Group signing is marked unknown on purpose:
  the first spike decides it. `@bacons/apple-targets` was not verified against
  SDK 57 and React Native 0.86. This Mac had no Simulator runtime and no
  CocoaPods when the research ran.
- **`audit-summary.md` confidence levels matter.** Only `confirmed` findings were
  proven. `likely` and `suspected` ones need a device or a measurement.
- **Landing page notes in `market.md` come from page text, not screenshots.**
- **Not confirmed anywhere:** Gymbook, intervals.icu pricing and strength
  handling, whether Strava paywalls its strength log, the Wall Street Journal
  claim about Runna injuries (one secondary source, do not use in marketing).

## Paths in these files

The research ran on `main` at `b5c4394`, before the monorepo move. The files keep
their original paths and commands, apart from the one edit listed below.

| In the research | Now |
|---|---|
| `lib/`, `app/`, `db/`, `components/`, `constants/`, `hooks/`, `stores/`, `types/`, `modules/`, `plugins/`, `scripts/`, `app.json` | the same names under `apps/mobile/` |
| `backup-server/` | `apps/sync/` |
| `shared/` | `packages/shared/` |
| `package-lock.json`, `npm`, `npx tsc --noEmit` | `pnpm-lock.yaml`, `pnpm`, `pnpm check` |
| `AGENTS.md` "lint and typecheck before done" | [AGENTS.md](../../AGENTS.md) "Definition of done" |

`audit-summary.md` already uses the new paths.

## Changes since the research

Upstream `main` at `28face9` (PR #2) landed after the research and was merged
into the monorepo branch. What it changes for these notes:

- Migrations 011 to 014 exist (body weights, device id, openGym data update,
  Lat Pulldown). The next free number is 015, so the migration numbers in
  `running.md` were shifted by four (011 to 015, 012 to 016, 013 to 017).
- The catalogue now has 5,593 exercises, not 5,632. Counts of "5,600+" in
  `market.md` are the research snapshot and stay as written.
- The bottom tab bar is native and `components/ui/TabBar.tsx` is gone. Body
  weight logging, a first-run setup and a "newest data wins" check in sync
  were added. `audit-summary.md` notes the two findings this touches (A-17, P-01).

## Edits made when copying

- `market.md`: one absolute path on the researcher's machine (in the feature
  matrix intro) became "the repo README.md". Nothing else was changed.
- `audit-summary.md` is new. It condenses the raw audit and drops line numbers,
  repro notes and the machine-local proof file.
