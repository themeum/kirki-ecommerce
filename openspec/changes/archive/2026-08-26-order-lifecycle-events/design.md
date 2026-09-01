## Context

See proposal.md - Why. The relevant existing mechanics:

- `OrderManager` (`app/Managers/OrderManager.php`) is the single choke point for admin-triggered lifecycle actions (via `PerformOrderAction`'s switch, and direct calls from `OrderController` for e.g. `add_tracking`/`mark_as_archive`) **and** for payment-gateway webhook calls — `payments/kirki-stripe`, `kirki-mollie`, etc. are separate WordPress plugins (`Requires Plugins: kirki-ecommerce`) that call `Order::mark_payment_as_paid()`/`mark_payment_as_failed()` from webhook handlers with no admin session. Since it's the one place every mutation flows through regardless of caller, it's also the natural place to trigger activity recording.
- `OrderActivityManager` (`app/Managers/OrderActivityManager.php`) already had one writer method per activity type from `order-activity-system`. Its `resolve_author(?int $created_by = null)` falls back to the ambient `user()->get_id()`, which is naturally null in a webhook context — no special-casing needed for "system-triggered, no author."
- Refund activities need a `Refund` model, not just an `Order` — an order can carry multiple refund rows, so "the one that just happened" isn't recoverable from the order alone. `OrderManager::mark_refund_as_completed(int $id)` itself never has a `Refund` in scope; its only live caller is `UpdateRefundAction::sync_fulfillment_status()`, which does have `$refund`. So the refund-completed call has to happen from `UpdateRefundAction`, not `OrderManager`.
- By the time any `OrderManager` method is ready to record an activity, it has already persisted the relevant change to the order (via `partial_update_order()` or `apply_order_action()`) and re-fetched a fresh copy. That fresh order therefore already carries everything the corresponding activity's metadata needs — cancellation reason, tracking fields, payment provider — for every activity type *except* the three refund ones.

## Goals / Non-Goals

**Goals:**
- Every order lifecycle mutation that has a corresponding, reachable `OrderActivityType` gets recorded.
- `order-placed` uses the same recording path as everything else — no special-cased call site.
- The activity taxonomy gains `refund-requested`, `refund-deleted`, `processing` and `fulfillment-resumed`, completing coverage of refund lifecycle and the two remaining fulfillment transitions.
- One consolidated write entry point for the activity types whose data lives entirely on the order, rather than a proliferation of near-identical wrapper classes.

**Non-Goals:**
- `OrderManager::mark_as_unfulfilled()` and `mark_payment_as_unpaid()` — confirmed zero callers anywhere in the codebase (no `OrderAction` constant exists for either; nothing invokes them). No activity type is added for unreachable code.
- `PARTIALLY_REFUNDED` stays unwired. Its only potential call site is inside `UpdateRefundAction::sync_fulfillment_status()`, itself commented-out/TODO business logic. That's a separate, already-flagged, unresolved business-rule question this change doesn't decide.
- `DeleteRefundAction`'s own unresolved question ("should refund deletion be allowed at all?") is not this change's to answer — the deletion gets recorded whenever the action runs, regardless of whether that action's own gating logic later changes.
- `comment-added` stays a direct, separate call — it's a direct user-initiated write carrying a message string, not derived from order state at all.
- No frontend work, no new API endpoints, no schema changes beyond four new string constants.
- No event/listener infrastructure. `app/Events/` and `app/Listeners/` are untouched by the final design (see "Decisions" below for why an events-based approach was tried and reverted).

## Decisions

### `OrderActivityManager::log(Order $order, string $activity_type)` — one entry point for order-state activities

Every activity type whose metadata is fully derivable from the order's own persisted state (order-placed, payment-completed, payment-failed, processing, fulfillment-resumed, shipped, delivered, cancelled, tracking-added, archived, on-hold — 11 of the 15 total types) is recorded through a single public method:

```php
public function log(Order $order, string $activity_type)
{
    switch ($activity_type) {
        case OrderActivityType::SHIPPED: return $this->shipped($order);
        case OrderActivityType::CANCELLED: return $this->cancelled($order);
        // ... one line per type
        default: throw new \InvalidArgumentException(...);
    }
}
```

The 11 methods it dispatches to are `protected` — nothing outside `OrderActivityManager` calls them anymore — and each is simplified to read whatever it needs directly off `$order` rather than taking it as a separate parameter:
- `cancelled(Order $order)` reads `$order->cancellation_reason`
- `tracking_added(Order $order)` reads `$order->shipping_carrier`/`shipping_tracking_number`/`shipping_tracking_url`
- `payment_completed(Order $order)` reads `$order->payment_provider` (dropping the `?string $provider = null` override param it used to take — every real caller passed a value that was already identical to what ended up on the order anyway, so the override was always redundant)

Trigger points collapse to one line each: `OrderActivity::log($order, OrderActivityType::SHIPPED);`.

**Type is passed explicitly, not inferred from a before/after diff.** Considered detecting the activity type by diffing an old and new order snapshot (comparing `order_status`/`fulfillment_status`/`payment_status`). Rejected: not every type corresponds to a state-machine transition — `order-placed` has no "old" order to diff against (it doesn't exist yet), `archived` is an independent flag (`archived_at`) with no `order_status`/`fulfillment_status` change at all, and `tracking-added` touches tracking columns, not status fields. A diff-based detector would only cover 8 of 11 types, needing a special-cased path for the rest anyway — undermining the point of unifying. Meanwhile every `OrderManager` method already unambiguously knows what just happened (that's why it's named `mark_as_shipped`, not `update_status`) — passing `OrderActivityType::SHIPPED` costs nothing since the caller isn't inferring anything, just naming what it already knows for certain. The one place a before/after check earns its keep — distinguishing `mark-as-processing` from `resume-fulfillment` in `OrderManager::mark_as_processing()` — stays local to that one call site (`$is_resuming = $order->fulfillment_status === FulfillmentStatus::ON_HOLD`, checked before mutating), rather than becoming `log()`'s job.

### Refund activities: no `log()`, no events — called directly

`refund_requested(Order $order, Refund $refund)`, `refunded(Order $order, Refund $refund)`, `refund_deleted(Order $order, array $refund_snapshot)`, and the dormant `partially_refunded(Order $order, Refund $refund)` stay public and are called directly from their trigger points (`CreateRefundAction`, `UpdateRefundAction`, `DeleteRefundAction`) — not through `log()`, since they need a specific `Refund` that isn't recoverable from `$order` alone, and not through any event, since a direct call is the simplest thing that works and there's no plugin-boundary reason for indirection here.

### Events and listeners: tried, then reverted

An earlier iteration of this design used `app/Events`/`app/Listeners` — one event class + one listener class per activity type (14 of each), each listener a one-line forward: `OrderActivity::shipped($event->order)`. Reviewed and reconsidered for three concrete reasons:

1. **The framework's listener discovery is a hard 1-listener-to-1-concrete-event mapping.** `ListenerDiscovery::event_class()` requires `class_exists($type_name)` on a listener's single typed `handle()` parameter — confirmed experimentally that this returns `false` for interfaces, so a listener typed to a shared interface is silently never registered. One listener genuinely cannot subscribe to multiple event types under this framework without hand-editing `libraries/framework` (off-limits) or hand-maintaining the gitignored, auto-regenerated cache file (defeats its own purpose). This closes off any "fewer listeners, same events" middle ground.
2. **Merging events into fewer, coarser ones reintroduces the exact problem the facade design already rejected.** A merged `OrderLifecycleChanged` event would need a generic `$context` array to carry type-varying extra data (reason, tracking, provider), which is the "generic `record($order_id, $type, $metadata, $actor)`" shape `order-activity-system`'s design explicitly rejected for losing compiler/IDE help at the call site — just relocated from the facade boundary to the event boundary instead of eliminated.
3. **`OrderManager` had no real decoupling need for events.** Unlike the payment-gateway plugins (genuinely separate WordPress plugins), `OrderManager` is core code with no plugin-boundary reason to avoid calling `OrderActivity` directly. Every event in the tried design had exactly one real listener (`SendNotificationEmail`, the dormant second listener on `OrderShipped`, is still an empty stub) — the observer-pattern benefit (multiple independent reactions) wasn't actually being exploited.

Reverting restored `app/Events/OrderShipped.php`, `app/Listeners/AddActivityLog.php` (renamed back from `LogOrderShippedActivity.php`, content restored to its original `Log::debug(...)` placeholder), and `app/Listeners/SendNotificationEmail.php` to exactly their pre-existing, dead-scaffolding state — none of these files are touched by the final design. The 13 event classes and 13 listener classes created for the tried approach (everything except the pre-existing `OrderShipped`/`AddActivityLog` pair) were deleted outright.

### `status_changed()`/`STATUS_CHANGED` removed entirely, not left dormant

Once `PROCESSING`/`FULFILLMENT_RESUMED` took over the one case the generic `status_changed()` writer existed for, it had zero remaining callers and no forward-looking reason to keep it — unlike `PARTIALLY_REFUNDED`, which stays unwired for a real, documented reason (blocked on an unresolved business rule). A generic type with no producer and no roadmap use reads as confusing later ("why does this exist, should new code call it?"). Removed: the `STATUS_CHANGED` constant, `OrderActivityManager::status_changed()`/`describe_status_changed()`, the now-unused `OrderStatus` import in `OrderActivityManager`, and the facade's `@method status_changed(...)` docblock line.

## Risks / Trade-offs

- **[`log()`'s `switch` on activity type has to be kept in sync with `OrderActivityType`'s constants by hand]** → Same trade-off `describe()` already has (also a hand-maintained `switch` on the same constants) — accepted as consistent with the existing pattern rather than a new risk. An unhandled type throws `\InvalidArgumentException` rather than silently doing nothing.
- **[Refund event dispatch is the one asymmetric case — `UpdateRefundAction` instead of `OrderManager`]** → Accepted since forcing symmetry would mean re-fetching data `UpdateRefundAction` already has, for no benefit; documented here so it isn't mistaken for an oversight later.
- **[Simplifying `payment_completed()`/`cancelled()`/`tracking_added()` to read from `$order` instead of taking explicit params is a breaking change to `OrderActivityManager`'s public API]** → Mitigated: these 11 methods are now `protected`, reachable only through `log()`, so nothing outside this class can be affected by the signature change.

## Migration Plan

No data migration. Purely code: one new public method, 11 methods demoted to `protected` and simplified, two new refund methods, four new/net constants, `STATUS_CHANGED` removed, trigger-point call sites updated. `app/Events/`/`app/Listeners/` end this change exactly as they started it. Safe to deploy in one step.
