## Context

See proposal.md - Why. The relevant existing mechanics:

- `libraries/framework`'s event system is real and already wired into boot: `EventManager::dispatch($event)` resolves `get_class($event)` against a map loaded from `config/listeners.cache.php` and calls `handle()` on each matching listener, synchronously, in the same request. `ListenerDiscovery` regenerates that cache file automatically on every boot in dev mode (`CoreServiceProvider::register()` → `ListenerDiscovery::discover()->cache()`), by reflecting each `app/Listeners/*.php` file's `handle()` method for its single typed parameter — that reflection is what maps a listener to an event class, not filename convention. **This means one listener file can only ever handle one event type** (though one event can have multiple listeners — see `OrderShipped` today, which already has two: `AddActivityLog` and `SendNotificationEmail`).
- `OrderManager` (`app/Managers/OrderManager.php`) is the single choke point for admin-triggered lifecycle actions (via `PerformOrderAction`'s switch, and direct calls from `OrderController` for e.g. `add_tracking`/`mark_as_archive`) **and** for payment-gateway webhook calls — `payments/kirki-stripe`, `kirki-mollie`, etc. are separate WordPress plugins (`Requires Plugins: kirki-ecommerce`) that call `Order::mark_payment_as_paid()`/`mark_payment_as_failed()` from webhook handlers with no admin session.
- `OrderActivityManager` (`app/Managers/OrderActivityManager.php`) already has writer methods for every activity type in the current taxonomy except refund-requested/refund-deleted, including one — `status_changed(Order $order, string $from, string $to)` — that has no caller anywhere today. Its `resolve_author(?int $created_by = null)` falls back to the ambient `user()->get_id()`, which is naturally null in a webhook context — no special-casing needed for "system-triggered, no author."
- `CreateOrderAction` already calls `OrderActivity::order_placed($order->fresh('items'));` directly, right before `DB::commit()`. This is the one existing precedent for where in a transaction to dispatch.
- Refund activities need a `Refund` model (`refunded(Order $order, Refund $refund)`, and the new `refund_requested`/`refund_deleted` will too), not just an `Order`. `OrderManager::mark_refund_as_completed(int $id)` itself never has a `Refund` in scope — its only live caller today is `UpdateRefundAction::sync_fulfillment_status()`, which does have `$refund`. So the refund-completed dispatch has to happen from `UpdateRefundAction`, not from inside `OrderManager`, breaking the otherwise-uniform "dispatch from OrderManager" rule for this one case.

## Goals / Non-Goals

**Goals:**
- Every order lifecycle mutation that has a corresponding, reachable `OrderActivityType` dispatches a domain event; a paired listener records the activity via the existing `OrderActivity` facade.
- `order-placed` moves to the same event-dispatch mechanism as everything else — no more direct facade call from an Action class.
- The activity taxonomy gains `refund-requested`, `refund-deleted`, `processing` and `fulfillment-resumed` so refund lifecycle and the two remaining fulfillment transitions are fully represented, matching every other lifecycle concern (order, payment, fulfillment) already having entry and exit points recorded.
- One event maps to exactly one action, with no shared "generic" event across multiple distinct actions — every wired transition gets its own named type, so the taxonomy stays unambiguous as more activity types are added later.
- The dead `OrderShipped`/`AddActivityLog` scaffolding becomes the real thing it was built to be, not a parallel new mechanism.

**Non-Goals:**
- `OrderManager::mark_as_unfulfilled()` and `mark_payment_as_unpaid()` — confirmed zero callers anywhere in the codebase (no `OrderAction` constant exists for either; nothing invokes them). No event is added for unreachable code; wiring one now would be speculative.
- `PARTIALLY_REFUNDED` stays unwired. Its only potential call site is inside `UpdateRefundAction::sync_fulfillment_status()`, itself commented-out/TODO business logic ("`// TODO: need to implement or take a decision regarding partial refund`"). That's a separate, already-flagged, unresolved business-rule question this change doesn't decide.
- `DeleteRefundAction`'s own unresolved question ("`@todo should we allow delete refund? what if its completed?`") is not this change's to answer — we record the deletion as an activity whenever the action does run, regardless of whether that action's own gating logic later changes.
- `comment-added` stays a direct facade call, not an event — it's a direct user-initiated write being made, not a lifecycle transition being observed. Consistent with `order-activity-system`'s "facade is dispatch-agnostic" decision.
- No frontend work, no new API endpoints, no schema changes beyond two new string constants.

## Decisions

### One event + one listener per activity-producing transition, dispatched from the transition's actual owner
Because listener→event mapping is 1:1 by reflection, each new activity type gets its own `Event` class in `app/Events/` and its own `Listener` class in `app/Listeners/`, named `Log<EventName>Activity` (e.g. `LogOrderShippedActivity`, `LogOrderRefundRequestedActivity`) for consistency — the one exception being the rename of the existing `AddActivityLog` → `LogOrderShippedActivity`, rather than leaving the old generic name in place now that there are ~12 of these. `SendNotificationEmail`, the other existing listener on `OrderShipped`, is left completely untouched — still an empty stub — it will simply start receiving real dispatches as a side effect, which is fine and unrelated to this change.

Dispatch happens at whichever class already holds both the mutated `Order` and any extra data the corresponding `OrderActivityManager` writer needs, gated on the same success/precondition check the surrounding code already uses (never dispatch on a no-op transition):

| Event | Dispatched from | Guard | Extra payload beyond `$order` |
|---|---|---|---|
| `OrderPlaced` | `CreateOrderAction::execute()` | inside existing try block | — |
| `OrderShipped` | `OrderManager::mark_as_shipped()` | `if ($is_shipped)` | — |
| `OrderDelivered` | `OrderManager::mark_as_delivered()` | `if ($is_delivered)` | — |
| `OrderCancelled` | `OrderManager::mark_as_cancel()` | `if ($is_cancelled)` | `$reason` |
| `OrderTrackingAdded` | `OrderManager::add_tracking()` | `if ($updated)` (currently unconditional — add the same bool-returned guard other methods use) | `$tracking` array (carrier, tracking_number, tracking_url) |
| `OrderArchived` | `OrderManager::mark_as_archive()` | `if ($updated)` | — |
| `OrderPlacedOnHold` | `OrderManager::mark_as_on_hold()` | `if ($is_on_hold)` | — |
| `OrderPaymentCompleted` | `OrderManager::mark_payment_as_paid()` | `if ($is_paid)` | `$payment_provider` |
| `OrderPaymentFailed` | `OrderManager::mark_payment_as_failed()` | `if ($updated)` | — |
| `OrderMarkedAsProcessing` (new type: `processing`) | `OrderManager::mark_as_processing()`, when the action taken is `mark-as-processing` (order was not on hold) | `if ($updated)` | — |
| `OrderFulfillmentResumed` (new type: `fulfillment-resumed`) | `OrderManager::mark_as_processing()`, when the action taken is `resume-fulfillment` (order was on hold) | `if ($updated)` | — |
| `OrderRefunded` | `UpdateRefundAction::sync_fulfillment_status()`, when `$is_fully_refunded` | existing `if ($is_fully_refunded)` branch | `$refund` |
| `OrderRefundRequested` (new type) | `CreateRefundAction::execute()`, after the refund row is created | inside existing try block, before `DB::commit()` | `$refund` |
| `OrderRefundDeleted` (new type) | `DeleteRefundAction::execute()`, after `$refund->delete()` | unconditional (action already throws `NotFoundException` earlier if the refund doesn't exist) | refund snapshot captured *before* delete (id, invoiced_amount) since the model is gone after |

Each event carries a freshly-fetched `Order` (`$order->fresh(...)`) rather than the pre-mutation object most `OrderManager` methods hold in memory — same pattern `CreateOrderAction` already uses. Events carry plain constructor args (order, plus whatever extra column each writer method needs), matching the existing `OrderShipped` shape (`public $order`), not a generic payload bag — this keeps each event's shape self-documenting and matches how `Dispatchable::dispatch()` just forwards `func_get_args()` into `new static(...)`.

Alternative considered: dispatch every event uniformly from `OrderManager`, treating refund events as no exception. Rejected — `OrderManager::mark_refund_as_completed(int $id)` has no `Refund` in scope and no live caller besides `UpdateRefundAction`; forcing the dispatch through `OrderManager` would mean re-fetching the specific just-completed `Refund` there for no benefit, when the caller already has it.

### `mark-as-processing` and `resume-fulfillment` get their own dedicated events/types, not the generic `status_changed()`
Every other wired action fires a dedicated, semantically-named event (`OrderShipped`, `OrderPaymentCompleted`, ...). An earlier draft of this design reused the pre-existing, previously-unused `OrderActivityManager::status_changed(Order $order, string $from, string $to)` writer and `STATUS_CHANGED` type for both `mark_as_processing()` branches, reasoning that neither action carries distinguishing metadata beyond from/to. Revisited: that broke the otherwise-uniform "every action has its own event" rule, and a mixed pattern (12 dedicated events + 1 shared generic one) is exactly the kind of thing that reads as inconsistent later, when someone can't tell from the code whether a new action should get a dedicated event or fold into a generic one — there'd be no rule to point to. Two new types instead: `PROCESSING` (`OrderMarkedAsProcessing` event, fixed description "Order marked as processing.") and `FULFILLMENT_RESUMED` (`OrderFulfillmentResumed` event, fixed description "Order fulfillment resumed."). `OrderManager::mark_as_processing()` already computes which of the two actions it's taking (`$is_resuming`), so dispatching one or the other is a one-line branch, no new logic.

### `status_changed()`/`STATUS_CHANGED` removed entirely, not left dormant
Once `PROCESSING`/`FULFILLMENT_RESUMED` took over the one case `status_changed()` existed for, it had zero remaining callers and no forward-looking reason to keep it — unlike `PARTIALLY_REFUNDED`, which stays unwired for a real, documented reason (blocked on an unresolved business rule in `UpdateRefundAction`, a genuine future use). A generic type with no producer and no roadmap use is exactly the kind of leftover that reads as confusing later ("why does this exist, should new code call it?") and it directly contradicts the "every action gets its own dedicated event, no generic fallback" rule this change establishes. Removed: the `STATUS_CHANGED` constant, `OrderActivityManager::status_changed()`/`describe_status_changed()`, the now-unused `OrderStatus` import in `OrderActivityManager`, the facade's `@method status_changed(...)` docblock line, and `status-changed` from the spec's enumerated type list.

### Two new activity types: `refund-requested`, `refund-deleted`
Both refund creation and refund deletion are genuine lifecycle events worth an audit trail entry, independent of whatever `DeleteRefundAction`'s own open question about whether deletion should be allowed resolves to later — if the action runs, it's recorded. New `OrderActivityManager` methods:
- `refund_requested(Order $order, Refund $refund)` — metadata: amount, currency_code, reason (mirrors `refunded()`'s shape).
- `refund_deleted(Order $order, array $refund_snapshot)` — takes a snapshot array, not a `Refund` model, since the model is already deleted by the time the listener runs; metadata: amount, currency_code.

### `config/listeners.cache.php` is generated, not hand-maintained
`ListenerDiscovery` regenerates it automatically on every dev-mode boot. It's gitignored (`.gitignore`), not a tracked file — nothing to commit; it just needs to exist on whatever environment runs the code, which the existing dev-mode auto-regeneration already guarantees.

## Risks / Trade-offs

- **[Listener exceptions are currently unguarded — `EventManager::dispatch()` has no try/catch around `$this->resolve($listener, $event)`]** → An activity-logging bug (e.g. a describer error) would propagate up through `OrderManager` and fail the primary lifecycle action (e.g. marking an order shipped) it's merely supposed to be recording. This is pre-existing `EventManager` behavior, not something this change should silently patch — flagged here since it's now load-bearing for the first time (previously `OrderShipped` was dispatched to nobody). Mitigated in practice by keeping every listener a single, non-throwing facade call with no branching logic of its own.
- **[Refund event dispatch is the one asymmetric case — `UpdateRefundAction` instead of `OrderManager`]** → Slightly breaks the "always look in `OrderManager`" mental model for where lifecycle events fire. Accepted since forcing symmetry would require re-fetching data the actual caller already has, for no real benefit; documented explicitly above so it isn't mistaken for an oversight during `tasks.md` implementation or later review.
- **[`add_tracking()` and `mark_as_archive()` currently return `partial_update_order()`'s bool unconditionally — there's no existing "did it actually change" branch to hang the dispatch guard off]** → Both already return a bool (`true`/`false` from `Order::update()`); the guard just needs `if ($updated) { ... }` added around the existing return statement, mirroring the pattern every other method in the class already uses. No new state-checking logic, just applying the existing pattern.

## Migration Plan

No data migration. Purely code: new event/listener classes, renamed listener, new dispatch call sites, two new constants + manager methods, regenerated `config/listeners.cache.php`. Safe to deploy in one step; no feature flag needed since this only changes *how* already-specified activity types get recorded (or, for the two new types, adds them outright) — nothing depends on the old direct-call path continuing to exist.
