## 1. Schema and model

- [x] 1.1 Add `database/migrations/AlterOrderItemsAddRegularPriceColumns.php` adding `base_regular_price` and `invoiced_regular_price` (`integer`, `default(0)`, after `base_price`), with a `down()` that drops both, and full docblocks per the PHP docblock standard
- [x] 1.2 Register the migration in `config/migrations.php` after `AlterOrderItemsDropTaxColumns::class`
- [x] 1.3 Add both columns to `OrderItem::$fillable`
- [x] 1.4 Add both properties to `CreateOrderItemDTO` and `UpdateOrderItemDTO`
- [x] 1.5 Verify: run `composer phpcs:wporg` and `composer phpcs:docblocks`, and confirm the migration applies on a fresh database (`composer test:integration` runs migrations) — phpcs clean on changed files; migration applies in the Docker test DB (inserts reached the new columns). Order-creating integration tests fail until group 2 because the DTOs send `null` into the NOT NULL columns.

## 2. Write path

- [x] 2.1 In `CreateOrderAction::prepare_order_item_dto()`, set `base_regular_price = $variant->base_price` and `invoiced_regular_price` via `convert_amount()`
- [x] 2.2 In `UpdateOrderAction::prepare_order_item_dto()` (newly added items), set both columns the same way
- [x] 2.3 In `UpdateOrderAction::prepare_update_order_item_dto()`, copy both columns from `$existing_item`, next to the existing `invoiced_price`/`base_price` copy
- [x] 2.4 Verify: run `composer test` and confirm creating an order and editing one (quantity change, added item) persists the expected regular prices — added 3 integration tests in `OrderApiTest`; unit 322 and integration 473 pass. The added-item test originally sidestepped a pre-existing crash in `UpdateOrderAction::prepare_order_item_dto()` (`$product->media->first()->id` failed for a product with no media); that crash is fixed in 5.1.

## 3. Storefront resource

- [x] 3.1 In `Site\Order\OrderResource`, add `prepare_strikethrough_price()` following the design's rule (product coupon → `invoiced_subtotal`; else `base_regular_price > base_price` → `invoiced_regular_price * quantity`; else `null`), with a docblock in the style of `CartResource::prepare_strikethrough_price()`
- [x] 3.2 Use it for `invoiced_strikethrough_price_money_object` in `prepare_items()`, replacing the inline ternary
- [x] 3.3 Add unit tests next to `OrderResourceCouponFormattingTest`: sale only, coupon only, sale plus coupon, order-wide coupon only, no discount, legacy item with regular price `0`, and a non-base currency order
- [x] 3.4 Verify: run `composer test:unit`, `composer phpcs:wporg` and `composer phpcs:docblocks` — 27 tests in `OrderResourceCouponFormattingTest` pass (9 new); both phpcs standards clean on the changed files

## 4. Wrap-up

- [x] 4.1 Check whether any doc under `docs/` or `docs/ecommerce/` describes the storefront order item payload, and update it if so — none does: `docs/ecommerce/orders/*.yml` document the admin order payload, which is unchanged, and `docs/ecommerce/Site/` has no order documentation
- [x] 4.2 Run `openspec validate store-regular-price-on-order-items`
- [x] 4.3 Verify: run `npm run typecheck && npm test` in `resources/app/` to confirm no frontend regression, and `composer test` — typecheck clean, 1154 frontend tests pass, PHP unit 331 and integration 473 pass

## 5. Follow-ups

- [x] 5.1 Fix the pre-existing crash when an order edit adds an item whose product has no media (`UpdateOrderAction::prepare_order_item_dto()` now falls back to a null `product_image`), with the regression test `test_update_order_adds_item_for_product_without_media`
- [x] 5.2 Document the storefront `POST /checkout` endpoint and its order payload, including the item strikethrough rule, in `docs/ecommerce/Site/checkout.yml`
- [x] 5.3 Verify: run `composer test` (Docker) and `openspec validate`
