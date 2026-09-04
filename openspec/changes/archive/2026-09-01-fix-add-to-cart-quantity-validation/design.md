## Context

See [proposal.md](proposal.md) for motivation. Relevant current state:

- `AddToCartAction::execute()` validates `has_stock($variant_id, $dto->quantity)` and `is_within_limit($variant_id, $dto->quantity)`, then calls `CartService::add_item($dto)`.
- `CartService::add_item()` resolves the cart (`get_cart()`, creating one via the protected `create_new_cart()` if none exists), looks up any existing cart item for the variant via `find_item_in_cart()`, and either merges into it (`update_item_quantity`) or creates a new line (the protected `add_item_to_cart()`). This merge decision is invisible to the Action.
- `UpdateCartItemAction` already has the correct shape for comparison: it fetches the target item, validates `has_stock`/`is_within_limit` against `$dto->quantity` directly (that DTO field is an absolute set, not a delta), then calls the already-public `update_item_quantity()`. No merge ambiguity exists there because there's nothing to merge.
- `CartService::add_item()` is called directly, bypassing `AddToCartAction` and its validation, from three test call sites: `tests/Integration/CartApiTest.php:499`, `tests/Integration/OrderApiTest.php:1031`, `tests/Integration/OrderApiTest.php:1077`.
- No unique constraint exists on `(cart_id, variant_id)` in `kirki_ecommerce_cart_items`, and no transaction/row lock wraps the read-check-write sequence.

## Goals / Non-Goals

**Goals:**
- Validate stock and per-order limit against the cart line's *resulting* quantity (existing + requested), for both the "line already exists" and "new line" cases.
- Have exactly one place per request that decides "does this item already exist in the cart" — used for both validation and the write — instead of the Action and the Service each independently re-deriving it.
- Keep `CartService` as a persistence-only layer (no `InventoryService` dependency, no stock/limit business rules) and `AddToCartAction` as the sole owner of that validation, consistent with `UpdateCartItemAction`.

**Non-Goals:**
- Closing the concurrent-request race (two simultaneous requests both reading "no existing line" before either writes). Tracked as an explicit follow-up per the proposal; this change does not add locking, transactions, or a unique constraint for that purpose.
- Changing the `POST /cart/items` request/response contract.
- Changing `UpdateCartItemAction` — its validation is already correct.

## Decisions

### Split `CartService::add_item()` into standalone public primitives, rather than making `add_item_to_cart()` public as-is

Considered and rejected: leaving `add_item()` in place and having the Action separately call `find_item_in_cart()` before calling `add_item()`, purely to compute the total for validation. Rejected because it leaves two independent lookups deciding the same "does this item exist" question (one in the Action for validation, one inside `add_item()` for the write) with nothing enforcing they agree — the exact shape of bug this change fixes, just moved one level down.

Chosen approach: remove `add_item()`. Extract its cart-resolution half into a new public `CartService::get_or_create_cart($user_id, $token)`. Change `add_item_to_cart()` from `protected` to `public` (kept as its own primitive rather than merged into something else, since `find_item_in_cart` / `update_item_quantity` / `add_item_to_cart` together already form a complete, minimal CRUD surface). `AddToCartAction` calls `find_item_in_cart()` exactly once, uses that single result both to compute the validation total and to decide which write primitive to call.

Alternative considered: give `CartService` a single `upsert_item($cart_id, $variant_id, $product_id, $quantity)` that takes the final, already-validated quantity and internally branches merge-vs-create. Rejected: it would re-run `find_item_in_cart()` a second time inside the Service to do that branching, reintroducing a second lookup (a minor cost, but with no offsetting benefit — `update_item_quantity`/`add_item_to_cart` already exist as public primitives and this pattern is what `UpdateCartItemAction` already uses elsewhere).

### `get_or_create_cart()` is a genuine Service-level primitive, not new business logic

Cart resolution (find-or-create a cart for a user/token) is lifecycle plumbing, not a policy decision — unlike stock/limit checks, it doesn't decide whether a mutation is *allowed*. It belongs in `CartService` for the same reason `get_cart()` already does. `create_new_cart()` stays `protected`, called only from the new `get_or_create_cart()`, since nothing outside `CartService` needs to force-create a cart without first checking for an existing one.

### Test call sites switch to `AddToCartAction`

The three integration tests calling `CartService::add_item()` directly are seeding cart state to test unrelated flows (order placement, coupons), not testing add-to-cart validation itself. Since `add_item()` no longer exists, they call `AddToCartAction::execute()` instead — this is strictly more correct, since it means those tests seed state through the same validated path production traffic uses, rather than a shortcut that (per this change) had a bug in it.

### Correction during implementation: `add_item_to_cart()` takes a DTO, not `($cart_id, array $item_data)`

The task list had `add_item_to_cart()` keep its existing `($cart_id, array $item_data)` shape and just go from `protected` to `public`. That was inconsistent with the rest of the codebase: every other Service's `create()` method (`TagService`, `VariantService`, `ProductService`, `CouponService`, `AddressService`, etc.) takes a typed `CreateXDTO`, not a raw array — `CartService`'s array-based methods are the outlier, not the norm, and making one of them public without fixing that just exported the inconsistency. Added `App\DTO\Cart\CreateCartItemDTO` (`cart_id`, `product_id`, `variant_id`, `quantity`) and changed `add_item_to_cart()` to `add_item_to_cart(CreateCartItemDTO $dto)`, internally `CartItem::create($dto->to_array())` — the same `to_array()`-off-the-base-`DTO`-class pattern `TagService::create()` already uses.

### Correction during implementation: cart creation is deferred until after validation

The task list originally had `AddToCartAction` resolve the cart via `get_or_create_cart()` up front, before validation, so it could look up any existing item to compute the resulting quantity. In practice this created a persisted, empty cart (and set a guest cookie) as a side effect of a *rejected* add-to-cart request — a regression from current behavior, where validation runs entirely before `CartService` is touched. Caught by `test_add_item_rejects_single_call_exceeding_limit` (a brand-new cart scenario): `GET /cart` returned a cart record instead of nothing after the rejected request.

Fixed by splitting cart resolution in two: a read-only `get_cart()` lookup up front (returns `null` if none exists, used only to find any existing item for the quantity calculation), and `get_or_create_cart()` deferred until immediately before the write, called only once validation has passed. No new capability was needed for this — `get_cart()` was already public.

## Risks / Trade-offs

- **[Risk]** `add_item_to_cart()` becoming `public` widens `CartService`'s API surface. → **Mitigation**: it's a narrow, single-purpose primitive (`create a cart item row`) with no business-rule leakage — same shape as the already-public `update_item_quantity()`.
- **[Risk]** Test churn at three call sites could mask an unrelated failure if `AddToCartAction`'s validation now rejects a fixture that `add_item()` previously accepted unconditionally. → **Mitigation**: check each fixture's quantity against seeded stock/limit while updating the call sites; adjust fixture data if needed rather than working around the validation.
- **[Trade-off]** The concurrent-request race is explicitly not addressed here (see Non-Goals). This change fixes the sequential/repeated-click case described in the proposal; true simultaneous requests for the same variant can still both pass validation before either writes.
