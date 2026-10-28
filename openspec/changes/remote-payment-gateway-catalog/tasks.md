## 1. Packaging command

- [x] 1.1 Add `bin/build-payment-zips.js`: list `payments/kirki-*`, stage each in a temp folder, run `composer install --no-dev -o` when `composer.json` exists (premise corrected: most gateways have no lock file, so the script runs `composer update` with a warning in that case instead of failing)
- [x] 1.2 Parse the plugin header (name, description, version) and require `assets/logo.svg`; fail naming the gateway otherwise (a folder with no `<slug>.php`, e.g. `kirki-paddle`, is skipped with a warning)
- [x] 1.3 Zip with a single top-level `<slug>` folder, excluding dev files; write `payment-server/gateways/<slug>/{<slug>.zip,logo.svg,meta.json}` including `sha256`
- [x] 1.4 Add the `build:payments` script to the root `package.json` (uses the system `zip`, so no `archiver` dependency); ignore `payment-server/gateways/` in `payment-server/.gitignore`
- [x] 1.5 Check each gateway id against the provider id it registers (the script reads `$this->id = '...'` from `src/`, so `id` always matches; no folder renames needed)
- [x] 1.6 Verify: run the command, unzip one result, confirm a valid plugin header and checksum; run `npm run typecheck && npm test` in `resources/app/` (typecheck passes; 2 pre-existing failures in `shipping-carrier.test.tsx`, unrelated)

## 2. Dev catalog server

- [x] 2.1 Add `payment-server/` (`node:http`): `GET /payments` reads `payment-server/gateways/*/meta.json` per request and adds `icon_url`, `download_url`; serve zips/logos statically
- [x] 2.2 Add an npm script to start it; delete `payments/payments.json`
- [x] 2.3 Verify: start the server, `curl /payments`, download one zip and compare its hash; run `npm run typecheck && npm test` in `resources/app/`

## 3. Backend catalog and install

- [x] 3.1 Add `PaymentGatewayCatalog` with the single base-URL constant, remote fetch, shape validation, and transient cache with stale fallback
- [x] 3.2 Rewrite `OnlinePaymentService::all_installable_providers()` to use the catalog and merge `is_installed`; update `InstallableOnlinePaymentListResource`
- [x] 3.3 Implement `install()`: id lookup, already-installed check, host lock, download to temp, SHA-256 check, install and activate via `Extension::install()` using the verified file, cache clear, return provider
- [x] 3.4 Make `POST /online-payments/install` ignore any client URL (the controller already read only `id`; covered by a test)
- [x] 3.5 Add PHP tests (catalog parsing, host lock, checksum mismatch, unknown id, already installed) using the docker runner; run phpcs on changed files (unit 584 pass; new integration tests pass; unrelated pre-existing failure in `OnboardingApiTest::Setup seeds offline payments disabled`)
- [x] 3.6 Update `payment-providers` behavior in code: remove `is_available`

## 4. Admin dialog

- [x] 4.1 Update `OnlinePaymentSchema` (add `description`, `version`; drop `is_available` use) (the schema had no `is_available`; added `version`) and its test
- [x] 4.2 Update `online-payment-dialog.tsx`: loading, error with retry, empty state, per-row pending Add button, remove "Coming Soon" branch
- [x] 4.3 Verify: `npm run typecheck && npm test` in `resources/app/`; typecheck, lint and payment tests pass; the dialog needs a visual check by the maintainer (no browser use in this project)

## 5. Docs

- [x] 5.1 Write `docs/payment-gateways.md`: contents, quick start (build, upload, set base URL), catalog contract, install security, and "Where this differs from" (WordPress.org plugin installer) section
- [x] 5.2 Final check: `openspec validate remote-payment-gateway-catalog`
