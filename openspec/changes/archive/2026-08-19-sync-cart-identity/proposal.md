## Why

Cart ownership is currently ambiguous across guest and authenticated flows: a cart can be found by `customer_id` or by `cart_token`, then opportunistically attached to a customer, but there is no explicit merge boundary for sign-in and stale-token edge cases. We need a single cart identity model so guest carts, account carts, duplicate line items, stale cookies, and concurrent requests resolve predictably before checkout.

## What Changes

- Introduce a cart identity sync flow that treats every active cart as either anonymous by opaque token or owned by the authenticated shopper, with exactly one active owner identity used for lookup.
- Add an explicit sign-in/adoption/merge path for the four cart-sync cases: no carts, only account cart, only guest cart, and both guest plus account cart.
- When guest and account carts contain the same variant, merge the line by taking the higher quantity and clamping it to available stock instead of summing quantities.
- Ensure stale or invalid guest cart cookies never expose another shopper's cart and are cleared or ignored without causing cart API failures.
- Move guest cart cookie lifecycle into the backend by reading through the framework request cookie API and setting/clearing through the framework Cookie facade.
- Clear or rotate the guest cart cookie after adoption or merge so subsequent requests resolve to the owned cart.
- Preserve existing cart mutation endpoints while making cart lookup, item updates/removals, coupon application, cart updates, and checkout operate through the same resolved cart identity, with optional sync metadata for visible merge notices.
- Add integration coverage for login sync, stale-token handling, duplicate-variant merges, unauthorized item mutation attempts, and stock-bound quantity clamping.

## Capabilities

### New Capabilities
- `cart-identity-sync`: resolving, adopting, and merging guest/account carts through a deterministic cart identity model.

### Modified Capabilities
(none)

## Impact

- `database/migrations/CreateCartsTable.php` and `app/Models/Cart.php` — cart owner identity fields and indexes/constraints may change to support a single active anonymous or owned identity.
- `app/Services/CartService.php` and `app/Services/GuestCartService.php` — centralize cart resolution, adoption, merge, token clearing, and stale-token behavior.
- `libraries/framework/Http/Request.php` and `libraries/framework/Supports/Facades/Cookie.php` usage — cart APIs should consume existing cookie helpers rather than direct `$_COOKIE`, `setcookie()`, or storefront-owned token writes.
- `app/Hooks/Actions/GuestCart.php` and the missing `SyncGuestCart` hook wiring in `config/hooks.php` — define when guest cookie creation and sign-in sync actually run.
- `app/Actions/Cart/*` and `app/Http/Controllers/Api/CartController.php` — route cart mutations through the resolved cart identity and return the canonical active cart after sync.
- `resources/site/ts/components/*` and `resources/site/ts/api/cart.ts` — stop owning cart-token persistence in JavaScript except for a temporary compatibility fallback, and keep JS focused on displaying sync notices.
- `tests/Integration/CartApiTest.php` or new cart identity tests — cover the edge cases that previously depended on implicit lookup order.
