# Proposal

## Why

Each order stores its own `base_currency_code` and its `base_*` amounts in that currency. When the store changes its base currency later, the old orders keep amounts in the old base currency. An edit recalculates an order with the current base currency and writes the current `base_currency_code` back to the order, while untouched amounts stay in the old currency. This corrupts the order. Editing such an order must stop.

The order payloads have a second problem with the same cause. They format every `base_*` amount without a currency, so Money falls back to the store's current base currency. After a base currency change, an old order's amounts show the new currency symbol with the old numbers. The payloads must use the order's own stored currency.

## What Changes

- An order is editable only when its stored `base_currency_code` equals the store's current base currency, in addition to the existing payment, cancellation and fulfillment rules.
- `Order::is_editable()` is the single place for the rule. The order calculation preview, the edit read, the order update endpoint and the `is_editable` flag in the order detail and order list payloads all follow it. A refused edit returns the existing 422 error and message.
- Every `base_*` money object in the admin order detail payload, the admin order list row and the storefront order list row uses the order's stored `base_currency_code`, in place of the default base currency. Amounts do not change. Resources that have no stored currency (products, variants, coupons, customer totals, shipping options, new-order calculation) keep the default fallback as it is.
- No schema change. No frontend change: the admin SPA already blocks the edit page and hides the edit button when `is_editable` is false.
- **Behaviour change for existing stores:** an unpaid, open order placed in a previous base currency was editable before. It is not editable after this change. The order stays viewable, payable, cancellable and refundable. If the store switches back to the old base currency, the order becomes editable again.

## Capabilities

### New Capabilities

- `order-base-currency-amounts`: order payloads state every base-currency amount in the order's own base currency.

### Modified Capabilities

- `admin-order-pricing-breakdown`: the base-currency amounts of the admin order payload are in the order's own base currency, not the store's current one.
- `order-editing`: the editability rule gains a base-currency condition. The rule no longer depends on the order's own fields only. The rejection requirement gets scenarios for this case.

## Impact

- `app/Models/Order.php`: one added condition in `is_editable()`. `OrderService` and `UpdateOrderAction` already refuse through `is_editable()` and do not change.
- `app/Resources/Order/OrderResource.php`, `app/Resources/Order/OrderListResource.php`, `app/Resources/Site/Order/OrderListResource.php`: pass `$this->base_currency_code` to every `base_*` money call.
- REST: `is_editable` values change for old-base-currency orders. Response shapes and route paths do not change. The currency code inside the `base_*` money objects of an old-base-currency order changes to the order's own code. The preview and update routes return 422 for these orders.
- Docs: `docs/order-editing.md` (section 2 "When an order can be edited" and section 10 "Errors"), `docs/currencies.md` (section 3) and `docs/order-data-and-calculations.md` (section 2) change in the same change.
- Backward compatibility (CLAUDE.md 4.5): this changes behaviour for existing stores. The user confirmed it in the explore discussion before this proposal.
