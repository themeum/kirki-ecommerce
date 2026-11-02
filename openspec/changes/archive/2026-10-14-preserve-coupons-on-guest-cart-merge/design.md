## Context

`CartService::get_cart()` runs the sign-in sync on every authenticated cart read. When both a guest cart and an owned cart exist, `merge_guest_cart_into_owned_cart()` moves or updates the items and deletes the guest cart. Deleting the guest cart also deletes its `cart_coupons` rows through the foreign key.

`RecalculateCartAction` already removes invalid coupons from a stored cart. `CartResource` and order creation call it, so coupon eligibility is checked lazily on the next read. `CartService` has no constructor, and `RecalculateCartAction` depends on `CartService`.

`InventoryService` offers `has_stock()` and `is_within_limit()`, both yes/no checks. It does not depend on `CartService`.

See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**
- Keep guest coupons after a merge.
- Keep merged quantities inside stock and the per-order limit.
- Make the merge safe to run on every cart read.

**Non-Goals:**
- Validate coupon eligibility inside the merge.
- Change the "guest quantity replaces owned quantity" rule.
- Tell the shopper what was dropped (needs response metadata; separate change).

## Decisions

**Copy coupons, do not call `RecalculateCartAction` from the merge.** Recalculation already drops invalid coupons on the next read. Calling it from `CartService` would make the service and the action depend on each other, and it does not check stock anyway. The merge copies each guest coupon that the owned cart does not already hold, using the existing `add_coupon()`. The unique key on (cart_id, coupon_id) makes the existing-coupon check necessary. Alternative: validate with `DiscountService` during the merge. Rejected: it needs a full calculation context (addresses, shipping) the merge does not have, and it repeats work the read path does.

**Cap, do not throw.** The merge runs inside `get_cart()`. A thrown error rolls the transaction back, the guest cart stays, and every later cart read throws again. The merge therefore lowers the quantity to the largest allowed value. Alternative: reject the merge and keep both carts. Rejected: it breaks the cart for the shopper.

**New `InventoryService::max_purchasable_quantity(int $variant_id, int $quantity): int`.** It returns the requested quantity lowered to the stock level (when the variant tracks stock and does not allow back orders) and to `max_per_order` (when the limit is on). It uses the same conditions as `has_stock()` and `is_within_limit()` so the three methods cannot drift apart. A missing variant returns the requested quantity unchanged, because a deleted variant is a cart-availability concern handled elsewhere. Alternative: loop on `has_stock()` and `is_within_limit()`. Rejected: slow and awkward.

**Resolve `InventoryService` inside the merge with the container.** `CartService` has no constructor and is built in many places, so adding a constructor argument touches every call site. The merge resolves the dependency lazily, the same way other classes in the codebase use `app()->make()`.

**Keep "guest quantity replaces owned quantity".** It is the existing, specified rule. Summing would be a behavior change that the issue does not ask for.

**A clamped quantity of 0 removes the line.** If a variant has no stock left, the guest line is not carried and the owned line is not updated to 0. Result: no zero-quantity lines.

## Risks / Trade-offs

- [Shopper sees a lower quantity or a missing coupon with no notice] → Accepted for now; the proposal lists notices as a separate change.
- [A coupon carried over is not valid for the owned account, for example a first-time-buyer coupon] → The next pricing removes it. This is the same path a coupon takes today when its conditions stop being true.
- [Reversed spec scenario "not capped to available stock"] → The delta spec and the existing test are updated in the same change.
