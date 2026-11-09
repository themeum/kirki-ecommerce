## Context

See `proposal.md` for the motivation and `specs/` for the required behaviour.

Facts that shape the design:

- **Gateway pattern.** `payments/kirki-bkash` is the closest model: a `PaymentProvider` subclass,
  a thin client, a constants class, a builder, and a check job that calls the provider.
- **SSLCommerz API v4.**
  - Session: `POST /gwprocess/v4/api.php`. A failure is HTTP 200 with `status=FAILED`.
  - Validation, query, and refund are GET calls with `store_passwd` in the URL.
  - The customer return is a cross-site browser POST. `SameSite=Lax` cookies do not arrive.
  - `VALIDATED` means only that someone called the validator before. It gives no idempotency.
  - `amount` is the BDT value. `currency_amount` and `currency_type` are the values that the store
    sent.
  - The docs state no IPN retry policy, no session lifetime, and no partial refund rules.
- **Core routes.** `POST /payment/webhook/{id}` calls `webhook()`, which gets no request, and it
  returns JSON. `RedirectResponse::send()` ends the request, so `webhook()` can redirect.
- **Core payment flow.** `pay()` runs once for each order. "Try Again" goes to checkout and makes a
  new order. So each order has one SSLCommerz attempt.
- **Core refund flow.** `CreateRefundAction` holds a transaction and the order lock while it calls
  `refund()`, and a thrown exception removes the refund row. A refund row has `status` and
  `refund_id`, and `OrderManager::update_refund` completes it, as PayPal does.
- **Order states.** From `pending`: hold, then paid, gives `on_hold_paid`. From `failed_unfulfilled`:
  hold, then paid, gives `paid_processing`. Paid, then hold, gives `on_hold_paid`.
- **Framework.** `Superglobals::post()` with no key returns the whole unslashed array, which the
  hash needs. `Http` returns a `Response` and does not throw.
- **Tests** run on PHP 7.4 in Docker, so the plugin must not use PHP 8 syntax.

## Goals / Non-Goals

**Goals:**

- No path marks an order paid without a matching Order Validation response.
- A forged request cannot change an order or fail a real payment.
- A lost return and a lost IPN do not lose a payment.
- The store password does not reach a log, a note, or an error.

**Non-Goals:**

- Core changes.
- EasyCheckout, saved cards, recurring charges, EMI, and provider fee tracking.
- A manual "check payment" action in the admin.

## Decisions

### 1. Own thin client, no SDK

The official PHP library is a sample application with no Composer package, SQL injection in its
samples, and no refund code. `SslcommerzClient` uses the framework `Http`, as `CLAUDE.md` §2a
requires. It has `create_session`, `validate`, `query_by_tran_id`, `refund`, and `query_refund`.

The client maps each response to one of three outcomes, as bKash does:

| Outcome | Condition |
|---|---|
| Success | HTTP 200 with JSON, and `APIConnect` is `DONE` when present |
| Rejected | HTTP 200 with JSON, and a final error status |
| Unknown | Connection error, timeout, other HTTP status, non-JSON body, or another `APIConnect` |

`SslcommerzRejectedException` and `SslcommerzUnknownResultException` carry the two failure outcomes,
because Unknown can mean that the money moved. Exception messages use the path and the SSLCommerz
reason only. They never hold the query string.

### 2. Hosts in constants

`SslcommerzConstant` holds the two hosts, all paths, statuses, field limits, and check delays. There
is no version setting, because v4 is the only current public version.

### 3. Return and IPN share `webhook()`, with no core change

Each return URL is `webhook_url()` with `sslcommerz_return=success`, `fail`, or `cancel`. No order
data goes in the URL. `ipn_url` is `webhook_url()` with no argument.

```
webhook()
  $request = Request::capture()
  sslcommerz_return is present -> $this->handle_browser_return($request)->send()   // 303, exit
  otherwise                    -> return $this->handle_ipn($request)
```

`handle_browser_return()` catches every `Throwable` and returns a `RedirectResponse`, so a customer
never sees JSON, and tests can run it without the `exit`. It uses `redirect($url, 303)`.

*Alternative:* a core change so that `handle()` sends a `RedirectResponse`. Rejected: the plugin
would need a new core version.

### 4. State is in `payment_metadata`, and `tran_id` holds the order ID

```
tran_id = "{order_id}-{12 random hex characters}"
metadata.gateway = { tran_id, sessionkey, amount, currency,
                     val_id, bank_tran_id, risk_level, risk_title, currency_rate, store_amount }
```

`find_order_for_tran_id()` reads the digits before the `-`, loads the order, and requires
`hash_equals(stored, posted)`. A missing or different value means "no order". There is no metadata
search and no new table.

`set_payment_metadata` replaces the `gateway` key, so each write merges with the current value.

*Alternative:* an attempts table. Rejected: each order has one attempt.

### 5. One settlement path

```
confirm(order, val_id)
  validate(val_id)                       // no lock during HTTP
    Unknown                              -> UNKNOWN
    status not VALID or VALIDATED        -> NOT_CONFIRMED
    response tran_id != stored tran_id   -> NOT_CONFIRMED, log
  apply_settlement(order_id, response)   // lock_order, read again

apply_settlement_to_locked_order
  settled, same val_id                   -> ALREADY_PAID
  settled, other val_id                  -> ALREADY_PAID, critical log (double payment)
  cancelled                              -> CANCELLED, critical log
  amount or currency differs             -> store fields, hold, critical log -> HELD
  risk_level === "0"                     -> store fields, set_transaction_id, mark paid -> PAID
  otherwise                              -> store fields, set_transaction_id, risk transition -> PAID
```

A browser return maps `PAID` and `ALREADY_PAID` to the success page, `HELD` and `CANCELLED` to the
failed page, and `UNKNOWN` to the success page with a critical log entry. The reason for `UNKNOWN`
is the same as bKash Decision 6: the failed page offers a new payment, and the money may have moved.

"Settled" means paid, refunding, or refunded. Amounts are compared after both values are formatted
to two decimals. The bank transaction ID becomes the order transaction ID, because core calls
`refund()` only when that field has a value.

**Compare target.** The comparison uses the current order total and currency, not the stored
snapshot. The research proposed the snapshot, but `payment-processing-integrity` requires a
comparison with the order total. An order edited after payment starts therefore goes on hold, and
the merchant reviews it. The stored `amount` and `currency` are for the log entry and for audit.

### 6. Risk transition depends on the current state

Risk handling must end in `on_hold_paid`. From `failed_unfulfilled`, hold then paid gives
`paid_processing`, so that order goes paid and then hold. Other orders go hold and then paid, so that
the order is on hold when the paid step runs. A test covers both start states.

The response value is compared as a string, so `0` and `"0"` are low risk, and a missing value is
not.

### 7. Failure path

```
failure message
  order is settled                 -> success page, no query
  query_by_tran_id
    Unknown                        -> no change
    element is VALID or VALIDATED  -> confirm(order, element.val_id)
    element is PENDING             -> no change
    otherwise                      -> lock, read again, mark failed if not settled
  browser return                   -> failed page, unless the order is settled
```

A failed order stays open to a late success, because `failed_unfulfilled` allows `mark-as-paid`, and
the check job continues. The job is the protection if a forged failure names a real `tran_id`.

### 8. Payment check job

`SslcommerzPaymentCheckJob` has scalar values: the order ID, the `tran_id`, and the check number. It
calls `Sslcommerz::run_payment_check`, so that unit tests run with no queue. It has the same delays
as bKash: `[300, 600, 2700, 18000, 64800]`. A queue error writes a log entry and does not stop the
payment.

```
order settled                 -> stop, no query
job tran_id != stored tran_id -> query; a confirmed success gets a critical log; no order change; stop
query by tran_id
  Unknown                     -> next check
  success element             -> confirm(order, element.val_id)
  otherwise                   -> next check
last check, no success        -> log entry, order unchanged
```

The job scans all elements, because the docs do not define their order.

### 9. Signature is a signal

`verify_sign` uses the official SSLCommerz MD5 algorithm, on raw `Superglobals::post()` values, with
`hash_equals`. A mismatch writes a warning. The result has no other use. The test vector is the
official Python vector, not the doc sample, which does not reproduce.

### 10. Refund

`refund()` uses `payment_transaction_id` as `bank_tran_id`.

```
refund_trans_id = "{order_id}-{count of earlier refunds}-{amount in minor units}"

success    -> $refund->update(refund_id = refund_ref_id), stays pending, schedule check
processing -> throw: a refund has already started
failed     -> throw errorReason
Unknown    -> throw: check the SSLCommerz panel before you try again
```

The value is deterministic, because a thrown exception removes the row, and a repeat by the admin
must send the same value. Deduplication on this value is not confirmed. A go-live task asks about it.

`SslcommerzRefundCheckJob` has the order ID, the refund row ID, and the check number. Its delays are
1, 6, 24, 72, and 168 hours after the refund, because the doc sample shows about nine hours and no
SLA exists. This schedule is an assumption.

```
refund row gone or not pending -> stop
query_refund(refund_id)
  refunded       -> update_refund(completed)
  cancelled      -> update_refund(cancelled), warning log
  otherwise      -> next check
last check       -> warning log, row stays pending
```

The job uses `OrderManager::update_refund`, as PayPal does, so core handles the order status. If
the refund transaction rolls back after the job is queued, the job finds no row and stops.

### 11. Session payload

`SslcommerzTransactionBuilder` follows `EwayTransactionBuilder`:

- `cus_*` uses the billing fields, then the shipping fields, then the customer fields.
- `ship_*` includes `ship_area` and `ship_sub_city`, because the docs mark them mandatory for
  `shipping_method=YES`.
- `shipping_method` is `YES` when the order has a shipping address line, with `product_profile`
  `physical-goods`. Otherwise it is `NO`, with `non-physical-goods`.
- `product_name` joins item names, `product_category` is a constant of at most 50 characters, and
  `num_of_item` is the sum of quantities.
- Country fields use the name from `CountryData`, because the docs show a country name.
- Each value is cut to its documented limit.

`pay()` requires `status === 'SUCCESS'` and an HTTPS `GatewayPageURL`. It does not parse the URL
path, because the sandbox format differs from the docs. A `failedreason` with "Store Credential"
gets a message that says not to use the merchant panel password.

### 12. Currency

`supported_currencies()` is not overridden, so the list is empty. A list from one shared sandbox store
would misstate live support.

## Risks / Trade-offs

- **Sandbox is less strict than live** → The sandbox accepted missing mandatory fields, a low amount,
  and a repeated `tran_id`. A go-live task runs one real payment.
- **Empty customer fields** → A customer with no phone or address sends an empty value. Live may reject
  it, and the customer then sees the error. The plugin sends no placeholder, because a false phone
  number can mix saved-card lists. A go-live task tests this.
- **Failure on a valid order that later succeeds** → A customer sees the failed page and can try a new
  order, while a late success settles the first order. The double-payment check does not cover two
  orders, and the merchant refunds one from the panel.
- **Partial refund on a non-BDT order** → The docs do not state the currency of `refund_amount`. The
  plugin sends the order currency value, so a USD refund of 100.00 may refund 100 BDT. `docs/sslcommerz.md`
  states this, and a go-live task tests it. The merchant must check the amount in the panel.
- **Refund IP registration** → Live refunds need a registered public IP. A change of IP makes refunds
  fail with no code fault. The settings description and docs state this.
- **Refund with no clear result** → The refund can exist at SSLCommerz with no local row. There is no
  documented lookup. The error tells the admin to check the panel.
- **Refund HTTP call in the core transaction** → The order lock stays held during the call. This is
  existing behaviour for all gateways. The client uses a 30-second timeout.
- **Plugin inactive when a job runs** → That check fails, and no later check runs, as for bKash. The
  docs state this.
- **Hash reliability is unknown** → The check logs only. The logs give data for a later decision.
- **Plain permalinks** → `add_query_arg` keeps the `rest_route` argument, so return URLs work. A task
  tests this.
- **`cancel_url` delivery is not observed** → The simulator has no cancel button. The handler treats a
  GET and a POST the same. `handle_return()` covers a GET.
- **Logo** → The user must supply the file. The gateway build stops without it.

## Corrections during implementation

- **Decision 1:** an `APIConnect` value other than `DONE` is Rejected, not Unknown, because the docs define
  `INVALID_REQUEST`, `FAILED`, and `INACTIVE` as final answers, and a refund must show that reason to the
  admin. A validation or query call treats Rejected and Unknown the same way, so the spec does not change. A
  query with no `APIConnect` is Unknown.
- **Decision 3:** `webhook()` reads `Superglobals::query()` and `Superglobals::post()`, not `Request::capture()`.
  The hash needs the raw posted values, and `Request` merges its sources.
- **Decision 3:** a GET return reads its values from `Superglobals::query()`. A cancel return with no `tran_id`
  goes to the home page. Task 9.1 tests the real cancel request.
- **Decision 5:** an order on hold after a mismatch, or a cancelled order, stops the scheduled checks, so each
  check does not repeat the critical log entry.
- **Decision 8:** an older transaction logs at critical level from the query status, with no validator call. The
  order does not change, so the extra call adds nothing.
- **Decision 11:** `ship_area`, `ship_city`, and `ship_sub_city` all use the order city, because the order has no
  other value for them. `cus_state` and `ship_state` use the stored order value.
- **Risk events (task 4.5):** core dispatches no paid event from `mark_payment_as_paid`. It writes the
  `PAYMENT_COMPLETED` activity. `mark_as_on_hold` dispatches `OrderOnHoldEvent`, and its listener sends the
  on-hold notifications. So a risky payment sends on-hold notifications and no separate paid event.
- **Integration tests:** task 4.6 also has a case for both risky start states, and a case for a refund that stays
  pending until a check completes it, on the real order and refund rows.
- **Local test setup:** this worktree needed `bash kirki-ecommerce-test install`, a test database, and `npm ci` in
  `resources/app/` before the checks could run.
