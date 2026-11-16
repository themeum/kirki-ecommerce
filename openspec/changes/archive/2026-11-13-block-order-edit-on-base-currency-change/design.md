# Design

## Context

- `orders.base_currency_code` is stored per order (required column). All `base_*` amounts of the order, its items, coupons and taxes are in that currency. See proposal.md - Why.
- `UpdateOrderAction` reads the current base currency in its constructor and writes it to the order on every save (`$order_dto->base_currency_code`). It also converts `invoiced_*` amounts from the current base currency. On an old-base-currency order this mixes currencies.
- Editability is decided in one method, `Order::is_editable()`. Three callers depend on it:
  - the `is_editable` flag in `OrderResource` and `OrderListResource`,
  - `OrderService::find_editable_order_or_fail()`, used by the edit read (`OrderController`) and the preview (`OrderCalculationController`),
  - the in-transaction check in `UpdateOrderAction::execute()`.
- The admin SPA already blocks the edit screen and hides the edit button when `is_editable` is false (`order-form.tsx`, `order-details.tsx`).
- `Money::get_base_currency()` (`MoneyManager`) returns a code held in a property. It runs no query.

## Goals / Non-Goals

**Goals:**
- One rule, one place. Flag, preview, read and save never disagree.
- The save is checked inside the lock, so a base-currency change between preview and save is caught.

**Non-Goals:**
- Re-pricing or migrating old orders to the new base currency.
- Blocking refunds, cancellation, payment or fulfillment of old orders. They already use the order's stored currency.
- A message that names the base currency, or a `reason` field in the payload. A refused edit uses the existing 422 error and message.
- `base_*` money objects of resources with no stored currency, and the customer "amount spent" sum.

## Decisions

**1. Add the condition to `Order::is_editable()`, inline.**
`is_editable()` gets one more condition: `$this->base_currency_code === Money::get_base_currency()`. Every caller already refuses through `is_editable()`, so no other production code changes.
- Alternative: check in `UpdateOrderAction` only. Rejected: the flag, the preview and the edit read would still say the order is editable, and the UI would let the admin start an edit that fails on save.
- Alternative: a stored `is_editable` column. Rejected: it needs a schema change and a backfill when the base currency changes, and it goes stale.
- Alternative (tried, then removed): a service method that picks a base-currency-specific error message, with a helper on the model. Rejected: the specific message is not needed, and the method and helper added code for no behaviour the callers need.

**2. Pass the order's stored currency to every `base_*` money call in the order resources.**
`Money::prepare_amount_object_from_minor($amount, $this->base_currency_code)` replaces the one-argument call. The second argument already exists, and `CartResource` already uses it with the cart's `base_currency_code`. No new API.
- Only order payloads change. Products, variants, coupons, shipping options, the new-order calculation and the customer "amount spent" sum have no stored currency, so they keep the default fallback. The customer sum adds amounts of many orders and needs its own decision.
- Alternative: convert old order amounts to the new base currency. Rejected: it needs the historical rate and changes stored meaning; the order keeps what the customer paid.
- `prepare_unit_amount_object()` already takes a currency argument; the order resource now passes the stored code instead of `null`.

**3. No change to the update flow after the guard.**
`UpdateOrderAction` keeps writing `base_currency_code`. After the guard the stored and current values are equal, so the write is a no-op. Removing the write is out of scope.

**4. Existing tests build an `Order` without `base_currency_code`.**
`tests/Unit/Models/OrderEditableTest.php` makes orders with no base currency. After this change those orders are not editable. The test helper sets `base_currency_code` to the current base currency, and the unit test case binds a known base currency.

## Risks / Trade-offs

- [Admin cannot fix an old unpaid order after a base-currency change] → The order can still be paid, cancelled or refunded. Switching the base currency back makes it editable again. The docs say why.
- [A refused edit gives the generic "This order can no longer be edited." message, which does not name the cause] → Accepted. The edit screen and the order detail page already hide the edit action through `is_editable`. The docs state the cause.
- [`Money::get_base_currency()` is read once per `is_editable()` call; a list page calls it per row] → It reads a property, so the cost is negligible. The call is skipped when an earlier condition already fails.
- [Behaviour change for existing stores] → Recorded in proposal.md. The user confirmed it in the explore discussion.

## Migration Plan

No data migration. No schema change. Deploy the code. Orders in an old base currency become non-editable at once. Rollback is a code revert, with no data to restore.
