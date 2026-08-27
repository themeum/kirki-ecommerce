## Why

Orders currently have no audit trail. There is no record of who changed what, when a payment cleared, when an order shipped, or what an admin privately noted about an order — and no way for a customer to see what happened to their order beyond its current status. `database/migrations/CreateOrderActivitiesTable.php` already scaffolds a table for this, and `App\Events\OrderShipped` / `App\Listeners\AddActivityLog` sketch the intent, but nothing persists an activity today. This change builds the activity system itself — schema, model, service, manager, facade, comment CRUD, and list endpoints — as a solid foundation other order code can call into, without requiring every order lifecycle call site to be wired up in this same change.

## What Changes

- Fix `kirki_ecommerce_order_activities.created_by`'s foreign key to reference `users` (WordPress users) instead of `kirki_ecommerce_customers`, matching the convention already used by `kirki_ecommerce_orders.created_by`/`updated_by` and `kirki_ecommerce_refunds.created_by` (the actor is an admin/WP user, or `null` for pure system events — never a customer).
- Add `App\Constants\Order\OrderActivityType`, enumerating every activity type (`order-placed`, `payment-completed`, `payment-failed`, `status-changed`, `shipped`, `delivered`, `cancelled`, `tracking-added`, `archived`, `on-hold`, `partially-refunded`, `refunded`, `comment-added`), mirroring `OrderStatus`'s `HasConstants` + `get_list()`/`get_formatted()` style.
- Add `App\Models\OrderActivity` (belongs to `Order`), `App\Services\OrderActivityService` (persistence/query, plus the guarded `delete_comment()`), `App\Managers\OrderActivityManager`, and `App\Facades\Activity` — the facade exposes one semantic method per activity type (e.g. `Activity::order_placed($order)`, `Activity::shipped($order)`, `Activity::comment($order_id, $message, $created_by)`) rather than a generic `record()`, mirroring the `@method static` style already used on `App\Facades\Order` and `App\Facades\Money`. The manager also owns `describe()`, the read-time description builder, so the facade is the single entry point for everything order-activity-related — recording and describing alike.
- System-activity descriptions are generated at **read time** from `activity_type` + stored `metadata` (so wording can change later without a data migration); comment descriptions are the admin's message text, stored verbatim at write time.
- New admin endpoints, on a dedicated `App\Http\Controllers\Api\OrderActivityController` (not folded into `OrderController`): create a comment activity on an order, delete a comment activity (guarded — only `comment-added` activities can be deleted), and list an order's activity timeline. No intermediate Action classes — the controller calls `OrderActivityService`/the `Activity` facade directly, since there was no business logic between the two worth a separate layer.
- New customer (Site) endpoint on its own `App\Http\Controllers\Site\OrderActivityController` (not folded into `AccountController`): list an order's activity timeline for an order the customer owns — same activities the admin sees, comments included (no visibility/audience split).
- `App\Resources\Order\OrderActivityResource`, reused as-is by both the admin and customer endpoints — no `Site`-namespaced duplicate, since customers see an identical shape with no filtering.
- Out of scope for this change: wiring `Activity::` calls into the existing order lifecycle call sites (`CreateOrderAction`, `OrderManager`'s `mark_as_*` methods, refund actions, etc.) beyond one or two representative call sites proving the facade works end to end. Also out of scope: deciding whether lifecycle code calls the facade directly or goes through an event/listener — the facade is designed to work identically either way, and that wiring is deferred to a follow-up change.

## Capabilities

### New Capabilities
- `order-activity-log`: recording, describing, listing, and (for comments) creating/deleting order activity entries, for both admin and customer-facing consumers.

### Modified Capabilities
(none — no existing spec covers order activity behavior)

## Impact

- **Database**: `database/migrations/CreateOrderActivitiesTable.php` (FK fix on `created_by`).
- **New PHP**: `app/Models/OrderActivity.php`, `app/Services/OrderActivityService.php`, `app/Managers/OrderActivityManager.php`, `app/Facades/Activity.php`, `app/Providers/OrderActivityServiceProvider.php`, `app/Constants/Order/OrderActivityType.php`, `app/Http/Requests/Order/OrderActivityCreateRequest.php`, `app/Resources/Order/OrderActivityResource.php`, `app/Http/Controllers/Api/OrderActivityController.php`, `app/Http/Controllers/Site/OrderActivityController.php`.
- **Modified PHP**: REST route registration in `routes/api.php`, `app/Models/Order.php` (new `activities()` relation), `bootstrap/providers.php`.
- No frontend changes in this proposal — the React admin UI (`resources/app/`) is not touched; a follow-up change would consume these endpoints from the Timeline UI shown in product screenshots.
