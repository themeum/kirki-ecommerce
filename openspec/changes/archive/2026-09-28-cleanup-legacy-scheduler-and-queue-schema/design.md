## Context

See proposal.md for the motivation. Facts that shape the approach:

- **Migration history.** The migrator (`vendor/libraries/framework/src/Database/Migrations/Migrator.php`) runs each registered class once and records it by class name in a WordPress option (`MigrationRepository`, `OptionKeys::MIGRATIONS`). Editing an already-recorded migration therefore never re-runs it on a database that has already applied it.
- **The old scheduler table has shipped.** `CreateSchedulerJobsTable` and `AlterSchedulerJobsStatusColumnToString` are in the `v1.0.0-alpha.1` through `alpha.4` tags. After both run, the table has `status VARCHAR(50) DEFAULT 'pending'` and indexes `idx_queue_status`, `idx_queue_scheduled_at`, `idx_queue_claim_id`.
- **The queue migrations have not shipped.** `CreateJobsTable` / `CreateFailedJobsTable` are untracked, so no release contains them. The local dev DB has already applied them with auto-generated key names. `SchemaKeyInventoryTest` expects `idx_kirki_ecommerce_jobs_reserved_at_available_at_priority`, `idx_kirki_ecommerce_jobs_reserved_by` and `uq_kirki_ecommerce_failed_jobs_uuid`. The longest is 58 characters, under MySQL's 64-character identifier limit.
- **The Docker base image can't be built from scratch.** `php:7.4-fpm` is bullseye-based. `deb.debian.org/debian-security` lists `libicu67 67.1-7+deb11u1` but serves 404 for it. `archive.debian.org` already carries bullseye `main` but not `bullseye-security`. A throwaway `php:7.4-fpm` container with `sources.list` set to `deb http://archive.debian.org/debian bullseye main` installed every package in the Dockerfile's list, plus `socat`, without error.
- **Nothing depends on the old scheduler code.** `SendEmailJob` has no dispatchers; the only mention is a comment at `OrderManager.php:605`. `RecurrableScheduler` has no implementers.

## Goals / Non-Goals

**Goals:**
- Get the full Unit and Integration suites passing, `npm run typecheck` clean, and phpcs clean on every touched file.
- Make the `php` image buildable with `--no-cache`.

**Non-Goals:**
- Writing a real email job on the framework queue. That is a feature for when email sending is built.
- Changing the old scheduler migrations or their index names.
- Moving the dev image off PHP 7.4 or off bullseye.

## Decisions

**Drop the old table with a new migration, keeping the shipped ones.**
- `DropSchedulerJobsTable::up()` calls `Schema::drop_if_exists('kirki_ecommerce_scheduler_jobs')`.
- `down()` recreates the table in its final shipped shape: `status` as `string(50)` with default `'pending'` (not the original enum), and the same three `idx_queue_*` indexes. A rollback then lands exactly where the alpha installs were.
- The migration is registered last in `config/migrations.php`.
- *Alternative rejected:* deleting the two old migrations and only adding `drop_if_exists`. That saves fresh installs a create-then-drop, but it rewrites shipped history: a rollback past the drop would have nothing to recreate the migrations from. You chose to keep history.

**Edit the queue migrations in place, then rebuild those two tables locally.**
- Pass explicit names to the three `index()` / `unique()` calls.
- Add class, `up()` and `down()` docblocks in the style of `CreateSchedulerJobsTable`.
- Because the migrator won't re-run a recorded class, the local dev DB is fixed once with `./wpcli eval`: `Schema::drop_if_exists()` both tables, `forget_migration()` both class names on the `MigrationRepository`, then `migrator()->run()`. The same `run()` also applies the new `DropSchedulerJobsTable`.
- *Alternative rejected:* a follow-up rename migration. That would be a permanent migration for a problem no release ever had.

**Point apt at the frozen archive in the Dockerfile.**
- A first `RUN` overwrites `/etc/apt/sources.list` with `deb http://archive.debian.org/debian bullseye main`, dropping the `bullseye-security` and `bullseye-updates` suites.
- `socat` goes back into the main `apt-get install` list, so the separate layer added by `auto-publish-scheduled-products` is removed.
- The archive never changes, so this keeps building after Debian removes bullseye from the live mirror.
- *Alternatives rejected:*
  - Dropping only the security suite still depends on the live mirror.
  - A bookworm image with third-party PHP 7.4 builds is a much bigger rework than this fix needs.

**Delete the dead scheduler code, and don't port it.** `SendEmailJob`'s `handle($args)` signature and commented-out body don't match the framework queue contract anyway, so a future email job will be written from scratch. The `OrderManager.php:605` comment keeps its point (no email template or renderer exists yet) and only drops the class name.

**Remove the test product through the plugin's REST API.** `DELETE kirki/ecommerce/v1/products/33` runs as the admin via an internal `rest_do_request`, exactly as the admin UI would, so related rows are cleaned up by the normal delete path rather than by raw SQL.

## Risks / Trade-offs

- **[Risk]** The dev image no longer gets bullseye security updates. → Dev-only image, and bullseye is out of support anyway. Production is whatever PHP the merchant's host runs.
- **[Risk]** Rebuilding the dev queue tables discards any queued jobs. → The only job ever queued locally was consumed in the end-to-end run. Any leftover rows are dev test data.
- **[Trade-off]** Fresh installs create the old scheduler table and then drop it in the same migration run. The cost is a few milliseconds on activation, in exchange for never rewriting shipped history.
- **[Risk]** `SchemaKeyInventoryTest` may also check the dropped table's `idx_queue_*` names or expect the table in its snapshot. → Its legacy-vs-fresh convergence test runs the full migration list both ways, so the table is gone on both sides. The task list reruns the whole Integration suite to confirm.

## Migration Plan

1. Code, migration and Dockerfile changes land together.
2. Local dev: run the one-off `./wpcli eval` rebuild described above, then `docker compose build --no-cache php && docker compose up -d php`.
3. Installed sites pick up `DropSchedulerJobsTable` through the normal migration run on update. To roll back, `down()` recreates the table.
