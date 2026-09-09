## 1. `app/Supports/Utils.php`

- [x] 1.1 Convert the `$_SERVER['REQUEST_METHOD']` read in `is_nonce_verified()` to `Superglobals::server('REQUEST_METHOD', '', Sanitizer::TEXT)`; add the `Superglobals` `use` import.
- [x] 1.2 Convert the `$_POST : $_GET` whole-array ternary to `Superglobals::post() : Superglobals::query()`; remove the now-redundant `wp_unslash()` wrapping `Arr::get($data, 'kecom_nonce', '')` on the next line.
- [x] 1.3 Convert the `$_SERVER['REQUEST_URI']` read (used for the account-page path check) to `Superglobals::server('REQUEST_URI', '', Sanitizer::TEXT)`.
- [x] 1.4 Remove any now-unused `phpcs:ignore` comments on these three lines whose suppressed sniffs no longer fire (raw superglobal access is now inside `Superglobals`, not this file); verify with `composer phpcs:wporg`.
- [x] 1.5 Verify: `composer phpcs:wporg && composer test:unit` passes, including `UtilsIsAccountPageTest`.

## 2. `app/Supports/Template.php`

- [x] 2.1 Convert the `$_SERVER['REQUEST_URI']` read in `render_pagination()` to `Superglobals::server('REQUEST_URI', '', Sanitizer::TEXT)`.
- [x] 2.2 Convert the whole-array `$params = $_GET;` read (pagination URL builder) to `Superglobals::query()` — not `request()->all()` (see design.md Decision 0).
- [x] 2.3 Convert `(array)($_GET['category_ids'] ?? [])` in `render_category_filter()` to `(array) request()->array('category_ids', [])` (see design.md Decision 1).
- [x] 2.4 Convert `(array) ($_GET['attribute_value_ids'] ?? [])` in `render_attribute_filters()` the same way, keyed on `attribute_value_ids`.
- [x] 2.5 Add the `Superglobals` and `request` `use`/`use function` imports (`Sanitizer` is already imported in this file).
- [x] 2.6 Verify: `composer phpcs:wporg && composer test:unit` passes.

## 3. `app/Supports/Assets.php`

- [x] 3.1 Convert `is_admin_page()`'s `isset($_GET['page'])` + `sanitize_text_field(wp_unslash($_GET['page']))` pair to a single `Superglobals::query('page', null, Sanitizer::TEXT)` call, comparing against `null` in place of the `isset()` check.
- [x] 3.2 Add the `Superglobals` and `Sanitizer` `use` imports.
- [x] 3.3 Verify: `composer phpcs:wporg && composer test:unit` passes.

## 4. `app/Hooks/Filters/PageIdentifier.php`

- [x] 4.1 Convert `isset($_GET['post_type'])` to `Superglobals::query('post_type') !== null`.
- [x] 4.2 Add the `Superglobals` `use` import.
- [x] 4.3 Verify: `composer phpcs:wporg && composer test:unit` passes.

## 5. `app/Scheduler/Scheduler.php`

- [x] 5.1 Convert `isset($_POST['secret']) ? Sanitizer::apply_rule(wp_unslash($_POST['secret']), Sanitizer::TEXT) : ''` in `run_async_worker()` to `Superglobals::post('secret', '', Sanitizer::TEXT)`.
- [x] 5.2 Add the `Superglobals` `use` import (`Sanitizer` is already imported in this file).
- [x] 5.3 Verify: `composer phpcs:wporg && composer test:unit` passes.

## 6. `app/Managers/MoneyManager.php`

- [x] 6.1 Convert `isset($_COOKIE[static::DISPLAY_CURRENCY_COOKIE]) ? wp_unslash(...) : null` to `Superglobals::cookie(static::DISPLAY_CURRENCY_COOKIE)`.
- [x] 6.2 Convert `isset($_SERVER[static::DISPLAY_CURRENCY_HEADER]) ? wp_unslash(...) : null` to `Superglobals::server(static::DISPLAY_CURRENCY_HEADER)`.
- [x] 6.3 Leave the existing `sanitize_text_field()`/`is_string()`/`empty()` guard below these two lines unchanged (see design.md Decision 3 — it's now redundant but harmless, and out of scope to trim here).
- [x] 6.4 Add the `Superglobals` `use` import.
- [x] 6.5 Verify: `composer phpcs:wporg && composer test:unit && composer test:integration` passes (currency resolution is exercised by integration tests via `Cart`/checkout flows).

## 7. Site view templates

- [x] 7.1 `resources/views/site/shop.php`: convert `!empty($_GET)` to `!empty(Superglobals::query())` — not `request()->all()` (see design.md Decision 0).
- [x] 7.2 `resources/views/site/shop/single.php`: convert `isset($_GET['variant_id']) ? (int) $_GET['variant_id'] : null` to `request()->int('variant_id', null)`.
- [x] 7.3 `resources/views/site/shop/parts/empty.php`: convert each of the 7 bare `$_GET[...]` reads (`search`, `sort_by`, `category`, `brand`, `min_price`, `max_price`, `attribute`) to `request()->text('<key>')`, keeping the same `empty()`/`!==` structure.
- [x] 7.4 Add `use Kirki\Ecommerce\Framework\Http\Superglobals;` to `shop.php`, and `use function Kirki\Ecommerce\Framework\request;` to `shop/single.php` and `shop/parts/empty.php` (matching the existing import style already used for `request()` in `resources/views/site/login.php`).
- [x] 7.5 Verify: `composer phpcs:wporg` passes; manually confirm shop filtering, the empty-state message, and the single-product variant selector still work as expected (these templates aren't covered by PHPUnit — per CLAUDE.md section 0, do not use a browser preview to check this; flag to the user for manual confirmation instead).

## 8. Documentation

- [x] 8.1 Add a rule to `CLAUDE.md`'s "PHP Coding Standards" section: new code must read `$_GET`/`$_POST`/`$_SERVER`/`$_COOKIE` via `Request`/`request()` (inside a dispatched request) or `Superglobals` (everywhere else), never directly (mirroring the existing `Sanitizer::apply_rule()` convention note already in that section).
- [x] 8.2 Final verification across the whole change: `composer phpcs:wporg && composer test:unit && composer test:integration`.
