## 1. Job: idempotent, self-validating publish

- [x] 1.1 In `app/Jobs/PublishScheduledProductJob.php`, rename `$retries` to `$tries` (value `3`) and add `protected $backoff = 60;`, each with a docblock
- [x] 1.2 Rewrite `handle()` to return without error when the product does not exist, its `status` is not `ProductStatus::SCHEDULED`, or its `scheduled_at` is null or later than `Date::now()` (UTC); otherwise set `status = published`, `published_at = Date::now()->set_timezone('UTC')`, `scheduled_at = null` and `save()`
- [x] 1.3 Remove the debug `Log::info('Scheduler run')` and the now-unused `Log` / `Exception` imports; complete the class/method docblocks to the repo's `@since` standard
- [x] 1.4 Verify: `composer phpcs:wporg -- app/Jobs/PublishScheduledProductJob.php` is clean, and `npm run typecheck && npm test` (from `resources/app/`) still passes — phpcs (wporg + RequiredDocblock) clean on the file; tests 1322/1322 pass; typecheck reports one pre-existing, unrelated error (`features/settings/email/pages/edit-notification-template.tsx:88` unused `styles`, not touched by this change)

## 2. ProductService: dispatch on create and on schedule change

- [x] 2.1 In `ProductService::create()`, after `Product::create($data_array)`, dispatch `PublishScheduledProductJob::dispatch($product->id)->delay($data_array['scheduled_at'])` when `$data->status === ProductStatus::SCHEDULED`, reusing the already-UTC-normalised `scheduled_at` (no second `Date::parse`)
- [x] 2.2 In `ProductService::update()`, remove the dispatch from the `scheduled_at` normalisation branch. Before writing, capture whether the schedule changed: the new status is `scheduled` and either the stored `$product->status` was not `scheduled` or the stored `scheduled_at` timestamp differs from the new one. After `$product->update($data_array)` succeeds, dispatch with `$product->id` only when the schedule changed.
- [x] 2.3 Normalise `create()`'s `else if` to `elseif` so it matches `update()`, and update both methods' docblocks to mention queuing the scheduled publish
- [x] 2.4 Verify: `composer phpcs:wporg -- app/Services/ProductService.php` is clean, and `npm run typecheck && npm test` (from `resources/app/`) still passes — phpcs (wporg + RequiredDocblock) clean; tests 1322/1322; typecheck only shows the same pre-existing unrelated `edit-notification-template.tsx` error. Also normalised `update()`'s pre-existing `else if` → `elseif` (already in the working tree before this change)

## 3. Integration tests

- [x] 3.1 Add `tests/Integration/ScheduledProductPublishingTest.php` (extending `RestTestCase`, using `CreatesTestProducts`) with dispatch tests under `Queue::fake()`:
  - creating a scheduled product pushes one job for its ID
  - creating a draft or published product pushes none
  - updating draft → scheduled pushes one
  - re-saving a scheduled product with the same `scheduled_at` pushes none
  - changing `scheduled_at` pushes one
  - scheduled → draft pushes none
- [x] 3.2 Add job behaviour tests that seed product rows directly and call `(new PublishScheduledProductJob($id))->handle()`:
  - scheduled with a past `scheduled_at` → published, `published_at` set, `scheduled_at` null
  - scheduled with a future `scheduled_at` → unchanged
  - draft / trashed / already-published → unchanged, including an existing `published_at`
  - missing product ID → no exception
- [x] 3.3 Add a rollback test: a scheduled create whose variant payload fails inside `CreateProductAction` leaves no row in the jobs table (real queue, not faked) — the failure is forced with an anonymous `VariantService` whose `create()` returns null (same technique as `VariantBulkUpdateApiTest`), since request validation would reject a bad variant before the action runs. The test also runs a successful create afterwards and asserts it adds exactly one job row, so the rollback assertion can't pass vacuously
- [x] 3.4 Verify: `composer test:integration` passes (or `composer test:docker:integration` if the local WP test env is not set up), `composer phpcs:wporg` is clean on the touched files, and `npm run typecheck && npm test` (from `resources/app/`) still passes — `ScheduledProductPublishingTest` 13/13 via Docker (host WP test lib not installed). Full Integration suite: 534/537; the 3 failures (`SchemaKeyInventoryTest`: naming scheme, legacy/fresh convergence, idempotent renaming) are all caused by the auto-generated key names in the untracked `CreateJobsTable`/`CreateFailedJobsTable` migrations (`kirki_ecommerce_jobs_reserved_by_index` etc. instead of `idx_…`/`uq_…`), which this change doesn't touch. phpcs clean; npm tests 1322/1322; typecheck has only the pre-existing `edit-notification-template.tsx` error

## 4. Final check

- [x] 4.1 Run `composer test` and `composer phpcs:docblocks` for a full pass, plus `npm run typecheck && npm test` (from `resources/app/`); record any pre-existing unrelated failures in this file rather than fixing them here — run via Docker (`kirki-test unit` / `kirki-test integration`):
  - Unit: 345/345.
  - Integration: 534/537. The 3 `SchemaKeyInventoryTest` failures come from the untracked queue migrations' auto-generated key names (see 3.4).
  - `phpcs:docblocks`: every file this change touched is clean. It reports errors only in files this change doesn't touch: `database/migrations/CreateJobsTable.php` and `CreateFailedJobsTable.php` (no class/`up`/`down` docblocks), and `app/Resources/Variant/VariantResource.php:119` (`get_product_featured_image` tag order).
  - npm: tests 1322/1322. Typecheck has only the unrelated `edit-notification-template.tsx:88` error.
- [ ] 4.2 **Pending: needs your manual check. Do it after group 6: before the loopback forwarder, WP-Cron never fires in Docker, so this check can't pass locally.** (left to the user, per CLAUDE.md's no-browser rule): schedule a product ~2 minutes ahead in wp-admin, confirm it flips to Published within about a minute of the time, then reschedule another product later and confirm it does not publish at the original time

## 5. Named queue

- [x] 5.1 In `app/Jobs/PublishScheduledProductJob.php`, add a `QUEUE = 'scheduled-products'` class constant and call `$this->on_queue(static::QUEUE)` in `__construct()`. Update the constructor docblock to mention the queue. Leave both `ProductService` dispatch sites unchanged.
- [x] 5.2 In `tests/Integration/ScheduledProductPublishingTest.php`, assert `get_queue() === PublishScheduledProductJob::QUEUE` on the job pushed by `test_creating_a_scheduled_product_queues_its_publish`, and have the rollback test count only rows on that queue.
- [x] 5.3 Verify: `bash kirki-test integration --filter=ScheduledProductPublishingTest` passes, phpcs (wporg and `RequiredDocblock`) is clean on the job, and `npm run typecheck && npm test` (from `resources/app/`) still passes. Result: 13/13 (274 assertions); phpcs clean; npm tests 1322/1322; typecheck shows only the pre-existing `edit-notification-template.tsx:88` error.

## 6. Docker: make native WP-Cron and the queue loopback fire

- [x] 6.1 Add `socat` to the `apt-get install` list in `docker/php/Dockerfile`.
- [x] 6.2 In `docker/php/docker-entrypoint.sh`, before the final `exec`:
  - Parse the host and port from `WP_URL`. The default is `http://localhost:20100`; with no explicit port, use 80.
  - Only when the host is `localhost` or `127.0.0.1`, start `socat TCP-LISTEN:<port>,bind=127.0.0.1,fork,reuseaddr TCP:nginx:80` in the background.
  - Add a short comment explaining why the forwarder exists.
- [x] 6.3 Run `docker compose up -d --build php`, then confirm `docker compose exec php curl -s -o /dev/null -w '%{http_code}' http://localhost:20100/wp-cron.php` returns `200`. It returned `000` before this change. Result: after the rebuild, `wp-cron.php` returns `200` from inside `php`, and `admin-ajax.php` is reachable (`400` for an unknown action, which is WordPress's normal reply).
- [x] 6.4 End-to-end check, with no browser and no manual `wp cron` / `queue:work` run:
  - Create a product through the REST API with `status: scheduled` and `scheduled_at` about 2 minutes ahead, and confirm a `scheduled-products` row exists in `kirki_ecommerce_jobs`.
  - After `scheduled_at` passes, send plain HTTP traffic from the host (`curl http://localhost:20100/` a few times, about a minute apart).
  - Confirm the product becomes `published` with `scheduled_at` null, and its job row is gone.
  - Result: product 33 was created at 14:52:20 UTC through an internal `rest_do_request` as the admin (`201`, status `scheduled`, due 14:54:20), with one `scheduled-products` job row. Only `curl http://localhost:20100/` from the host was sent, every ~20s. The product stayed `scheduled` until the due time, then at 14:54:59 became `published` with `scheduled_at` NULL and `published_at` 14:54:59; the job row was deleted and `failed_jobs` stayed empty. Product state was read directly from MariaDB, not through WP-CLI, so nothing but the web traffic could have started cron.
- [x] 6.5 Add a row to the README's Troubleshooting table: "Scheduled jobs / WP-Cron never run locally" → rebuild the php image with `docker compose up -d --build php`, which starts the loopback forwarder.
- [x] 6.6 Verify: `npm run typecheck && npm test` (from `resources/app/`) still passes, then tick 4.2 if 6.4 passed. Result: npm tests 1322/1322; typecheck shows only the pre-existing `edit-notification-template.tsx:88` error. **4.2 left unticked:** 6.4 covered the publish path end-to-end, but 4.2 is a wp-admin UI check, including the reschedule case, that CLAUDE.md leaves to the user.
