## 1. `CartService` primitives

- [x] 1.1 Add public `get_or_create_cart($user_id, $token)`, extracting the current `get_cart()` ?: `create_new_cart()` logic out of `add_item()`.
- [x] 1.2 Change `add_item_to_cart($cart_id, array $item_data)` visibility from `protected` to `public`. (Revised further: signature changed to `add_item_to_cart(CreateCartItemDTO $dto)` — see "Correction during implementation" in design.md.)
- [x] 1.3 Remove `add_item(AddToCartDTO $dto)` entirely.
- [x] 1.4 Verify: `composer test:unit`

## 2. `AddToCartAction` orchestration

- [x] 2.1 Resolve the cart via `cart_service->get_or_create_cart($dto->user_id, $dto->token)`.
- [x] 2.2 Look up any existing line via `cart_service->find_item_in_cart($cart->id, $dto->variant_id)`.
- [x] 2.3 Compute the resulting quantity: `existing ? $existing->quantity + $dto->quantity : $dto->quantity`.
- [x] 2.4 Validate `has_stock()` and `is_within_limit()` against the resulting quantity (not `$dto->quantity` alone).
- [x] 2.5 On success, write via `update_item_quantity()` when a line already existed, or `add_item_to_cart()` when it did not.
- [x] 2.6 Return the cart via `cart_service->find($cart->id)`, matching current return behavior.
- [x] 2.7 Verify: `composer test:unit`

## 3. Migrate direct `CartService::add_item()` callers

- [x] 3.1 Update the cart-seeding helper in `tests/Integration/CartApiTest.php` (around line 499) to call `AddToCartAction::execute()` instead of `CartService::add_item()`.
- [x] 3.2 Update both call sites in `tests/Integration/OrderApiTest.php` (around lines 1031 and 1077) the same way.
- [x] 3.3 For each updated call site, confirm the fixture's seeded quantity still passes stock/limit validation now that it runs through `AddToCartAction`; adjust fixture data if a previously-unvalidated seed would now be rejected. (All call sites seed quantity 1-2 against the default test-product fixture: `available_quantity = 100`, no `max_per_order` configured — no adjustment needed.)
- [x] 3.4 Verify: `composer test:integration` (run via `composer test:docker:integration` — no local WP test env installed; 240 tests, 4691 assertions, all passing)

## 4. Regression coverage for the fixed bug

- [x] 4.1 Add an integration test: two sequential add-to-cart calls for the same variant whose combined quantity exceeds `max_per_order` — second call is rejected, and the cart line's quantity is unchanged from after the first call.
- [x] 4.2 Add an integration test: two sequential add-to-cart calls for the same variant whose combined quantity exceeds available stock — second call is rejected, and the cart line's quantity is unchanged from after the first call. (Required setting `track_inventory => true` on the fixture — `CreateVariantDTO` defaults it to `false`, which short-circuits `has_stock()` to always-true regardless of `available_quantity`.)
- [x] 4.3 Add an integration test: a single add-to-cart call for a variant not yet in the cart, requesting more than `max_per_order` (or more than available stock) in one shot, is still rejected (guards against regressing the already-working single-call case). (Caught a real regression: see "Correction during implementation" in design.md — cart resolution had to be deferred until after validation so a rejected first-ever add-to-cart doesn't persist an empty cart as a side effect.)
- [x] 4.4 Verify: `composer test:integration` (via `composer test:docker:integration` filtered to `CartApiTest` — 17 tests, 662 assertions, all passing)

## 5. Final verification

- [x] 5.1 Run the full suite: `composer test` (via `composer test:docker:unit` + `composer test:docker:integration` — 173 unit tests / 281 assertions, 243 integration tests / 4807 assertions, all passing)
- [x] 5.2 Grep the codebase for any remaining reference to `CartService::add_item` to confirm no caller was missed. (Only `CartService::add_item_to_cart` remains, which is the intended public primitive.)
