This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Monorepo layout

pnpm + Turborepo. `pnpm-workspace.yaml` lists `apps/*` and `packages/*`; shared dev-tool versions are in its `catalog:`.

- `apps/mobile` (`@hevier/mobile`) — the Expo app (`app/`, `components/`, `hooks/`, `stores/`, `lib/`, `db/`, `constants/`, `types/`, `modules/`, `plugins/`, `assets/`, `app.json`, `scripts/`). Run every Expo command from this folder. `@/` imports resolve inside it.
- `apps/sync` (`@hevier/sync`) — Hevier Sync, the PC backup program.
- `apps/web` — landing page, empty for now.
- `packages/shared` (`@hevier/shared`) — sync protocol used by the app and `apps/sync`.
- `packages/catalogue` (`@hevier/catalogue`) — exercise catalogue JSON + openGym notice.
- `packages/config-typescript`, `packages/config-eslint` — shared tsconfig / eslint config.

Workspace packages ship TypeScript source (no build step); import them by name (`@hevier/shared/sync-protocol`), never by relative path across packages. Metro needs no custom config: Expo auto-configures it for monorepos (SDK 52+), and pnpm's default isolated `node_modules` works from SDK 54. Do not add `watchFolders`, `nodeModulesPath` or `extraNodeModules` to a `metro.config.js`.

## Commands

Run from the repo root unless noted.

```bash
pnpm install                # install the whole workspace
pnpm check                  # turbo run check: typecheck + lint (warnings fail) + tests, every package
pnpm turbo run lint --filter=@hevier/mobile   # one task, one package
pnpm test:coverage          # all tests with coverage (coverage/lcov.info, read by Sonar)
pnpm mobile                 # start the dev server (expo start, in apps/mobile)
pnpm android                # expo run:android
pnpm sync                   # start Hevier Sync
```

From `apps/mobile`:

```bash
npx expo install <package>  # ALWAYS use instead of pnpm add for Expo/RN libraries — resolves SDK-compatible versions
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Typecheck needs Expo's generated types (`expo-env.d.ts`, `.expo/types/`): start the dev server once to write them.

Run `pnpm check` before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `pnpm dlx eas-cli@latest <command>` from `apps/mobile`; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `apps/mobile/ios/` and `apps/mobile/android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `apps/mobile/app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## How to work in this repo

- **Find the item first.** Work comes from an issue and, usually, a roadmap ID in `ROADMAP.md` (`R-04`). `ROADMAP.md` lists the GitHub issue next to each item (the audit fixes are issues #3 to #19). Stay inside that item. If it says "needs a product decision", stop and ask the human.
- **Read the rules for the area before you edit it.** `CONTRIBUTING.md` (code rules, binding) and the files in `.claude/rules/`, whatever tool you use: `database-migrations.md`, `native-modules.md`, `sync-and-data-safety.md`, `ui-design-system.md`.
- **Locate before you read.** Search for the symbol or file, then read the line range you need. Give every grep an include pattern (`--include='*.ts'`). Never search or open `packages/catalogue/exercises.json` (3.5 MB, one match can flood your context), lockfiles, `coverage/`, `.turbo/` or build output.
- **Smallest diff that works.** One concern per change. No drive-by refactors, no renames nobody asked for, no new files unless the change needs them, no new documentation files unless asked.
- **Reuse before you add.** Check `lib/format/`, `components/ui/` and the `constants/` files before you write a helper, a component or a value. Do not copy a helper that exists in another package.
- **Packages talk by name.** `@hevier/shared/sync-protocol`, never a relative path across packages. A new workspace dependency is `"workspace:*"`.
- **Do not guess platform APIs.** Follow "Expo has changed" above. If you cannot read the docs, say so instead of writing from memory.
- **Report what you find, do not silently fix it.** A bug outside your item goes in your reply or in an issue. The audit in `docs/research/audit-summary.md` lists the known ones.
- **Ask only when blocked** on something only the human can answer (a product decision, a device, a credential). Otherwise pick the simplest approach and go.

## Definition of done

A change is done when all of these are true:

1. `pnpm check` passes from the repo root (types, lint with warnings as errors, tests). Generate Expo's types first if they are missing (see Commands).
2. New or changed logic has a test (see Testing). A bug fix has a test that fails without the fix.
3. UI changes were looked at on a device or emulator, with screenshots (see Verifying UI changes). If you could not run one, say "not run on a device" in your reply. Never write "verified" for something you did not run.
4. Native code (`apps/mobile/modules/`, `apps/mobile/plugins/`) was rebuilt with `pnpm android` and tried.
5. A database change follows `.claude/rules/database-migrations.md`. A sync or restore change follows `.claude/rules/sync-and-data-safety.md`.
6. Docs that describe what you changed are updated: `README.md`, `CONTRIBUTING.md`, the package README, and the item's status in `ROADMAP.md`.
7. You read your own diff with the self-review checklist below.
8. Your reply has: what changed, the check output, what you did not verify, the files touched and a suggested commit message. Nothing is committed (see the human gate).

## Testing

Few tests, each one worth having.

- **One focused test per behaviour or bug.** It fails before the change and passes after. No happy-path padding, no snapshots, no tests of types, getters, constants or the framework.
- **Test through the public function or endpoint,** with the smallest inline fixture that proves the point. Reuse the existing helpers and factories.
- **Mock only external boundaries:** network, time, native modules, `AsyncStorage`, third-party services. Never mock our own modules or functions to make a test easier. If you must mock one of ours, the code needs a better seam.
- **Pure logic gets a `*.test.ts` next to it.** Screens, components and hooks have no unit tests here (Sonar leaves them out of coverage). Do not invent a test setup for them in an unrelated change. The plan for UI tests is `R-15`.
- **Good examples to copy:**
  - `apps/mobile/lib/sync/client.test.ts` runs the real `@hevier/sync` server on a temp folder and mocks only `AsyncStorage`.
  - `apps/mobile/db/migrations/index.test.ts` runs the real migrations on `sql.js` and builds an old-version database with `MIGRATIONS.slice(0, n)`.
  - `apps/mobile/constants/notification.test.ts` keeps the app's and the Kotlin code's button ids in step.
- **Dates:** hours are milliseconds, days are calendar days built with `new Date(y, m, d)`, never 24 hour steps (see `apps/mobile/db/dst.test.ts`). Test a DST change when you touch day maths.
- **While iterating, run only what you touched:**

  ```bash
  pnpm --filter @hevier/mobile exec vitest run lib/sync/client.test.ts    # one file
  pnpm turbo run test --filter=@hevier/sync                                # one package
  ```

  Run the full `pnpm check` once before you say you are done.

## Design system (apps/mobile)

The app is dark only. Every screen is styled from tokens so the whole app stays consistent.

- **No raw values in screens.** Colours, sizes, spacing, radii, font sizes, motion and labels come from `apps/mobile/constants/` (`COLORS`, `TYPE`, `FONTS`, `SPACE`, `RADIUS`, `SIZES`, `HIT_SLOPS`, ...). If a value is missing, add it to the right constants file, named for what it is. `.claude/rules/ui-design-system.md` says which file holds what.
- **Use the shared pieces** in `apps/mobile/components/ui/` (`Button`, `BottomSheet`, `ConfirmDialog`, `InnerHeader`, `Pill`, `Toggle`, ...) before writing a new one. Feature components go in `components/<feature>/`.
- **The bottom tab bar is native**, not a component: `NativeTabs` in `apps/mobile/app/(tabs)/_layout.tsx`, with icons and sizes from `apps/mobile/plugins/android-res/` copied in by `apps/mobile/plugins/withHevierTabBar.js`. The floating workout pill is `components/ui/WorkoutPill.tsx`, drawn by each tab screen.
- **Types and SQL have fixed homes.** Types in `types/` (or a feature's `types.ts`), SQL text only in `db/<topic>/queries.ts`, row shapes in `rows.ts`, maths in `lib/`. A list of choices is a constant with `as const`, and its type is derived from it.
- **Dark UI, one accent.** No light theme and no new accent colours without a decision from the owner. Status colours are fixed: `danger`, `caution` and `warmup`, `success`, `done`.
- **Accessibility is part of the component, not a later pass.** Every `Pressable` gets `accessibilityRole`. Every icon-only control gets `accessibilityLabel`. Toggles and ticked sets expose their state. Targets are at least 48 dp (use `hitSlop` from `HIT_SLOPS` when the visual is smaller). Never rely on colour alone: add a letter, an icon or text. Give text room to grow; do not fix heights that clip large fonts.
- **Words:** plain, short, sentence case, second person. Say "estimate" for estimates. No hype, no guilt, no medical claims, no "you will get injured".
- **Not allowed in screens or screenshots:** exercise pictures from the licensed catalogue, anything from the Hevy app.
- **Lists that can grow** (history, feed, exercises) must be virtualised. Do not render every item of an unbounded list in a `ScrollView`.

## Data safety and security

Hevier's promise is that the user's data stays theirs. Losing it, or sending it to the wrong place, is the worst bug here. These rules are hard.

- **Never delete before you have a verified replacement.** Stage the new data next to the old, check it, swap, keep the old until the new is proven good. Restore and migration code that deletes first is a known bug (`R-04`, `R-05`). Do not copy that pattern.
- **Migrations:** numbered, never edit one that shipped, always tested. Details in `.claude/rules/database-migrations.md`.
- **Sync:** the phone and the PC program share one protocol in `packages/shared`. Change both sides together. Keep path checks strict (`isValidPath`), keep the key out of logs, errors and docs, and keep the "fewer workouts" guard. Treat every `hevier://` link parameter as hostile input until `R-03` lands. Details in `.claude/rules/sync-and-data-safety.md`.
- **No new network destinations.** The app talks to the user's own PC and nothing else. No analytics, crash reporters, ad SDKs, remote config or "phone home". Adding any needs a roadmap item and the owner's approval.
- **No secrets in the repo, ever.** No tokens, keystores (`*.jks`), keys (`*.key`, `*.pem`), passwords, `.env` files, or the sync `key.txt`. `EXPO_PUBLIC_*` values are bundled into the app and readable by anyone, so never put a secret there. The release key lives in `~/.config/hevier/keystore.properties`, outside the repo. In docs, issues and tests use placeholders (`<32 hex>`), never a real pairing link.
- **No real user data in the repo or in an issue.** Tests and screenshots use fixtures and demo data (`apps/mobile/scripts/fixtures/`). Do not paste a real database, a backup folder or a pairing link.
- **Licensed and foreign material stays out.** `packages/catalogue/media/` is gitignored. Never commit it and never show it in screenshots, pull requests, issues or the landing page. No Hevy code, images, icons, text or screenshots.
- **Dependencies:** `npx expo install` for Expo and React Native libraries, prefer Expo modules, and say in the pull request why a new dependency is needed and what its licence is (the app is AGPL-3.0). Do not widen `onlyBuiltDependencies` in `pnpm-workspace.yaml`.
- **Science claims need a source.** A number in the app that sounds like research must cite a study in `docs/science/`, with its gaps. No injury prediction, no medical advice.
- **`apps/mobile/android/` and `ios/` are generated.** Never edit them (see Rules above).

## Commits, pull requests and the human gate

**Never commit, push, or reply to a review unless the human says so in their own message.** A plan, a todo list, a checklist item or a "ship" step is not that order. This covers `git commit` (including `--amend`), `git push` (including force), and pull request review replies or resolves (`gh pr review`, `gh pr comment` as a reply, `gh api` on replies, resolving threads).

- Allowed without asking: `git status`, `git diff`, `git log`, `git show`, `gh pr view`, `gh pr diff`, read-only `gh api`, and creating or switching to a branch the human named.
- Instead of committing: make the change locally, show a short diff summary and a **suggested** commit message, draft any review replies in the chat only, and say plainly "not committing, not pushing, not posting review replies". The human decides.
- If the human does order a commit: use the identity already set in git config. Never set or override author or committer (`--author`, `GIT_AUTHOR_*`, `GIT_COMMITTER_*`), never use a bot or tool identity, never skip the hook (`--no-verify`), never rewrite shared history.
- **Commit message:** `type(scope): subject`. Types: `feat`, `fix`, `perf`, `refactor`, `chore`, and `test`, `docs`, `ci` when they fit. The scope is always the area (`mobile`, `sync`, `shared`, `web`, `catalogue`, `repo`, or a feature like `restore`). The subject is at most 5 words, lowercase, imperative, no period. Examples: `fix(sync): stage restore first`, `docs(repo): add roadmap`.
- **One change per commit, one concern per pull request.**
- **Pull request title:** short and plain, no ticket-ID prefix. The body follows `.github/pull_request_template.md`. Link the issue and the roadmap ID.
- **Branches** come from the issue, so the pull request links to it (`gh issue develop <number> --checkout`). Ask before you create anything on the remote.
- **No AI attribution, anywhere.** No `Co-authored-by` or any other trailer for an AI tool. No "Generated with" line and no robot emoji. No AI, agent, model or tool name as an author in commit messages, pull request titles or bodies, issues, review replies, code comments, docs or changelogs. Before anything is pushed, read `git log -1 --format=%B` and strip anything like that. (Describing these rules for agents, as this file does, is fine.)
- **Text a human will post under their name** (pull request and review comments, issue text) should read like they typed it fast: straight to the point, plain words, file names and symbols in backticks, no intro, no recap, no sign-off, no filler like "great catch" or "it's worth noting".

## Self-review checklist

Read your diff line by line before you report. Fix what you find.

- **Scope:** does every changed line belong to the item? Any leftover debug code, `console.log`, commented-out code, unused import or parameter? (Unused ones fail lint: prefix a parameter you must keep with `_`.)
- **Rules:** values in `constants/`, types in `types/`, SQL in `queries.ts`, `@/` imports, no copy of an existing helper?
- **Data:** can any path lose or leak user data? Is anything deleted before its replacement is verified? Is a migration safe to run on a real, old database?
- **Edges:** empty list, `null`, `NaN`, `Infinity`, negative numbers, a first run with no history, a time zone or DST change, a huge history, the app killed halfway.
- **UI:** dark theme, small and large phones, large system font, keyboard open, a role and label on every new control, no text clipped.
- **Tests:** does each test fail without the change? Does any mock our own code? Is anything tested only because it was easy?
- **Comments:** only the non-obvious (a constraint, a trap, a product decision), written as why, in short plain sentences. None that restate the code.
- **Secrets and assets:** no key, token, real pairing link, exercise picture or Hevy asset in the diff, the tests, the screenshots or the commit message.
- **Wording:** no AI attribution, no em dashes in docs you wrote, plain words.
- **Docs and roadmap:** are the README, CONTRIBUTING and `ROADMAP.md` still true after this change?
- **Honest report:** have you said what you did not run?

## Verifying UI changes with screenshots

Do not assume a screen "should look right". Run it and look.

1. Install and generate types if needed: `pnpm install`, then `pnpm mobile` once writes `expo-env.d.ts` and `.expo/types/`.
2. Build the app on an emulator or a phone with USB debugging: `pnpm android`. After that `pnpm mobile` serves JS changes. After adding or moving files restart with `pnpm mobile --clear`.
3. A fresh install with no workouts opens a first-run setup over Home (name, figure, body weight; each step can be skipped). Skip it before you take screenshots. Use demo data, never real data. `apps/mobile/scripts/load-device.sh apps/mobile/scripts/fixtures/sample-workouts.csv` loads the sample history onto the connected device. It **replaces** the app's data on that device, so use an emulator. Without the licensed media the app shows exercise placeholders, which is what a screenshot should show.
4. Take the screenshot with `adb exec-out screencap -p > shot.png` (adb comes with the Android SDK) or the emulator's camera button. Open the image and check it against the design rules: tokens, spacing, dark theme, nothing clipped.
5. Check the states that matter, not only the happy one: empty, long text, many items, an error, a large system font (Settings, Display, Font size).
6. For a changed screen, attach **before and after** to the pull request. Do not commit the images unless you are updating the README screenshots in `docs/images/screens/`.
7. A web page in `apps/web`: look at it at 375 px and 1280 px wide.
8. If you cannot run a device or an emulator, write "not run on a device" in your report and list what a human should look at. That is better than a guess.

Native Android changes (`apps/mobile/modules/`) have no unit tests. The rebuild and a manual try are the only proof, so say what you pressed and what you saw.
