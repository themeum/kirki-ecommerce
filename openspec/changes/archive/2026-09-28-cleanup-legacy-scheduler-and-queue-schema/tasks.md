## 1. Remove dead scheduler code

- [x] 1.1 Delete `app/Jobs/SendEmailJob.php` and `app/Contracts/RecurrableScheduler.php`, then confirm with `grep -rn` that nothing in `app/`, `bootstrap/`, `config/`, `routes/`, `database/` or `tests/` references either class, or `App\Scheduler`
- [x] 1.2 Remove `use Kirki\Ecommerce\App\Scheduler\Scheduler;` from `app/KirkiEcommerce.php`
- [x] 1.3 Reword the comment at `app/Managers/OrderManager.php:605` so it no longer names `SendEmailJob`, keeping its point that no email template or renderer exists yet
- [x] 1.4 Verify: `php -l` on the touched PHP files; phpcs (wporg and `RequiredDocblock`) clean on them; `bash kirki-test unit` passes; `npm run typecheck && npm test` (from `resources/app/`) still passes. Result: `php -l` and phpcs clean; Unit 345/345; npm tests 1322/1322; typecheck shows only the `styles` error that 3.1 fixes. (`KirkiEcommerce.php`'s `Utils` / `migrator` imports are unused too, but that comes from the earlier `handle_activation()` edit, not this change, so they're left alone.)

## 2. Migrations

- [x] 2.1 In `database/migrations/CreateJobsTable.php`, name the indexes `idx_kirki_ecommerce_jobs_reserved_at_available_at_priority` and `idx_kirki_ecommerce_jobs_reserved_by`. In `CreateFailedJobsTable.php`, name the unique key `uq_kirki_ecommerce_failed_jobs_uuid`. Add class, `up()` and `down()` docblocks to both, in the style of `CreateSchedulerJobsTable.php`
- [x] 2.2 Add `database/migrations/DropSchedulerJobsTable.php`, with docblocks:
  - `up()` calls `Schema::drop_if_exists('kirki_ecommerce_scheduler_jobs')`
  - `down()` recreates the table in its final shipped shape: `CreateSchedulerJobsTable`'s columns with `status` as `string(50)`, default `'pending'` and the same comment as `AlterSchedulerJobsStatusColumnToString`, plus the `idx_queue_status` / `idx_queue_scheduled_at` / `idx_queue_claim_id` indexes
  - Register it last in `config/migrations.php`
- [x] 2.3 Rebuild the local dev DB's queue tables with `./wpcli eval`: `Schema::drop_if_exists()` both `kirki_ecommerce_jobs` and `kirki_ecommerce_failed_jobs`, `forget_migration()` `CreateJobsTable` and `CreateFailedJobsTable` on the `MigrationRepository`, then `migrator()->run()`. Confirm with `SHOW INDEX` that the three keys have the new names, and with `SHOW TABLES` that `wp_kirki_ecommerce_scheduler_jobs` is gone. Result: both queue tables were empty beforehand. After the rebuild, all three migrations were recorded in batch 2 with the new key names, and the scheduler table is gone. `DropSchedulerJobsTable::down()` → `up()` was also round-tripped on the dev DB: `down()` recreated `status varchar(50) DEFAULT 'pending'` with the three `idx_queue_*` indexes, and `up()` dropped it again
- [x] 2.4 Verify: phpcs (wporg and `RequiredDocblock`) clean on the three migrations and `config/migrations.php`; the full `bash kirki-test integration` suite passes, including all 3 previously failing `SchemaKeyInventoryTest` tests; `npm run typecheck && npm test` (from `resources/app/`) still passes. Result: phpcs clean on all four files; Integration 537/537 (previously 534/537), including the 3 `SchemaKeyInventoryTest` tests; npm checks are covered by 3.3, since this group touched no frontend code

## 3. Small lint fixes

- [x] 3.1 Remove the unused `styles` block from `resources/app/features/settings/email/pages/edit-notification-template.tsx`, and drop `defineStyles` from its `@/theme/mixins` import if nothing else uses it
- [x] 3.2 Reorder `VariantResource::get_product_featured_image()`'s docblock to summary, `@since`, `@param`, `@return`, and remove the trailing whitespace on its blank docblock lines
- [x] 3.3 Verify: `npm run typecheck` reports no errors; `npm run lint` (from `resources/app/`) is clean on the touched file; phpcs `RequiredDocblock` is clean on `VariantResource.php`; `npm run typecheck && npm test` (from `resources/app/`) passes. Result: typecheck has 0 errors; RequiredDocblock and wporg are clean on `VariantResource.php`; npm tests 1322/1322. eslint then flagged an import-sort error in the same file that was already there (`lucide-react` imported below the `@/` aliases). It was fixed by moving that import to the top, as the React standards require, and eslint is now clean

## 4. Docker image

- [x] 4.1 In `docker/php/Dockerfile`, add a first `RUN` that overwrites `/etc/apt/sources.list` with `deb http://archive.debian.org/debian bullseye main`, with a one-line comment explaining why. Fold `socat` back into the main `apt-get install` list and remove the separate `socat` layer
- [x] 4.2 Run `docker compose build --no-cache php && docker compose up -d php`. The build must succeed from scratch, and `docker compose exec php curl -s -o /dev/null -w '%{http_code}' http://localhost:20100/wp-cron.php` must still return `200`. Result: `--no-cache` build succeeded (`socat 1.7.4.1-3` and `xdebug-3.1.6` installed); the container's `sources.list` is the archive line; `wp-cron.php` returned `200`
- [x] 4.3 Verify: `bash kirki-test integration --filter=ScheduledProductPublishingTest` passes on the rebuilt container; `npm run typecheck && npm test` (from `resources/app/`) still passes. Result: 13/13 (274 assertions); typecheck 0 errors; npm tests 1322/1322

## 5. Dev data cleanup

- [x] 5.1 Delete test product 33 ("Loopback E2E …") with `./wpcli eval`, as the admin, using `rest_do_request` on `DELETE kirki/ecommerce/v1/products/33`, after confirming by `GET` that id 33 is still the "Loopback E2E" product. Confirm a follow-up `GET` returns 404. **Premise changed:** the confirming `GET` already returned 404. No `Loopback E2E%` product exists and no variants reference id 33, so it had already been deleted outside this session and there was nothing left to delete
- [x] 5.2 Verify: `npm run typecheck && npm test` (from `resources/app/`) still passes. Result: no code changed in this group; the last run (4.3) had typecheck 0 errors and 1322/1322 tests

## 6. Final check

- [x] 6.1 Run `bash kirki-test unit`, `bash kirki-test integration`, `composer phpcs:docblocks` and `npm run typecheck && npm test` (from `resources/app/`). Record anything still failing here rather than fixing it outside this change's scope. Results:
  - Unit 345/345; Integration 537/537; `RequiredDocblock` clean across `app/` and `database/`; typecheck 0 errors; npm tests 1322/1322. The php image builds with `--no-cache`.
  - **Changed after 2.2 by the user:** `DropSchedulerJobsTable::down()` was emptied (`// no rollback`), so rolling it back no longer recreates the table. The round-trip result recorded under 2.3 reflects the earlier `down()`. Still out of step with this edit, left for the user to decide: the method's docblock (still "Recreate the … table"), the now-unused `Structure` import, and design.md's "Drop the old table with a new migration" decision.
