---
paths:
  - "apps/sync/**"
  - "packages/shared/**"
  - "apps/mobile/lib/sync/**"
  - "apps/mobile/db/sync/**"
  - "apps/mobile/app/sync*.tsx"
  - "apps/mobile/app/pair.tsx"
---

# Sync, backup and restore

Hevier Sync is a PC program (`apps/sync`) that keeps one copy of the phone's data.
The phone side is `apps/mobile/lib/sync/` and `apps/mobile/db/sync/`. Both import
the protocol from `packages/shared` (`sync-protocol.ts`, `sync-types.ts`).

This is the code that can lose or leak a user's whole history. Read the audit
entries first: A-01, A-10, A-11, A-12, A-16, A-17 in
`docs/research/audit-summary.md`. They are roadmap items R-03, R-04 and R-06.

## How it works now

- The phone makes a snapshot with `VACUUM INTO` (`db/sync/sync.ts`), sends `begin`, uploads files, then `commit`. The PC writes into `incoming/` and swaps it for `current/` only when complete (`apps/sync/store.ts`).
- Every request carries the key from the PC's `key.txt` (header `KEY_HEADER`). It travels in the pairing QR code.
- The phone's id (`deviceId`) is kept outside the database (`apps/mobile/lib/sync/deviceId.ts`), so a database copied onto another device does not pass for the phone. A restore adopts the copy's id.
- Transport is plain HTTP on the LAN (`R-35`).
- Restore downloads the PC's files, then `replaceAll` in `apps/mobile/lib/sync/expoIO.ts` swaps them in.

## Rules

- **One protocol, two sides.** A change in `packages/shared` must be handled by the phone and the PC in the same pull request. Old phones must not break a new PC program, or the PR must say they do.
- **Keep path validation strict.** `isValidPath` allows only `hevier.db` and files directly inside `media/` or `profile/`. Do not loosen it. Path traversal is not possible today; keep it so. Reject `.` and `..` segments.
- **The key is a secret.** Never log it, put it in an error message, a test name, a screenshot, an issue or a doc. Use `<32 hex>` in examples. Compare it with `crypto.timingSafeEqual` in new code.
- **Treat input as hostile.** A `hevier://pair` link, a request body, a header, a file name and a manifest all come from outside. Validate types and sizes before use. A malformed request is a 400, not a 500.
- **Never delete before the replacement is verified.** The current restore deletes the live database and media before it copies the staged files in. Do not copy that pattern and do not make it worse. New code stages next to the target, verifies (`PRAGMA integrity_check`, `user_version` not above the latest migration), swaps by rename, and keeps the old data until the app has reloaded fine.
- **Sync and restore must not overlap.** `expoIO.cleanup()` deletes the staged restore files. Anything that runs `cleanup` while a restore is in progress breaks the restore. Share one busy flag and keep separate cache folders (`R-04`).
- **Keep the "wiped phone" guard.** The PC keeps the newest data. A copy with fewer workouts, with an older last workout, or from another phone, is not replaced without the user saying so (`checkAccept`). You may improve how it measures (`R-06`), not remove it.
- **No new destinations.** Sync talks to the paired PC only. No telemetry, no cloud, no third-party host.
- **Use timeouts.** Every request needs an inactivity timeout, and a sync that fails must reset its running flag in a `finally`.
- **Tests use the real thing.** `apps/mobile/lib/sync/client.test.ts` starts the real server on a temp folder and mocks only `AsyncStorage`. Do the same. A restore or store test must fail on the unfixed code (kill the process halfway, leave the staged file missing, end a sync during a restore).
- **Docs:** if behaviour or safety changes, update `apps/sync/README.md` ("Safety") in the same pull request.
