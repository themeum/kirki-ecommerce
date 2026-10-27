## Context

See proposal.md — Why. The relevant parts of the new `Framework\Queue` (vendored at `vendor/libraries/framework/src/Queue/`):

- `Job::dispatch(...)` returns a `PendingDispatch` that inserts the row **in its destructor**, so an unassigned `Job::dispatch($id)->delay($at)` statement is written immediately at the end of that statement. `delay()` accepts a `DateTimeInterface`; the row's `available_at` is `max(now, $at)` in epoch seconds.
- Rows live in `{prefix}kirki_ecommerce_jobs`, in the same database as the products table, so an insert made inside `DB::begin_transaction()` rolls back with it.
- There is **no API to find or cancel a queued job** by class or argument — only `DatabaseQueue::delete(int $id)` (by row id) and `clear(?queue)`.
- Delayed jobs are picked up by a WP-Cron sweep every minute, which fires a signed loopback worker. Retries come from `$tries` / `$backoff` on the job class (read via `property_exists`); `$retries` is not a recognised property.
- `Queue::fake()` (`Framework\Supports\Facades\Queue`) records pushes and offers `assert_pushed` / `assert_pushed_times` / `assert_not_pushed`.

**Docker dev setup.** Both automatic triggers make an HTTP request from PHP to the site's own URL:
- WP-Cron's `spawn_cron()` posts to `site_url('wp-cron.php')`.
- The queue's `Spawner::spawn()` posts to `admin_url('admin-ajax.php')`.

In `docker-compose.yml`, `WP_URL` is `http://localhost:20100`, a port published on the host by the `nginx` container. Inside the `php` container nothing listens on it. This was verified from inside `php`: `curl http://localhost:20100/wp-cron.php` fails with status `000`, while `curl http://nginx/wp-cron.php` returns `200`. So in Docker, browser traffic never actually starts WP-Cron, and a delayed job is never picked up.

`ProductService::create()` / `update()` are always called inside the transaction opened by `CreateProductAction` / `UpdateProductAction`. `update()` loads the current `$product` before writing, so the pre-save `status` and `scheduled_at` are available for comparison. `scheduled_at` is cast `'datetime'` on `Product`.

## Goals / Non-Goals

**Goals:**
- Correct under reschedule, unschedule, trash, delete, and repeated saves, without needing to cancel queued rows.
- Keep the dispatch decision in `ProductService`, beside the existing `scheduled_at` normalisation.

**Non-Goals:**
- A catch-up sweep that publishes every overdue `scheduled` product regardless of queued jobs. It would duplicate what the per-product job does; it is only worth adding if lost jobs turn out to be a real problem.
- Firing an extra "product published" hook or event from the job. Manual publishing doesn't fire one today, so the job doesn't either.
- Clearing `scheduled_at` in `bulk_trash` / `trash_all`. That invariant belongs to `product-status-scheduling` and is a separate fix; the job's status guard already makes a trashed product safe.
- Removing the leftover `app/Scheduler` references (`app/Jobs/SendEmailJob.php`, the `KirkiEcommerce.php` import, the `CreateSchedulerJobsTable` migrations). They are outside this change's scope.

## Decisions

**Stale jobs are neutralised by guards in `handle()`, not cancelled.** When the job runs, it re-reads the product and publishes only if all three hold: the product exists, `status === scheduled`, and `scheduled_at <= now`. Otherwise it returns without error.
- A job left over from a reschedule to a *later* time finds `scheduled_at` still in the future and does nothing. The job dispatched for the new time handles the publish.
- A job left over from a reschedule to an *earlier* time finds the product already `published` and does nothing.
- If the product was unscheduled, trashed or deleted, the status or existence check fails and the job does nothing.
- *Alternative rejected:* store the queued row id on the product (a new `scheduled_job_id` column) and `DatabaseQueue::delete()` it on reschedule. This adds a column and a migration, reaches past the public dispatch API into the storage class, and still needs the guards: a job the worker has already reserved can't be deleted, and a row can be lost when the queue is cleared or flushed.

**`scheduled_at <= now` compares at whole-second precision.** `scheduled_at` arrives as ATOM (second precision) and is stored as a MySQL `timestamp`. `available_at` is `now + (scheduled_at - now)` in integer seconds, so the job is never claimed before `scheduled_at`. No tolerance window is needed.

**Dispatch only when the schedule changes.** In `update()`, dispatch when the resolved status is `scheduled` **and** either the stored status was not `scheduled` or the stored `scheduled_at` differs from the new one (compared as UTC timestamps). In `create()`, dispatch whenever the status is `scheduled`. This keeps routine edits of a scheduled product from piling up redundant rows. The guards would make those rows harmless anyway, so this is about keeping the table clean, not about correctness.

**Dispatch after the row is written.** Move the dispatch below `$product->update($data_array)` / `Product::create($data_array)` and pass `$product->id`, not `$data_array['id']`. Because `ProductService` runs inside the action's transaction and the jobs table is in the same database, a rollback later in the action (e.g. a variant fails) also drops the job row. That covers the spec's "failed save queues no publish" requirement without an after-commit hook.

**Compute the UTC `scheduled_at` once.** `$data_array['scheduled_at']` is already normalised with `Date::parse(...)->set_timezone('UTC')`. Pass that same object to `delay()` instead of parsing the string a second time.

**Publish via the model with `published_at = now()`.** Set `status`, `published_at` (current UTC time) and `scheduled_at = null`, then `save()`, which matches what `ProductService::update()` does for a manual publish. *Alternative considered:* `published_at = scheduled_at` (the intended go-live time). Rejected, because `published_at` everywhere else means "when it actually became visible", and WP-Cron can lag by a minute or more.

**Retry policy: `$tries = 3`, `$backoff = 60`.** The only realistic failures are transient DB errors. The guards make a retry safe.

**Dispatch on a named queue, `scheduled-products`, set in the job's constructor.** A `QUEUE = 'scheduled-products'` class constant, with `$this->on_queue(static::QUEUE)` called in `__construct()`. This keeps both dispatch sites (`create()` / `update()`) on the same queue without repeating `->on_queue()` at each one, and matches the `Queueable` trait's stated intent that a job sets its own defaults in its constructor. It can't be a property default: the trait already declares `protected $queue`, and redeclaring it with a different default is a fatal error on PHP 7.4. No worker configuration is needed, because the web worker (`Spawner::handle_request()` → `Worker::run()` with no `queues` option) and the sweep (`DatabaseQueue::has_due(null)`) both cover every queue. The constant lets tests and `queue:clear scheduled-products` reference the name without repeating the string.
- *Alternative rejected:* a human-readable job name. `Payload::encode()` hardcodes `display_name` to the class name, and the framework is vendored and can't be edited here, so it would need an upstream `themeum/framework` change first.

**Docker: a `socat` loopback forwarder in the `php` container.**
- The Dockerfile installs `socat`.
- `docker-entrypoint.sh` reads the host and port from `WP_URL`. When the host is `localhost` or `127.0.0.1`, it starts `socat TCP-LISTEN:<port>,bind=127.0.0.1,fork,reuseaddr TCP:nginx:80 &` before its final `exec`.
- The request keeps its `Host: localhost:20100` header, so nginx's `server_name localhost` matches and WordPress sees its own URL. The traffic-based chain then works exactly as on real hosting: page view → `spawn_cron()` → `wp-cron.php` → queue sweep → `admin-ajax.php` worker → job.
- Binding to `127.0.0.1` keeps the forwarder off the Docker network.
- It also fixes any other request WordPress makes to its own URL, such as Site Health's loopback test.
- *Alternatives rejected:*
  - `DISABLE_WP_CRON` plus a cron container running `wp cron event run --due-now`. It bypasses the traffic-based path this change needs to exercise, and the sweep it runs would still make a loopback request that fails.
  - Adding `listen 20100` to nginx and sharing nginx's network namespace with `php`. It restructures the stack's networking for one port.
  - A dev-only mu-plugin that rewrites the URLs WordPress requests (`cron_request`, HTTP API filters). It only patches the requests we know about and hides the real networking gap.

**Tests at the integration layer.** `tests/Integration/` already has `RestTestCase` + `CreatesTestProducts`:
- Dispatch rules: `Queue::fake()` plus product create/update API calls, asserting `assert_pushed` / `assert_pushed_times` / `assert_not_pushed`.
- Job behaviour: seed a product row directly in the needed state (e.g. `scheduled` with a past `scheduled_at`, which the request validation would reject), then call `(new PublishScheduledProductJob($id))->handle()` and assert the resulting row.

## Risks / Trade-offs

- **[Risk]** WP-Cron only runs when the site gets traffic, so a low-traffic site can publish late. → This is inherent to the framework's sweep. It's documented in proposal.md's Impact section, and sites can run a real cron against `wp-cron.php`.
- **[Risk]** A queued row is lost (queue flushed, job moved to `failed_jobs` after 3 tries), leaving the product `scheduled` forever. → The merchant re-saving the product dispatches a fresh job, and `queue:retry` recovers failed rows. If this happens in practice, add the catch-up sweep from Non-Goals.
- **[Risk]** `Job::dispatch()` throws `QueueException` when the queue provider isn't registered or the jobs table is missing, which fails the product save. → Both are part of this plugin's bootstrap and migrations. Failing loudly is better than silently storing a schedule that will never fire.
- **[Risk]** The forwarder only runs after the php image is rebuilt, so an old container keeps failing silently. → The migration plan and the README troubleshooting row both say `docker compose up -d --build php`. Task 6.3 checks the loopback returns `200`.
- **[Risk]** If `socat` dies, nothing restarts it, and loopbacks fail again until `docker compose restart php`. → Acceptable for a dev-only helper. It is a plain background process of the container, not a supervised service.
- **[Trade-off]** A custom `WP_URL` host other than `localhost` / `127.0.0.1` gets no forwarder. Such a host is expected to resolve through its own DNS or hosts setup.
- **[Trade-off]** Rescheduling leaves orphaned rows until their time passes; each then runs as a no-op and is deleted. That's acceptable at product-scheduling volumes.

## Migration Plan

1. Deploy with the already-registered `CreateJobsTable` / `CreateFailedJobsTable` migrations and `QueueServiceProvider`.
2. No backfill: `add-scheduled-product-status` is unarchived and unreleased, so no production product can be `scheduled` without a job. On a dev site with leftover scheduled products, re-save them to queue a job.
3. Docker dev: `docker compose up -d --build php` once to pick up `socat` and the new entrypoint.
4. Rollback: revert the `ProductService` dispatch calls. Any queued rows then run as harmless publishes or no-ops, or can be removed with `queue:clear scheduled-products`. To drop the forwarder, revert the two `docker/php/` files and rebuild.
