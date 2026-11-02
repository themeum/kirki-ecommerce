## Why

Several order, stock, coupon and refund flows read a value, check it in PHP, then write it with no lock and no condition on the write. Under concurrent requests (flash sales, double clicks, a webhook racing an admin action) two requests can both pass the check. The result is oversold stock, coupons used past their limit, refunds above the refundable total, and stock or coupon counts released twice. These bugs lose money and corrupt inventory, so they must be fixed before the plugin ships.

## What Changes

- Make stock changes atomic: `reserve_stock()` and `decrement_stock()` do the availability check inside the SQL `UPDATE` (`WHERE available_quantity >= ?`) and fail when no row changes. Back-order variants keep the unconditional decrement.
- Make `release_reserved_stock()` and `confirm_reserved_stock()` clamp to the committed quantity inside the SQL `UPDATE`, not from a value read earlier.
- Make coupon usage atomic: the increment of `current_usage_count` carries the `usage_limit` condition and fails the order when no row changes. The per-customer limit is re-checked after the coupon row is locked.
- Make refund creation safe: the order row is locked inside the transaction, and the refundable amount is calculated after the lock.
- Make order state changes apply once: `apply_order_action()` updates with `WHERE order_status = <expected>` and reports failure when no row changes, so stock release, coupon reversal and events run only for the request that won.
- Serialise order edits: `UpdateOrderAction` locks the order row and reloads its items inside the transaction.
- Harden the invoice counter edge cases (first-ever order, yearly reset).
- Add regression tests for each fix that prove the guard, plus an optional true-concurrency stress script.

No REST response shape changes. **BREAKING**: none. A request that lost a race now fails with the existing validation error ("Insufficient stock", "Coupon usage limit reached", and similar) where before it silently oversold.

## Capabilities

### New Capabilities
- `inventory-stock-atomicity`: Stock reserve, decrement, release and confirm change stock in one conditional statement, so available quantity never goes below zero for variants without back orders, and committed quantity never goes below zero.
- `coupon-usage-limit-atomicity`: A coupon with a usage limit, or a per-customer limit, is never used beyond that limit by concurrent orders.
- `refund-amount-atomicity`: Concurrent refund requests for one order never refund more than the refundable total.
- `order-state-transition-atomicity`: An order state transition and its side effects (stock release, coupon reversal, events) happen once, even when requests race. Order edits on one order run one at a time.

### Modified Capabilities

None. Existing specs describe validation outcomes that stay the same. The new specs cover the concurrent case.

## Impact

- `app/Services/VariantService.php`: new conditional decrement and clamped move methods.
- `app/Services/InventoryService.php`: `reserve_stock()`, `decrement_stock()`, `release_reserved_stock()`, `confirm_reserved_stock()`.
- `app/Services/CouponService.php`, `app/Concerns/PersistsOrderCoupons.php`, `app/Services/DiscountService.php`: atomic usage increment and per-customer re-check.
- `app/Actions/Order/CreateRefundAction.php`: lock before the refundable calculation.
- `app/Services/OrderService.php` (`apply_order_action`), `app/Managers/OrderManager.php` (`mark_as_cancel`, `mark_payment_as_paid`), `app/Actions/Order/UpdateOrderAction.php`.
- `app/Supports/OrderNumberGenerator.php`: counter bootstrap and year rollover.
- `tests/Integration` and `tests/Unit`: new tests. No database migration is required.
- `docs/`: a short section on stock and coupon concurrency behaviour, including a "Where this differs from WooCommerce" note.
- Not changed: `vendor/libraries/framework/src/` (generated package; not edited by hand).
