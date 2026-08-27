## Why

`order-activity-system` shipped the activity log's recording/describing facade but deliberately wired only two call sites (`order-placed`, `comment-added`) as proof-of-concept, deferring "wiring `Activity::` calls into every existing order lifecycle action" to a follow-up. This change wires the rest: every reachable order lifecycle mutation now records an activity, so the timeline is actually complete rather than a demo of two activity types.

**Revision note**: this change went through two design iterations before landing on its final shape (both driven by user review, both while the change was still unimplemented/mid-implementation — see design.md's "Decisions" for the full reasoning):
1. First iteration used the pre-existing `app/Events`/`app/Listeners` framework — one event + one listener per activity type. Reviewed and rejected: every listener was a one-line forward to the facade, the framework's discovery mechanism made further consolidation impossible without reintroducing the metadata-bag anti-pattern the original facade design explicitly rejected, and `OrderManager` (core code, not a plugin boundary) had no real decoupling need for events.
2. Landed shape: `OrderActivityManager::log(Order $order, string $activity_type)` — one public method covering every activity type whose metadata is fully derivable from the order's own state, called directly from each trigger point. No events, no listeners.

## What Changes

- Add `OrderActivityManager::log(Order $order, string $activity_type)` — the single public entry point for every order-state activity (order-placed, payment-completed, payment-failed, processing, fulfillment-resumed, shipped, delivered, cancelled, tracking-added, archived, on-hold). It dispatches internally to a protected per-type method, each of which builds its metadata entirely from `$order`'s own already-persisted state (no extra parameters needed — by the time `log()` is called, the mutation that motivated it has already been written to the order).
- The 11 per-type methods `log()` dispatches to move from `public` to `protected` — nothing outside `OrderActivityManager` calls them directly anymore.
- Every `OrderManager`/Action trigger point that previously called the facade directly (or, briefly mid-development, dispatched an event) now calls `OrderActivity::log($order, OrderActivityType::X)` — one line, no event class, no listener class.
- Add two new activity types, `REFUND_REQUESTED` and `REFUND_DELETED`, with their own `OrderActivityManager` writer + describer methods (`refund_requested()`, `refund_deleted()`) — these stay separate from `log()` and are called directly, since which specific `Refund` triggered them isn't recoverable from the order alone (an order can have several refund rows, and the deleted one is already gone by the time it'd be logged).
- Add two new activity types, `PROCESSING` and `FULFILLMENT_RESUMED`, covering the two `mark_as_processing()` branches (fresh order vs. resuming from hold) that previously had no dedicated type.
- **Remove** the pre-existing, never-called `OrderActivityManager::status_changed()`/`describe_status_changed()` and the `STATUS_CHANGED` type — `PROCESSING`/`FULFILLMENT_RESUMED` took over the one gap it existed for, and it had no other reason to stay (unlike `PARTIALLY_REFUNDED`, which stays unwired for a real, separately-documented reason).
- **Explicitly not wired** (documented in design.md, not silently dropped): `OrderManager::mark_as_unfulfilled()` and `mark_payment_as_unpaid()` (zero callers anywhere in the codebase today — no reason to wire unreachable code), and `PARTIALLY_REFUNDED` (its only potential trigger is commented-out/TODO logic in `UpdateRefundAction`, blocked on a separate undecided business rule, not something this change can resolve).

## Capabilities

### New Capabilities

(none — no new user-facing capability; this changes how already-specified activity types get recorded)

### Modified Capabilities

- `order-activity-log`: the "recorded with a type and author" requirement gains four new activity types (`refund-requested`, `refund-deleted`, `processing`, `fulfillment-resumed`) to the fixed type set. The dispatch mechanism for system-recorded activities changes from ad-hoc direct calls to the single, consolidated `log()` entry point — an implementation-level change to how the existing "activities are recorded" requirement is fulfilled, called out here because the fixed type set enumerated in that requirement's text is expanding.

## Impact

- **Affected code**: `app/Managers/OrderManager.php` (trigger points), `app/Actions/Order/CreateOrderAction.php`, `CreateRefundAction.php`, `UpdateRefundAction.php`, `DeleteRefundAction.php` (trigger points), `app/Managers/OrderActivityManager.php` (new `log()` entry point, 11 methods demoted to `protected` and simplified, two new refund methods), `app/Constants/Order/OrderActivityType.php` (net +3: two refund types and two fulfillment types added, `STATUS_CHANGED` removed), `app/Facades/OrderActivity.php` (docblock updated).
- **No new files**: `app/Events/` and `app/Listeners/` are untouched by the final design — both directories are exactly as they were before this change started (`OrderShipped`/`AddActivityLog`/`SendNotificationEmail` remain dead scaffolding, unrelated to this feature).
- **No API changes**: no new endpoints, no request/response shape changes.
- **No schema changes**: no migrations — the four new activity types are just new string constants written into the existing `activity_type` column.
- **Payment gateway plugins** (`payments/kirki-stripe`, `kirki-mollie`, etc.) are unaffected — they already call `Order::mark_payment_as_paid()`/`mark_payment_as_failed()`, which now record an activity internally rather than nothing; the gateway plugins don't need to know or care.
