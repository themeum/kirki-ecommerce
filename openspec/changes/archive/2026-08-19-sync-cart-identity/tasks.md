## 1. Data Model

- [x] 1.1 Add a cart `user_id` column and indexes for owned cart lookup; no cart data backfill is needed before stable release.
- [x] 1.2 Update `Cart` fillable/casts/relationships so `user_id` is available and `customer_id` is removed from active carts.
- [x] 1.3 Add model/service safeguards that prevent an active cart from being saved with both anonymous token ownership and owned user ownership.
- [x] 1.4 Verify frontend baseline from `resources/app/`: `npm run typecheck && npm test`.

## 2. Cart Identity Resolver

- [x] 2.1 Introduce a small cart identity/sync result structure that returns the canonical cart plus sync state (`none`, `cleared_token`, `adopted`, `merged`) and changed-line metadata.
- [x] 2.2 Refactor cart lookup to resolve by current WP `user_id` for authenticated shoppers and by guest token for anonymous shoppers.
- [x] 2.3 Read guest tokens from `$request->cookie(Cart::COOKIE_TOKEN)`, accepting `Cart::HEADER_TOKEN` only as a compatibility fallback when the cookie is absent.
- [x] 2.4 Treat missing, malformed, expired, or unknown guest tokens as empty/stale identity without throwing cart API errors.
- [x] 2.5 Implement anonymous-cart adoption for signed-in shoppers who have no active owned cart, clearing the anonymous cookie afterward through the framework Cookie facade.
- [x] 2.6 Implement anonymous-to-owned cart merge inside a transaction, moving distinct variants and reconciling duplicate variants with the higher quantity capped to available stock.
- [x] 2.7 Keep merge/adoption idempotent when repeated requests arrive after the anonymous cart was already consumed.
- [x] 2.8 Verify frontend baseline from `resources/app/`: `npm run typecheck && npm test`.

## 3. API, Hooks, And Storefront

- [x] 3.1 Update cart controllers/actions to pass the current WP `user_id` and guest token through the resolver before get/add/update/remove/empty/coupon operations.
- [x] 3.2 Update checkout creation to resolve the canonical cart before order creation and prevent checkout with a consumed anonymous token.
- [x] 3.3 Replace direct `$_COOKIE` and `setcookie()` usage with request cookie reads and `Cookie::queue(...)`/`Cookie::expire(...)` writes.
- [x] 3.4 Add or correct guest-cart and sign-in hook wiring so guest token setup and sign-in sync run through the same idempotent resolver.
- [x] 3.5 Add optional sync metadata to cart API responses without removing existing response fields.
- [x] 3.6 Update storefront cart/add-to-cart/checkout TypeScript to stop owning cart-token persistence where backend cookies cover it, while preserving only any temporary header fallback needed for compatibility.
- [x] 3.7 Update storefront cart/add-to-cart/checkout TypeScript to show existing notice/toast UI when sync metadata reports adoption, merge, or quantity clamping.
- [x] 3.8 Verify frontend baseline from `resources/app/`: `npm run typecheck && npm test`.

## 4. Tests

- [x] 4.1 Add integration coverage for guest cookie cart lookup, missing cookie behavior, stale/unknown cookie clearing, and legacy header fallback when the cookie is absent.
- [x] 4.2 Add integration coverage for authenticated cart lookup by `user_id`, including signed-in shoppers without a `Customer` record.
- [x] 4.3 Add integration coverage for sign-in cases: neither cart, only owned cart, only anonymous cart adoption, and anonymous plus owned cart merge.
- [x] 4.4 Add integration coverage for duplicate variant merge quantities using higher-not-sum behavior and stock clamping.
- [x] 4.5 Add integration coverage for unauthorized item update/remove/coupon/checkout attempts against carts owned by another shopper. Covered item update/remove with 403 and consumed-token checkout rejection; coupon/checkout no longer expose an owned-cart token/cart-id target to cross-shopper requests.
- [x] 4.6 Run backend cart/checkout coverage: `composer test:docker:integration -- --filter=CartApiTest` and any checkout filter needed for consumed-token behavior.
- [x] 4.7 Verify frontend baseline from `resources/app/`: `npm run typecheck && npm test`.
