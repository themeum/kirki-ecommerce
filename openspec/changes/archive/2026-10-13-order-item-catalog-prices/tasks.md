## 1. Schema and data objects

- [x] 1.1 In `database/migrations/CreateOrderItemsTable.php`, after `base_regular_tax_total`, add the `invoiced_*` / `base_*` integer pairs (`->default(0)`, each with a descriptive `->comment()` stating unit vs. line, currency, and that the value includes tax exactly when `orders.is_tax_inclusive` is true): `catalog_regular_price`, `catalog_sale_price`, `catalog_product_coupon_discounted_subtotal`, `discount_tax_total`
- [x] 1.2 Add the 8 columns to `OrderItem` `$fillable` / `$casts`, and as documented properties on `CreateOrderItemDTO` and `UpdateOrderItemDTO`
- [x] 1.3 Add `base_catalog_regular_price`, `base_catalog_sale_price`, `base_catalog_product_coupon_discounted_subtotal`, `base_discount_tax_amount` to `CalculationItemDTO` (with `/** @var int */`)
- [x] 1.4 Verify: `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test:unit`, and `npm run typecheck && npm test` (from `resources/app/`) pass (PHP checks pass; one pre-existing, unrelated frontend failure in `ribbon.test.tsx` - this change touches no frontend file)

## 2. Calculation engine (`RecalculateCartAction`)

- [x] 2.1 Write failing tests in `RecalculateCartActionTest`: 50% order coupon under tax-inclusive pricing (subtotal 100.00 net, tax 5.00, discount tax 5.00, catalog figures 110.00); 100% discount (net subtotal 100.00, not 110.00; discount tax 10.00); product coupon + order coupon (catalog product-coupon-discounted subtotal ignores the order coupon); sale price (catalog regular vs. sale); tax-exclusive pricing (catalog figures equal net figures)
- [x] 2.2 Run the tax strategy a second time with undiscounted taxable amounts and keep its per-item tax as "tax before discount" (design D2)
- [x] 2.3 Derive `base_subtotal` as catalog sale total minus tax before discount, and change `calculate_tax_fraction()` to use the undiscounted amount and its tax for unit and regular unit prices (design D3)
- [x] 2.4 Fill the four new `CalculationItemDTO` figures, computing the product-scoped discount from `DiscountTarget::PRODUCTS` coupon results, capped at the catalog sale total (design D4)
- [x] 2.5 Verify: the tests from 2.1 pass, plus `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test:unit`, and `npm run typecheck && npm test` (from `resources/app/`)

## 3. Order persistence

- [x] 3.1 `CreateOrderAction::prepare_order_item_dto()`: persist the 4 base figures and their `convert_amount()` invoiced figures
- [x] 3.2 `UpdateOrderAction::prepare_order_item_dto()` and `prepare_update_order_item_dto()`: persist the same 8 values from the recalculation (catalog figures follow the recalculation; see the spec "Catalog figures change only when the order is recalculated")
- [x] 3.3 Verify: an integration test that places an order under tax-inclusive pricing with a sale item, a product coupon and an order coupon asserts all 8 stored values, plus `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test`, and `npm run typecheck && npm test` (from `resources/app/`)

## 4. Shared line-item pricing trait

- [x] 4.1 Create `app/Concerns/ResolvesLineItemPricing.php` with `get_strikethrough_amount($catalog_regular_price, $catalog_sale_price, $coupon_discounted_subtotal, $quantity)` and `get_unit_amount($line_amount, $quantity)` (design D5, D6), with full docblocks
- [x] 4.2 Unit-test the trait: coupon case, sale-only case, coupon + sale case, nothing struck through, unit amount rounding up
- [x] 4.3 Verify: `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test:unit`, and `npm run typecheck && npm test` (from `resources/app/`) pass

## 5. Resources

- [x] 5.1 `Cart/CartResource`: item subtotal, strikethrough, items subtotal and order total from the catalog figures via the trait; remove the `$is_inclusive_tax` add-back logic and `derive_inclusive_amount_at_rate()`; add `is_tax_inclusive` to the payload
- [x] 5.2 `Order/OrderCalculationResource`: replace every `*_exclusive_money_object` / `*_inclusive_money_object` pair with one `*_money_object` (design D7); remove `derive_inclusive_amount()`, `derive_inclusive_amount_at_rate()`, `get_items_tax_total()` and `get_strikethrough_amounts()` if no longer used
- [x] 5.3 `Order/OrderResource` (admin): same as 5.2 for both `invoiced_*` and `base_*`, reading the stored catalog columns; strikethrough case chosen from the base figures, amount shown per currency (design D8)
- [x] 5.4 `Site/Order/OrderResource`: invoiced subtotal, strikethrough, items subtotal and order total from the stored invoiced catalog columns via the trait; remove the add-back logic and `derive_inclusive_amount_at_rate()`
- [x] 5.5 Update the resource tests under `tests/Unit/Resources/` for the new keys and figures, including the 110.00 / 50% order-coupon scenario under tax-inclusive pricing for each resource
- [x] 5.6 Verify: `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test`, and `npm run typecheck && npm test` (from `resources/app/`) pass (also needed: the order email view `resources/views/emails/parts/order/order-summary.php` built the dual keys by string concatenation, and the email preview's sample `order-items.json` had no catalog fields - both updated; the only frontend failure is the unrelated `ribbon.test.tsx`)

## 6. Docs

- [x] 6.1 Update `docs/ecommerce/orders/Calculate Order Totals.yml`, `get-by-id-5.yml` and any other `docs/ecommerce/` sample that shows the dual `*_exclusive_*` / `*_inclusive_*` keys to the single-key shape (also `create-5.yml` and `edit-5.yml`; all four samples are tax-exclusive, so each keeps its tax-exclusive value)
- [x] 6.2 Verify: `grep -rE "_(ex|in)clusive_money_object" app docs/ecommerce tests` returns nothing, plus `npm run typecheck && npm test` (from `resources/app/`)
