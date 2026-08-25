Groups are ordered by severity, not by guideline number — see `design.md`, Decision 1. Every group ends with a verification step. Where a task consolidates many sites, the command shown regenerates the full list and is the completion test: the task is done when it returns nothing.

Counts are first-party only; `libraries/framework` is excluded everywhere (Decision 3). Plugin Check must be run one check at a time — a whole category crashes (design.md, Audit method).

## 0. Prerequisites

- [ ] 0.1 Restore dev dependencies — the last `make:package` run left `vendor/` as a `--no-dev` install with `vendor/themeum` deleted, so PHPUnit, php-scoper, and the WP stubs are absent: `composer install`
- [ ] 0.2 Stage the built package for Plugin Check as described in `design.md`, and confirm the baseline reproduces: 778 first-party findings
- [ ] 0.3 Verify: `bin/phpunit` runs and the suite passes before any change is made

## 1. Blocker — `readme.txt` does not exist

- [ ] 1.1 Author `readme.txt` in the directory's format: `=== Kirki Ecommerce ===`, `Contributors`, `Tags`, `Requires at least: 5.9`, `Tested up to: 6.9`, `Requires PHP: 7.4`, `Stable tag`, `License: GPLv2 or later`, plus Description / Installation / FAQ / Changelog / Upgrade Notice sections
- [ ] 1.2 Add the external-services disclosure the guidelines require — every service the plugin contacts, what is sent, when, and a link to each provider's terms and privacy policy: `api.exchangeratesapi.io` and `api.currencyapi.com` (exchange-rate sync), `api-m.paypal.com` / `api-m.sandbox.paypal.com` (payment processing), and `fonts.googleapis.com` / `fonts.gstatic.com` until task 5.3 removes it
- [ ] 1.3 Reconcile `Stable tag` with the plugin header — `Version: 1.0.0-alpha.2` is a prerelease string; the directory expects the Stable Tag to match a released version, so decide the launch version before submitting
- [ ] 1.4 Add `LICENSE` containing the full GPLv2 text — the header declares `GPLv2 or later` but no license file ships
- [ ] 1.5 Verify: `./wpcli plugin check kirki-ecommerce-dist --checks=plugin_readme` — `no_plugin_readme` gone

## 2. Blocker — the package fails guideline 4 and its own spec

`bin/make-package.sh` copies only `resources/{views,data,images,assets}`, so the TypeScript behind a 263 KB / 97-line admin bundle and a 477 KB / 97-line vendor bundle is absent, with no sourcemaps. `openspec/specs/plugin-packaging/spec.md` currently *requires* that exclusion — the spec delta in this change corrects it.

- [ ] 2.1 Ship the frontend source: add `resources/app` and `resources/site` to the copied paths, excluding `node_modules` and build caches
- [ ] 2.2 Stop shipping `payments/gulpfile.js` and `payments/package.json` — already a violation of the existing spec's "dev configs are excluded" scenario
- [ ] 2.3 Add `readme.txt` and `LICENSE` to the required paths
- [ ] 2.4 Exclude dotfiles from the copy — `payments/.gitignore` and `payments/kirki-stripe/.gitignore` currently ship (`hidden_files`)
- [ ] 2.5 Ship `composer.json` alongside the bundled `vendor/`, or drop the directory-level `vendor/` from the package (`missing_composer_json_file`)
- [ ] 2.6 Verify: rebuild, restage, then `--checks=file_type` and `--checks=plugin_header_fields` clean; confirm `resources/app/` is present in the zip and `node_modules` is not
- [ ] 2.7 Verify: `npm run typecheck && npm test` from `resources/app/` — this group changes what the build emits

## 3. Blocker — six plugins are nested inside the package

`payments/kirki-{stripe,square,mollie,klarna,razorpay,authorizenet}/` each carry a live `Plugin Name:` header. A nested copy can never be activated, and `Requires Plugins: kirki-ecommerce` only resolves against directory slugs.

- [ ] 3.1 Remove `payments` from `OPTIONAL_PATHS` in `bin/make-package.sh` and drop the per-gateway `composer install` loop
- [ ] 3.2 Replace `OnlinePaymentService::__discover_installable_providers()`'s read of `base_path('payments/payments.json')` — the manifest ships inside the plugin today and disappears with it
- [ ] 3.3 Point `PaymentProvider::get_logo_url()` (`app/Payment/PaymentProvider.php:147`) somewhere other than `/payments/kirki-<name>/assets/logo.svg`; move the 16 gateway logos into `resources/images/`
- [ ] 3.4 Move each gateway to its own repository and directory submission — the six entry files already declare `Requires Plugins: kirki-ecommerce`
- [ ] 3.5 Verify: `grep -rl 'Plugin Name:' build/kirki-ecommerce --include='*.php' | grep -v vendor` returns only `build/kirki-ecommerce/kirki-ecommerce.php`

## 4. Blocker — remote code installation and two unauthenticated endpoints

Guideline 8 prohibits installing or executing code fetched from outside wordpress.org. Read `design.md`, Decision 4, before starting this group — it constrains the product direction, not just the code.

- [ ] 4.1 Delete `app/Supports/AddonPlugin.php` — `Plugin_Upgrader->install($url)` followed by `activate_plugin()` on a URL the plugin chooses is precisely what guideline 8 forbids
- [ ] 4.2 Delete `OnlinePaymentService::install()` (`app/Services/OnlinePaymentService.php:73`) and its `//@todo: implement cloud url`
- [ ] 4.3 Delete `OnlinePaymentService::mock_download_provider_zip()` (line 172) — it zips `base_path('payments/' . 'kirki-' . $id)` from an unsanitized path segment and streams it with raw `header()` calls, and it ships in the package
- [ ] 4.4 Delete the route at `routes/api.php:228` (`GET /online-payments/download/{id}`) and `OnlinePaymentController::download()` — the route sits between the auth groups (which close at line 225 and reopen at 255), so it is **unauthenticated**
- [ ] 4.5 Delete `GET /test-public` (`routes/api.php:230`) — an unauthenticated debug endpoint that enables the query log and returns it — and the `GET /test` route at line 48 with `TestController`
- [ ] 4.6 Route gateway installation through the normal WordPress plugin installer against directory-hosted plugins, with no installer code in this plugin
- [ ] 4.7 Verify: `grep -rn 'Plugin_Upgrader\|activate_plugin\|mock_download\|test-public' app routes --include='*.php'` returns nothing
- [ ] 4.8 Verify: `composer install && bin/phpunit`

## 5. Security — authorization, transport, and a fatal on supported versions

- [ ] 5.1 **Capability checks on 144 admin routes.** `routes/api.php` wraps them in two `Route::group(['middleware' => AuthMiddleware::class], …)` blocks, and that middleware checks `is_user_logged_in()` only — every admin endpoint is reachable by a Subscriber. Extend the existing pattern rather than inventing one: `customer()->is_admin()` already guards `OrderCreateRequest`, `OrderUpdateRequest`, and `OrderActionRequest`. See the `admin-api-authorization` spec delta for the contract
- [ ] 5.2 **Scope shopper endpoints to the requester.** The unauthenticated cart and checkout routes (`routes/api.php:243–250`) and the `/account/*` group must reject access to another customer's records, not merely require a session
- [ ] 5.3 **Bundle Inter locally.** `app/Menu/Root.php:58` enqueues `fonts.googleapis.com/css2?family=Inter`, and `add_font_resource_hints()` preconnects to `fonts.googleapis.com` and `fonts.gstatic.com` (lines 155, 159). Serving fonts from a third-party CDN is an external-resource and EU-privacy issue; ship the font files in `assets/` and drop both hints
- [ ] 5.4 **`array_find()` fatals on supported versions.** `resources/views/site/account/order-details.php:50` and `:53` call it against a declared `Requires at least: 5.9`; it needs WordPress 6.8 (or PHP 8.4). Replace with a `foreach` or a `current(array_filter(...))`
- [ ] 5.5 **Plaintext transport.** `app/Currency/Providers/ExchangeRatesApiProvider.php:15` uses `http://api.exchangeratesapi.io/v1`; move to HTTPS
- [ ] 5.6 Verify: `composer install && bin/phpunit`, and `--checks=wp_functions_compatibility` reports no first-party findings

## 6. Security — output escaping (486 findings)

Three mechanical classes. The 42 templates in `resources/views/` are the hot spot: `order-details.php` (35 findings), `shop/single.php` (30), `order-success.php` (21), `shop/parts/product-card.php` (18).

- [ ] 6.1 **420 × `ExceptionNotEscaped`** — exception messages built from `__()` reach output unescaped. Switch to `esc_html__()` at the throw sites. Locator: `grep -rEn 'throw new [A-Za-z_]*(Exception|Error)\((__|sprintf)' app payments database --include='*.php' | grep -v '/vendor/'` (257 statements; Plugin Check counts each unescaped argument)
- [ ] 6.2 **33 × `UnsafePrintingFunction`** — `_e()` in templates, e.g. `resources/views/site/registration/registration-term-field.php:21–24`. Replace with `esc_html_e()` / `esc_attr_e()`. Locator: `grep -rEn '\b_e\(' resources/views app --include='*.php'`
- [ ] 6.3 **33 × `OutputNotEscaped`** — raw `echo` of composed markup, e.g. `app/Supports/Icon.php:99` and `app/Supports/Template.php:90,106`. These emit intended HTML/SVG, so `wp_kses()` with an allowed-tag set is the fix, not `esc_html()`
- [ ] 6.4 Verify: `--checks=late_escaping` reports zero findings outside `libraries/`

## 7. Security — input handling and direct file access

- [ ] 7.1 **13 entry-point files lack a direct-access guard.** Add `defined('ABSPATH') || exit;`. Completion test: `grep -rL "defined('ABSPATH')" bootstrap/*.php config/*.php app/helpers.php routes/*.php` returns nothing
- [ ] 7.2 **19 unsanitized / unslashed reads and 11 missing nonce verifications**, at: `app/Supports/Utils.php:39,40,309,312`, `app/Supports/Template.php:135,264,343,349`, `app/Managers/MoneyManager.php:137`, `app/Hooks/Filters/PageIdentifier.php:39`, `app/Scheduler/Scheduler.php:217`, `resources/views/site/shop.php:26`, `resources/views/site/shop/single.php:41`, and in the gateways `kirki-razorpay/src/RazorpayClient.php:126`, `kirki-square/src/SquareClient.php:43`, `kirki-stripe/src/Stripe.php:205`. Apply `wp_unslash()` then the matching `sanitize_*()`, and verify a nonce on every state-changing read. Locator: `grep -rEn '\$_(GET|POST|REQUEST|SERVER|COOKIE|FILES)\[' app payments --include='*.php' | grep -v '/vendor/'`
- [ ] 7.3 Verify: `--checks=direct_file_access` and `--checks=plugin_review_phpcs` report no `ValidatedSanitizedInput` or `NonceVerification` findings outside `libraries/`

## 8. Hygiene

- [ ] 8.1 **219 non-prefixed globals in templates** — `resources/views/site/` files assign into global scope (`order-details.php` 29, `shop/single.php` 28, `product-card.php` 18). Pass data into templates via an explicit array rather than extracting to globals. Locator: `--checks=prefixing`
- [ ] 8.2 **`date_default_timezone_set('UTC')`** at `kirki-ecommerce.php:84` — changes the timezone for WordPress and every other plugin on the site. Remove it and use `gmdate()` / `wp_date()` at the call sites that relied on it
- [ ] 8.3 **7 × `date()`** — `app/Resources/Site/Order/OrderListResource.php:85`, `resources/views/site/account/dashboard.php:28`, `order-details.php:47,104,120,134`, `database/seeders/CartSeeder.php:31`. Use `gmdate()` for storage and `wp_date()` for display
- [ ] 8.4 **6 × development functions** (`error_log`, `print_r`, `var_export`, `debug_backtrace`, `set_error_handler`). Locator: `grep -rEn 'error_log\(|var_dump\(|print_r\(|var_export\(|debug_backtrace\(' app payments database --include='*.php' | grep -v '/vendor/'`
- [ ] 8.5 **5 × direct filesystem/URL calls** — `app/Services/OnlinePaymentService.php:203,204` (`readfile`, `unlink`), `database/seeders/OnBoarding/ProductSeeder.php:348,352` (`unlink`, `rmdir`), `app/Supports/Utils.php:309` (`parse_url`). Use `WP_Filesystem` and `wp_parse_url()`. Note 203–204 disappear with task 4.3
- [ ] 8.6 **`wp_redirect()` → `wp_safe_redirect()`** at `app/Http/Middlewares/SiteAuthMiddleware.php:47`
- [ ] 8.7 **Heredoc** at `payments/kirki-razorpay/src/RazorpayClient.php:103` — `PluginCheck.CodeAnalysis.Heredoc.NotAllowed`
- [ ] 8.8 **`Domain Path: /languages` points at a directory that does not exist.** Create it and ship the `.pot`, or drop the header
- [ ] 8.9 **Non-prefixed hook name** `https_local_ssl_verify` at `app/Scheduler/Concerns/HasAsyncWorker.php:32` — that is a WordPress core filter being *invoked* rather than filtered; confirm the intent
- [ ] 8.10 **Assets URL is built by string surgery** — `kirki-ecommerce.php:56` does `str_replace(WP_CONTENT_DIR, '', …)` against `WP_CONTENT_URL`, which breaks on any non-default `WP_PLUGIN_DIR`. Use `plugins_url()`
- [ ] 8.11 **56 `@todo`/`FIXME`/mock markers ship in the package.** Triage; several disappear with group 4. Locator: `grep -rn '@todo\|TODO\|FIXME\|mock_' app payments database routes bootstrap config --include='*.php' | grep -v '/vendor/'`
- [ ] 8.12 **Mixed line endings** in 2 files (`Internal.LineEndings.Mixed`) — normalize to LF. Locator: `--checks=plugin_review_phpcs`
- [ ] 8.13 Verify: `--checks=prefixing`, `--checks=plugin_review_phpcs`, `--checks=plugin_header_fields` clean outside `libraries/`

## 9. Keep it from coming back

- [ ] 9.1 Add `WordPress-Extra` and `WordPress-Docs` to `phpcs.xml.dist` — it rules on PSR-12 today, so nothing in CI has ever looked for escaping, sanitization, or prefixing. Set `minimum_supported_wp_version` to match the header
- [ ] 9.2 Add Plugin Check to `.github/workflows/` against the built package, running checks individually per the crash noted in `design.md`
- [ ] 9.3 Verify: CI fails on a deliberately unescaped `echo`, then passes once reverted
- [ ] 9.4 Verify: full re-run — every `plugin_repo` and `security` check reports zero first-party findings
