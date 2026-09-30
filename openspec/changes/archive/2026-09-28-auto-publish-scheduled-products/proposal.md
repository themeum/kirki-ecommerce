## Why

`add-scheduled-product-status` stored `scheduled_at` but explicitly deferred the auto-publish, so a scheduled product never goes live on its own. The `themeum/framework` update ships a database-backed queue (`Framework\Queue`, with delayed dispatch, retries, and a WP-Cron sweep), and a first-pass `PublishScheduledProductJob` is already wired into `ProductService::update()`, but it is incomplete: `create()` never dispatches, `update()` dispatches on every save of a scheduled product (and before the row is written), the job declares `$retries` (the framework reads `$tries`), and the job publishes unconditionally even if the product was rescheduled, drafted, trashed, or deleted after dispatch.

## What Changes

- `ProductService::create()` dispatches `PublishScheduledProductJob` delayed until `scheduled_at` when a product is created with `status: scheduled`.
- `ProductService::update()` dispatches the job only when the save *changes the schedule* — status moves into `scheduled`, or `scheduled_at` changes while scheduled — and only after the product row has been written. Saving an already-scheduled product without touching its schedule dispatches nothing.
- `PublishScheduledProductJob::handle()` becomes idempotent and self-validating: it publishes only if the product still exists, is still `scheduled`, and its `scheduled_at` has arrived. Anything else is a silent no-op, which is how stale jobs from a reschedule/unschedule are neutralised (the framework queue has no per-job cancellation).
- Publishing sets `status: published`, `published_at` to the current UTC time, and `scheduled_at: null` — the same state a manual publish produces.
- Job fixes: `$retries` → `$tries`, remove the debug `Log::info('Scheduler run')`, add a `$backoff`.
- The job runs on its own named queue, `scheduled-products`, set in its constructor via `on_queue()`, so its rows can be told apart from other jobs and cleared or sized on their own.
- Docker dev setup: a loopback forwarder in the `php` container, so native traffic-based WP-Cron and the queue's `admin-ajax.php` worker loopback actually fire locally. Today `http://localhost:20100` is unreachable from inside that container, so both fail silently.
- Integration tests covering dispatch on create/update (via `Queue::fake()`) and the job's publish/no-op paths.

## Capabilities

### New Capabilities
- `scheduled-product-publishing`: automatic transition of a `scheduled` product to `published` when its `scheduled_at` arrives, including when a publish is queued and how a changed or withdrawn schedule is handled.

### Modified Capabilities
<!-- product-status-scheduling lives only in the unarchived add-scheduled-product-status change, not in openspec/specs/, so its requirements are not modified here; this change adds a sibling capability. -->

## Impact

- `app/Services/ProductService.php` — `create()` / `update()` dispatch logic.
- `app/Jobs/PublishScheduledProductJob.php` — guard conditions, `$tries`/`$backoff`, logging removed.
- `tests/Integration/` — new tests for dispatch and job behaviour.
- Runtime: relies on `Framework\Queue\QueueServiceProvider` (already added to `bootstrap/providers.php`) and the `CreateJobsTable`/`CreateFailedJobsTable` migrations (already registered). Publish timing depends on WP-Cron's every-minute sweep, so a product goes live within roughly a minute of `scheduled_at` on a site with traffic.
- `docker/php/Dockerfile`, `docker/php/docker-entrypoint.sh`, `README.md`: the dev-only loopback forwarder and a troubleshooting note. No production impact; on real hosting the site URL already resolves from PHP.
- No API shape or frontend change.
