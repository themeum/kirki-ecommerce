## Why

Kirki Ecommerce has no payment gateway for the Bangladeshi market, where bKash is
the main mobile wallet. Merchants who sell in BDT cannot take a bKash payment from
a customer.

## What Changes

- Add a new gateway plugin, `payments/kirki-bkash`, that uses bKash Tokenized
  Checkout without agreement, API v2. The customer pays on the bKash hosted page
  and returns to the store.
- Add a thin bKash API client on the framework `Http`. bKash publishes no official
  PHP SDK, so this change adds no SDK dependency.
- Keep bKash tokens in the framework `Cache`, with one renewal at a time, because
  bKash allows Grant and Refresh only twice per hour.
- Confirm a payment on the customer return: Query, then Execute, then Query again
  when the Execute result is unknown. An order becomes paid only when bKash reports
  `Completed` and the amount and currency match the order.
- Declare BDT as the only bKash currency, through the core rule in the
  `gateway-currency-restrictions` change. Checkout then hides bKash for another
  currency, and the store creates no order. The check in `pay()` stays as a last guard.
- Add a Query-only scheduled job. `pay()` schedules it, and it marks an order paid when
  bKash reports `Completed` after the customer return did not settle the order. The job
  never calls Execute.
- Lock the order while a payment settles, because the customer return and the job can
  run at the same time.
- Send admin refunds to bKash, and check Refund Status when the refund call has no
  clear result.
- Add unit tests with fake HTTP, `docs/bkash.md`, and API collection entries.
- Narrow the existing idempotency requirement: the bKash Create Payment API has no
  idempotency key, so bKash uses a different protection against double payment.

Out of scope: agreement-based (saved wallet) payments, Instant Payment Notification
(IPN), a late Execute for a customer who did not return, callback `signature` checks,
and provider fee tracking.

## Capabilities

### New Capabilities

- `bkash-payment-gateway`: bKash settings, starting a payment, confirming it on the
  customer return, token renewal limits, and refunds.

### Modified Capabilities

- `payment-processing-integrity`: the requirement "Starting payment for an order is
  idempotent" applies only when the gateway API supports an idempotency key. A
  gateway without one must make sure that only the latest payment of an order can
  complete.

## Impact

- **New code:** `payments/kirki-bkash/` (plugin file, `composer.json`,
  `assets/logo.svg`, `src/`).
- **Core code:** no change in this change. The gateway uses the existing
  `PaymentProvider` contract, `kirki_ecommerce_payment_providers` filter,
  `GET /payment/webhook/{provider_id}` return route, and framework queue.
- **Depends on:** `gateway-currency-restrictions`, which must merge first. It adds the
  currency method, and it stops `pay()` from running on page views. Without that fix, each
  page view of an unpaid order would create a new payment and schedule a new job.
- **Tests:** new `tests/Unit/Payment/BkashTest.php`. This is the first test file for
  a gateway under `payments/`.
- **Docs:** new `docs/bkash.md`, and new `docs/ecommerce/online-payments/` collection
  entries.
- **External systems:** bKash API v2. The bKash docs publish only the sandbox host.
  The live host comes from a third-party listing, and a go-live task must confirm it.
- **Dependencies:** no new Composer or npm package.
- **Input needed:** the user supplied the bKash SVG.
