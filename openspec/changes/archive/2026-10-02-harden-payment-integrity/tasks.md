## 1. Provider snapshot survives gateway data

- [x] 1.1 In `OrderManager::set_payment_metadata()`, decode the incoming JSON, merge it under a `gateway` key into the stored array, and save the array (preserving `payment_provider`) → verify: an order's provider name and icon are unchanged after the call
- [x] 1.2 Add Integration tests: snapshot kept after a gateway write, gateway data stored under `gateway`, second write replaces `gateway` and keeps the snapshot, order list and details still report the provider
- [x] 1.3 Run `composer test`, then `npm run typecheck && npm test` in `resources/app/`

## 2. PayPal webhook integrity

- [x] 2.1 Compare `resource.amount` (minor units and currency) with the order in `handle_payment_capture_completed()`; on a mismatch skip paying, save the payload, call `mark_as_on_hold()`, log it, and return success → verify: lower amount and wrong currency both leave the order unpaid
- [x] 2.2 In `capture_order()`, return the decoded response when PayPal answers `ORDER_ALREADY_CAPTURED` instead of throwing; skip the capture in `handle_checkout_order_approved()` when the matching order is already paid
- [x] 2.3 In `handle_payment_capture_refunded()`, return without updating when the refund is already completed with the same refund id
- [x] 2.4 Wrap the capture-completed handler in a database transaction (only that one: transactions do not nest and the refund action already has its own, see design), roll back and log on failure (event type, event id, message; no payload), and keep returning `false` so PayPal redelivers; log with `error_log()` and the repo's justified `phpcs:ignore`
- [x] 2.5 Extend `tests/Unit/Payment/PayPalWebhookTest.php`: matching amount pays, lower amount and wrong currency do not, approval delivered twice, refund-completed delivered twice, capture-completed delivered twice, rollback and log on a mid-handler failure, unknown event type changes nothing
- [x] 2.6 Run `composer test`, then `npm run typecheck && npm test` in `resources/app/`

## 3. PayPal create-order idempotency

- [x] 3.1 Send `PayPal-Request-Id: kirki-paypal-<order uuid>` on the create-order request in `PayPal::pay()` → verify: two calls for one order carry the same key, two orders carry different keys
- [x] 3.2 Add tests for both cases (Integration, `PayPalCreateOrderTest`, not the unit file: `pay()` needs WordPress URL helpers the unit bootstrap does not stub, so it runs against the real container with a recording fake HTTP client)
- [x] 3.3 Run `composer test`, then `npm run typecheck && npm test` in `resources/app/`

## 4. Final checks

- [x] 4.1 Run `composer phpcs:wporg` and `composer phpcs:docblocks` on the changed files, and `openspec validate harden-payment-integrity`
- [x] 4.2 In `docs/ecommerce/online-payments/` (`get-by-id-6.yml` and the `Edit/*.yml` files), replace literal secret values, including the `sk_test_...` Stripe key, with placeholders in request and response examples (done for every secret-named field in `online-payments/`: 78 values in 12 files, covering Stripe, Klarna, Square, PayU, 2Checkout, PayMongo, Paystack, QuickPay, Authorize.Net, Eway and Redsys; publishable keys left as they are)
