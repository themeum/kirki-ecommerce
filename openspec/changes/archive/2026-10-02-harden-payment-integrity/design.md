## Context

See proposal.md for motivation. Current state that shapes the approach:

- `PayPal::webhook()` verifies the event, then dispatches by type inside a
  `try` that turns any exception into `false` (HTTP 400). Nothing is logged, and
  nothing wraps the order writes in a transaction (the Stripe add-on does).
- `handle_payment_capture_completed()` marks the order paid from the event
  alone; it never reads `resource.amount`.
- `handle_checkout_order_approved()` calls `capture_order()`, which throws on any
  failed response, including PayPal's "order already captured".
- `handle_payment_capture_refunded()` calls `update_refund()` every time; for a
  completed refund that re-runs `mark_refund_as_completed` and logs the refund
  activity again.
- `pay()` posts to `/v2/checkout/orders` with no idempotency key. It runs each
  time an unpaid order is rendered, so each view creates a PayPal order.
- `OrderManager::set_payment_metadata()` writes its string argument straight into
  `orders.payment_metadata`, a JSON-cast column that
  `CreateOrderAction::build_payment_provider_snapshot()` already fills with
  `{ payment_provider: { id, name, icon, is_offline } }`. Order resources read
  the snapshot from that column, so a webhook write erases it. Verified with a
  throwaway test: after the write the order reports a `null` provider name and
  icon, and the column holds a JSON string.
- No logger exists in `app/`; errors that matter use `error_log()` with a
  justified `phpcs:ignore`, as in `Utils.php`.

## Goals / Non-Goals

**Goals:**
- Money is never marked received on an unchecked amount.
- Repeating a webhook or a payment attempt is safe.
- A failed webhook leaves the order unchanged and leaves a log line.
- A paid order keeps its provider snapshot.

**Non-Goals:**
- No new tables, no stored event-ID list, no shared event pipeline.
- No change to the single `payment_transaction_id` field.
- No new order activity type or admin notification for a mismatch beyond the
  existing on-hold activity.

## Decisions

**1. Idempotency by state, not by stored event IDs.** Each handler already has,
or can cheaply get, a state test: PAID for capture-completed, "refund already
completed with this refund id" for refunds, and PayPal's own `ORDER_ALREADY_CAPTURED`
answer for capture. This needs no new storage and cannot drift from the order's
real state. Alternative: record every processed event id (option or table) and
skip repeats. Rejected as heavier, and it still needs the state tests for events
that arrive under new ids.

**2. Treat `ORDER_ALREADY_CAPTURED` as success inside `capture_order()`.** The
response body names the issue, so the method returns the decoded response in that
case instead of throwing. The approval handler also skips the call when the
matching local order is already paid. Both, because the local check saves a
request and the remote check covers the race where the capture succeeded but the
local write did not.

**3. Mismatch handling: hold, record, log, acknowledge.** Returning `false`
would make PayPal retry the same event up to its limit with the same result, so
the webhook is acknowledged. The order stays unpaid, the gateway payload is
saved, and `mark_as_on_hold()` is called, which already records an ON_HOLD
activity admins see. Hold is best-effort: if the order's status does not allow
the transition the call returns false and the log line is the trace. Amount
comparison uses minor units (`Money::to_minor($resource.amount.value, currency)`
against `invoiced_total`) and an exact match, since PayPal captures the amount
that was requested.

**4. Idempotency key on create-order: `PayPal-Request-Id: kirki-paypal-<order uuid>`.**
It mirrors Stripe's `kirki-stripe-<uuid>` key and costs one header. Alternative:
store the PayPal order id and GET it on the next attempt, reusing it while its
status is still approvable. That handles an order PayPal has voided or expired,
but adds a request and a state check, and `payment_transaction_id` is shared with
the capture id until that split is done. Not chosen now.

**5. One transaction around the capture-completed handler only.** That handler
makes several plain order writes (transaction id, paid status, payload, fee) and
is the one that can be left half-applied. `DB::begin_transaction()` wraps it; any
exception rolls back, is logged, and returns `false` so PayPal redelivers a
failure that may be transient. The log line carries event type, event id and
exception message only, never the payload or settings. The approval event writes
nothing locally (it calls PayPal's capture API), and the refund event is already
atomic through `UpdateRefundAction`'s own transaction, so neither is wrapped (see
the correction below).

**6. Keep the snapshot by merging in `set_payment_metadata()`.** The method
decodes the incoming string, reads the stored array, and writes
`{ ...stored, gateway: decoded }`, so `payment_provider` is untouched. It also
stops the double-encoding, since the model's JSON cast now receives an array.
This is the single choke point both PayPal and Stripe already call, so no
gateway code changes. Alternative: change each gateway to nest its own payload.
Rejected because each new add-on would have to remember to.

## Risks / Trade-offs

- [A PayPal order that was voided or expired is returned again for the same
  request id within PayPal's idempotency window, so the buyer cannot pay] →
  Accepted for now; the window is bounded, and decision 4's alternative is the
  follow-up if it shows up.
- [Exact amount matching rejects a legitimate capture that differs by a rounding
  cent] → Order totals are already in the minor unit PayPal was asked to
  charge; a mismatch means something is wrong. The order goes on hold, not
  cancelled, so an admin can reconcile.
- [`payment_metadata` consumers that expect the raw gateway JSON at the top
  level] → A search of `app/` found only the order resources, which read the
  `payment_provider` key. The gateway payload moves under `gateway`; existing
  rows holding a raw JSON string are left as they are and read as before.
- [Rolling back leaves the gateway believing the event was applied] → The
  rejection makes the gateway redeliver, and the handlers are repeat-safe by
  decision 1.

## Corrections during implementation

- **Transactions do not nest, so only the capture-completed handler is wrapped.**
  The original plan wrapped every order-writing handler. The framework's
  `begin_transaction()` runs a bare `START TRANSACTION`, which in MySQL silently
  commits any transaction already open, and `UpdateRefundAction` opens its own.
  Wrapping the refund handler would therefore not make it atomic and would hide
  that. The refund handler is atomic through its action instead, the approval
  handler writes nothing, and the capture-completed handler (plain updates, no
  inner transaction) gets the wrapper. The "handling fails part-way" scenario
  still holds for each event type. The Stripe add-on wraps its whole event
  handler and calls the same refund action, so its refund path has the nesting
  problem today; that is outside this change.
- **A capture with no readable amount counts as a mismatch.** The spec lists
  amount and currency mismatches; a payload with no amount cannot be verified, so
  it takes the same hold-and-log path. The existing capture-completed test
  payload had no amount, so it now carries one.
- **The mismatch check runs only when the order is about to be marked paid.** A
  later capture on an order that is already paid is not held, which would
  otherwise flip a settled order to on hold.
- **The idempotency key is tested through the real container.** `pay()` calls
  WordPress and URL helpers the unit bootstrap does not stub, so
  `PayPalCreateOrderTest` is an integration test that swaps in a recording fake
  HTTP client. It also showed that placing an order through checkout already
  calls `pay()` once, because the order resource resolves the next payment step;
  the idempotency key is what stops that call and later views from creating
  separate PayPal orders.
