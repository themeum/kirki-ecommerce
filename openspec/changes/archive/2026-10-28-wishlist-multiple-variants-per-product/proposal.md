# Proposal

## Why

The wishlist table has a unique key on `(user_id, product_id)`. The store keeps one entry per product today, but we may let a customer save several variants of one product later. If the unique key stays, that later feature needs a schema migration on installed sites. Removing the key now avoids that migration. The wishlist behaviour does not change.

## What Changes

- In `CreateWishlistTable`, remove the unique key on `(user_id, product_id)` and add a plain index on `(user_id, product_id)` for lookups. The foreign keys, `product_id` NOT NULL and `variant_id` nullable all stay as they are. The change edits the migration in place (pre-release installs reinstall, per the migration policy).
- The service already returns the existing entry when a product is saved again, so the application keeps one entry per product with no code change. The database no longer enforces it. Two parallel requests can create a duplicate; this is accepted.
- In `resources/views/site/shop/parts/product-card.php`, replace `absint($product_id)` with `(int) $product_id`, as the other views do. A product ID is never negative, and `%d` already casts to an integer.
- Update the migration docblock and `docs/wishlist.md` so they no longer say that the database enforces one entry per product.
- Add one integration test that shows the table has no unique key on the user and product columns, and keep the existing tests that show one entry per product.

Out of scope: saving several variants of one product, a changed `DELETE` route, and a changed heart state. A later change does those.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The `customer-wishlist` requirements stay the same, including "One wishlist entry per product". Only the way the rule is enforced changes, from the database to the service. The change sets `skip_specs: true`.

## Impact

- Database: `database/migrations/CreateWishlistTable.php`.
- Views: `resources/views/site/shop/parts/product-card.php`.
- Tests: `tests/Integration/WishlistApiTest.php`.
- Docs: `docs/wishlist.md`.
- API: no change.
