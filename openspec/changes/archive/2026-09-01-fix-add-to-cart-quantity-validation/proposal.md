## Why

`AddToCartAction` validates stock and per-order limits against the incoming `quantity` only, not against the quantity the cart line will actually hold after merging with any existing item. Adding to an already-populated cart line in multiple calls (e.g. clicking "Add to cart" repeatedly) can silently push a variant's cart quantity past its stock or its `max_per_order` limit, because each call only checks its own delta against the limit, never the resulting total.

## What Changes

- `AddToCartAction` computes the cart line's *resulting* quantity (existing quantity + requested quantity) before validating stock and per-order limits, instead of validating the requested quantity in isolation.
- `CartService::add_item()` is removed. Its two responsibilities — resolving/creating the cart, and merging-or-creating the cart item — are split into standalone public primitives so the Action can validate against the same lookup it uses to write, with no duplicated or hidden merge decision:
  - `CartService::get_or_create_cart($user_id, $token)` (new, extracted from the current internal logic in `add_item()`)
  - `CartService::add_item_to_cart(CreateCartItemDTO $dto)` (visibility changed from `protected` to `public`; signature changed from `($cart_id, array $item_data)` to a typed `CreateCartItemDTO`, matching the DTO-based `create()` convention used by every other Service in this codebase — see design.md)
  - `CartService::find_item_in_cart()` and `CartService::update_item_quantity()` (already public, unchanged)
- `AddToCartAction` orchestrates: resolve cart → look up existing item → compute total → validate stock/limit against the total → write via `update_item_quantity` (merge) or `add_item_to_cart` (new line).
- Test call sites that previously called `CartService::add_item()` directly to seed cart state now go through `AddToCartAction`, so integration tests exercise the same validated path as production traffic.
- **BREAKING**: `CartService::add_item()` is removed. Any code calling it directly must call `AddToCartAction::execute()` instead.

Out of scope for this change: concurrent (simultaneous) add-to-cart requests for the same variant can still both pass validation before either writes, since there is no transaction/row lock or unique constraint backing this check-then-write. That race is tracked as a follow-up.

## Capabilities

### New Capabilities
- `cart-item-quantity-limits`: Defines how the backend validates a cart line's resulting quantity — after merging with any existing quantity for that variant — against available stock and the variant's configured per-order limit when items are added to the cart.

### Modified Capabilities
(none — no existing spec currently covers add-to-cart stock/limit validation)

## Impact

- `app/Actions/Cart/AddToCartAction.php` — validation logic rewritten to check the resulting total quantity.
- `app/Services/CartService.php` — `add_item()` removed; `get_or_create_cart()` added; `add_item_to_cart()` visibility changed to `public` and its signature changed to take a `CreateCartItemDTO`.
- `app/DTO/Cart/CreateCartItemDTO.php` — new DTO (`cart_id`, `product_id`, `variant_id`, `quantity`).
- `tests/Integration/CartApiTest.php`, `tests/Integration/OrderApiTest.php` — call sites using `CartService::add_item()` switched to `AddToCartAction`.
- No API contract change: the `POST /cart/items` request/response shape is unchanged, only the validation now checks the correct value.
