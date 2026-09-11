## 1. `AddressService` — split transactional methods so they can be called without nesting

- [x] 1.1 In `app/Services/AddressService.php`, extract the body of `create()` (minus the `DB::begin_transaction()`/`commit()`/`catch`/`rollback()` wrapper) into a new `protected function create_without_transaction(CreateAddressDTO $data)` that returns the created `Address`. Make `create()` a thin wrapper: begin transaction, call `create_without_transaction()`, commit, catch/rollback exactly as today.
- [x] 1.2 Do the same for `set_default()` → `protected function set_default_without_transaction(int $id, string $purpose)`.
- [x] 1.3 Do the same for `update()` → `protected function update_without_transaction(UpdateAddressDTO $data)` (this is also where task 2's null-handling fix lives — do task 2 as part of writing this method, not as a separate pass).
- [x] 1.4 Verify `bash kirki-test integration --filter=AddressApiTest` still passes unchanged (these endpoints keep calling the public, transactional methods — no behavior change here). Passed (only the expected delete-promotion failure remains, addressed in group 3).

## 2. `AddressService::update()` — distinguish omitted default flags from explicitly-false

- [x] 2.1 Change `app/DTO/Address/UpdateAddressDTO.php`'s `$is_default_shipping`/`$is_default_billing` defaults from `false` to `null`.
- [x] 2.2 Grep for other readers of these two `UpdateAddressDTO` properties and confirm `AddressService::update()`/`update_without_transaction()` is the only one affected by the default change. Confirmed — `AddressUpdateRequest`'s rules/filters just sanitize input, unrelated; `AddressResource`, `Customer`/`Address` models, and `CreateAddressDTO` are untouched by this change.
- [x] 2.3 In `update_without_transaction()`, build the array passed to `$address->update(...)` by unsetting `is_default_shipping`/`is_default_billing` from `$data->to_array()` when the DTO value is `null`. Kept the existing `unset_current_default()` call guarded by `!empty(...)` — unchanged.
- [x] 2.4 Verify `bash kirki-test integration --filter=test_update_address_does_not_change_default_status` passes. Passed.
- [x] 2.5 Added `test_update_address_can_explicitly_set_default_status` in `tests/Integration/AddressApiTest.php`. Passed.

## 3. `AddressApiTest.php` — sync the delete-promotion test to dev's kept behavior

- [x] 3.1 Rewrote as `test_delete_default_address_promotes_another` in `tests/Integration/AddressApiTest.php`. Passed.
- [x] 3.2 Added `test_delete_only_address_leaves_no_default`. Passed.
- [x] 3.3 `AddressService::delete()` itself is unchanged — no code task here.
- [x] 3.4 Verified `bash kirki-test integration --filter=AddressApiTest` passes — 24 tests, 253 assertions, OK.

## 4. `CreateOrderAction` — guard `sync_address()` for guests and avoid nested transactions

- [x] 4.1 Added an early return in `CreateOrderAction::sync_address()` when `empty($order->customer_id)`. Its create-vs-use-existing-id branches are otherwise unchanged.
- [x] 4.2 Changed `create_address()`'s call into `AddressService::create()` to `create_without_transaction()`, and the two `set_default()` calls at the end of `sync_address()` to `set_default_without_transaction()`. Had to fix the three `_without_transaction()` methods' visibility from `protected` to `public` (task 1 originally specified `protected`, but `CreateOrderAction` is a separate class and PHP `protected` isn't callable from outside the declaring class/subclasses — corrected in AddressService.php). `update_address()` stays unused, as confirmed — no change needed there.
- [x] 4.3 Verified `bash kirki-test integration --filter=test_checkout_failure_leaves_provisioned_customer_behind` passes.
- [x] 4.4 Verified `bash kirki-test integration --filter=OrderApiTest` passes as a whole — but two further issues surfaced along the way, fixed as part of this task rather than deferred (see below): a docblock in `sync_address()` containing literal `*/` inside the comment text broke the PHP parser (fixed the wording), and the checkout-empties-cart test's underlying bug (see task 4.5).
- [x] 4.5 **New, not in the original plan:** `test_checkout_empties_cart_for_authenticated_user` was failing independently of everything above — `CartService::create_cart()` (added by the same dev commit `6a8bd7c9` that this change is otherwise fixing) does `$customer->get_shipping_address()['id']` unconditionally once `!empty($customer)`, but `customer()` always returns a non-null wrapper object, so that guard never actually skips anything; for an authenticated user with no `Customer` row yet, `get_shipping_address()` returns `null` and `null['id']` raises a notice that this test environment escalates to a 500. Fixed in `app/Services/CartService.php`: guard on `$customer->get_customer_id()` instead of `$customer` itself, and null-check each address before indexing into it — preserves the exact original comparison result for every case, just without dereferencing a null.

## 5. Sync `OrderApiTest.php` to the current cart API

- [x] 5.1 Replaced both `app()->make(CartService::class)->add_item($add_to_cart_dto)` call sites with `app()->make(AddToCartAction::class)->execute($add_to_cart_dto)`.
- [x] 5.2 `AddToCartAction` was already imported in `tests/Integration/OrderApiTest.php`.
- [x] 5.3 Verified both tests pass.

## 6. Customer-contact fallback tests — premise was wrong, real bug found

- [x] 6.1–6.4 superseded. The original premise (a WP-user/current-user resolution issue) was wrong. Actual cause: `OrderCreateRequest`'s `rules()` merges a computed `is_billing_same_as_shipping` value into the request (defaulting to `true` when omitted, matching its own `required_if:is_billing_same_as_shipping,0` validation on billing fields), but `filters()` never listed `is_billing_same_as_shipping` — the sanitizer only carries forward keys present in `filters()`, so that merged value was silently dropped and `CreateOrderPayloadDTO`'s own class default (`true`) won every time. With it staying `true`, `CreateOrderAction::resolve_billing_and_shipping_addresses()` (called first thing in `execute()`) copies `shipping_first_name` over `billing_first_name` — and the test fixture's `shipping_first_name` default happens to be `'John'`, which is exactly the value that kept leaking through instead of each test's `billing_first_name` override. This is a real bug affecting production requests too: a real API consumer explicitly sending `is_billing_same_as_shipping: false` would have been silently ignored. Fixed by adding `'is_billing_same_as_shipping' => Sanitizer::BOOL` to `OrderCreateRequest::filters()` in `app/Http/Requests/Order/OrderCreateRequest.php` (covers both `/orders` and `/checkout`, which share this request class), and by adding `'is_billing_same_as_shipping' => false` to the three affected tests' payloads (`test_checkout_customer_prefers_wp_profile_then_falls_back_to_billing`, `test_order_customer_contact_falls_back_to_billing_for_missing_wp_fields`, `test_order_customer_contact_uses_billing_for_guest_checkout`) so their intent (billing genuinely differs from shipping) is actually exercised. Verified all three pass, plus the sibling `test_order_customer_contact_uses_wp_profile_when_complete` and `test_checkout_duplicates_billing_address_from_shipping_when_same` (the "same as shipping" path) still pass.

## 7. Full regression pass

- [x] 7.1 Ran `bash kirki-test all`. First pass surfaced 2 further failures (see 7.1a); after fixing them, 0 failures / 0 errors (572 tests, 8551 assertions).
- [x] 7.1a **New, not in the original plan:** `test_apply_and_remove_coupon_on_cart` and `test_removing_one_of_several_applied_coupons_keeps_the_rest` were failing (422 instead of 200), unrelated to address/checkout — a genuine merge-conflict-resolution mistake in `app/Actions/Cart/RemoveCouponAction.php`. The resolved code kept the multi-coupon branch's per-code removal logic (`$applied_coupon = $cart->coupons->first(...)`) but left dev's variable name in the guard clause (`throw_if(empty($applied_coupon_info), ...)` — `$applied_coupon_info` was never assigned anywhere in the merged version, so the guard always fired and coupon removal always 422'd). Fixed by changing the guard to check `$applied_coupon` (confirmed correct against the pre-merge multi-coupon branch's version of this method via `git diff d846797d^1 d846797d^2`).
- [x] 7.2 Full suite run in 7.1 covers `CartApiTest`, `CustomerApiTest`, and `OrderActivityApiTest` — all pass.
- [x] 7.3 `composer phpcs:wporg` reports findings only in files this change never touched (`helpers.php`, `popover.php`, seeders, `Assets.php`, `PersistsOrderCoupons.php`, `OnlinePaymentService.php`, `CurrencyService.php` — all pre-existing). Confirmed clean by running phpcs directly against just the six files this change modified: 0 errors, 0 warnings.
