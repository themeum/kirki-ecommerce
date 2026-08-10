## 1. Payment provider snapshot on order creation

- [x] 1.1 In `app/Actions/Order/CreateOrderAction.php`, after `$order_dto->payment_provider = $dto->payment_provider;`, resolve the live provider via `Payment::get_provider($dto->payment_provider)` and, when found, set `$order_dto->payment_metadata = ['payment_provider' => ['id' => ..., 'name' => ..., 'icon' => ..., 'is_offline' => ...]]` using the provider's `id()`, `title()`, `icon()`, `is_offline()`. Leave `payment_metadata` unset when the provider doesn't resolve.
- [x] 1.2 Confirm `CreateOrderDTO` already exposes a `payment_metadata` property flowing through to `Order::create()` (via `Order::$fillable`/`$casts`, already present) — add the DTO property if missing. (Property was missing; added it.)
- [x] 1.3 Verification: extended `tests/Integration/OrderApiTest.php::test_store_order_returns_201` to assert `payment_provider_name`/`payment_provider_icon`/`payment_provider_is_offline` on the create response, for the `'paypal'` provider used in that test's payload. **Passing** (verified via Docker integration run).

## 2. Order API exposes the snapshot

- [x] 2.1 In `app/Resources/Order/OrderResource.php`, added the snapshotted `payment_provider_name`, `payment_provider_icon`, `payment_provider_is_offline` alongside the existing `'payment_provider' => $this->payment_provider` line, reading from `$this->payment_metadata['payment_provider'] ?? null` and falling back gracefully (nulls) when absent.
- [x] 2.2 `app/Resources/Order/OrderListResource.php` also exposes `payment_provider_name`, `payment_provider_icon`, `payment_provider_is_offline` (revised after initial proposal scoped this to the details resource only — user asked for the list resource to carry it too).
- [x] 2.3 Verification: extended `tests/Integration/OrderApiTest.php::test_show_order_returns_resource` and `test_list_orders_returns_paginated_results` to assert the new fields appear in both the show-order and list-orders responses. **Passing**.

## 3. Base-currency payment provider fee derivation

- [x] 3.1 In `app/Managers/OrderManager.php::set_payment_provider_fee()`, loads the order, computes `base_fee` from `$fee` using the order's own `exchange_rate` column, and updates both `invoiced_payment_provider_fee` and `base_payment_provider_fee` in the same `partial_update_order()` call.
- [x] 3.2 Handles the case where `order.currency_code === order.base_currency_code` (no conversion needed, `base_fee = invoiced_fee` directly) consistent with how `convert_amount()` short-circuits for that case elsewhere.
- [x] 3.3 Verification: added `test_set_payment_provider_fee_derives_base_currency_fee` (EUR order, exchange_rate 2.0 → 200 invoiced / 100 base) and `test_set_payment_provider_fee_same_currency_skips_conversion` (USD order, 150/150), calling the `Order` facade (`OrderManager`) directly since this method has no HTTP route of its own — it's only ever invoked internally by gateway webhook handlers. **Both passing**.

## 4. Wire fee capture in bundled gateways

- [x] 4.1 In `app/Payment/Providers/PayPal.php`, added `capture_payment_provider_fee()`, called from `handle_payment_capture_completed()`, reading `seller_receivable_breakdown.paypal_fee.value` and `.currency_code`.
- [x] 4.2 Compares `paypal_fee.currency_code` against the order's `currency_code`; calls `OrderManager::set_payment_provider_fee()` only on a match, silently skips otherwise (no logging facility already in use elsewhere in this class to hook into, so mismatch is a silent no-op rather than a new logging dependency).
- [x] 4.3 Confirmed `payments/kirki-stripe/src/Stripe.php::handle_charge_succeeded()` needs no code change.
- [x] 4.4 Verification: **premise corrected** — PayPal's `webhook()` reads the raw POST body via `file_get_contents('php://input')`, which this repo's REST test harness (`WP_REST_Request`-based, body set via `set_body_params()`) cannot populate, so no HTTP-level webhook test is possible with existing test infrastructure. Added `test_paypal_captures_fee_only_when_currency_matches_order`, invoking the protected `capture_payment_provider_fee()` method directly via `ReflectionMethod` with synthetic match/mismatch payloads. **Passing** (asserts fee stays 0 on currency mismatch, becomes 330 on match).

## 5. Fix `PaymentManager::pay()` stale attribute bug

- [x] 5.1 In `app/Payment/PaymentManager.php::pay()`, changed `$this->get_provider($order->payment_method)` to `$this->get_provider($order->payment_provider)`.
- [x] 5.2 Verification: **premise corrected** — no existing route exercises `PaymentManager::pay()` or `Site\Order\OrderResource` directly, and PayPal's real `pay()` makes live HTTP calls that would fail regardless of the fix. Added `test_pay_resolves_provider_using_payment_provider_attribute`, calling `PaymentManager::pay()` directly via the container and asserting it throws PayPal's "PayPal is not enabled." exception — proving the gateway *was* resolved and invoked (pre-fix it silently returned `null` instead, since `payment_method` doesn't exist on `Order`). **Passing**.

## 6. Final verification

- [x] 6.1 Ran the full backend suite: `composer test` (`bash kirki-test all`, Docker). **288 tests, 271 passing.** All 8 tests this change touches or adds are green. The 17 remaining failures are pre-existing and unrelated — see note below.
- [x] 6.2 Manually confirmed the new `OrderResource` fields match what a details-page "Payment" panel would need to render a provider name/badge; no frontend code was changed.

## 7. Shipping method snapshot on order creation (added after initial implementation, user-requested extension of the same pattern)

- [x] 7.1 `database/migrations/CreateOrdersTable.php`: added `$table->text('shipping_metadata')->nullable();` after `shipping_method` — no spare unused column existed for shipping the way `payment_metadata` did for payments, so this needed a genuine new column (edited directly on the create migration, plugin unpublished, no alter-migration convention exists yet in this repo).
- [x] 7.2 `app/Models/Order.php`: added `shipping_metadata` to `$fillable` and cast it `json`.
- [x] 7.3 `app/DTO/Order/CreateOrderDTO.php`: added `public $shipping_metadata;` (mirrors `payment_metadata`). Deliberately NOT added to `UpdateOrderDTO` — same immutability property as the payment snapshot: `Order::update()` only writes keys present in the update payload, so a field absent from `UpdateOrderDTO` is never touched after creation.
- [x] 7.4 `app/Actions/Order/CreateOrderAction.php`: added `build_shipping_method_snapshot(CalculationContextDTO $context)`, calling `$this->shipping_service->get_selected_shipping_method($context)` (already resolves `['id','name','type','base_cost']` from the same settings the cost calculation reads — previously only `base_cost` was ever extracted, `name`/`type` were computed and silently discarded) and setting `$order_dto->shipping_metadata = ['shipping_method' => ['id','name','type']]`. Returns `null` gracefully if the method doesn't resolve (shouldn't happen — `execute()` already gates on `has_valid_shipping_method($context)` before this runs — but matches the payment snapshot's defensive-null pattern).
- [x] 7.5 `app/Resources/Order/OrderResource.php`: added `shipping_method_name`/`shipping_method_type` alongside the existing `shipping_method` id.
- [x] 7.6 `app/Resources/Order/OrderListResource.php`: added `shipping_method`/`shipping_method_name` (this resource had no `shipping_method` field at all before, unlike the details resource).
- [x] 7.7 Verification: extended `test_store_order_returns_201`, `test_show_order_returns_resource`, and `test_list_orders_returns_paginated_results` to assert `shipping_method_name === 'Standard Delivery'` / `shipping_method_type === 'flat_rate'` (the fixture seeded by `SeedsTestShipping::seed_shipping_settings()`). **All passing** — full `OrderApiTest` re-run: 10/12 green, same 2 pre-existing/unrelated failures as before (customer-creation 422, PayPal-not-configured refund); `ProductApiTest` (9/9) and unit suite (117/117) unaffected.
- [x] 7.8 Updated `openspec/changes/order-payment-provider-snapshot/{proposal,design,specs/order-payment-provider/spec}.md` to cover the shipping snapshot, and `docs/ecommerce/orders/*.yml` (Bruno collection examples) to show the new response fields.

## Pre-existing bugs found and fixed along the way (user-approved, out of original proposal scope)

Getting the integration suite to actually run at all — the first time it has ever run in this dev environment — surfaced two unrelated pre-existing defects that were blocking every order/product test. Both were fixed with explicit user sign-off:

1. **`committed_quantity` NOT NULL violation** — `app/DTO/Variant/CreateVariantDTO.php`: `$committed_quantity` defaulted to `null`, and since the sanitizer never injects keys absent from the request, that `null` flowed straight into an insert against a `NOT NULL DEFAULT 0` column, failing on every variant creation under MariaDB's strict mode. Fixed by changing the default to `0` (matching the migration and `ProductSeeder`'s existing precedent). Confirmed fix: `ProductApiTest` went from 2/9 to 9/9 passing.
2. **Null shipping/billing address crash on order creation** — `app/Wordpress/Customer.php`: `get_shipping_address()`/`get_billing_address()` dereferenced `$this->customer->shipping_address` without a null guard (unlike the adjacent `get_customer_id()`, which already does `?? null`). `app/Http/Requests/Order/OrderCreateRequest.php`: even after guarding `Customer.php`, each field's fallback chain (`customer(...)->get_shipping_address()->phone`, etc., for fields not sent in the request — `shipping_address_line2`/`phone`/`email` in this test's payload) still dereferenced a property on the now-null return value outside any `??`'s notice-suppression scope, so it still crashed; added a trailing `?? null` to each of the 20 shipping/billing field fallback expressions so the property access is the direct, isset-protected operand. Verified empirically in a PHP REPL that this specific construct (`$x ?? $obj->prop ?? null`) is notice-free before applying it. Confirmed fix: `test_store_order_returns_201`/`test_show_order_returns_resource` went from 500 to passing.

## Known pre-existing failures, explicitly left unfixed (out of scope)

17 failures remain in `composer test`, all pre-existing and unrelated to payment providers, `committed_quantity`, or shipping addresses — confirmed by their error messages and by the fact none of the affected code was touched this change:

- **Coupon* (7 tests)** and **Customer* (7 tests)**: customer/coupon creation returns 422 (validation error) in this environment. Root cause not investigated — different subsystem, never mentioned in this change's scope.
- **`test_update_order_changes_notes`**: fails via `create_customer()` (same root cause as the Customer* failures above), not via anything related to orders or payment providers.
- **`test_create_refund_on_order`**: fails with "PayPal Refund Error: PayPal is not enabled." — this pre-existing test creates an order with the `'paypal'` provider but never configures PayPal credentials, so a real refund attempt fails. Unrelated to the fee-derivation logic added by this change (which is unit-tested separately and passing).

These look like the same underlying pattern as the two bugs fixed above (code paths nobody had exercised against a real, freshly migrated database before this session) but are in unrelated subsystems (customers/coupons) or require test-fixture work (mocking PayPal) rather than a source fix — flagging for the user as a separate follow-up rather than expanding this change's scope further.
