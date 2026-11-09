## Why

Merchants in Bangladesh often need one gateway that accepts cards, mobile banking, and
internet banking. Kirki Ecommerce has only bKash for this market, and bKash accepts only its
own wallet. SSLCommerz fills this gap through one hosted payment page.

## What Changes

- Add a new gateway plugin, `payments/kirki-sslcommerz`, that uses the SSLCommerz v4 hosted
  redirect. The customer pays on the SSLCommerz page and returns to the store.
- Add a thin SSLCommerz API client on the framework `Http`. The official PHP library is a
  sample application with unsafe code and no refund code, so this change does not use it.
- Mark an order paid only after the Order Validation API confirms the transaction, and the
  transaction ID, amount, and currency match the order. The customer return, the IPN, and a
  scheduled check all use this one path, under the order lock.
- Send the customer to a store page after the browser POST from SSLCommerz, with no core
  change.
- Check `verify_sign` and log a mismatch. No order state depends on this check.
- Put a payment that SSLCommerz reports as risky in the paid and on-hold state.
- Confirm a failure message with a transaction query before the order changes.
- Send admin refunds to SSLCommerz, keep each accepted refund pending, and complete it from a
  scheduled refund check.
- Allow every currency at checkout, and show the SSLCommerz error when it rejects a currency.
- Add unit tests with fake HTTP, `docs/sslcommerz.md`, and API collection entries.

Out of scope: the EasyCheckout popup, saved cards, recurring charges, EMI, and a merchant
action to run a payment check manually.

## Capabilities

### New Capabilities

- `sslcommerz-payment-gateway`: SSLCommerz settings, starting a payment, the customer return,
  the IPN, payment confirmation, risk handling, failure handling, scheduled checks, and refunds.

### Modified Capabilities

None. The gateway follows the existing `payment-processing-integrity` requirements.

## Impact

- **New code:** `payments/kirki-sslcommerz/` (plugin file, `composer.json`, `assets/logo.svg`,
  `src/`).
- **Core code:** no change. The gateway uses the existing `PaymentProvider` contract, the
  `kirki_ecommerce_payment_providers` filter, the `POST /payment/webhook/{provider_id}` route,
  the framework queue, and `OrderManager::update_refund`.
- **Tests:** new `tests/Unit/Payment/SslcommerzTest.php`, and a new case in
  `tests/Integration/ConcurrencySafetyTest.php`.
- **Docs:** new `docs/sslcommerz.md`, a new row in `docs/payments.md`, and new
  `docs/ecommerce/online-payments/` collection entries.
- **External systems:** SSLCommerz API v4. No live call, refund call, or real IPN delivery has
  been observed yet, so the tasks include sandbox and go-live checks.
- **Dependencies:** no new Composer or npm package.
- **Input needed:** the user must supply the SSLCommerz logo SVG. The gateway build stops
  without `assets/logo.svg`.
