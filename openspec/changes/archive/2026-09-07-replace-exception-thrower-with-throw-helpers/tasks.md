Conversion rule for every task below (see design.md - Decisions):
`if ($cond) { ExceptionThrower::throw(new X($msg, ...$args)); }` → `throw_if($cond, $msg, X::class, ...$args);` (condition kept verbatim, never inverted to `throw_unless`).
Unconditional/fallthrough throws → `throw_anyway($msg, X::class, ...$args);`.
Add `use function Kirki\Ecommerce\Framework\throw_if;` (and `throw_anyway` where used) per file, replacing `use Kirki\Ecommerce\App\Supports\ExceptionThrower;` unless the file keeps a `with_errors()` site.
Verification per group: `composer phpcs:wporg` on the changed files + `composer test` (or the narrower `composer test:unit` / `composer test:integration` if it covers the touched area).

## 1. Confirm framework helpers are available locally

- [x] 1.1 Run `composer install` and confirm `libraries/framework/helpers.php`'s `throw_if`/`throw_unless` forward `...$params` to `throw_anyway` (they didn't before the `themeum/framework` 3.1.2 bump - see design.md Risks). Do not proceed until this is confirmed.

## 2. app/Settings, app/Supports, app/Constants/Order

- [x] 2.1 Convert `app/Settings/SettingsFactory.php` (3 sites)
- [x] 2.2 Convert `app/Supports/SchemaKeys.php` (2 sites)
- [x] 2.3 Convert `app/Supports/AddonPlugin.php` (5 sites)
- [x] 2.4 Convert `app/Supports/Currency.php` (3 sites)
- [x] 2.5 Convert `app/Constants/Order/OrderStatus.php` (2 sites, 1 unconditional via `throw_anyway`)
- [x] 2.6 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean on all 5 files; `SchemaKeysTest` passes, including the converted `throw_if` site)

## 3. app/Payment

- [x] 3.1 Convert `app/Payment/WebhookController.php` (1 site)
- [x] 3.2 Convert `app/Payment/Providers/PayPal.php` (6 sites, 1 unconditional catch-block rethrow via `throw_anyway`)
- [x] 3.3 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 2 files)

## 4. app/Managers, app/Tax, app/Scheduler, app/Decisions

- [x] 4.1 Convert `app/Managers/OrderActivityManager.php` (1 site, unconditional `default:` arm via `throw_anyway`)
- [x] 4.2 Convert `app/Managers/MoneyManager.php` (2 sites)
- [x] 4.3 Convert `app/Tax/TaxStrategyFactory.php` (3 sites)
- [x] 4.4 Convert `app/Scheduler/Runner.php` (4 sites)
- [x] 4.5 Convert `app/Decisions/DecisionEngine.php` (2 sites)
- [x] 4.6 Convert `app/Decisions/Conditions/Condition.php` (1 site)
- [x] 4.7 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean; `MoneyManagerTest` + `RunnerTest` pass, covering the converted sites)

## 5. app/Http/Controllers, app/Currency

- [x] 5.1 Convert `app/Http/Controllers/Site/OrderActivityController.php` (1 site)
- [x] 5.2 Convert `app/Http/Controllers/Api/CartController.php` (2 sites)
- [x] 5.3 Convert `app/Currency/CurrencyExchangeFactory.php` (1 site, unconditional via `throw_anyway`)
- [x] 5.4 Convert `app/Currency/Providers/CurrencyApiProvider.php` (6 sites)
- [x] 5.5 Convert `app/Currency/Providers/ExchangeRatesApiProvider.php` (4 sites)
- [x] 5.6 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 5 files)

## 6. app/Actions/Order

- [x] 6.1 Convert `app/Actions/Order/CreateOrderAction.php` (7 sites - original count of 6 undercounted the second `prepare_order_item_dto` product-not-found site)
- [x] 6.2 Convert `app/Actions/Order/CreateRefundAction.php` (2 sites)
- [x] 6.3 Convert `app/Actions/Order/DeleteRefundAction.php` (1 site)
- [x] 6.4 Convert `app/Actions/Order/PerformOrderAction.php` (2 sites)
- [x] 6.5 Convert `app/Actions/Order/UpdateOrderAction.php` (4 sites)
- [x] 6.6 Convert `app/Actions/Order/UpdateRefundAction.php` (1 site)
- [x] 6.7 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 6 files)

## 7. app/Actions/Coupon, app/Actions/Cart, app/Actions/Customer

- [x] 7.1 Convert `app/Actions/Coupon/DuplicateCouponAction.php` (1 site)
- [x] 7.2 Convert `app/Actions/Cart/RemoveCouponAction.php` (1 site)
- [x] 7.3 Convert `app/Actions/Cart/UpdateCartAction.php` (1 site)
- [x] 7.4 Convert `app/Actions/Cart/UpdateCartItemAction.php` (4 sites)
- [x] 7.5 Convert `app/Actions/Cart/AddToCartAction.php` (3 sites)
- [x] 7.6 Convert `app/Actions/Customer/CreateCustomerAction.php` (3 sites)
- [x] 7.7 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 6 files)

## 8. app/Services (catalog & taxonomy: Product, Variant, Category, Tag, Attribute, Collection, Brand)

- [x] 8.1 Convert `app/Services/ProductService.php` (10 sites - original count of 8 undercounted the bulk_trash and bulk_restore "selected" guards)
- [x] 8.2 Convert `app/Services/VariantService.php` (9 sites)
- [x] 8.3 Convert `app/Services/CategoryService.php` (6 sites)
- [x] 8.4 Convert `app/Services/TagService.php` (5 sites)
- [x] 8.5 Convert `app/Services/AttributeService.php` (6 sites)
- [x] 8.6 Convert `app/Services/AttributeValueService.php` (5 sites)
- [x] 8.7 Convert `app/Services/CollectionService.php` (5 sites)
- [x] 8.8 Convert `app/Services/BrandService.php` (5 sites)
- [x] 8.9 Convert `app/Services/ProductSchemaService.php` (5 sites)
- [x] 8.10 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 9 files)

## 9. app/Services (commerce: Order, Cart, Customer, Coupon, Discount, Inventory)

- [x] 9.1 Convert `app/Services/OrderService.php` (6 sites)
- [x] 9.2 Convert `app/Services/OrderActivityService.php` (2 sites)
- [x] 9.3 Convert `app/Services/CartService.php` (6 sites)
- [x] 9.4 Convert `app/Services/CustomerService.php` (10 sites - original count of 9 undercounted one "Customer could not be found" guard)
- [x] 9.5 Convert `app/Services/CouponService.php` (9 sites - original count of 8 undercounted the second `find_by_code` guard)
- [x] 9.6 Convert `app/Services/DiscountService.php` (2 sites)
- [x] 9.7 Convert `app/Services/InventoryService.php` (7 sites - original count of 6 undercounted the `confirm_reserved_stock` guard)
- [x] 9.8 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean, `php -l` clean; no dedicated tests exist for these 7 files; fixed a duplicate `use Exception;` import introduced mid-edit in CouponService.php)

## 10. app/Services (shipping, tax, currency, payment, address, country, user)

- [x] 10.1 Convert `app/Services/ShippingProfileService.php` (5 sites)
- [x] 10.2 Convert `app/Services/ShippingBoxService.php` (6 sites)
- [x] 10.3 Convert `app/Services/TaxProfileService.php` (5 sites)
- [x] 10.4 Convert `app/Services/CurrencyService.php` (7 sites)
- [x] 10.5 Convert `app/Services/AddressService.php` (5 sites)
- [x] 10.6 Convert `app/Services/CountryService.php` (1 site)
- [x] 10.7 Convert `app/Services/OfflinePaymentService.php` (2 sites, 1 unconditional via `throw_anyway`)
- [x] 10.8 Convert `app/Services/OnlinePaymentService.php` (4 sites, 1 unconditional via `throw_anyway`)
- [x] 10.9 Convert `app/Services/UserService.php` (4 of 5 sites - leave the `ValidationException::with_errors(...)` site on `ExceptionThrower::throw(...)`, keep its import)
- [x] 10.10 Verify: `composer phpcs:wporg` + `composer test` pass (phpcs clean - 2 pre-existing unrelated warnings only; `php -l` clean; no dedicated tests exist for these 9 files)

## 11. Final sweep

- [x] 11.1 Grep for `use Kirki\Ecommerce\App\Supports\ExceptionThrower;` across `app/` and confirm it remains only in `app/Services/UserService.php`, `app/Concerns/ValidatesVariantMatrix.php`, and `app/Supports/ExceptionThrower.php` itself (confirmed - both retained sites are `ValidationException::with_errors(...)` calls, unreachable through `throw_if`/`throw_anyway`)
- [x] 11.2 Grep every file touched in groups 2-10 for `throw_if(` / `throw_anyway(` and confirm each has a matching `use function Kirki\Ecommerce\Framework\...;` import (see design.md Risks) - confirmed, no missing imports
- [x] 11.3 Run full `composer phpcs:wporg` and full `composer test` across the repo - `phpcs:wporg` on `app/` + `database/`: 0 errors (all warnings pre-existing/unrelated - nonce checks, `file_get_contents`, `json_encode`, script versioning - and critically zero `ExceptionNotEscaped` findings, confirming the WPCS motivation holds). `composer test:unit` (integration suite needs a WordPress test install not available here): 173 tests, 22 errors + 2 failures, all pre-existing and unrelated to this change - the 22 errors are `UtilsIsAccountPageTest` hitting an unbootstrapped `sanitize_text_field()` in `app/Supports/Utils.php` (untouched by this change), the 2 failures are `AvailabilityServiceTest` expecting a `<span>`-free string in `app/Services/AvailabilityService.php` (also untouched, unrelated to exception handling). Tests covering actually-converted code (`SchemaKeysTest`, `MoneyManagerTest`, `RunnerTest`) all pass.
- [x] 11.4 Confirm `app/Supports/ExceptionThrower.php` is unchanged and still referenced by the 2 remaining sites - confirmed via `git diff --stat` (no changes) and grep (both sites reference it)
- [x] 11.5 Run WordPress.org Plugin Check CLI (`wp plugin check kirki-ecommerce`, via the project's docker stack, which already had Plugin Check 2.1.0 installed and active) against the converted code. The full default check set crashes with a pre-existing "critical error" unrelated to this change (stale docker WP install - debug.log shows old fatals from missing class autoloads and DB schema mismatches predating this session). Ran the relevant checks individually instead: `plugin_review_phpcs` (Plugin Check's own full WordPress-standards PHPCS scan, independent of this repo's `phpcs-wporg.xml.dist` excludes), `late_escaping` (the exact `WordPress.Security.EscapeOutput.ExceptionNotEscaped` sniff this migration is about), `direct_db_queries`, `php_error_reporting`, `wp_functions_compatibility` - all completed successfully with **zero errors in any `app/` or `database/` file**. All 151 flagged files across the whole plugin are in `payments/` (separate vendored payment-gateway addon plugins), `tests/`, or `libraries/framework/` (vendored, out of this project's style scope per CLAUDE.md) - none touched by this change.
