## Why

Orders currently store only the raw `payment_provider` id string. Offline providers are admin-editable/deletable settings entries and online providers are addon-registered classes that can be uninstalled — in both cases the live registry lookup used today can return stale, wrong, or null data by the time anyone looks at an old order. There is no historical record of which provider (name, icon, online/offline) was actually used at checkout, and the order details page has nothing to render. Separately, `base_payment_provider_fee` exists on the schema but nothing ever writes to it, and PayPal never even reads a fee from its webhook — so base-currency fee reporting is silently broken for both bundled gateways.

## What Changes

- Snapshot the payment provider's `id`, `name`, `icon`, and `is_offline` into `orders.payment_metadata` (JSON, under a `payment_provider` key) at order-creation time, resolved from the live registry once and frozen thereafter — for both online and offline providers.
- Expose the snapshotted `id`/`name`/`icon`/`is_offline` in `OrderResource` (order details) alongside the existing raw `payment_provider` id column.
- Make `base_payment_provider_fee` actually get populated: `OrderManager::set_payment_provider_fee()` derives it from `invoiced_payment_provider_fee` using the order's own frozen `exchange_rate`, instead of leaving it at its default of `0`.
- Wire Stripe's existing fee-capture call through the updated setter (no caller-side change needed).
- Add fee capture to PayPal, which currently reads no fee at all: parse `seller_receivable_breakdown.paypal_fee` (+ its `currency_code`) from the capture-completed webhook, skip storing it if the currency doesn't match the order's invoiced currency, and call `OrderManager::set_payment_provider_fee()`.
- **BUGFIX**: `PaymentManager::pay()` reads `$order->payment_method`, an attribute that no longer exists on `Order` (renamed to `payment_provider`) — always resolves no gateway and returns `null`, silently breaking the storefront's online-payment redirect (`payment_next_step` in `Site\Order\OrderResource`). Fix to read `$order->payment_provider`.
- Snapshot the shipping method's `id`, `name`, and `type` into a new `orders.shipping_metadata` JSON column (under a `shipping_method` key) at order-creation time, for the identical reason as the payment provider snapshot — shipping zones/methods are an admin-editable settings blob (`OptionKeys::SHIPPING_SETTINGS`), and `orders.shipping_method` today stores only the raw method id.
- Expose `shipping_method_name`/`shipping_method_type` in both `OrderResource` and `OrderListResource`, alongside the existing raw `shipping_method` id.

## Capabilities

### New Capabilities
- `order-payment-provider`: Order-level payment provider snapshotting (id/name/icon/is_offline captured at order creation, exposed via the order API resource), base-currency payment provider fee tracking (derivation from invoiced fee via the order's frozen exchange rate, populated by both bundled gateways), and shipping method snapshotting (id/name/type captured at order creation, exposed via both the order details and list API resources) — same "freeze mutable config at order time" pattern applied to both order-level references that point at admin-editable settings.

### Modified Capabilities
(none — no existing spec covers orders/payments yet)

## Impact

- **Database**: `payment_metadata` and `base_payment_provider_fee` columns already existed, just unused, so those needed no migration. The shipping snapshot has no equivalent spare column, so `database/migrations/CreateOrdersTable.php` gained a new `shipping_metadata` text/JSON column (edited directly on the create migration, not a separate alter migration, since the plugin is unpublished — see design.md).
- **Backend (`app/`)**:
  - `app/Actions/Order/CreateOrderAction.php` — resolve provider via `Payment::get_provider()` and shipping method via `ShippingService::get_selected_shipping_method()`, setting `payment_metadata`/`shipping_metadata` on the order DTO.
  - `app/Managers/OrderManager.php` — `set_payment_provider_fee()` derives and writes `base_payment_provider_fee`.
  - `app/Resources/Order/OrderResource.php` and `OrderResource/OrderListResource.php` — expose snapshotted provider and shipping method fields.
  - `app/Payment/Providers/PayPal.php` — new fee read from the capture-completed webhook.
  - `app/Payment/PaymentManager.php` — `pay()` bug fix.
- **Addon (`payments/kirki-stripe/`)**: no code change expected beyond inheriting the manager-side base-fee derivation.
- **No frontend/breaking API changes** — `payment_metadata`/`shipping_metadata` and their resource fields are additive to `OrderResource`/`OrderListResource`'s JSON output; existing consumers are unaffected. This plugin is not yet published, so there is no production order data to backfill.
- **Docs**: `docs/ecommerce/orders/*.yml` (Bruno API collection examples) updated to reflect the new response fields.
