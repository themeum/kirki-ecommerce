## Context

See proposal.md - Why. The relevant existing code:

- `database/migrations/CreateOrderActivitiesTable.php` already defines `kirki_ecommerce_order_activities` (id, order_id, activity_type, description, metadata, created_by, timestamps) — part of the original scaffold, never modified since, safe to correct.
- `App\Events\OrderShipped` + `App\Listeners\AddActivityLog` are dead scaffolding (the listener just does `Log::debug(...)`) hinting at an event-driven intent that was never finished.
- Order lifecycle changes funnel through a small set of call sites: `CreateOrderAction`, `OrderManager`'s `mark_as_*`/`add_tracking`/`mark_payment_as_*` methods (via `OrderService::apply_order_action` / `partial_update_order`), and `CreateRefundAction`/`UpdateRefundAction`/`DeleteRefundAction`. None of them are touched by this change beyond one or two proof-of-concept calls.
- The codebase's Facade pattern (`App\Facades\Order` → `OrderManager` singleton, `App\Facades\Money` → `MoneyManager`) is a thin static proxy over a container-bound class; `ServiceProvider::register()` does the singleton binding (see `OrderServiceProvider`).

## Goals / Non-Goals

**Goals:**
- A working, persistable activity log with a facade that's pleasant to call from anywhere in the codebase.
- Correct data modeling now (FK target, activity type taxonomy) so nothing needs a breaking migration later.
- Admin comment CRUD (create + delete) and read endpoints for both admin and customer surfaces.
- Read-time description generation for system activities, so copy changes don't require backfilling stored data.

**Non-Goals:**
- Wiring `Activity::` calls into every existing order lifecycle action. Only `order-placed` (from `CreateOrderAction`) and `comment-added` are wired end-to-end in this change, as a proof that the facade works; the rest is a follow-up.
- Deciding direct-call vs. event/listener dispatch for lifecycle wiring. That's a call-site concern for the follow-up change, not something the facade needs to know about.
- Any frontend work. The Timeline UI shown in the product screenshots consumes these endpoints in a later change.
- A generic diff-based "status changed" activity derived from `OrderService::apply_order_action`. Activity types are semantic (order-placed, shipped, refunded, ...), not raw field diffs — see the exploration notes in the conversation that led to this proposal.

## Decisions

### Facade shape: semantic methods, not a generic `record()`
`App\Facades\Activity` exposes one method per activity type (`order_placed(Order $order)`, `payment_completed(Order $order, ...)`, `shipped(Order $order)`, `comment(int $order_id, string $message, ?int $created_by)`, etc.), documented via `@method static` PHPDoc exactly like `App\Facades\Order` and `App\Facades\Money`. Each method knows what metadata its activity type needs and builds it internally, so call sites pass domain objects/values, not a raw metadata array they have to get right by convention. Alternative considered: a generic `Activity::record($order_id, $type, $metadata, $actor)` — rejected because it pushes metadata-shape knowledge out to every call site with no compiler/IDE help, which fights the "cleaner way to record activities" goal directly.

### created_by FK targets `users`, not `kirki_ecommerce_customers`
The existing migration's FK is inconsistent with `kirki_ecommerce_orders.created_by`/`updated_by` and `kirki_ecommerce_refunds.created_by`, both of which reference `users` (WordPress users — i.e. admins/staff). An activity's actor is the admin who took the action, or nobody (system-triggered); it is never a customer. Fixed as part of this change since the migration has never shipped as its own commit.

### Read-time description generation for system activities; write-time for comments
Comment activities store the admin's message directly in `description` at write time — there's nothing to generate. System activities store `activity_type` + structured `metadata` (order number, amount, carrier, tracking number, from/to status, etc., whatever that type needs) and leave `description` unset; `OrderActivityManager::describe()` (exposed on the `Activity` facade) builds the human-readable sentence from `metadata` at read time, keyed by `activity_type`. This means updating copy for a given activity type is a code change, not a data migration. Trade-off: every activity type needs both a writer (the `record()`-based semantic method deciding what metadata to capture) and a reader (`describe_<type>($metadata)`, one method per type) kept in sync — mitigated by keeping both halves on the same class, next to each other, so adding a new activity type touches one file.

### Activity type taxonomy lives in `OrderActivityType`, mirroring `OrderStatus`
Same `HasConstants` + `get_list()`/`get_formatted()` shape as `App\Constants\Order\OrderStatus`, for consistency and because the codebase already resolves display labels this way.

### Facade is dispatch-agnostic
`OrderActivityManager`'s recording methods don't know or care whether they're called directly from an `Action`/`Manager` method or from an event listener — they just persist an activity given the inputs they're handed. This keeps the direct-call-vs-event decision fully deferred to the follow-up change without requiring any rework here.

### One facade for everything order-activity-related: recording and describing
`OrderActivityManager` owns both halves — the semantic recording methods (`order_placed()`, `comment()`, ...) and `describe()`, the read-time description builder. Initially the description builder was a separate `OrderActivityDescriber` support class, called directly by the Resource layer; that split the "order activity" concern across two classes for no real benefit, since the describer had no reason to be used outside the context of a recorded activity. Consolidated into the manager (and by extension the `Activity` facade) so there's exactly one thing to import when working with order activities anywhere in the codebase.

### No intermediate Action classes for comment create/delete
Comment creation is `find the order, call Activity::comment()`; comment deletion is `find the activity, check its type, delete it`. Neither has enough independent logic to justify a dedicated `Actions/Order/*` class the way `CreateRefundAction`/`DeleteRefundAction` do (which coordinate inventory, payment gateways, and order-state transitions). The guarded delete (`only comment-added activities are deletable`) lives on `OrderActivityService::delete_comment()` instead, and the dedicated `OrderActivityController` (admin) / `Site\OrderActivityController` (customer) call `OrderActivityService`/the `Activity` facade directly — one clear owner per concern (service = persistence + guards, facade = recording + describing, controller = HTTP plumbing), with no pass-through layer in between.

### Dedicated controllers instead of folding into `OrderController`/`AccountController`
Order activities are a distinct enough concern (their own resource, their own list/create/delete lifecycle) to warrant their own admin (`Api\OrderActivityController`) and customer-facing (`Site\OrderActivityController`) controllers, rather than growing `OrderController` and `AccountController` with activity-specific methods that don't share their state or validation concerns.

### No `Site`-namespaced `OrderActivityResource`
Unlike `OrderResource` (where the `Site` variant adds customer-facing fields like `order_timeline`/`payment_next_step`), the activity resource is identical for both audiences per the "customers see everything" decision above — a `Site\Order\OrderActivityResource extends Order\OrderActivityResource` with an empty body added nothing but an extra file and an extra symbol to keep in sync. Both controllers import `App\Resources\Order\OrderActivityResource` directly.

### Correction during implementation
The original task breakdown planned dedicated `CreateOrderCommentAction`/`DeleteOrderCommentAction` classes and routed comment create/delete/list through the existing `OrderController` (admin) and `AccountController` (customer), with a `Site`-namespaced `OrderActivityResource` mirroring the rest of the `Site\Order\*` resources. Code review after the first implementation pass found all three added indirection without payoff (see the three decisions immediately above) — reworked to: no Action layer, two new dedicated controllers, one shared resource. `ActivityManager` was also renamed to `OrderActivityManager` for consistency with `OrderActivityService`/`OrderActivityType`/`OrderActivityResource`, and the request class `OrderCommentCreateRequest` was renamed to `OrderActivityCreateRequest`. None of this changes the spec — the observable behavior (what admins/customers can do) is unchanged, only the internal class layout.

### Second correction during implementation
A further review pass raised three more naming/shape issues, all internal-only (no spec change):
- **"Actor" terminology reads oddly for a WordPress user recording a note or triggering a status change.** Renamed throughout to "author" — `OrderActivityManager::resolve_actor()` → `resolve_author()`, its `$actor`/`$actor_name` locals → `$author_id`/`$author_name`, the `order_placed` metadata key `actor_name` → `author_name`, and the Resource's output field `actor_name` → `author_name` (with `resolve_actor_name()` → `resolve_author_name()`). The persisted `created_by` column keeps its name unchanged, since that matches the sibling `orders`/`refunds` convention already established elsewhere in this codebase — only the reader-facing/internal naming changed.
- **Facade renamed** `App\Facades\Activity` → `App\Facades\OrderActivity`, matching the `Order`/`OrderManager` and `Money`/`MoneyManager` precedent (facade name is the domain noun, manager name adds the `Manager` suffix) more closely than the original short `Activity` name did. No collision with `App\Models\OrderActivity`: nothing in the codebase needs to import both the model and the facade in the same file, since callers reach the model only through the facade/service, never both directly.
- **`OrderActivityService` collapsed to one delete method.** It previously had a generic `delete(OrderActivity $activity)` alongside the guarded `delete_comment(int $order_id, int $id)` that called it — the generic one had no other caller anywhere in the codebase, so it was dead indirection. `delete_comment()` now does the `find_or_fail` + comment-type guard + `$activity->delete()` inline; it remains the only delete method on the service.

### Customer visibility: no filtering
Per product decision, customers see the exact same activity list admins do, comments included. No `visibility`/`audience` column is added. The customer endpoint enforces order ownership (a customer can only read the timeline of their own order), not activity-type filtering.

## Risks / Trade-offs

- **[Read-time description generation adds a runtime dependency between the describer and stored metadata shape]** → Mitigated by keeping the metadata-writer and the describer for each activity type defined together, and treating a missing/malformed metadata key as a describer bug to fix, not a runtime crash (fall back to a generic "Order updated" string rather than throwing, so a describer bug doesn't break the whole timeline).
- **[Only two call sites are wired this change; the facade could still be "wrong" in ways that don't surface until the follow-up wires the rest]** → Accepted per explicit scope decision; the semantic-method shape and the describer pattern are exercised by both a create-flow (`order-placed`) and a user-input flow (`comment`), which are the two structurally different cases (system-generated vs. user-authored), giving reasonable confidence the shape generalizes.
- **[Existing `kirki_ecommerce_order_activities` migration correction happens before any release depends on the old FK]** → Confirmed safe: the migration has never shipped as its own commit and no other code references the old FK target.

## Migration Plan

Standard migration `up()`/`down()`; no existing data to backfill since the table has never been used. No rollback complexity beyond `Schema::drop_if_exists`, already implemented.
