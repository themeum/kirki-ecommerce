## 1. Build tools: catalog fields, versioned zips, incremental build

- [x] 1.1 In `bin/lib/payment-catalog.js`, add `slug`, `requires_kirki_ecommerce`, `requires_wp`, `requires_php` and `source_sha256` to the catalog entry, and make `download_url` end with `/<slug>/<slug>-<version>.zip`
- [x] 1.2 Add pure helpers to `bin/lib/payment-catalog.js`: read the plugin headers (`Requires Kirki eCommerce`, `Requires at least`, `Requires PHP`), select the gateways to build from the live catalog, merge the built and kept entries, find removed gateways, and validate kept entries (no `slug`, no `source_sha256`, or `download_url` not under `BASE_URL` gives a "use --full" error)
- [x] 1.3 Add the `source_sha256` helper: a hash of the sorted relative paths and contents, without `vendor`, `node_modules`, `.git` and `.DS_Store`
- [x] 1.4 Extend `bin/test/payment-catalog.test.js` for 1.1 to 1.3: new fields, versioned URL, selection (new, version changed, same), merge keeps the live `sha256`, removed gateway, "use --full" errors, warning when the source changed but the version did not
- [x] 1.5 Change `bin/build-payment-zips.js`: add the `--full` flag, fetch `{ICON_BASE_URL}/payments` without it, build only the selected gateways, write `<slug>-<version>.zip`, put `slug`, `requires_*`, `source_sha256` and `changelog` (from `CHANGELOG.md`, empty when there is none) in `meta.json`, write the merged catalog, and print the written, kept and removed gateways and "upload gateways/payments last"
- [x] 1.6 Change `bin/publish-payment-gateways.js`: pass `--full` to the build, stop excluding `*/meta.json`, keep the catalog upload last, and never delete objects
- [x] 1.7 Verify: `npm run test:payments` passes; with `npm run s3:up`, `npm run publish:payments -- --full`, then a version bump of one gateway and `npm run build:payments` writes only that folder; then `npm run typecheck && npm test` in `resources/app/`
  - Note: the AWS CLI is not installed on this machine, so `publish:payments` did not run. In its place: `build:payments --full`, then an incremental build against that catalog served by a local HTTP server (one older version, one changed source hash, one removed gateway). Only the changed folder was written, the warning and the removed gateway were printed, and the unreachable and pre-change catalog cases stopped with the `--full` hint.

## 2. Backend: catalog and update logic

- [x] 2.1 In `PaymentGatewayCatalog::normalize()`, require a safe `slug` (`^[a-z0-9-]+$`) and read `requires_kirki_ecommerce`, `requires_wp`, `requires_php` (a value that is not a version string becomes empty); update `tests/Unit/Payment/PaymentGatewayCatalogTest.php`
- [x] 2.2 Add `PaymentGatewayCatalog::find_by_download_url()` and a cached `details(string $slug)` that reads `{base}/<slug>/meta.json` through `Http` and `Cache`, with the trusted URL check
- [x] 2.3 Add `app/Payment/PaymentGatewayUpdates.php`: match catalog entries to `<slug>/<slug>.php` from `get_plugins()`, compare versions, apply the requirement gate (`app()->version()`, WordPress version, `PHP_VERSION`) and return `installed_version`, `update_available` and `update_blocked_reason` for each entry; a catalog failure gives no updates
- [x] 2.4 Move the download and sha256 check from `OnlinePaymentService::download_package()` into `PaymentGatewayUpdates::verified_package(string $url)`; it returns the verified temp file path or a `WP_Error`, and deletes the file on failure
- [x] 2.5 Add unit tests for `PaymentGatewayUpdates`: newer, same and older versions, plugin not in catalog, each requirement blocked, no requirements, catalog failure
  - Note: these are in `tests/Integration/PaymentGatewayUpdatesTest.php`, not in the unit suite. The unit bootstrap has no `get_bloginfo()` and no `KIRKI_ECOMMERCE_VERSION`, and the integration suite has real WordPress.
- [x] 2.6 Verify: `bash kirki-ecommerce-test unit --filter=PaymentGateway` passes and phpcs (wporg standard) is clean for the changed files; then `npm run typecheck && npm test` in `resources/app/`

## 3. Backend: WordPress hooks

- [x] 3.1 Add the hook name constants to `app/Constants/Hooks/WPHookNames.php`: `pre_set_site_transient_update_plugins`, `plugins_api`, `upgrader_pre_download`
- [x] 3.2 Add the filter `app/Wordpress/Hooks/Filters/InjectPaymentGatewayUpdates.php`: add offered updates to `response` (plugin, slug, new_version, package, requires, requires_php, icons), add matched gateways with no update to `no_update`, remove wp.org entries for catalog basenames, and return the transient without a change on failure
- [x] 3.3 Add the filter `PaymentGatewayPluginInformation.php` on `plugins_api` (3 args): answer `plugin_information` for catalog slugs with the catalog values and `sections` (description, changelog from `meta.json`, Markdown to simple HTML through `wp_kses_post`); otherwise return the result without a change
- [x] 3.4 Add the filter `VerifyPaymentGatewayPackage.php` on `upgrader_pre_download` (3 args): for a catalog `download_url`, return the verified file or a `WP_Error`; for a URL under the base URL that is not in the catalog, or when the catalog cannot load, return a `WP_Error`; otherwise return `$reply`
- [x] 3.5 Register the three filters in `config/hooks.php`
- [x] 3.6 Add integration tests: the transient gets the update and the `no_update` entry, a blocked update is left out, a wp.org entry for a catalog slug is removed, `plugins_api` returns the sections, the pre-download filter returns a `WP_Error` on a hash mismatch and does not change other URLs
- [x] 3.7 Verify: `bash kirki-ecommerce-test integration --filter=PaymentGateway` passes and phpcs is clean; then `npm run typecheck && npm test` in `resources/app/`

## 4. Backend: service, endpoint

- [x] 4.1 Change `OnlinePaymentService::install()` to call only `Extension::install($download_url)` (the global filter verifies the package); remove `download_package()` and the local filter in `install_package()`
  - Correction: with only `Extension::install($download_url)`, the framework turns the filter's `WP_Error` into a plain exception and the HTTP code (400 on a hash mismatch) is lost. `install_package()` now calls `PaymentGatewayUpdates::verified_package()`, maps the error code to 400 or 503, and gives the verified local file to `Extension::install()`. The local filter and `download_package()` are removed. See design.md.
- [x] 4.2 Add the update state to `all_installable_providers()` from `PaymentGatewayUpdates`
- [x] 4.3 Add `OnlinePaymentService::update(string $id)`: 404 when not installed, drop the catalog cache, 409 when there is no update, 400 with the reason when blocked, trusted URL check, `Extension::install($url, true, true)`, `Payment::init_registry()`, return the provider
  - Note: named `update_plugin()` (in the service and the controller), because `update()` already exists for the settings (`PUT /online-payments/{id}`).
- [x] 4.4 Add `OnlinePaymentController::update` and the route `POST /online-payments/update` next to `install` in `routes/api.php`, with the same access rule
- [x] 4.5 Extend `tests/Integration/PaymentGatewayCatalogApiTest.php`: the installable list has the three new fields; update succeeds, keeps settings and active state; not installed (404), no update (409), blocked (400); a `download_url` in the body is ignored
- [x] 4.6 Verify: `bash kirki-ecommerce-test integration --filter=PaymentGatewayCatalogApi` passes and phpcs is clean; then `npm run typecheck && npm test` in `resources/app/`
  - Note: `--filter=Payment` also has one failure, `OnboardingApiTest::test_setup_seeds_offline_payments_disabled`. It fails only in that combined run, and it fails the same way without this change (checked with a stash), so it was already there.

## 5. Frontend: update button and badge

- [x] 5.1 Add `installed_version`, `update_available` and `update_blocked_reason` (optional, nullish) to `OnlinePaymentSchema` in `features/settings/payment/schemas/catalog/payment.ts`, and update `features/settings/payment/tests/schemas/catalog/payment.test.ts` for them
- [x] 5.2 Add `updateOnlinePayment` and `useUpdateOnlinePaymentMutation` to `features/settings/payment/services/payment.ts`, with a success toast and the same invalidations as install
  - Note: named `updateOnlinePaymentPlugin` and `useUpdateOnlinePaymentPluginMutation`, because the old names already exist for the settings update. The endpoint is `ONLINE_PAYMENTS_UPDATE_PLUGIN`.
- [x] 5.3 In `online-payment-dialog.tsx`, show a secondary "Update" button next to the "Added" badge when `update_available` is true (loading and disabled only for that row), and show `update_blocked_reason` as muted text when it is set
- [x] 5.4 In `payment-methods.tsx`, read `useInstallableOnlinePaymentsQuery`, and show an "Update available" badge on each installed online row with an update; pressing it opens `OnlinePaymentPopup`; a query failure shows nothing
- [x] 5.5 Verify: `npm run typecheck && npm test` and lint pass in `resources/app/`; ask the user to check the dialog and the badge in the browser

## 6. Docs and release

- [x] 6.1 Update `docs/payment-gateways.md`: the update flow (Plugins page, dialog, auto-update), the new headers (`Requires Kirki eCommerce`, `Requires at least`, `Requires PHP`), `CHANGELOG.md`, versioned zip names, the incremental build and `--full`, the manual upload order, the first `--full` release, and the "Where this differs from wp.org updates" section (12-hour check, no Update URI header yet, no rollback UI, old zips not deleted)
- [x] 6.2 Add a `CHANGELOG.md` with a `1.0.1` entry to `kirki-authorizenet`, `kirki-payfast` and `kirki-paymongo`
- [x] 6.3 Verify: `npm run typecheck && npm test` in `resources/app/`, and `npm run build:payments -- --full` succeeds with the local S3
  - Note: a `--full` build does not read S3, so it ran with the `.env` values (the production bucket URLs). It built 16 gateways with versioned zip names, and `kirki-payfast/meta.json` has the changelog.
