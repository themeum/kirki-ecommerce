# Tasks

## 1. Wishlist table without the unique key

- [x] 1.1 In `database/migrations/CreateWishlistTable.php`, replace `$table->unique(['user_id', 'product_id'], 'uq_kecom_wishlist_user_id_product_id')` with `$table->index(['user_id', 'product_id'], 'idx_kecom_wishlist_user_id_product_id')`, and change the class docblock so it no longer says that a user has at most one entry per product. Verify: `composer phpcs:docblocks` reports no error for the file. (Done. The sniff is clean for this file. `composer phpcs:docblocks` still exits 1 because of an old error in `app/Actions/Order/PerformOrderAction.php:163`, which is outside this change.)
- [x] 1.2 In `tests/Integration/WishlistApiTest.php`, add a test that reads the table indexes (`SHOW INDEX FROM` the wishlist table) and asserts that no unique index covers `user_id` and `product_id`, and that the plain index exists. Verify: `bash bin/phpunit --testsuite Integration --filter WishlistApiTest` passes, including the existing one-entry-per-product tests (`test_saving_a_product_twice_keeps_one_entry` and `test_saving_two_variants_of_one_product_keeps_one_entry_with_the_last_variant`).
- [x] 1.3 In `docs/wishlist.md`, change section 2 so it says that the service keeps one entry per product, that the table has an index and no unique key, and that two parallel requests can create a duplicate. Add the same note to section 7 ("One entry per product") and say that the schema is ready for several variants later. Verify: the text no longer says that the database enforces one entry per product (`rg "unique key" docs/wishlist.md` finds only the new explanation).
- [x] 1.4 Verify the group: run `composer phpcs:wporg` and `npm run typecheck && npm test` in `resources/app/` (no TypeScript changes, so both must stay green). (Done. `npm run typecheck` is clean and `npm test` passes: 195 files, 2048 tests. `composer phpcs:wporg` reports only warnings in other files (seeders, `Assets.php`, `helpers.php` and similar); the touched files are clean.)

## 2. Integer cast in the product card

- [x] 2.1 In `resources/views/site/shop/parts/product-card.php` line 44, replace `absint($product_id)` with `(int) $product_id`. Verify: `rg "absint" resources/views` finds nothing, and `composer phpcs:wporg` reports no new escaping error for the file.
- [x] 2.2 Verify the group: run `bash bin/phpunit --testsuite Integration --filter WishlistApiTest` (the shop listing test `test_shop_listing_marks_a_product_wishlisted_whatever_the_saved_variant` renders the card data) and `npm run typecheck && npm test` in `resources/app/`. (Done. `bash bin/phpunit` cannot run on the host because there is no WordPress test library, so I ran `bash kirki-ecommerce-test integration --filter=WishlistApiTest` in Docker: 19 tests, 432 assertions, all pass. The shop listing test only reads card data and does not render `product-card.php`; the view cast is covered by phpcs only. `npm run typecheck && npm test` passed in 1.4 and no TypeScript file changed after that.)

## Workflow follow-up

- Archive the change after review with `/opsx:archive`. It has no spec delta, so it uses `skip_specs`.
- The change name mentions "multiple variants". Rename it before archive if you want the name to match the narrower scope.
