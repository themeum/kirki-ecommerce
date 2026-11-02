## Why

A review of the payment core and the PayPal gateway found gaps that can cost
money or hide data once real payments flow: a captured payment is trusted
without checking it matches the order, repeated webhooks and repeated "pay"
attempts repeat their side effects, webhook failures leave no trace, a gateway
webhook wipes the order's provider name and icon.

## What Changes

- A "capture completed" webhook marks an order paid only when the captured
  amount and currency match the order. On a mismatch the order is left unpaid
  and put on hold where its status allows it, the event is logged, and the
  webhook is still acknowledged so PayPal does not retry it.
- Webhook handling is repeat-safe: a second delivery of an approval event does
  not fail because the PayPal order is already captured, and a second delivery
  of a completed-refund event does not log the refund again.
- Starting payment for the same order again no longer creates a second PayPal
  order: the create-order request carries an idempotency key derived from the
  order.
- Webhook handlers that change an order run in one database transaction, and a
  failure is logged (event type, event id, error) instead of being swallowed.
- Saving a gateway payload on an order (`set_payment_metadata`) no longer
  replaces the provider snapshot stored in the same column, so paid orders keep
  their provider name, icon and offline flag. The gateway payload is kept under
  its own key.

Out of scope (deliberately deferred): splitting the PayPal order ID and capture
ID that share `payment_transaction_id`, masking gateway secrets in admin API
responses, the shared webhook/event refactor, the required-field check when
enabling a gateway, and the fail-open defaults of `webhook()` / `refund()`.

## Capabilities

### New Capabilities

- `payment-processing-integrity`: what the store guarantees when a gateway
  reports or repeats a payment event: amounts are verified, events are safe to
  repeat, starting payment is idempotent, and handling is atomic and observable.

### Modified Capabilities

- `order-payment-provider`: the provider snapshot on an order must survive later
  writes of gateway payment data.

## Impact

- Backend: `app/Payment/Providers/PayPal.php`, `app/Payment/PaymentProvider.php`,
  `app/Managers/OrderManager.php` (`set_payment_metadata`).
- Add-on gateways: Stripe also calls `set_payment_metadata`, so it picks up the
  snapshot fix with no change.
- API: order payloads gain no new fields, but `payment_metadata` now nests the
  gateway payload under a key.
- No frontend or migration changes.
