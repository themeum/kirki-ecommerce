## Context

See proposal.md - Why. In short: `carts.discount_details` and `orders.coupon_code`/`discount_details` are single-value columns, `CalculationContextDTO::$coupon` is a single string, and `DiscountService`/`RecalculateCartAction` are written for exactly one `Coupon`. `coupon_usage` (coupon_id, order_id, customer_id) already has a composite `(coupon_id, order_id)` unique key rather than a bare `order_id` key — a multi-coupon-per-order-friendly shape already existed here, but this change goes further and folds `coupon_usage` into `order_coupons` entirely (see Decisions).

Two dead/deferred mechanisms already exist in the schema and are explicitly **not** touched by this change:
- `coupons.combinations` (JSON, unused today) — left as-is for future combinability rules.
- `coupons.method = 'automatic'` and `discount_type = 'buy-x-get-y'` — both unimplemented stubs today, left as-is.

## Goals / Non-Goals

**Goals:**
- Multiple `code`-method coupons (`amount-off`, `free-shipping`) can be applied to a cart and stack unconditionally.
- Exact per-item, per-coupon discount attribution is recorded on the order at checkout for refund/reporting accuracy.
- Legacy single-coupon columns are removed cleanly (alpha stage, no data to preserve).
- The calculation and validation code has explicit seams so combinability rules, automatic coupons, and `buy-x-get-y` can be added later without rearchitecting.

**Non-Goals:**
- Any combinability/stackability restriction — every valid, applicable coupon combination is allowed. (`coupons.combinations` stays unread and unwritten.)
- Any explicit apply-order/priority field — sequencing follows the order coupons were applied to the cart / listed in the checkout payload.
- `automatic`-method coupon resolution or `buy-x-get-y` calculation logic.
- Backfilling historical carts/orders into the new tables.
- A capped/limited discount ceiling across stacked coupons beyond the existing "never let the order total go below zero" floor.
- Implementing the admin (`resources/app`) or storefront (`resources/site`) UI changes needed to surface multiple applied coupons. This change delivers backend/API only; tasks.md ends with a guide (not implementation tasks) enumerating what a follow-up change needs to touch.

## Decisions

**1. Cart persists only the applied-coupon list; item-level breakdown stays fully live.**
`cart_coupons` (cart_id, coupon_id) replaces `carts.discount_details`. It does not mirror `order_item_coupons` on the cart side. Per-item discount breakdown for a cart continues to be computed in memory on every `CartResource`/`RecalculateCartAction` call, exactly as it is today for the single-coupon case.
*Alternative considered:* a full symmetric 4-table design (`cart_coupons` + `cart_item_coupons`), mirroring the order side. Rejected — carts are ephemeral (destroyed at checkout) and mutate on every add/remove/quantity-change; persisting item-level attribution rows would mean rewriting them on every cart mutation for a value that's about to change again, with no retention value once the cart is gone.

**2. Order persists full attribution: `order_coupons` + `order_item_coupons`.**
This matches Shopify's `DiscountApplication`/`DiscountAllocation` pattern (one row per applied discount, one row per line-item attribution) rather than FluentCart's flatter `applied_coupons`-only model (order-level amount, no item junction). The flatter model can't answer "which coupon caused this line's discount," which is the core requirement driving this change (refunds, reporting).

**3. Drop legacy single-coupon columns outright, via new migration files.**
`carts.discount_details`, `orders.coupon_code`, `orders.discount_details` are dropped (not deprecated-in-place) since the project is pre-production alpha with no data requiring preservation. Existing migration files are never edited — the drops are new `Alter*` migration classes, consistent with how every other schema change in this codebase is layered.
`orders.base_discount_total`/`invoiced_discount_total` and `order_items.base_discount_amount`/`invoiced_discount_amount` are **kept** — they are denormalized rollups structurally identical to every other `base_*`/`invoiced_*` total column already in this schema (`base_subtotal`, `base_tax_total`, etc.), just now computed by summing `order_coupons`/`order_item_coupons` instead of a single coupon's calculation.

**4. `coupon_usage` is dropped; `order_coupons` absorbs its job.**
`coupon_usage` (coupon_id, order_id, customer_id) and the proposed `order_coupons` record the same underlying fact — a coupon was consumed by an order — with `order_coupons` being the strict superset (it adds the discount amount and rule snapshot). Keeping both would mean writing that fact twice on every checkout and keeping them in sync forever. `order_coupons` gains:
- a denormalized `customer_id` column (snapshot of `orders.customer_id` at checkout, nullable for guests — the same denormalization pattern already used for `orders.customer_email` etc.), so `DiscountService::validate_conditions()`'s per-customer usage-limit check — run on every cart recalculation — stays a single indexed lookup (`where coupon_id = ? and customer_id = ?`) with no join, exactly matching `coupon_usage`'s current query shape and cost.
- a nullable `usage_reversed_at` timestamp, set (along with decrementing `coupons.current_usage_count`) when an order is cancelled. This is a behavior improvement, not just deduplication: today, `OrderManager::mark_as_cancel()` deletes the single `coupon_usage` row on cancel, so a cancelled order's coupon history vanishes entirely. With the merge, the `order_coupons` row (and its `order_item_coupons` attributions) survive cancellation intact for history/reporting; only its contribution to usage-limit counting is reversed. `usage_reversed_at` being non-null also guards against double-decrementing `current_usage_count` if cancellation logic ever runs twice for the same order.
`Coupon::usage()` and `Order::coupon_usage()` (today a `has_one`, already incompatible with multiple coupons regardless of this decision) are both repointed at `order_coupons`; the `CouponUsage` model and its table are removed.

**5. `coupons.combinations` is left completely untouched.**
Not read, not written, not renamed, not repurposed. Every currently-applied coupon is treated as combinable with every other. This is a deliberate, user-directed deferral, not an oversight — flagging it here so a future combinability change knows this column is still the intended (unused) home for that rule.

**6. Explicit validation seam for future combinability.**
`DiscountService::validate_coupon()` runs a fixed sequence of per-coupon checks (status, item eligibility, spend/usage conditions, region, customer eligibility). This change adds one more step to that sequence — a no-op placeholder that receives the coupon being validated and the set of coupons already applied to the same cart/order. Today it always passes. A future combinability rule (reading `coupons.combinations`) plugs into this single step; it does not touch discount calculation math.

**7. Explicit seam for future automatic-coupon resolution.**
`CalculationContextDTO::$coupon` (single string) becomes `$coupons` (array of codes). That array is assembled once, upstream of `DiscountService::calculate()` — from the cart's `cart_coupons` relation for cart context, from the checkout payload's coupon codes for order context. `calculate()` iterates that array; it has no knowledge of where entries came from. When `automatic`-method coupons are implemented later, eligible automatic coupons are merged into this same array before validation runs — no change to `calculate()`'s iteration or the per-coupon validation/attribution logic.

**8. Two-pass calculation order.**
Pass 1: every item-scoped coupon (`discount_target = products`) computes its own eligible items and discount independently; multiple item-scoped coupons hitting the same item both apply, summed. Pass 2: every cart-wide coupon (`discount_target = order`) is processed sequentially, each against the subtotal remaining after the previous cart-wide coupon's discount (order = the sequence coupons appear in the resolved `$coupons` array, i.e. application order — see Open Questions). Free-shipping coupons contribute their own discount entry (the waived shipping cost) independent of both passes.

**9. Rounding: largest-remainder allocation.**
When a coupon's discount is split proportionally across items, each item's share is first computed by integer-minor-unit division (truncated), then any leftover minor units (the difference between the coupon's total discount and the sum of the truncated shares) are distributed one unit at a time to the items with the largest truncated fractional remainder, until exhausted. This guarantees `sum(item shares) === coupon total` exactly, distributing the "extra cent(s)" predictably rather than always dumping them on one item.

**10. Reconciliation is enforced, not just documented.**
The invariants in both specs' "reconcile exactly" requirements are checked at order-creation time, inside the same DB transaction that writes `order_coupons`/`order_item_coupons`. If a computed breakdown doesn't sum correctly, order creation fails and rolls back rather than persisting an inconsistent record — this is a correctness backstop on the calculation code, not just an expectation.

## Risks / Trade-offs

- **Unbounded stacking on one item** (two item-scoped coupons both eligible on the same item, applied unconditionally per Non-Goals) could discount a single item heavily.
  → **Correction during implementation**: capping each coupon individually at the item's subtotal turned out not to be enough — two coupons each capped at 100% of an item still sum to 200% "discount" on that item, which would have broken the "sum of coupons = order total" reconciliation invariant this whole change exists to guarantee. `DiscountService::clamp_item_discounts()` was added as a final pass in `calculate()`: when a summed item discount exceeds that item's subtotal, every contributing coupon's share of that item is scaled down proportionally (the same largest-remainder helper used for cart-wide allocation) so the combined discount never exceeds 100% of the item, and each coupon's reported total is adjusted to match what was actually applied. This replaces the "uncapped combined total" statement from the original design — the combined total is now capped, per item, exactly at that item's subtotal.
- **Dropping `orders.coupon_code`/`discount_details` and `coupon_usage` is breaking** for any code still reading them (`OrderManager::mark_as_cancel()`, exports). → Mitigation: acceptable pre-production; every remaining reader inside the PHP backend must be updated in the same change (tracked in tasks.md), there is no dual-read fallback period. Frontend readers are explicitly out of scope (see Non-Goals) and are handed off via a guide instead.
- **Largest-remainder rounding is more code than "remainder goes to the last item."** → Mitigation: it's a small, self-contained, unit-testable helper; the fairness/predictability is worth the extra ~10 lines given money is involved.
- **No backfill means pre- and post-change orders have different discount data shapes.** → Mitigation: matches proposal's explicit scope; any UI reading order coupon data must treat zero `order_coupons` rows as "this order predates the feature," not as an error.
- **Shipping the backend/API without the frontend leaves the storefront and admin UI temporarily out of sync** (they'll still assume one coupon until the follow-up change lands) → Mitigation: acceptable since this is pre-production/alpha and there is no live traffic depending on coupon UI continuity; the guide in tasks.md makes the follow-up scope explicit so it isn't dropped.

## Migration Plan

1. New migrations: create `cart_coupons`, `order_coupons`, `order_item_coupons`; drop `coupon_usage`.
2. New migrations: drop `carts.discount_details`; drop `orders.coupon_code` and `orders.discount_details`.
3. Backend: rewrite `DiscountService`/`RecalculateCartAction` for the two-pass/N-coupon calculation and largest-remainder rounding; add `CartCoupon`/`OrderCoupon`/`OrderItemCoupon` models and relations (removing `CouponUsage`); update `ApplyCouponAction`/`RemoveCouponAction`/`CartController`; update `CreateOrderAction` to persist attribution inside the existing order-creation transaction; update `OrderManager::mark_as_cancel()` to reverse usage across all of an order's coupons instead of deleting a single row.
4. API: update `CartResource`/`OrderResource`/`OrderCalculationResource` to expose a `coupons` array.
5. Frontend: not part of this change's migration — see the guide at the end of tasks.md for what a follow-up change needs to do.

No rollback data-preservation is needed in either direction (alpha, no production data) — rollback is running each migration's `down()`.

## Open Questions

- Cart-wide coupon application order when more than one is applied: strictly the order they were added to the cart (insertion order of `cart_coupons`), or does the checkout payload get to specify an explicit order? Either is a small, contained decision in the `ApplyCouponAction`/`CreateOrderAction` implementation and doesn't change the specs or task breakdown.
- Largest-remainder tie-breaking when two items have an identical fractional remainder (e.g. break ties by item id ascending) — pure implementation detail, safe to decide during `tasks`.
