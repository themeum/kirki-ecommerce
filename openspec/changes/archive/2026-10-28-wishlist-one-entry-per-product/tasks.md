# Tasks

## 1. Schema, model and service

- [x] 1.1 Edit `database/migrations/CreateWishlistTable.php`: add `product_id` (NOT NULL, `fk_kecom_wishlist_product_id` to `kirki_ecommerce_products`, `cascade_on_delete`), make `variant_id` nullable with `null_on_delete`, and replace the unique key with `uq_kecom_wishlist_user_id_product_id` on `(user_id, product_id)`; update the class docblock. Verify: the integration test in 1.4 passes on a fresh migrate, and a product delete removes its entries.
- [x] 1.2 Update `app/Models/Wishlist.php`: add `product_id` to `$fillable` and `$casts`, and add a `product()` relation. Verify: `composer phpcs:docblocks` passes for the file.
- [x] 1.3 Change `app/Services/WishlistService.php` to use the product as identity: `get_item`, `is_wishlisted` and `remove_item` take `$product_id`; `add_item($user_id, $product_id, ?$variant_id)` returns the existing entry, sets its variant only when one is sent and differs, and throws `NotFoundException` when the product or a sent variant is not valid; `list_query` eager-loads `product.media`, `product.categories` and `product.variants.media` (the resource picks the display variant from these, so no separate `variant` load is needed). Verify: the integration test in 1.4 passes.
- [x] 1.4 Add `tests/Integration/WishlistApiTest.php` (pattern of `AddressApiTest`) for the service through the REST routes in group 2, written together with group 2. Cover: one entry per product, add without variant, add with variant, re-add with a chosen variant, re-add without variant keeps the variant, 404 for an unpublished or unknown product, 404 for a variant of another product, remove by product ID, 404 for another customer's entry, entry survives a variant delete with `variant_id` NULL, entries deleted with the product, 401 for a visitor. Verify: `composer test:docker:integration` passes.
- [x] 1.5 Verify group: `composer phpcs:wporg` and `composer phpcs:docblocks` pass for the changed files, and `npm run typecheck && npm test` in `resources/app/` still pass.

## 2. REST API

- [x] 2.1 Change `WishlistController::add_item` in `app/Http/Controllers/Api/Site/WishlistController.php`: read `product_id` and optional `variant_id`; answer 404 (`Product not found.` / `Variant not found.`) when the product is missing or not published, or the variant does not belong to it; replace `is_valid_variant` with a product check; answer 201 with the resource. Verify: the add tests in 1.4 pass.
- [x] 2.2 Change `WishlistController::remove_item`: the route `id` is a product ID; look the entry up by user and product. Verify: the remove tests in 1.4 pass.
- [x] 2.3 Update the `WishlistController` docblocks (add, remove, and the class text that says "variant") to say product. Verify: `composer phpcs:docblocks` passes.

## 3. Wishlist resource and heart state

- [x] 3.1 Change `app/Resources/Wishlist/WishlistResource.php` to build the card from the product: resolve the display variant as entry variant, then the product's `is_default` variant, then the product's first variant; set it on the resource so `ShopProductResource` fills the card; add `?variant_id=` to `product_url` only when the entry has its own variant; return `product_id` from the entry. Verify: a test in `WishlistApiTest` lists an entry with and without a variant and checks the price, image and URL come from the right variant.
- [x] 3.2 Change `app/Resources/Site/Shop/ShopProductResource.php` to call `is_wishlisted($product_id)`. Verify: a test lists a wishlisted product through the shop listing and checks `is_wishlisted` is true while the entry has a chosen variant.
- [x] 3.3 Change `app/Hooks/Filters/PageInlineScript.php`: set `is_wishlisted` once on the product config and remove it from each entry of `product_variants`. Verify: a test or a read of the generated config shows the product-level flag and no per-variant flag. (Checked by reading the code: `set_shop_single_page_data` is protected and needs full view data, so no test was added; `kirki_ecommerce.is_wishlisted` is the product-level flag.)
- [x] 3.4 Verify group: `composer test:docker:integration`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/` pass.

## 4. Storefront JS and views

- [x] 4.1 Change `resources/site/ts/api/wishlist.ts`: `addItem(productId, variantId?)` sends `{ product_id, variant_id? }`; `remove(productId)` keeps the same endpoint. Verify: `npm run typecheck:app` and the site build pass.
- [x] 4.2 Change `resources/site/ts/components/wishlist.ts`: take the product ID, drop `wishlistedVariants` and the variant list argument, keep one `isWishlisted` flag, and send the optional variant on add. Verify: the site build passes and the component has no remaining `wishlistedVariants` use (`grep`).
- [x] 4.3 Change `resources/views/site/shop/parts/product-card.php`: the heart sends only the product ID, and the card's `id` is the product ID (used by the account page to remove the card). Verify: `grep` shows no `variant_id` in the wishlist button code of the card.
- [x] 4.4 Change `resources/views/site/shop/single.php`: initialise the component with the product-level flag, remove the `$watch` on the selected variant, and send `productId` plus `selectedVariantId` on click; the active class uses the single `isWishlisted` flag. Verify: `grep` shows no `wishlistedVariants` left in the view.
- [x] 4.5 Verify group: rebuild the site assets with the project's build command and run `npm run typecheck && npm test` in `resources/app/`. Visual confirmation of the heart on the listing, product and account pages is left to the user (no browser testing in this project).

## 5. Docs

- [x] 5.1 Update the Bruno files in `docs/ecommerce/account/Wishlist/` (`add-item-to-wishlist.yml`, `delete-wishlist-item.yml`, and the list file if it shows variant fields): new request body, `{id}` as product ID, the new 404 messages. Verify: the examples match the controller answers in group 2.
- [x] 5.2 Add `docs/wishlist.md`, structured like `docs/emails.md`: table of contents, quick start, the data model, the add/remove API, the display-variant rule, and a "Where this differs from WooCommerce wishlist plugins" section that is honest about gaps (no guest wishlist, no sharing, one entry per product, stock flag from the shown variant). Verify: every statement matches the spec in `specs/customer-wishlist/spec.md`.
- [x] 5.3 Final check: `composer test:docker` and `npm run typecheck && npm test` in `resources/app/` pass, and `openspec validate wishlist-one-entry-per-product` passes.

## Workflow follow-up

- Run `/opsx:apply` to implement this change.
- Archive the change after review.
