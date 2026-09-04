## 1. Setup (already done)

- [x] 1.1 Create `app/Supports/ExceptionThrower.php` with a static
      `throw(Throwable $t)` method.
- [x] 1.2 Convert `app/Supports/Currency.php` (3 call sites) as the pilot
      and confirm `phpcs-wporg.xml.dist` + `phpcs.xml.dist` + `php -l`
      are clean on it.

## 2. Services — catalog & reference

- [x] 2.1 Convert throw sites in `app/Services/AddressService.php`,
      `AttributeService.php`, `AttributeValueService.php`,
      `BrandService.php`, `CategoryService.php`, `CollectionService.php`,
      `CountryService.php`, `ShippingBoxService.php`,
      `ShippingProfileService.php`, `TagService.php`,
      `TaxProfileService.php`: replace `throw new X(...);` with
      `ExceptionThrower::throw(new X(...));`, remove the trailing
      `phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped`
      comment, add `use Kirki\Ecommerce\App\Supports\ExceptionThrower;`.
- [x] 2.2 Verify: `php -l` on each touched file; run
      `./vendor/bin/phpcs --standard=phpcs-wporg.xml.dist` and
      `./vendor/bin/phpcs --standard=phpcs.xml.dist` scoped to this
      group's files — 0 errors, 0 new warnings.

## 3. Services — commerce

- [x] 3.1 Convert throw sites in `app/Services/CartService.php`,
      `CouponService.php`, `CurrencyService.php`, `CustomerService.php`,
      `DiscountService.php`, `InventoryService.php`,
      `OfflinePaymentService.php`, `OnlinePaymentService.php`,
      `OrderActivityService.php`, `OrderService.php`,
      `ProductSchemaService.php`, `ProductService.php`, `UserService.php`,
      `VariantService.php` — same transform as 2.1. `UserService.php`'s
      `throw ValidationException::with_errors([...])` handled as
      `ExceptionThrower::throw(ValidationException::with_errors([...]))`;
      `VariantService.php`'s multi-line `sprintf(...)` throw handled the
      same way as `SchemaKeys.php` in group 6.
- [x] 3.2 Verify: same as 2.2, scoped to this group's files.

## 4. Actions

- [x] 4.1 Convert throw sites in `app/Actions/Cart/AddToCartAction.php`,
      `RemoveCouponAction.php`, `UpdateCartAction.php`,
      `UpdateCartItemAction.php`, `app/Actions/Coupon/DuplicateCouponAction.php`,
      `app/Actions/Customer/CreateCustomerAction.php`,
      `app/Actions/Order/CreateOrderAction.php`, `CreateRefundAction.php`,
      `DeleteRefundAction.php`, `PerformOrderAction.php`,
      `UpdateOrderAction.php`, `UpdateRefundAction.php` — same transform
      as 2.1.
- [x] 4.2 Verify: same as 2.2, scoped to this group's files.

## 5. Managers, controllers, and core payment plumbing

- [x] 5.1 Convert throw sites in `app/Managers/MoneyManager.php`,
      `app/Managers/OrderActivityManager.php`,
      `app/Http/Controllers/Api/CartController.php`,
      `app/Http/Controllers/Site/OrderActivityController.php`,
      `app/Payment/WebhookController.php`,
      `app/Payment/Providers/PayPal.php` (6 sites) — same transform as
      2.1. Everything under `app/` is in scope, including gateway
      providers.
- [x] 5.2 Verify: same as 2.2, scoped to this group's files.

## 6. Remaining infrastructure

- [x] 6.1 Convert throw sites in `app/Concerns/ValidatesVariantMatrix.php`,
      `app/Constants/Order/OrderStatus.php`,
      `app/Currency/CurrencyExchangeFactory.php` (multi-line
      `sprintf(...)` throw, handled by hand),
      `app/Currency/Providers/CurrencyApiProvider.php`,
      `app/Currency/Providers/ExchangeRatesApiProvider.php`,
      `app/Decisions/Conditions/Condition.php`,
      `app/Decisions/DecisionEngine.php`, `app/Scheduler/Runner.php`,
      `app/Settings/SettingsFactory.php`, `app/Supports/AddonPlugin.php`,
      `app/Supports/SchemaKeys.php` (multi-line `sprintf(...)` throw —
      the ignore comments were on the argument lines, not the `throw`
      line; converted the whole statement by hand),
      `app/Tax/TaxStrategyFactory.php` — same transform as 2.1.
- [x] 6.2 Verify: same as 2.2, scoped to this group's files.

## 7. Full-suite verification

- [x] 7.1 Ran `./vendor/bin/phpcs --standard=phpcs-wporg.xml.dist` and
      `./vendor/bin/phpcs --standard=phpcs.xml.dist` against all 55
      touched files plus `ExceptionThrower.php`: wporg — 0 errors, 2
      warnings (both pre-existing and unrelated: `file_get_contents()`
      discouraged in `CurrencyService.php:261`, double-underscore method
      name in `OnlinePaymentService.php:63` — confirmed via `git diff`
      that neither touched line was modified by this change). PSR-12 —
      60 errors / 36 warnings, an exact match to the pre-change baseline
      (measured via `git stash`) confirming zero net-new findings of any
      kind, not just `ExceptionNotEscaped`.
- [x] 7.2 `php -l` on all 55 touched files plus `ExceptionThrower.php` —
      all clean.
- [x] 7.3 `git diff --name-only` shows 0 files under `libraries/framework/`.
- [x] 7.4 `npm run typecheck && npm test` from `resources/app/` — 0 type
      errors, 765/765 tests passed, confirming no unintended impact
      outside the PHP files this change touches.
- [x] 7.5 `git diff --stat` reviewed: 56 files changed (the 55 in scope
      plus the already-done `Currency.php` pilot), diff shape on each is
      exactly one added `use ExceptionThrower;` import plus
      throw-statement replacements with their trailing `phpcs:ignore`
      comments removed — no unrelated changes.
