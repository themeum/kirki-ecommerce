## Context

See `proposal.md` for motivation. The current cart table stores `customer_id` and `cart_token`; `CartService::get_cart()` checks `customer_id` first, falls back to token, and may attach a token cart to a customer. That works only when a `Customer` record already exists. Recent checkout work intentionally allows authenticated shoppers to have a WP user before they have a `Customer`, so `customer_id` is the wrong owner identity for active carts.

The framework already exposes cookie primitives: request objects can read cookies with `$request->cookie($name)`, and `libraries/framework/Supports/Facades/Cookie.php` queues/forgets cookies through the response lifecycle. Current cart code bypasses that by reading `$_COOKIE` and calling `setcookie()` directly, while storefront JavaScript also mirrors the token into the `kecom-cart-token` header. `GuestCart` cookie bootstrapping is currently disabled, and `config/hooks.php` imports a `SyncGuestCart` action that does not exist.

## Goals / Non-Goals

**Goals:**
- Make WP `user_id` the owner identity for authenticated active carts.
- Preserve token-based anonymous carts for guests.
- Keep guest cart cookie reads/writes owned by the backend framework layer.
- Resolve cart identity through one service path before every cart mutation and checkout.
- Merge guest and owned carts at sign-in with deterministic quantity rules.
- Keep checkout customer provisioning independent from cart ownership.

**Non-Goals:**
- Do not create `Customer` records merely because a shopper signs in or adds to cart.
- Do not redesign cart pricing snapshots or coupon eligibility beyond preserving the existing calculation context.
- Do not add a new frontend cart framework; use the existing PHP views and Alpine storefront modules for any user-visible notice.
- Do not scatter cart-token persistence across storefront JavaScript; JS may display sync notices and may keep a short-lived header fallback only during migration.

## Decisions

### 1. Use `user_id` as the owned cart key

**Choice:** Add `user_id` to carts and make owned-cart resolution use the authenticated WP user ID. Remove `customer_id` from carts; customer records remain an order/check-out concern and can be derived from `Customer.user_id` when calculation needs existing customer context.

**Rationale:** A WP user exists immediately after sign-in, but a `Customer` row may not exist until checkout. Keying active carts on `customer_id` either fails for first-time logged-in shoppers or forces premature customer creation.

**Alternative considered:** Continue using `customer_id` and auto-provision on sign-in. Rejected because it pollutes customers with users who never order and contradicts the existing checkout-customer-provisioning direction.

### 2. Centralize identity resolution in `CartService`

**Choice:** Replace ad hoc `get_cart($customer_id, $token)` ownership decisions with `get_cart($user_id, $token)` and a resolver that accepts the current WP user ID and optional guest token, returns the canonical active cart, and reports whether a token was cleared, adopted, or merged.

**Rationale:** Add/update/remove/coupon/checkout paths currently repeat token/customer derivation in controllers and actions. One resolver makes ownership checks, stale-token handling, and post-sync responses consistent.

**Alternative considered:** Implement sync only in a login hook and leave API methods as-is. Rejected because REST requests can arrive from signed-in sessions with stale tokens, multiple tabs, or missed hooks.

### 3. Backend owns guest cookie lifecycle

**Choice:** Read guest tokens from `$request->cookie(Cart::COOKIE_TOKEN)` and set/clear them with the framework Cookie facade (`Cookie::queue(...)`, `Cookie::expire(...)`, or equivalent response-cookie helpers). Keep `Cart::HEADER_TOKEN` as a temporary compatibility fallback when no cookie is present.

**Rationale:** Cookie identity is a server concern. Keeping it in controllers/services through the framework request/response layer avoids direct `$_COOKIE`, raw `setcookie()`, and duplicated `Cookie.set()` logic in Alpine components. It also allows HttpOnly/SameSite/Secure defaults to be managed centrally.

**Alternative considered:** Keep the current JS-owned cookie/header loop. Rejected because it spreads identity responsibilities across API client code, add-to-cart code, checkout code, and backend services.

### 4. Add an explicit sync result for notices

**Choice:** Have the resolver return both the cart and a small sync result object (`none`, `cleared_token`, `adopted`, `merged`, with optional changed variants). Cart responses can include optional sync metadata, and storefront code can show a toast/banner when quantities changed during merge.

**Rationale:** The source model requires merges to be visible. A sync result keeps the user-facing notification contract separate from cookie persistence, which remains backend-owned.

**Alternative considered:** Rely on the updated item quantities being visible in the cart. Rejected because silent quantity changes are easy to miss and make merge behavior feel like data loss or surprise.

### 5. Merge inside a transaction with row ownership rechecked

**Choice:** Perform adopt/merge operations inside a database transaction. Re-fetch both carts by their expected identities inside the transaction, move or update line items, then deactivate/delete the anonymous cart and clear the token.

**Rationale:** Multiple tabs or repeated sign-in callbacks can otherwise move the same guest line items twice or leave both carts active.

**Alternative considered:** Move items one by one without wrapping the cart state change. Rejected because partial merges would be hard to recover from and visible at checkout.

### 6. Reconcile duplicate variants by higher quantity, capped by stock

**Choice:** For matching `variant_id`, set the owned line quantity to `min(max(guest_qty, owned_qty), available_stock)`; do not sum.

**Rationale:** Taking the higher quantity avoids accidentally charging shoppers for duplicates. Stock clamping keeps the cart valid before checkout while still surfacing the adjustment.

**Alternative considered:** Sum quantities. Rejected because it maximizes the most expensive failure mode: shoppers paying for more units than intended.

### 7. Preserve customer context at calculation time

**Choice:** Keep calculation DTOs using `customer_id` for coupon/customer history checks, but derive that value from an existing `Customer` linked to the cart's `user_id` when available. If no customer exists yet, keep the current guest-like `customer_id = 0/null` behavior until checkout provisions one for the order.

**Rationale:** Cart ownership and customer eligibility are different concerns. This keeps first-time signed-in carts stable without inventing customer records early.

**Alternative considered:** Store `customer_id` on carts as a denormalized convenience. Rejected because it makes cart ownership look customer-based again and duplicates data that can be derived from `user_id`.

## Risks / Trade-offs

- [Schema migration before stable release] -> No cart data migration is required because the cart schema is not stable released yet; keep the create migration as the source of truth.
- [Duplicate active carts for a user] -> Add a service-level canonical selection rule and index owned cart lookup by `user_id, created_at`; consolidate duplicates during sync.
- [MySQL/check constraint portability] -> Enforce the one-owner invariant in service code and use indexes the current schema builder supports; add DB constraints only if the local schema layer supports them safely.
- [Stale cookie loops] -> Clear invalid tokens through the framework Cookie facade and update any in-request token state held by the resolver so the same request cycle and the next browser request agree.
- [Legacy header users] -> Continue accepting `Cart::HEADER_TOKEN` only when the cookie is absent, then set/clear the backend cookie in the response so future requests converge on the cookie path.
- [Concurrent sign-in or cart mutation] -> Transactionally re-fetch carts and make merge/adopt idempotent when the anonymous cart was already consumed.
- [Frontend notice shape] -> Keep sync metadata optional and additive so older consumers that ignore unknown fields continue to work.

## Migration Plan

1. Add the cart `user_id` column and supporting indexes while removing cart `customer_id`.
2. Update the cart model fillable/casts/relationships.
3. Derive customer calculation context from `Customer.user_id` when a cart has a `user_id`.
4. Replace direct `$_COOKIE` and `setcookie()` usage with `$request->cookie(...)` and the framework Cookie facade.
5. Ship the resolver and route all cart actions/controllers through it.
6. Enable or replace the disabled guest-cart/sign-in hooks with idempotent cookie setup and sync.
7. Add storefront handling for optional merge/sync notices while removing JS-owned token persistence where backend cookies cover it.
8. Run cart and checkout integration tests.

Rollback before stable release: restore the previous create migration and resolver signature from version control.

## Clarifications Resolved

- Merge notices will use additive sync metadata in cart API responses and the existing storefront notice/toast surface. Cookie writes/clears happen in the backend; storefront JavaScript only reads sync metadata for UI feedback. A separate cart-page persistence mechanism can be added later if product/design wants a banner after a full redirect.
- This change will treat expired anonymous carts as inactive and clear stale tokens, but it will not add a scheduled abandoned-cart cleanup job. The existing `expires_at` field and cleanup indexes are enough for this identity-sync scope.
