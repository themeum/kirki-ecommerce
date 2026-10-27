## 1. Inventory cap helper

- [x] 1.1 Add `InventoryService::max_purchasable_quantity()` that lowers a quantity to stock and the per-order limit, with the same conditions as `has_stock()` and `is_within_limit()`
- [x] 1.2 Add unit tests for the helper: tracked stock, back order, untracked in-stock, per-order limit, both limits, missing variant

## 2. Merge behavior

- [x] 2.1 In `merge_guest_cart_into_owned_cart()`, cap the quantity of duplicate-variant lines and moved lines with the helper; skip a line whose capped quantity is 0
- [x] 2.2 In the same method, copy guest coupons not already on the owned cart with `add_coupon()` before the guest cart is deleted
- [x] 2.3 Update the method docblock to describe the coupon copy and the cap

## 3. Tests

- [x] 3.1 Update `test_duplicate_variant_merge_uses_guest_quantity` in `CartApiTest` to the new capped result and add duplicate-variant limit and moved-line cases
- [x] 3.2 Add merge tests: guest coupon survives, coupons from both carts kept, shared coupon applied once, invalid carried coupon dropped on the next cart read
- [x] 3.3 Run the PHP tests for cart and inventory, and `composer phpcs:wporg`

## 4. Docs

- [x] 4.1 Check `docs/` for a cart doc that describes merge behavior and update it in the same change; if none exists, record that in the final summary
