## Why

`CreateCustomerAction` exposes a public `provision()` method (in addition to `execute()`) purely so `CreateOrderAction` can fold customer creation into the order's own DB transaction — no other Action class in the codebase has more than `execute()` public. That coupling also means customer resolution happens deep inside the order transaction, after cart calculation already ran, so calculation always sees `customer_id = 0` for a shopper's first-ever checkout. `DiscountService::validate_coupon()` gates `first_time_buyer_only`, `has_customer_limit`, and customer-include-list coupons on `context->customer_id` — so those coupon types are currently broken for genuinely first-time logged-in buyers, who get rejected with "please login" while already logged in.

## What Changes

- `CreateCustomerAction::provision()` is removed; its body is folded back into `execute()` (already transactional), which becomes the only public entry point again, matching every other Action class. `provision()` was only ever extracted so `CreateOrderAction` could reuse it inside a transaction it didn't own — with that caller gone, it has no remaining purpose.
- `CreateOrderAction` resolves the checkout customer (auto-provisioning one if needed) at the top of `execute()`, before `prepare_calculation_context_dto()`, by calling `create_customer_action->execute(...)` instead of `->provision(...)`.
- Customer auto-provisioning now commits in its own transaction, independent of the order's transaction. **BREAKING (behavior change):** if order creation subsequently fails (bad shipping method, invalid coupon, insufficient stock, etc.), the auto-provisioned `Customer` record, its WordPress user, and its addresses are no longer rolled back — they persist.
- Because the customer is resolved before cart calculation, `context->customer_id` is populated in time for `DiscountService::validate_coupon()`, fixing `first_time_buyer_only`, `has_customer_limit`, and customer-include-list coupon validation for first-time checkout customers.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `checkout-customer-provisioning`: customer provisioning is no longer atomic with order creation (provisioning commits independently and is retained even if the order subsequently fails); customer resolution now happens before cart/coupon calculation instead of inside the order transaction.

## Impact

- `app/Actions/Customer/CreateCustomerAction.php` — `provision()` removed; its body moves into `execute()`.
- `app/Actions/Order/CreateOrderAction.php` — reorders customer resolution to the top of `execute()`, ahead of `prepare_calculation_context_dto()` and `DB::begin_transaction()`; drops the in-transaction `provision()` call and the now-redundant `$create_order_dto->customer_id` assignment inside the transaction.
- No API contract or request/response shape changes; no migrations.
- Consumers relying on "no orphan customer without a successful order" (if any exist outside this codebase, e.g. reporting/exports) should be aware orphan customers become possible.
