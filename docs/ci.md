# CI/CD

Everything runs on GitHub Actions, on `ubuntu-latest` only (no macOS runners,
so nothing here is billed at the 10x macOS rate). Third-party actions are pinned
to a commit SHA; Dependabot bumps them weekly.

## Workflow map

| File | Runs on | Jobs (the names to use in branch protection) | What it does |
|---|---|---|---|
| `ci.yml` | PR, push to `main`, manual | `check`, `mobile (expo-doctor)`, `mobile (android-bundle)`, `mobile (prebuild)`, `actionlint` | `pnpm turbo run check` (types, lint, tests, every package), then coverage and Sonar when `SONAR_TOKEN` exists and the PR is not from a fork. `expo-doctor`, the Android JS bundle export, `expo prebuild` (checks that `withHevierRelease` patched the gradle file and that `package.json` / `app.json` stay unchanged), and `actionlint` over all workflows. |
| `pr-title.yml` | PR | `title` | The title must be `type(scope): subject`: types `feat fix perf refactor chore test docs ci`, subject up to 5 words, lowercase, no period. It becomes the squash commit and the changelog line. Skipped for Dependabot. |
| `android.yml` | PR, manual, called by `release.yml` | `apk (debug)` on a PR, `apk (release)` from a release | Prebuild + Gradle. A PR gets a debug APK (arm64 only) as an artifact for 7 days. A release builds the signed APK and AAB. |
| `web.yml` | PR, push to `main`, manual | `web (build, e2e, axe)` | Builds the landing page and runs Playwright: behaviour and axe tests block; the screenshot tests only warn until linux baselines are committed (see [Landing page](#landing-page)). |
| `sync-binaries.yml` | PR touching `apps/sync` or `packages/shared`, manual, called by `release.yml` | `build` | `bun build --compile` for linux-x64, windows-x64, darwin-arm64 and darwin-x64 from one linux runner, a smoke test of the linux binary (starts, answers 401 without the key and 200 with it), archives as artifacts. |
| `release.yml` | push to `main`, manual (from a tag to rebuild it) | `please`, `android`, `sync`, `publish` | release-please keeps the release PR current. Merging it tags `vX.Y.Z`; the same run builds the Android release and the Sync binaries and publishes the GitHub Release. |
| `pages.yml` | push to `main` touching `apps/web`, manual | `build`, `deploy` | Static export of the landing page to GitHub Pages. |
| `vercel-preview.yml` | PR touching `apps/web` | `preview` | A Vercel preview, only when the three Vercel secrets exist. |
| `codeql.yml` | PR, push to `main`, weekly | `analyze (javascript-typescript)`, `analyze (actions)` | CodeQL for the code and for the workflows. |
| `dependency-review.yml` | PR | `review` | Fails a PR that adds a dependency with a high severity advisory. Skipped until the `DEPENDENCY_REVIEW` variable is `true` (see [Owner todo](#owner-todo)). |
| `security.yml` | PR, push to `main`, weekly | `audit (informational)`, `gitleaks` | `pnpm audit --prod` in the job summary (never fails), and a gitleaks secret scan (non-blocking on fork PRs). |
| `.github/dependabot.yml` | weekly | | Grouped PRs for npm (Expo and React Native packages are left alone: move them with `npx expo install --fix`) and for the actions. |

`.github/actions/setup` is the shared step: pnpm (version from `packageManager`),
Node from `.nvmrc`, `pnpm install --frozen-lockfile`, and the Turborepo cache.

## Secrets and variables

Settings > Secrets and variables > Actions. Nothing is needed for the checks to run.

| Name | Kind | Needed for | Required? |
|---|---|---|---|
| `SONAR_TOKEN` | secret | Coverage and the Sonar scan in `ci.yml` | Optional: skipped without it |
| `ANDROID_KEYSTORE_BASE64` | secret | The release keystore, base64 | Optional: without the four `ANDROID_*` secrets the release APK is signed with the debug key, no AAB is built, and the release stays a draft |
| `ANDROID_KEYSTORE_PASSWORD` | secret | Keystore password | with the keystore |
| `ANDROID_KEY_ALIAS` | secret | Key alias in the keystore | with the keystore |
| `ANDROID_KEY_PASSWORD` | secret | Key password | with the keystore |
| `RELEASE_PLEASE_TOKEN` | secret | A fine-grained token (this repo: Contents, Pull requests, Issues write) so the release PR starts the checks | Optional, see [Release PR and checks](#release-pr-and-checks) |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secrets | `vercel-preview.yml` | Optional: no preview without all three |
| `SITE_URL` | variable | Canonical URL of the landing page (`NEXT_PUBLIC_SITE_URL`) | Optional: defaults to the Pages URL |
| `HAS_APK_RELEASE` | variable | Set to `true` once a release has an APK: the landing page then says "Download for Android" (`NEXT_PUBLIC_HAS_APK_RELEASE`) | Optional |
| `WEB_VISUAL_BLOCKING` | variable | `true` makes the screenshot tests block | Optional, after the linux baselines are committed |
| `VERCEL_PR_COMMENT` | variable | `true` posts the preview URL on the PR | Optional |
| `DEPENDENCY_REVIEW` | variable | `true` runs `review` in `dependency-review.yml` | Optional, set it once the Dependency graph is on |

`EXPO_TOKEN` is not used: the app is built with Gradle on the runner, not with EAS.
If you move to EAS later, create it at expo.dev > Account settings > Access tokens and
add it as a secret.

Vercel: `vercel link` in the repo root writes `.vercel/project.json` with `orgId` and
`projectId` (the two IDs); create the token at vercel.com/account/tokens. Set the
project's Root Directory to `apps/web`.

### Android keystore

Reuse the key you already sign your phone's builds with (`~/.config/hevier/keystore.properties`
points at it): an update signed with another key cannot be installed over the old app.
To make a new one:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore hevier-release.jks \
  -alias hevier -keyalg RSA -keysize 2048 -validity 10000
```

Then store it (avoid `\` in the passwords, they go through a `.properties` file):

```bash
base64 -i hevier-release.jks | gh secret set ANDROID_KEYSTORE_BASE64     # macOS
base64 -w0 hevier-release.jks | gh secret set ANDROID_KEYSTORE_BASE64    # linux
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS
gh secret set ANDROID_KEY_PASSWORD
```

How it is wired: `apps/mobile/plugins/withHevierRelease.js` makes the release build
read `~/.config/hevier/keystore.properties` (`storeFile`, `storePassword`, `keyAlias`,
`keyPassword`) and sign with that key, or with the debug key when the file is missing.
`android.yml` writes the keystore to `~/.config/hevier/release.jks` and that file from
the secrets, so the plugin needs no change. After the build it checks that the APK is
not signed with the debug key and puts the signing certificate fingerprint in the job
summary.

## Cut a release

1. Merge pull requests into `main` with a `type(scope): subject` title. `feat` bumps the
   minor version, `fix` and `perf` the patch, `!` after the scope (or `BREAKING CHANGE:`
   in the body) the major. `docs`, `test`, `ci`, `chore` appear nowhere in the notes.
2. `release.yml` opens (and keeps updating) a pull request `chore(release): X.Y.Z` that
   edits `CHANGELOG.md` and the version in the root `package.json`, `apps/mobile/app.json`,
   `apps/mobile/package.json` and `apps/sync/package.json`.
3. Merge that pull request. The same workflow run creates the tag `vX.Y.Z` and a draft
   release with the changelog section, builds the signed APK + AAB and the Sync binaries,
   uploads them with `SHA256SUMS`, and publishes the release.
4. If the keystore secrets are missing the release stays a **draft** with a debug-signed
   APK. Add the secrets, then run Release from that tag (see below) to build and publish again.
5. Set the `HAS_APK_RELEASE` variable to `true` so the landing page links the APK.

Version handling: release-please writes the version into the files above. The Android
build also stamps `expo.version` and `expo.android.versionCode` into `app.json` before
`expo prebuild`, from the tag: `versionCode = major * 1000000 + minor * 1000 + patch`
(1.2.3 is 1002003), so every release is higher than the one before. Nothing is committed
for the code. Pre-release tags (`v1.2.3-rc.1`) use the code of 1.2.3.

The first release PR only lists commits after `28face9` (`bootstrap-sha` in
`release-please-config.json`) and starts from `1.0.0` in `.release-please-manifest.json`.
Change both before the first release if you want another start.

To build an existing tag again (or to release by hand without release-please: push the
tag first), run Release **from the tag ref**: `gh workflow run release.yml --ref vX.Y.Z`,
or Actions > Release > Run workflow > "Use workflow from" > Tags > `vX.Y.Z`. There is no
input: the workflow takes the version from `github.ref_name` (it must look like `vX.Y.Z`,
`vX.Y.Z-rc.1`) and builds the commit it runs on, so the build can never be pointed at
another ref. Run from a branch it runs release-please instead.

### Release PR and checks

A pull request opened with the default `GITHUB_TOKEN` does not start workflows, so the
release PR shows no checks and a branch protection that requires them cannot be satisfied.
Either set `RELEASE_PLEASE_TOKEN` (a fine-grained token, Contents + Pull requests + Issues
write on this repo), or close and reopen the release PR once. Tags made with the default
token start no workflow, which is why the release builds run in the same workflow as
release-please; with `RELEASE_PLEASE_TOKEN` that stays true, because `release.yml` has no
tag trigger. The repo setting "Allow GitHub Actions to create and approve pull requests"
(Settings > Actions > General) must be on, or release-please cannot open its PR.

## Landing page

- **Pages.** Settings > Pages > Source: GitHub Actions. `pages.yml` reads the base path
  and URL from `actions/configure-pages`: `https://<owner>.github.io/<repo>` gets
  `NEXT_PUBLIC_BASE_PATH=/<repo>`, a custom domain gets none. `apps/web/next.config.ts`
  must apply it, with the images loader as `next/image` does not prefix `public/` paths
  when images are unoptimized:

  ```ts
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;
  // in nextConfig:
  basePath,
  images: basePath ? { loader: 'custom', loaderFile: './src/lib/image-loader.ts' } : { unoptimized: true },
  ```

  ```ts
  // apps/web/src/lib/image-loader.ts
  export default function imageLoader({ src }: { src: string }): string {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${src}`;
  }
  ```

  Without a base path the build is the same as before. Raw `<img src="/...">` or CSS
  `url(/...)` in the site need the prefix too.
- **Screenshots.** The baselines in `apps/web/e2e/__screenshots__` were made on macOS and
  differ on linux. Until linux ones are committed the screenshot step only warns. To fix:
  1. Actions > Web > Run workflow, tick `update-baselines`.
  2. Download the `web-baselines-linux` artifact, replace `apps/web/e2e/__screenshots__`
     with its content, commit it.
  3. Set the `WEB_VISUAL_BLOCKING` variable to `true`.
  The same run is also the way to refresh them after a redesign.
- **Vercel preview.** Optional. The comment with the URL only posts when `VERCEL_PR_COMMENT`
  is `true`; no secret is ever written to the comment or the log.

## Branch protection

Settings > Branches > `main`, require status checks, and add exactly these:

`check`, `mobile (expo-doctor)`, `mobile (android-bundle)`, `mobile (prebuild)`,
`actionlint`, `title`, `web (build, e2e, axe)`, `apk (debug)`,
`analyze (javascript-typescript)`, `analyze (actions)`.

Add `review` once the Dependency graph is on (see [Owner todo](#owner-todo)). While the
`DEPENDENCY_REVIEW` variable is not `true` the job is skipped and never reports.

Leave `build` (sync binaries), `gitleaks`, `audit (informational)`, `preview`, and the
Pages jobs out: they are path-filtered, informational, or need secrets. A path-filtered
workflow that is skipped never reports, and a required check that never reports blocks
the merge. Squash merges only, so the PR title is the commit.

## Owner todo

- **Dependency review.** The `review` job needs the Dependency graph: Settings > Security
  (Advanced Security) > Dependency graph > Enable. Then set the repository variable
  `DEPENDENCY_REVIEW=true` (Settings > Secrets and variables > Actions > Variables, or
  `gh variable set DEPENDENCY_REVIEW --body true`). Until then the job is skipped.
- **Code scanning.** CodeQL uploads need code scanning to be available (free on public
  repositories). On a private repository without GitHub Code Security the two `analyze`
  jobs fail at the upload step.

## Forks

A pull request from a fork runs everything that needs no secret: `check` (without
Sonar), the Expo checks, `actionlint`, the title check, the web job, the debug APK, the
sync build, CodeQL, dependency review (once enabled), the audit, and gitleaks (reports, never blocks).
It never sees `SONAR_TOKEN`, the keystore, or the Vercel secrets, and its token is
read-only. Releases, Pages and the Vercel preview run only in the main repository.

## Run a job on your machine

```bash
pnpm install --frozen-lockfile
pnpm turbo run check                                     # check
cd apps/mobile
pnpm dlx expo-doctor@1.21.6                              # mobile (expo-doctor)
pnpm exec expo export --platform android                 # mobile (android-bundle)
pnpm exec expo prebuild --platform android --no-install  # mobile (prebuild), then:
(cd android && ./gradlew assembleDebug)                  # apk (debug), needs JDK 17 + Android SDK
cd ../..
pnpm --filter @hevier/web build && pnpm --filter @hevier/web e2e   # web
bun build --compile apps/sync/main.ts --outfile /tmp/hevier-sync \
  && .github/scripts/smoke-sync.sh /tmp/hevier-sync      # sync binary + smoke test
actionlint                                               # actionlint (brew install actionlint)
.github/scripts/check-pr-title.sh "ci(repo): add thing"  # title
```

[`act`](https://github.com/nektos/act) can run the light jobs (`act -j check`); the
Android build and Playwright need the real runner.

## Cost

Public repositories get free minutes on GitHub-hosted runners. Everything uses
`ubuntu-latest`. The slow jobs are the Android builds (about 10 minutes for the debug APK, 20 to 25 for the
release APK + AAB, less with the Gradle cache that `main` fills) and the web job (about 3 minutes). In-progress
runs of the same PR are cancelled when you push again; Release and Pages never are.
Artifacts are kept 7 days (14 for the baselines).

## Troubleshooting

- **`release-please failed: GitHub Actions is not permitted to create or approve pull requests`**:
  turn on that setting under Settings > Actions > General.
- **Release PR has no checks**: see [Release PR and checks](#release-pr-and-checks).
- **A release stays a draft**: the keystore secrets are missing or incomplete, read the
  job summary of the `apk (release)` job.
- **`Get Pages site failed`**: Settings > Pages > Source must be GitHub Actions.
- **Pages site has no images or styles**: the base path is not applied, see
  [Landing page](#landing-page).
- **Screenshots fail on linux**: expected until the linux baselines are committed.
- **`expo prebuild` job fails on `git diff`**: prebuild changed `package.json` or
  `app.json`; run it locally and commit the result.
- **Gradle runs out of memory**: raise `-Xmx` in the Build step of `android.yml`.
- **`gitleaks` asks for a licence**: only organisation-owned repositories need the free
  `GITLEAKS_LICENSE` secret.
- **A macOS Sync binary does not open**: it is not notarised; run
  `xattr -d com.apple.quarantine hevier-sync` once.
