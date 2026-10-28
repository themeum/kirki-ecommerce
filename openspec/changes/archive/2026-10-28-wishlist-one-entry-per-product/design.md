# Design

## Context

Today `kirki_ecommerce_wishlist` has `user_id` and `variant_id`, both with cascade-delete foreign keys, and a unique key on `(user_id, variant_id)`. The whole chain uses the variant as the identity of an entry:

- `WishlistService` (`get_item`, `is_wishlisted`, `add_item`, `remove_item`) takes a variant ID.
- `WishlistController` validates a variant, and `DELETE /account/wishlist/{id}` treats `{id}` as a variant ID.
- `WishlistResource` builds the card from `variant.product`. It sets `variant_id`, `product_url` (with `?variant_id=`) and prices from the variant.
- `ShopProductResource` (listing cards) and `PageInlineScript` (product page variants) compute `is_wishlisted` per variant.
- The Alpine `wishlist` component keeps a `wishlistedVariants` map and sends a variant ID. The card uses `id="<variant_id>"` to remove itself from the account page.

The listing card already knows its default variant, so it sends a variant today, but the customer did not choose it. See proposal.md for why this matters.

`variants.is_default` is set by the merchant (`CreateVariantDTO`/`UpdateVariantDTO`). Nothing in the code guarantees that exactly one variant per product has it. `VariantService` hard-deletes variants.

The plugin is pre-release, and `CreateWishlistTable` is edited in place (policy from `squash-migrations-into-create-tables`).

## Goals / Non-Goals

**Goals:**
- One entry per user and product, with an optional remembered variant.
- Entry survives deletion of its variant.
- The listing page can wishlist without choosing a variant.
- Heart state and removal depend only on the product.

**Non-Goals:**
- Showing out-of-stock state across all variants of the product on a wishlist card. The card keeps its current stock behavior.
- Hiding entries of trashed or unpublished products from the list. The list does not filter by product status today, and this change keeps that.
- Guest wishlists, wishlist sharing, and a variant picker on the account page.
- A change to the admin SPA. Only the storefront and the site API change.

## Decisions

**1. `product_id` NOT NULL with cascade; `variant_id` nullable with `null_on_delete`.**
Cascade on the product matches `cart_items`. `null_on_delete` on the variant matches `order_items` and is the point of the change. Alternative: keep `variant_id` NOT NULL and store the default variant. Rejected: the entry would still vanish when that variant is deleted, and the stored variant would be a guess.

**2. Unique key `(user_id, product_id)`.**
`product_id` is never NULL, so MySQL enforces the key with no special case. A unique key on `(user_id, variant_id)` would allow duplicate NULL rows once variants are deleted. The old `(user_id, variant_id)` key is dropped. Alternative: service-level dedupe. Rejected: it races, while the key does not.

**3. The service takes `(user_id, product_id, ?variant_id)`.**
`add_item` finds the entry by user and product. If it exists, it returns it, and sets `variant_id` only when a variant was sent and differs. If not, it creates the entry. `get_item`, `is_wishlisted` and `remove_item` take a product ID. The controller checks that the product is published and that a sent variant belongs to it, and answers 404 otherwise. The service re-checks, so it does not trust its caller. Alternative: ignore a re-sent variant on an existing entry. Rejected: the product page toggles, so only the API can re-add, and the later choice is the better one to remember.

**4. `DELETE /account/wishlist/{id}` keeps its path; `{id}` becomes a product ID.**
Changing the path would break the `ENDPOINTS` map and the Bruno docs for no gain. The meaning change is a **BREAKING** item in the proposal. The `/wishlist/empty` route is unchanged.

**5. Display variant is resolved in `WishlistResource`, not stored.**
Order: the entry's variant, then the product's `is_default` variant, then the product's first variant. The first-variant step covers products where the merchant set no default. The resource loads the product's variants and their media eagerly (`product.variants.media`) in `WishlistService::list_query`, and picks the entry's variant from that list, so the fallback costs no extra query per row. It then sets the chosen variant as the `variant` relation on the entry, so the parent `ShopProductResource` builds the card. The URL adds `?variant_id=` only when the entry has its own variant. Alternative: copy the default variant into the row when adding. Rejected: it goes stale and is the guess this change removes.

**6. Heart state is product-level.**
`ShopProductResource` and `PageInlineScript` call `is_wishlisted($product_id)`. In the product-page config, `is_wishlisted` moves from each variant to the product. The Alpine component drops `wishlistedVariants` and the `$watch` on the selected variant. It keeps one `isWishlisted` flag. The listing card sends `{ product_id }`. The product page sends `{ product_id, variant_id: selectedVariantId }`. The account-page card uses `id="<product_id>"` for self-removal. Alternative: keep a per-variant map and OR it. Rejected: it keeps the old variant identity alive for no behavior.

**7. Add request body.**
`product_id` is required. `variant_id` is optional. A request with only `variant_id` is rejected with 404, because there is no installed base of API clients to keep working. Alternative: derive the product from a lone `variant_id`. Rejected: two ways to say the same thing, and the BREAKING note stays true.

## Risks / Trade-offs

- [A product with no variants has no display variant, and the parent resource then returns an empty card] → Every product is created with a default variant, and variant deletion keeps at least one in normal use. If it still happens, `WishlistResource` returns the empty array it already returns for a missing variant. Do not add a new filter in this change.
- [Several variants of one product saved before the change collapse to one entry] → The pre-release policy means there is no live data to convert. A fresh install starts empty.
- [Out-of-stock and "has variants" flags on a wishlist card use the one displayed variant] → Same as today. Recorded as a non-goal.
- [Merchant sets no default variant and later adds one] → The card shows the first variant until then, then the default. This matches the `Wishlist shows a variant for each entry` scenario "Default variant changes".
- [Breaking API meaning of `{id}`] → Only the site JS calls it. Both are changed in this change, and the Bruno docs are updated.
