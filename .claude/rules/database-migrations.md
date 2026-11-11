---
paths:
  - "apps/mobile/db/**"
---

# Database migrations

The app's SQLite schema is versioned with `PRAGMA user_version`. The runner is
`apps/mobile/db/migrations/index.ts`. Phones have already run every shipped
migration, and Hevier Sync copies the whole database file, so a bad migration
reaches real history.

## Add a migration

1. Create `apps/mobile/db/migrations/NNN_name.ts` (next number, three digits: `015` today, after `014_lat_pulldown.ts`) that exports `sql` as a string. Look at `006_football.ts` for data changes, `009_warmup_sets.ts` for a table rebuild and `011_body_weights.ts` for a new table.
2. Import it in `index.ts` and add `{ version: NNN, sql: migrationNNN }` to the end of `MIGRATIONS`.
3. Update `index.test.ts`: the expected table list and every `user_version` and table-count assertion (today the version is 14 and the table count is 11, so do not change a number blindly).
4. Add a test that builds an old database (`MIGRATIONS.slice(0, n)`), inserts real-looking rows, runs the migrations and checks the rows survived. The existing tests on `sql.js` show the pattern.
5. A catalogue data update (new openGym data) is generated, not written by hand: `apps/mobile/scripts/update-catalogue.ts` rewrites `packages/catalogue/exercises.json` and writes the matching migration (see `013_opengym_catalogue_update.ts`). Look at the exercises you hide in `apps/mobile/constants/hiddenExercises.ts` first.
6. If the data the migration touches is also loaded by the CSV import (`apps/mobile/scripts/import-csv.ts`), check that path too. `006_football.ts` exports `moveFootballSql` for that reason.

## Rules

- **Never change a migration that has shipped.** Add a new one.
- **Never delete or overwrite user data without a copy.** To change a CHECK or a column type, rebuild the table (create `x_new`, copy every column, drop, rename, recreate indexes) as `009` does.
- **The runner is not atomic yet.** It runs `sql`, then a separate `PRAGMA user_version = N`, with no transaction (`R-05`, audit A-13). A crash in a multi-step migration leaves a half-migrated database that fails on every launch. `013_opengym_catalogue_update.ts` is a long list of statements run the same way. Until `R-05` lands, keep each migration small, put a table rebuild in its own migration, and say in the pull request which step could be left half done. When you do `R-05`, wrap `sql` and the version bump in one transaction and add a test that fails halfway and runs again.
- **Storage keys are forever.** Never rename a key in `apps/mobile/constants/storage.ts`: data saved under the old name is lost.
- **Restore runs migrations.** A restored backup is opened and migrated like any other file. A new migration must work on a database from any older version, and an older app must not be asked to open a newer file (`R-04` checks `user_version`).
- **SQL text lives in `queries.ts`.** Only migration files hold raw schema SQL.
- **Dates:** store ISO strings. Build calendar days with `new Date(y, m, d)`, not 24 hour steps (`apps/mobile/db/dst.test.ts`).
- **Transactions** go through `runInTransaction` in `apps/mobile/db/transaction.ts`. A task inside one must not start another.
