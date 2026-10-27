## Why

Replacing the in-house `app/Scheduler` with the framework queue (see the archived `auto-publish-scheduled-products` change) left a few problems behind:
- `app/Jobs/SendEmailJob.php` still uses the deleted `App\Scheduler\Concerns\Queueable`, which is a fatal error the first time it loads.
- The shipped `kirki_ecommerce_scheduler_jobs` table stays on existing installs forever.
- The new queue migrations break the repo's key-naming scheme, failing 3 `SchemaKeyInventoryTest` tests.
- The `php` dev image can no longer be built from scratch, because Debian bullseye's security suite now returns 404 for `libicu67`.

Two small lint errors (an unused `styles` variable that fails `npm run typecheck`, and a docblock tag-order error) also need fixing. Cleaning all of this up now makes the queue work shippable.

## What Changes

- Remove dead code left by the old scheduler:
  - delete `app/Jobs/SendEmailJob.php` (an unused placeholder) and `app/Contracts/RecurrableScheduler.php` (no users)
  - drop the stale `use Kirki\Ecommerce\App\Scheduler\Scheduler;` in `app/KirkiEcommerce.php`
  - reword the comment in `app/Managers/OrderManager.php` that mentions `SendEmailJob`
- Add a `DropSchedulerJobsTable` migration that drops `kirki_ecommerce_scheduler_jobs` if it exists. The shipped `CreateSchedulerJobsTable` / `AlterSchedulerJobsStatusColumnToString` migrations stay untouched, so migration history is never rewritten.
- Give `CreateJobsTable` / `CreateFailedJobsTable` explicit `idx_` / `uq_` key names and the required docblocks, editing them in place because neither has shipped. Recreate the two tables in the local dev database so it matches.
- `docker/php/Dockerfile`: install packages from `archive.debian.org` bullseye main, and fold `socat` back into the main package list.
- Remove the unused `styles` block (and its now-unused import) from `edit-notification-template.tsx`.
- Fix the docblock tag order in `VariantResource::get_product_featured_image()`.
- Delete the dev-only "Loopback E2E …" test product (id 33) through the plugin's REST endpoints.

## Capabilities

### New Capabilities
<!-- None: no behavior spec changes. The change sets skip_specs: true. -->

### Modified Capabilities
<!-- None. -->

## Impact

- **PHP:**
  - `app/Jobs/SendEmailJob.php` (deleted), `app/Contracts/RecurrableScheduler.php` (deleted), `app/KirkiEcommerce.php`, `app/Managers/OrderManager.php` (comment only), `app/Resources/Variant/VariantResource.php` (docblock only)
  - Migrations: `database/migrations/CreateJobsTable.php`, `database/migrations/CreateFailedJobsTable.php`, new `database/migrations/DropSchedulerJobsTable.php`, `config/migrations.php`
- **Frontend:** `resources/app/features/settings/email/pages/edit-notification-template.tsx`.
- **Dev tooling:** `docker/php/Dockerfile`.
- **Installed sites:** a site upgrading from `v1.0.0-alpha.1` through `alpha.4` loses the unused `kirki_ecommerce_scheduler_jobs` table. Nothing reads it any more.
- **Local dev data:** the dev DB's `kirki_ecommerce_jobs` / `kirki_ecommerce_failed_jobs` tables are recreated (emptied), and test product 33 is deleted.
- **API and UI:** no change to API shape or behavior.
