## Why

`order-activity-system` shipped the activity log's recording/describing facade but deliberately wired only two call sites (`order-placed`, `comment-added`) as proof-of-concept, deferring "wiring `Activity::` calls into every existing order lifecycle action" and "direct-call vs. event/listener dispatch" to a follow-up. The event/listener framework this was scaffolded against (`app/Events`, `app/Listeners`, `EventManager`, `ListenerDiscovery`) already exists and works, but its only real event, `OrderShipped`, is never dispatched, and its listener (`AddActivityLog`) just logs a debug line. This change makes that dead scaffolding real and extends the same event-driven pattern to every reachable order lifecycle transition, so the activity timeline is actually complete rather than a demo of two activity types.

## What Changes

- Dispatch a domain event from every order lifecycle mutation point that has a corresponding `OrderActivityType`, instead of calling the `OrderActivity` facade directly.
- Add one listener per event (`Log<Event>Activity` naming), each translating the event into the matching `OrderActivity::` facade call.
- Convert the existing direct `OrderActivity::order_placed(...)` call in `CreateOrderAction` to the same event-dispatch pattern, for consistency — **no observable behavior change**, this is a wiring-mechanism change only.
- Repurpose the existing dead `app/Events/OrderShipped.php` + rename `app/Listeners/AddActivityLog.php` → `LogOrderShippedActivity.php` with a real `handle()` body. The sibling `SendNotificationEmail` listener on the same event is left untouched (still an empty stub) — it will start receiving real dispatches as a side effect.
- Add four new activity types — `REFUND_REQUESTED`, `REFUND_DELETED`, `PROCESSING`, `FULFILLMENT_RESUMED` — each with its own dedicated event, listener, and `OrderActivityManager` writer + describer method, so refund creation/deletion and the two remaining fulfillment transitions are recorded on the timeline. Every wired action gets its own named event/type — no shared "generic" event across multiple actions, so the pattern stays unambiguous as more activity types get added later.
- **Remove** the pre-existing, never-called `OrderActivityManager::status_changed()`/`describe_status_changed()` methods and the `STATUS_CHANGED` type — `PROCESSING`/`FULFILLMENT_RESUMED` took over the one gap it existed for, and it had no other reason to stay (unlike `PARTIALLY_REFUNDED`, which stays unwired for a real, separately-documented reason).
- **Explicitly not wired** (documented in design.md, not silently dropped): `OrderManager::mark_as_unfulfilled()` and `mark_payment_as_unpaid()` (zero callers anywhere in the codebase today — no event for unreachable code), and `PARTIALLY_REFUNDED` (its only potential trigger is commented-out/TODO logic in `UpdateRefundAction`, blocked on a separate undecided business rule, not something this change can wire).

## Capabilities

### New Capabilities

(none — no new user-facing capability; this changes how already-specified activity types get recorded)

### Modified Capabilities

- `order-activity-log`: the "recorded with a type and author" requirement gains four new activity types (`refund-requested`, `refund-deleted`, `processing`, `fulfillment-resumed`) to the fixed type set, and the dispatch mechanism for system-recorded activities changes from direct facade calls to event/listener wiring (an implementation-level change to how the existing "activities are recorded" requirement is fulfilled — called out here because the fixed type set enumerated in that requirement's text is expanding).

## Impact

- **Affected code**: `app/Managers/OrderManager.php` (dispatch sites), `app/Actions/Order/CreateOrderAction.php`, `CreateRefundAction.php`, `UpdateRefundAction.php`, `DeleteRefundAction.php` (dispatch sites), `app/Managers/OrderActivityManager.php` (four new writer/describer methods), `app/Constants/Order/OrderActivityType.php` (four new constants), `app/Events/*` (new event classes + repurposed `OrderShipped`), `app/Listeners/*` (new listener classes + renamed `AddActivityLog`), `config/listeners.cache.php` (dev-mode auto-regenerated, gitignored).
- **No API changes**: no new endpoints, no request/response shape changes.
- **No schema changes**: no migrations — the four new activity types are just new string constants written into the existing `activity_type` column.
- **Payment gateway plugins** (`payments/kirki-stripe`, `kirki-mollie`, etc.) are unaffected — they already call `Order::mark_payment_as_paid()`/`mark_payment_as_failed()`, which now dispatch events internally rather than nothing; the gateway plugins don't need to know or care.
