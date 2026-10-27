# Tasks

## 1. Exact fee conversion

- [x] 1.1 In `OrderManager::convert_fee_to_base_currency`, divide the fee by `orders.exchange_rate` with decimal math and round half-up in the base currency, replacing `1 / $order->exchange_rate`. Verify with the new test in 1.2.
- [x] 1.2 In `tests/Integration/OrderApiTest.php`, add a test for rate `2.896` and fee `256115` that expects base fee `88438`, and a test with a zero-decimal currency (done on the order currency, JPY, because the test base currency cannot be changed). Verify `composer test:integration` passes and the `2.896` test fails before 1.1.
- [x] 1.3 Keep the existing `test_set_payment_provider_fee_*` tests green. Run `composer phpcs:wporg` and `npm run typecheck && npm test` (from `resources/app/`).

## 2. Order tables comments

- [x] 2.1 Comment the money columns in `CreateOrdersTable` (`exchange_rate` is already commented): `invoiced_`/`base_` `subtotal`, `shipping_total`, `discount_total`, `tax_total`, `shipping_tax_amount`, `total`, `payment_provider_fee`. State currency, minor units and tax treatment (see design). Verify each comment against `RecalculateCartAction::aggregate`.
- [x] 2.2 Comment the money columns in `CreateOrderItemsTable` that have none: `price`, `regular_price`, `regular_tax_total`, `tax_total`, `discount_amount`, `subtotal`, `total`. Leave the existing `*_catalog_*` and `*_discount_tax_total` comments as they are. Verify against `RecalculateCartAction::build_item_result`.
- [x] 2.3 Comment `amount` in `CreateOrderTaxesTable`, and `discount_amount` in `CreateOrderCouponsTable` and `CreateOrderItemCouponsTable`. Verify that the tax amounts sum to `tax_total` as the comment says (check `sync_order_taxes`). Checked: `assert_order_taxes_reconcile` enforces it for the base amounts only, so only `base_amount` claims the exact sum.
- [x] 2.4 Run `composer test:integration` (migrations run in the test setup) and `composer phpcs:wporg`, then `npm run typecheck && npm test` (from `resources/app/`). Result: 890 tests, only the 2 `OnboardingApiTest` failures (store owner email, order numbering prefix), which fail the same way without this change's edits; `composer phpcs:wporg` clean; frontend 1499 tests pass.

## 3. Catalog and coupon comments

- [x] 3.1 Comment `base_price`, `base_sale_price` and `base_cost_of_goods` in `CreateVariantsTable`. Say that price and sale price include tax when the store is tax-inclusive. Leave `base_unit_amount` and `total_unit_amount` uncommented as money (they are unit amounts).
- [x] 3.2 Comment `base_discount_amount_fixed` and `spend_condition_value` in `CreateCouponsTable`. For `spend_condition_value`, list both meanings (see the spec). Verify against `DiscountService` line 153-156.
- [x] 3.3 Run `composer test:integration` and `composer phpcs:wporg`, then `npm run typecheck && npm test` (from `resources/app/`). Same result as 2.4.

## 4. Docs

- [x] 4.1 Check `docs/payments.md` and `docs/currencies.md` for any description of the base fee or `invoiced_`/`base_` columns, and update it if it is wrong. (Search found no description of the fee or of the `invoiced_`/`base_` columns; `docs/home.md` only uses `base_total` and `invoiced_total`, consistently with the new comments. No docs change.) Verify by re-running the search.
