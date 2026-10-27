## Why

When a guest signs in and already owns a cart, `CartService::merge_guest_cart_into_owned_cart()` moves the items and then deletes the guest cart. The coupons applied to the guest cart go with it, so the shopper loses their discount with no notice. The merge also writes the guest quantity straight onto the owned line without checking stock or the per-order limit, so a merged cart can hold a quantity the shopper could not add by hand.

## What Changes

- Carry the guest cart's coupons into the owned cart during a merge. Skip any coupon already on the owned cart.
- Do not validate coupon eligibility during the merge. `RecalculateCartAction` already drops invalid coupons from a stored cart on every cart read and at order creation, so a carried coupon that is no longer eligible is removed there.
- Cap each merged line quantity to what stock and the variant's per-order limit allow. The merge never throws on a quantity problem: `get_cart()` runs the merge on every cart read, and a thrown error would roll back, keep the guest cart, and break the cart on every later request.
- The cap applies both to a line that exists in both carts (guest quantity still replaces the owned quantity) and to a guest-only line that moves across.
- Add `InventoryService::max_purchasable_quantity()` so the cap reuses the rules behind `has_stock()` and `is_within_limit()`.
- **BREAKING (spec only)**: the existing scenario "quantities are not capped to available stock" is reversed. No API shape changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cart-identity-sync`: a guest/owned merge now carries coupons forward, and merged line quantities are capped to stock and the per-order limit.

## Impact

- `app/Services/CartService.php`: `merge_guest_cart_into_owned_cart()`.
- `app/Services/InventoryService.php`: new `max_purchasable_quantity()` method.
- Tests: `tests/Integration/GuestOrderMergeTest.php` and a unit test for the new inventory method.
- No migration, no API response change, no frontend change.
- Out of scope: telling the shopper that a coupon or quantity was dropped. That needs new response metadata and is a separate change.
