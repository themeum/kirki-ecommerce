## Context

See proposal.md - Why. Two facts from the codebase shape the approach:

- "Availability" here means `Product::status === ProductStatus::PUBLISHED` AND `Variant::is_visible === true`. This is a different axis from stock (`InventoryService::has_stock()`), which is already checked separately in both `AddToCartAction`/`UpdateCartItemAction` and `CreateOrderAction`.
- `Variant::scope_visible()` already exists (`app/Models/Variant.php`) but has no call sites — it's the intended hook for "is this variant sellable" and isn't cart/checkout-specific.
- The closest precedent for a status check is `WishlistController::is_valid_variant()`, which checks `status === ProductStatus::PUBLISHED` inline rather than through a shared helper.

## Goals / Non-Goals

**Goals:**
- One shared definition of "available" reused by both the cart response and checkout validation, so they can't drift.
- Match the existing insufficient-stock error shape exactly (`ValidationException`, `Response::UNPROCESSABLE_ENTITY`) so the frontend's existing error handling for cart/checkout failures applies unchanged.

**Non-Goals:**
- Frontend UI for displaying the unavailable flag (proposal explicitly scopes this out).
- Changing `AddToCartAction`/`UpdateCartItemAction` — a product already can't be added to the cart once unavailable (storefront only lists published products), so no new gate is needed there.
- Any change to stock/backorder logic — this is purely the status/visibility axis.

## Decisions

**Where the availability check lives**: a small `is_variant_available(Variant $variant)`-style check colocated with `Variant::scope_visible()`'s intent — evaluated as `$variant->product->status === ProductStatus::PUBLISHED && $variant->is_visible`. Considered adding it as a method on `AvailabilityService`, but that service is purely stock-status-oriented (`IN_STOCK`/`LOW_STOCK`/`OUT_OF_STOCK`); folding a product-status/visibility concept into it would blur its single purpose. Decision: keep it a standalone check (e.g. a `Variant::is_available()` accessor, matching `Variant::scope_visible()`'s home on the model) so `CartResource` and `CreateOrderAction` both call the same thing.

**Cart response field name**: add `is_available` (boolean) per line item in `CartResource::prepare_items()`, alongside the existing `in_stock` boolean — same shape, same place, so the frontend pattern for graying out a line generalizes to both flags without new plumbing.

**Checkout rejection point and error shape**: add the check in `CreateOrderAction::prepare_context_items()`, immediately after the existing "variant not found" `throw_if` (L556) and before the stock check, using the identical pattern: `throw_if(!$variant->is_available(), __('This item is no longer available.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);`. This keeps all three checks (not-found, unavailable, insufficient-stock) visually and structurally identical for future maintainers.

**No auto-removal**: per proposal, unavailable lines are left in the cart. No change to `RemoveCartItemAction` or cart-clearing behavior is needed — the requirement is satisfied by simply not adding any removal logic.

## Correction during implementation

`CreateOrderAction::prepare_context_items()`'s three existing sibling checks (variant-not-found, limit-exceeded, product-not-found) use plain `throw_if($condition, $message)` with the default `Exception::class`, no explicit exception class or HTTP status — which resolves to a 500 via `ApiExceptionHandler`'s fallback (no error code in [100,599] range). The availability check was initially matched to that local convention for consistency, but per explicit direction this was corrected: an unavailable item is a client error, not a server fault, so it should be a 4xx like every other validation failure in this codebase. The check now uses `throw_if(!$variant->is_available(), $message, ValidationException::class, Response::UNPROCESSABLE_ENTITY)`, matching the original design and `InventoryService`'s stock-check pattern, and returns 422.

Per further explicit direction, the three pre-existing sibling checks in this same method were fixed too, following this codebase's own established convention (seen across `InventoryService`, `CountryService`, `TagService`, `VariantController`, etc.): `NotFoundException::class, Response::NOT_FOUND` (404) for "variant not found" and "product not found" (missing-resource lookups), `ValidationException::class, Response::UNPROCESSABLE_ENTITY` (422) for "max per order limit exceeded" (a business-rule violation on an otherwise-valid item). Two regression tests were added (`test_store_order_returns_404_for_nonexistent_variant`, `test_store_order_returns_422_when_quantity_exceeds_per_order_limit`) since none previously covered these paths. The identical gap exists in other files (e.g. `AddToCartAction`'s equivalent checks) — those were intentionally left alone as a separate, broader cleanup outside this change's scope.

## Risks / Trade-offs

- **Stale eager-loaded `product` relation**: `CartService::cart_relations()` already eager-loads `items.product`/`items.variant`, so the new check reads data already being fetched — no N+1 risk introduced.
- **Race between validation and order creation**: same class of race the existing stock check already accepts (product could go draft in the moment between check and transaction commit) — not newly introduced, not addressed here, consistent with existing stock-check behavior.
