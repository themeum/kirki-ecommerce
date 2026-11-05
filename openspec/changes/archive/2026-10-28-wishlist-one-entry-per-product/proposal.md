# Proposal

## Why

A wishlist row stores only `variant_id`, with a cascade-delete foreign key. When a variant is deleted, the customer's wishlist entry disappears with it, even though the customer saved the product. The shop listing page also has no variant to send, so the heart on a product card has to guess the default variant. A wishlist entry should mean "I saved this product", and a variant is only an optional detail.

## What Changes

- A wishlist entry belongs to a product. A customer has at most one entry per product, whatever the variants.
- `kirki_ecommerce_wishlist` gets a `product_id` column (NOT NULL, deleted with the product). `variant_id` becomes nullable and is set to NULL when its variant is deleted. The unique key changes from `(user_id, variant_id)` to `(user_id, product_id)`.
- Adding to the wishlist takes a `product_id` and an optional `variant_id`. The shop listing page sends only `product_id`. The product page sends the selected variant as well.
- When an entry has no variant, the wishlist shows the product's `is_default` variant for price, image and link.
- The heart state, the "already saved" check and removal all use the product, not the variant.
- **BREAKING**: `POST /account/wishlist` needs `product_id`. `DELETE /account/wishlist/{id}` takes a product ID, not a variant ID.
- **BREAKING**: the pre-release rule applies: `CreateWishlistTable` is edited in place, and existing alpha/beta installs reinstall (see `squash-migrations-into-create-tables`).

## Capabilities

### New Capabilities

- `customer-wishlist`: what a customer's wishlist stores, how entries are added, shown and removed, and what happens when a saved variant or product is deleted.

### Modified Capabilities

None. `admin-api-access-control` only says that wishlist endpoints need a logged-in user. That does not change.

## Impact

- **Code**: `database/migrations/CreateWishlistTable.php`, `app/Models/Wishlist.php`, `app/Services/WishlistService.php`, `app/Http/Controllers/Api/Site/WishlistController.php`, `app/Resources/Wishlist/WishlistResource.php`, `app/Resources/Site/Shop/ShopProductResource.php`, `app/Hooks/Filters/PageInlineScript.php`.
- **Frontend**: `resources/site/ts/components/wishlist.ts`, `resources/site/ts/api/wishlist.ts`, `resources/views/site/shop/parts/product-card.php`, `resources/views/site/shop/single.php`.
- **API**: `POST /account/wishlist` body and `DELETE /account/wishlist/{id}` meaning change. The Bruno docs in `docs/ecommerce/account/Wishlist/` are updated.
- **Data**: no live-data migration. Pre-release installs reinstall.
- **Docs**: new `docs/wishlist.md`.
- **Tests**: new `tests/Integration/WishlistApiTest.php`.
