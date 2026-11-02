# Design

## Context

`kirki_ecommerce_wishlist` has a unique key `uq_kecom_wishlist_user_id_product_id` on `(user_id, product_id)`. `WishlistService::add_item()` already looks up `get_item($user_id, $product_id)` first and returns the existing entry, so the application keeps one entry per product without help from the key. See proposal.md for why the key goes.

The foreign key on `user_id` needs an index in MySQL. The unique key currently provides it. `get_item()` and `is_wishlisted()` filter by `user_id` and `product_id`, so they need an index that starts with those columns.

## Goals / Non-Goals

**Goals:**
- Leave the schema ready for several entries per user and product, with no later migration.
- Keep the current behaviour: one entry per product, and the same API.

**Non-Goals:**
- Saving several variants of one product, a changed `DELETE` route, per-variant heart state. A later change does these.
- A new database or service guard against parallel duplicates.

## Decisions

**Replace the unique key with a plain index on `(user_id, product_id)`.** The index keeps the lookups fast and keeps an index on `user_id` for the foreign key. Alternative: no index at all. MySQL would then create a single-column index for each foreign key, and the `(user_id, product_id)` lookup would lose its covering index.

**Name the index `idx_kecom_wishlist_user_id_product_id`.** It follows the `idx_kecom_<table>_<columns>` pattern of the other migrations.

**Edit `CreateWishlistTable` in place.** The plugin is pre-release, and the migration policy is to reinstall. The previous wishlist change did the same.

**Leave the service alone.** `add_item()` already returns an existing entry. A guard against parallel duplicates (a lock or a transaction) is more than this change needs. The `inventory-stock-atomicity` specs show how the project does atomic work when it is needed.

**Use `(int) $product_id` in `product-card.php`.** `single.php` uses the same cast. `%d` casts again, and a product ID is unsigned, so `absint` adds nothing.

## Risks / Trade-offs

- [Two parallel add requests for one product can create two entries] → Accepted. The user sees two cards at worst, and removing one entry by product ID would fail on the first match only. A later change that adds per-variant entries must define duplicates properly (see the NULL variant case: MySQL unique keys treat NULLs as different, so a unique key alone would not have stopped them either).
- [`remove_item()` deletes the first matching entry only] → Accepted for the same reason; a duplicate is rare and the next click removes it.
- [An existing install keeps the old unique key] → Accepted. The plugin is pre-release and installs reinstall.
