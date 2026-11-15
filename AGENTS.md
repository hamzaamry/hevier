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

CI (`docs/ci.md` has the workflow map, secrets and release steps): every PR runs `pnpm turbo run check`, the Expo checks, a debug APK and the web build + e2e. The PR title must be `type(scope): subject` (subject up to 5 words, lowercase): it becomes the squash commit and the changelog line. Never pin an action by tag: use the full commit SHA with the version in a comment. Check workflows with `actionlint`.

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
