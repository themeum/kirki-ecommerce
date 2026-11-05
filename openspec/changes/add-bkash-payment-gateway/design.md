## Context

See `proposal.md` for the motivation, and `specs/` for the required behaviour.

Facts that shape the design:

- **Gateway pattern.** Each gateway in `payments/` is a plugin with a `PaymentProvider`
  subclass, a client, a constants class and a builder. It registers through
  `DevHookNames::PAYMENT_PROVIDERS`. `kirki-eway` is the closest model: it has a hosted
  page and it confirms in `handle_return()` on `GET /payment/webhook/{provider_id}`.
- **bKash API (v2), from the docs at `developer.bka.sh`.**
  - Grant and Refresh are limited to twice per hour. More calls block refresh for one
    hour. `id_token` lives 60 minutes, and `refresh_token` lives 30 days.
  - `paymentId` lives 24 hours and allows one Execute attempt, whatever the result.
  - The docs treat a payment as complete only after Execute or a `Completed` Query.
  - All calls use a 30-second timeout.
  - Refunds: up to 10 partial refunds, within 60 days, with no duplicate in 10 minutes.
- **Field names differ between endpoints.** The callback uses `paymentID`, and JSON
  uses `paymentId`. Execute returns `merchantInvoiceNumber`, and Query returns
  `merchantInvoice`. Errors carry `externalCode` and `errorMessageEn`.
- **Framework limits.**
  - `Cache::lock()` has `get()` but no blocking wait. See Decision 3.
  - `Http` returns a `Response` and does not throw. For a connection error, `failed()`
    is true and `status()` is 0.
- **Core behaviour.**
  - `CreateRefundAction` ignores the return value of `refund()`. Only a thrown exception
    rolls back the local refund.
  - `set_payment_metadata()` writes to the `gateway` key and keeps the provider snapshot.
  - `order-failed.php` shows "Payment Failed" and a "Try Again" link to checkout.
- **Tests** run on PHP 7.4 in Docker, so the plugin must not use PHP 8 syntax.

## Goals / Non-Goals

**Goals:**

- No path marks an order paid without a server-side `Completed` and a matching amount.
- No path uses a `paymentId` before the store proves that it belongs to an order.
- Token renewal cannot reach the bKash rate limit under concurrent checkouts.

**Non-Goals:**

- Core changes. Nothing outside the new plugin changes at runtime.
- A shared gateway test harness. `BkashTest` stays self-contained.
- Provider fee tracking. Only Query returns `serviceFee`, and an extra call on each
  payment is not justified now.

## Decisions

### 1. Own thin client, no SDK

bKash publishes no official PHP SDK. Its org has a WooCommerce plugin, and its README
says that the code is not guaranteed for production use. Third-party packages are
Laravel-bound or unofficial, and many target v1.2.0-beta. `BkashClient` uses the
framework `Http`, as `CLAUDE.md` §2a requires, and as most other gateways do.

The client maps each response to one of three outcomes:

| Outcome | Condition |
|---|---|
| Success | The response is JSON and has no `externalCode` |
| Rejected | The response is JSON and has `externalCode`, at a status below 500 |
| Unknown | Connection error, timeout, 5xx response, or non-JSON body |

`BkashRejectedException` and `BkashUnknownResultException` carry the two failure
outcomes, so that the caller does not parse them. The difference matters because
Rejected is final, and Unknown can mean that the money moved.

*Alternative:* treat all failures alike, as the other gateways do. This is not safe here,
because the Query fallback and the mark-as-failed path depend on the difference.

### 2. Hosts and API version in constants

`BkashConstant` holds the v2 sandbox and live base URLs. There is no version setting. The
live URL is not in the bKash docs, so it is a go-live check.

*Alternative:* a setting for v1.2.0-beta, as in the official plugin. Rejected: it adds a
second code path with different paths and fields, and no one asked for it.

### 3. Token store: Cache with a non-blocking lock

`BkashClient` stores `{id_token, refresh_token, issued_at}` under a cache key that hashes
the environment and the App Key.

```
token age < 50 min  -> use it
otherwise, Cache::lock(key, 60)->get(fn: re-read, then Refresh, or Grant if no
                                        refresh token or if Refresh is rejected)
lock busy           -> token age < 60 min: use the current token
                       no usable token: throw, and the customer can try again
renewal fails       -> token age < 60 min: use the current token; otherwise throw
```

**Correction to the grill.** The grill said that "the others wait and read the new token".
The framework lock has no blocking wait. A non-blocking design is simpler and needs no
framework change:

- During a Refresh, the old token still works for up to 10 minutes.
- Only a cold start with no token can make a concurrent customer see an error. One retry
  then fixes it.

A `sleep` loop would hold a PHP worker for up to 30 seconds for this rare case.

The refresh token stays in the cache. If an object cache flush loses it, the next call
uses one Grant, which is within the limit.

*Alternative:* add `block()` to the framework lock. Not needed for this change.

### 4. Return flow: Query first, then Execute

`handle_return()` is one linear path, so that a forged or stale URL cannot use up a
`paymentId`:

```
paymentID missing            -> home page
Query(paymentID)
  Unknown                    -> no order is known. Log it, home page. Execute has not run.
  Rejected, or invoice has no order -> home page
order found by merchantInvoice
order already paid           -> success page
paymentID != stored paymentId -> log, failed page. No order change.
status != success            -> failed page. No order change.
Query says Completed         -> settle
otherwise Execute(paymentID)
  Success                    -> settle
  Rejected, already complete -> Query -> settle if Completed
  Rejected, other            -> mark failed, failed page
  Unknown                    -> Query
      Completed              -> settle
      otherwise              -> log critical, success page (see Decision 6)
```

`settle` checks the amount and currency:

- **Match:** in one DB transaction, `set_transaction_id`, `set_payment_metadata`, and
  `mark_payment_as_paid`.
- **Mismatch:** `set_payment_metadata`, `mark_as_on_hold`, and a log entry, as in PayPal's
  `hold_order_for_unmatched_capture`. Then the failed page.

"Already complete" means the codes `2062`, `2068` and `2117`.

Amounts are compared after both values are formatted to two decimals. Metadata excludes
`payerAccount`, because the store does not need the wallet number.

*Alternative:* Execute first, and find the order from the Execute response, as in the
grill summary. Query first keeps the agreed rule (the order comes from the bKash response)
and adds one call. In exchange, a request with a stale `paymentId` cannot use up its single
Execute attempt.

*Alternative:* put the order UUID in `callbackURL`. Rejected: bKash appends
`?paymentID=...`, so an existing query string would produce a malformed URL.

### 5. Signature is not enforced

The docs give no algorithm. The value is ignored, and the server-side rules protect the
order. See the spec requirement on confirmed payments.

### 6. Case C goes to the success page, not the failed page

When Execute and Query both have no result, the money may have moved. The failed page says
"Payment Failed" and offers "Try Again", which can charge the customer twice. The success
page shows the order and offers no new payment. The order stays unpaid, and a critical log
entry has the `paymentId`, so the merchant can check the bKash panel.

This choice has a cost: the success page can suggest that the payment is complete. It is
less harmful than a double charge. This case needs two failures in a row.

### 7. Only the latest payment can complete

bKash has no idempotency key, so a second Create Payment gives a second `paymentId`. The
order stores only the latest one, and Decision 4 executes only that one. An approved older
payment never gets Execute, so bKash does not complete it. This is the basis of the
`payment-processing-integrity` delta.

### 8. Refund: outcome-based, with count matching

`refund()` reads `paymentId` from `payment_metadata['gateway']` and `trxId` from
`payment_transaction_id`.

| Refund API outcome | Action |
|---|---|
| Success with `Completed` | Return `true` |
| Rejected | Throw with the bKash message |
| Unknown | Call Refund Status |

A status match is a `Completed` entry count for this amount that is higher than the count
of earlier local refunds of this amount. The current refund row already exists, because
`CreateRefundAction` creates it first, so the calculation excludes it.

*Alternative:* compare `completedTime` with the request time. Rejected: the sample
timestamps have inconsistent formats and zones.

### 9. `webhook()` is not overridden

The base method does nothing and returns `true`. IPN is out of scope, so a POST request
cannot change an order.

### 10. Currency check and test location

`pay()` rejects a non-BDT order first, as `kirki-authorizenet` does. Tests are in
`tests/Unit/Payment/BkashTest.php` and load the plugin classes with `require_once`, as
`EscapedOutputTest` does. They use the fake HTTP style of `PayPalWebhookTest`.

## Risks / Trade-offs

- **The live URL is wrong** → The bKash docs do not publish it. `tokenized.pay.bka.sh`
  returned HTTP 400 to an empty POST, which shows only that the path exists. A go-live task
  confirms it with bKash. The fix is one constant.
- **Authorization format** → The docs say "Bearer token", but the samples send the bare
  `id_token`. The client follows the samples. The sandbox run confirms this.
- **Query field names** → `merchantInvoice` and the other fields come from the docs only.
  The sandbox run confirms them.
- **Refund Status `trxId`** → The docs describe a refund request ID, but the sample uses
  the original transaction ID. The client follows the sample. The sandbox run confirms this.
- **Plain permalinks** → On such a site, `rest_url()` gives `?rest_route=...`, and bKash
  appending `?paymentID=` can break the return URL. `docs/bkash.md` states that pretty
  permalinks are required. `pay()` does not check this.
- **Case C** → The order stays unpaid while the money may have moved. The logs and docs
  state this. A retry job is a possible later change.
- **Customer closes the browser after approval** → Execute never runs, so the payment does
  not complete. This is safe, and the order stays unpaid.
- **Refund succeeds at bKash, but a later local step fails** → `CreateRefundAction` rolls
  back and the local record is lost. This is existing behaviour for all gateways. The
  change does not address it.
- **Query adds one call per return** → It adds latency to the customer return. The docs
  state no Query limit. This is acceptable.
- **Logo** → The user supplies the file. If the file is missing, `icon_url()` returns an
  empty string, so the gateway still works, with no icon.

## Corrections during implementation

- **Decision 1:** a 5xx response is always Unknown, also when it has `externalCode`. The
  docs list `503` for maintenance, and treating it as Rejected would mark an order failed
  when Execute may not have a final result. The table is updated.
- **Decision 4:** an Execute response with no error and no `Completed` status goes to the
  Query path, because it is not a final result. The same applies to an already-complete
  rejection when Query then does not report `Completed`.
- **Decision 4:** if the order update fails after bKash reports `Completed`, the change
  rolls back, logs at critical level, and sends the customer to the success page. This is
  the same risk as case C.
- **Settings:** `app_secret` and `password` use `Sanitizer::TRIM`. `Sanitizer::TEXT` removes
  sequences such as `<a` and can change a credential.
- **Stored data:** metadata uses an allow-list, not only an exclusion of `payerAccount`, so a
  new or undocumented wallet field is not stored.
- **Tests:** `tests/Support/StubsWordPressFunctions.php` gets stubs for `DAY_IN_SECONDS`,
  `home_url` and `add_query_arg`. This is one more changed file than the plan listed.
- **phpcs:** `phpcs-wporg.xml.dist` excludes `payments/*`, so a normal run checks nothing here.
  The check used a temporary copy of the config without that exclude. To pass it, the plugin
  uses `throw_anyway()` as `app/` does, and `defined('ABSPATH') || exit;` in the plugin file.
