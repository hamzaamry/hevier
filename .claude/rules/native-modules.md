---
paths:
  - "apps/mobile/modules/**"
  - "apps/mobile/plugins/**"
  - "apps/mobile/app.json"
---

# Native modules and config

Two local Expo modules, both Kotlin and Android only (plus two config plugins in `apps/mobile/plugins/`, see Rules):

- `apps/mobile/modules/workout-notification`: the ongoing rest notification and its buttons.
- `apps/mobile/modules/home-widgets`: the four home-screen widgets.

Their JS wrappers (`index.ts`) use `requireOptionalNativeModule`, so a build without
the module, or an iOS build, runs and does nothing. Keep it that way.

## Rules

- **Read the Expo SDK docs for the installed major version before you touch any Expo module or config plugin API.** See `AGENTS.md`.
- **Rebuild after any change here:** `pnpm android` (Expo Go cannot load these). JS-only changes do not need it.
- **`apps/mobile/android/` and `ios/` are generated.** Never edit them. Native behaviour goes in the module sources, `apps/mobile/app.json` or a plugin: `apps/mobile/plugins/withHevierRelease.js` (signing) and `apps/mobile/plugins/withHevierTabBar.js`, which copies the native tab bar's drawables and sizes from `apps/mobile/plugins/android-res/` into the generated `android/` folder on every prebuild. The tab bar itself is `NativeTabs` in `apps/mobile/app/(tabs)/_layout.tsx`; the drawable names there (`tab_home`, `tab_workout_active`, ...) must match the files in `android-res/drawable/`.
- **Keep the JS and Kotlin contracts in step.** The payload types are `apps/mobile/types/notification.ts` and `apps/mobile/types/widgets.ts`. The notification button ids exist in both places, and `apps/mobile/constants/notification.test.ts` fails when they drift. Change both sides in the same pull request.
- **The chime is duplicated** on purpose: `modules/workout-notification/android/src/main/res/raw/rest_chime.wav` is the Android copy of `assets/sounds/pr.wav`.
- **No unit tests exist for Kotlin.** The proof is a rebuild and a manual try. Write down what you pressed and what you saw, or say "not run on a device".
- **Android lifecycle traps (known, see `ROADMAP.md` R-07):** a foreground service must call `startForeground` on every start path or Android crashes the app, alarms do not survive a reboot, and audio focus must be released on every error path. Do not add new code that repeats these.
- **Privacy:** the lock screen can show workout and exercise names today. Do not put more personal data in a notification.
- **Do not edit `AndroidManifest.xml` permissions or exported receivers casually.** The widget receivers are the standard exported pair. The midnight and action receivers are not exported. Keep it that way.
- **Release signing** reads `~/.config/hevier/keystore.properties` and `debuggable` is off unless `HEVIER_DEBUGGABLE=1`. Never put a key, password or keystore in the repo.
- **`apps/mobile/app.json`:** `usesCleartextTraffic` is on for LAN sync (`R-35`). Do not widen it. `expo-build-properties` is listed twice, a known cleanup (`R-09`).
- **Do not add `watchFolders`, `nodeModulesPath` or `extraNodeModules`** to a Metro config.
- **iOS is not supported yet.** Keep new native work behind the optional-module pattern so it does not break an iOS build. The plan is in `docs/research/ios.md` and `R-22`.
