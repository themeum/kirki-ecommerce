## Why

Kirki Ecommerce is being submitted to the free WordPress.org plugin directory. Nothing in the repo has ever been checked against the directory's requirements: `phpcs.xml.dist` rules on PSR-12 with no WordPress Coding Standards ruleset, and Plugin Check has never been run. This change is the audit — the findings, and the plan to clear them.

The audit ran the official Plugin Check 2.1.0 against the packaged plugin (`build/kirki-ecommerce`, verified byte-identical to current source apart from the intended `KIRKI_ECOMMERCE_MODE` production patch), and read the 559 first-party PHP files by hand for the policy guidelines Plugin Check does not cover. Plugin Check reported **984 findings, 778 of them in first-party code**.

Five of those would end the submission before the code is read at all:

- **There is no `readme.txt`.** The directory cannot process a submission without one — it is the source of the plugin page, the version, and the Stable Tag.
- **The compiled admin bundle ships without its source.** `assets/js/kirki-ecommerce.bundle-*.js` is 263 KB across 97 lines and `…vendor-*.js` is 477 KB across 97 lines, with no sourcemaps, while `bin/make-package.sh` copies only `resources/{views,data,images,assets}` — so the TypeScript that produced them is absent from the package. Guideline 4 requires shipping the source of compiled files. This one is not an oversight: `openspec/specs/plugin-packaging/spec.md` explicitly *requires* excluding `resources/app/`, so the spec currently mandates the violation.
- **The package contains six other plugins.** `payments/kirki-{stripe,square,mollie,klarna,razorpay,authorizenet}/` each carry a live `Plugin Name:` header and `Requires Plugins: kirki-ecommerce`. A nested copy can never be activated by WordPress, and a submission containing other plugins' headers is malformed.
- **The gateway roadmap violates guideline 8.** `OnlinePaymentService::install()` builds a zip URL (`//@todo: implement cloud url`) and hands it to `AddonPlugin::install()`, which calls `Plugin_Upgrader->install()` and then `activate_plugin()`. Installing and executing code fetched from a non-wordpress.org server is prohibited outright.
- **Two unauthenticated endpoints ship in the package.** `routes/api.php:228` exposes `GET /online-payments/download/{id}` outside every auth group; it reaches `mock_download_provider_zip()`, which zips `base_path('payments/' . 'kirki-' . $id)` from an unsanitized path segment and streams it. `routes/api.php:230` exposes `GET /test-public`, which runs a query with the query log enabled and returns it.

Behind those sits the finding with the widest blast radius. `routes/api.php` defines 144 routes inside two `Route::group(['middleware' => AuthMiddleware::class], …)` blocks, and `AuthMiddleware::handle()` checks `is_user_logged_in()` and nothing else. Every admin endpoint — product, coupon, customer, order, and settings CRUD — is reachable by any authenticated user, including a Subscriber. Across `app/` and `routes/` there is exactly **one** occurrence of `current_user_can`, one policy class (`BrandPolicy`), and `customer()->is_admin()` on three request classes out of 144 routes.

## What Changes

- **`readme.txt` is authored** to the directory's format, including the external-service disclosures the guidelines require: `api.exchangeratesapi.io`, `api.currencyapi.com`, PayPal, and the Google Fonts CDN.
- **The packaging spec is corrected and the build follows it.** `plugin-packaging`'s "excludes development-only files" requirement is **MODIFIED** — uncompiled frontend source becomes required in the package rather than excluded, because guideline 4 demands it. `bin/make-package.sh` ships `resources/app/` and `resources/site/` source, stops shipping `payments/gulpfile.js` and `payments/package.json` (already a violation of that spec's own "dev configs are excluded" scenario), drops `.gitignore` files, and adds `LICENSE` and `readme.txt`.
- **The gateways stop being bundled.** `payments/` leaves the package. Each gateway becomes its own directory submission, which is what its `Requires Plugins: kirki-ecommerce` header already assumes.
- **The remote addon installer is removed from the free plugin.** `AddonPlugin`, `OnlinePaymentService::install()`, `mock_download_provider_zip()`, the `/online-payments/download/{id}` route, and `/test-public` all go. Gateway installation goes through the normal WordPress plugin installer against directory-hosted plugins.
- **A capability layer lands on the admin API.** A new `admin-api-authorization` capability specifies that an admin endpoint requires a capability, not merely a session, and that shopper-facing endpoints are scoped to the requester's own records. The 144 routes are brought under it.
- **Output escaping is closed across the 42 shipped view templates and the service layer** — 486 first-party Plugin Check escaping errors, in three mechanical classes.
- **Input handling is corrected** at the 10 sites reading `$_GET`/`$_POST`/`$_SERVER` without unslashing, sanitizing, or nonce verification.
- **Direct file access guards** are added to the 10 entry-point files that lack them.
- **Google Fonts is bundled locally** and the exchange-rate API call moves to HTTPS.
- **`array_find()` is replaced** — it requires WordPress 6.8 against a declared minimum of 5.9, and fatals on every site below it.
- **WordPress Coding Standards join `phpcs.xml.dist`**, and Plugin Check joins CI, so none of this silently returns.

Out of scope: auditing the TypeScript itself (the frontend finding is about *packaging* the source, not its quality); line-level review of the 519 bundled SDK files under `payments/*/vendor/`; and any change to `libraries/framework`, which is php-scoper output regenerated by `composer scope` and cannot hold a hand-edit.
