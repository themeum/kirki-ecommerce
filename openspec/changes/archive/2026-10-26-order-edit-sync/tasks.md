# Tasks

Each group ends with a verification step. Every PHP group runs `composer test:unit`, `composer test:integration`, `composer phpcs:wporg` and `composer phpcs:docblocks`. Every group also runs `npm run typecheck && npm test` from `resources/app/`. This change has no frontend code, but the project rule requires that run.

## 1. Edit eligibility

- [x] 1.1 Add `Order::is_editable()`. It uses the `EDITABLE_PAYMENT_STATUSES` (`pending`, `unpaid`, `failed`) and `EDITABLE_FULFILLMENT_STATUSES` (`unfulfilled`, `processing`, `on-hold`) allow lists, and it requires an empty `cancelled_at` (design D1). Verify with a new `tests/Unit/Models/OrderEditableTest.php` that covers each scenario in spec "Only unpaid, open, unshipped orders can be edited".
- [x] 1.2 Add `is_editable` to `Resources/Order/OrderResource` and `Resources/Order/OrderListResource` (admin only, not the `Site/` resources). Verify with assertions in `tests/Integration/OrderApiTest.php` for `GET /orders` and `GET /orders/{id}` on an editable order and on a paid order.
- [x] 1.3 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`. _(Unit and integration suites pass, and phpcs passes on the changed files. Failures that existed before this change and are not related to it: `phpcs:wporg` error in `AnalyticsMetricRequest.php`, `npm run typecheck` errors in `choropleth-map.tsx`, and 2 vitest tests + 6 vitest test files in `features/analytics`.)_

## 2. Null-safe releases for deleted variants and coupons

- [x] 2.1 In `InventoryService::release_all_reserved_stock()`, skip order items whose `variant_id` is empty (design D11). Verify with a unit test in `tests/Unit/Services/InventoryServiceTest.php`: an order with one deleted-variant line and one live line releases stock only for the live line, and throws no error.
- [x] 2.2 In `OrderManager::mark_as_cancel()`, skip `release_usage` for order coupons whose `coupon_id` is empty, but still set `usage_reversed_at`. Verify with an integration test: cancel an order whose coupon was deleted, and also an order whose variant was deleted. Both succeed (spec "Deleted variants and coupons do not block order changes").
- [x] 2.3 In `PersistsOrderCoupons::sync_order_coupons()`, keep order coupons with a NULL `coupon_id` out of the existing-coupons map, so they never reach `release_usage`. Verify with an integration test: an edit of an order whose coupon was deleted succeeds, and the coupon is removed from the order.
- [x] 2.4 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 3. Shared calculation context service (revised)

Group 3 was first built for "one line per variant". The first version of tasks 3.2 and 3.3 stays valid (the controller and `CreateOrderAction` use the context service). Task 3.1 is reopened for the `order_item_id` rules.

- [x] 3.1 Revise `App\Services\OrderCalculationContextService` as in design D2 and D3:
  - an existing line has `order_item_id`: load it from `$order->items`, reject an unknown or repeated ID (422), fill the DTO from the stored line (`base_catalog_sale_price`, `base_catalog_regular_price`, weight, quantity)
  - a new line has `variant_id`: reject a repeated variant, and a variant that an existing line holds (422); the variant must exist and have a product (404); it must pass `Variant::is_available()` (422); fill the DTO from the live variant
  - `max_per_order` is checked when saving, for a new line on the full quantity (422)
  - `tax_profile_id` = the variant's profile, or the product's profile when the variant has none (new lines)
  - `is_reachable` for each line, and a variant map that callers can read

  Verify with `tests/Unit/Services/OrderCalculationContextServiceTest.php`: update the cases that sent a line already on the order by variant, and add cases for each rule above. _(Built with `build_new_item()` and `build_existing_item()`. `StoredOrderTermsService` is a new constructor dependency. The quantity rules for a line already on the order are enforced here, on save only.)_
- [x] 3.2 Make `OrderCalculationController` use the context service, and remove `prepare_context_dto()` and `prepare_items()`. _(Done in the first version. The controller is changed again in group 8.)_
- [x] 3.3 Make `CreateOrderAction` use the context service (admin create and storefront checkout). _(Done in the first version. Create is changed again in group 4.)_
- [x] 3.4 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`. _(Unit and integration suites pass.)_

## 4. Coupon discount rate column

- [x] 4.1 Add the nullable `discount_rate` (`decimal(8,4)`) column to `database/migrations/CreateOrderCouponsTable.php` with a comment that says what it holds (design D6). Add the field to `CreateOrderCouponDTO`, the `OrderCoupon` model and the order-coupon resource. Verify with a migration or model test that the column exists and casts as a float.
- [x] 4.2 In `PersistsOrderCoupons`, write `discount_rate` (the coupon's `discount_amount_percentage` when `discount_value_type` is percent, otherwise null) for every order coupon that is created. Update `database/seeders/OrderSeeder.php`. Verify with integration tests for spec "Coupon discount terms are stored at checkout": a 15% coupon stores 15, a fixed coupon stores null. _(The seeder writes `discount_rate` too.)_
- [x] 4.3 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 5. Engine line key and stored-value inputs

- [x] 5.1 Add `line_key` to `CalculationItemDTO` and use it as the key of the per-line arrays in `RecalculateCartAction`, `DiscountService` (`remaining_per_item`, `item_discounts`, `product_item_discounts`) and `PersistsOrderCoupons` (design D2). The context service, `CalculationContextDTO::from_cart` and the checkout path set `line_key` to the payload index or cart index. Verify that all existing engine, cart, discount, coupon and checkout tests pass with no change to their expected values. _(The key is `line_key`. The cart sets it to the cart item ID, the context service to the payload index. The only existing test changes are fixtures that set `line_key`; no expected value changed. The tax step keys its items by `line_key` too, so `PersistsOrderTaxes` and `PersistsOrderCoupons` take the saved items keyed by it.)_
- [x] 5.2 Add the stored-value inputs to `CalculationContextDTO` (design D5): the stored tax rates per `line_key` and for shipping, the stored shipping cost, `is_tax_inclusive` from the order, and a flag for "address changed". Make the tax strategy and the shipping step use them when they are set. Decide and test the tax rate of a new line on an unchanged address (live lookup, with the fallback in design D5). Verify with unit tests: an order with stored rates, after the live rate changed, keeps the stored rate; the same order with a changed address uses the live rate. _(`StoredOrderTermsDTO` on the context, `StoredRateTaxStrategy` wrapping the live strategy, and a tax-inclusive override on `Tax::get_tax_strategy()`. A new line takes its rate from the live strategy, so no "highest stored rate" fallback was needed.)_
- [x] 5.3 Add `DiscountService::calculate_stored()` (design D5) for the five stored coupon types in the table, with no validation and no `Coupon` model. Verify with `tests/Unit/Services/DiscountServiceTest.php` for each spec scenario in "Stored coupons are locked", "A stored percent coupon discounts a changed line by its stored rate" and "A stored order-wide coupon also discounts a new line": expired, deleted, rate changed, quantity raised on a percent line and on a fixed line, order-wide percent coupon and a new line, product coupon and a new line, fixed order coupon shared over lines. Also verify that an unchanged edit gives the same totals as the stored order. _(`DiscountService::calculate()` prices `$context->stored->coupons` after the live coupons in each pass. A stored coupon is shown to the rest of the code as an unsaved `Coupon`, and its result carries the `OrderCoupon` it came from.)_
- [x] 5.4 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 6. Order update: frozen save

- [x] 6.1 Reorder `UpdateOrderAction::execute()` to: lock → load → `is_editable()` check (422) → currency check → build with the context service (`$is_saving = true`; removed in 13.1) → check the shipping method → calculate → write (design D7). _(Done in the first version. Task 6.5 changes the build and write steps.)_
- [x] 6.2 Lock the currency (`OrderUpdateRequest` no longer defaults it; 422 on a different currency). _(Done in the first version.)_
- [x] 6.3 Make the exchange rate and the tax mode come from the order (design D10): `resolve_exchange_rate()` returns `$order->exchange_rate`, and the edit calculates with `$order->is_tax_inclusive`. Verify with integration tests for spec "An edit keeps the order's exchange rate and tax-inclusive setting": the rate changes after the order was placed, and the store moves to tax-inclusive. Replace the test `test_update_order_refreshes_is_tax_inclusive_when_the_setting_has_changed` and the first-version rate test, which asserted the sync behavior. _(No `resolve_exchange_rate()` method is left: `UpdateOrderAction` reads `$order->exchange_rate` directly. `test_update_order_refreshes_is_tax_inclusive_when_the_setting_has_changed` became `test_update_order_keeps_the_tax_mode_the_order_was_placed_with`, and the first-version rate test became `test_an_edit_converts_amounts_with_the_exchange_rate_the_order_was_placed_with`.)_
- [x] 6.4 Add the `order_item_id` input to `OrderUpdateRequest` and `UpdateOrderDTO` (existing lines carry `order_item_id`, new lines carry `variant_id`). Verify with request tests for spec "Existing lines are identified by order line ID". _(`UpdateOrderPayloadDTO::$items` is a plain array, so only `OrderUpdateRequest` and `OrderCalculationRequest` changed. Existing tests that sent an existing line by `variant_id` now send `order_item_id`.)_
- [x] 6.5 Rewrite line sync for the frozen save (design D4 and D9):
  - an existing line updates only its quantity and its calculated amounts, and keeps all snapshot fields
  - a new line gets the full snapshot from the live variant (one shared `fill_order_item_dto()`)
  - a quantity change on an unreachable line fails with 422
  - a quantity increase checks the per-order limit, and live stock for the added quantity
  - a lower quantity releases stock; a line left out is deleted, and stock is released only when its variant exists

  Verify with integration tests for the spec scenarios in "An existing line keeps its stored price", "A new line takes the current variant price", "A line whose product is not reachable is locked", "Stock is checked live for the quantity added" and "The per-order limit blocks only an increase" (limit 5 with stored 4: 5 passes, 6 fails; limit 2 with stored 4: 4 passes, 5 fails). Remove the first-version tests that asserted the price sync, the draft-product quantity change and the deleted-line removal. _(Reachability and per-order-limit rules are in the context service; stock moves are in `UpdateOrderAction`. An existing line is written with the `ITEM_SNAPSHOT_FIELDS` excluded. `PreparesOrderItems` is shared with `CreateOrderAction`. An invalid shipping method on an edit is now 422.)_
- [x] 6.6 Rewrite coupon sync for the frozen save (design D5 and D9). A code that matches a stored order coupon is priced with `calculate_stored()` and its row is kept with new amounts and `order_item_coupons` rows, with no usage claim. A stored coupon that is not in the payload is removed and its use is released. Any other code follows the live path and claims a use. Verify with integration tests for the spec scenarios in "Stored coupons are locked", "A stored order-wide coupon also discounts a new line" and "A removed coupon that no longer exists cannot be added again" (remove a deleted coupon, send its code again: rejected). _(`sync_order_coupons()` rebuilds the rows. A kept coupon copies its stored terms and usage state; a new coupon claims a use. Removed coupons give their use back.)_
- [x] 6.7 Add the address-change check (design D8) and the shipping and tax rules. When country and state are the same, keep the stored shipping cost, `shipping_metadata` and tax rates. When one differs, calculate them again from the current settings and write `shipping_metadata`. Verify with integration tests for the four scenarios in spec "Shipping and tax keep their stored values unless the delivery address changes". _(Rules are in `StoredOrderTermsService`: shipping is quoted again when the shipping country, state or method changes, and tax when the country or state of the address in the order's `tax_destination` changes. This adds the shipping method and the tax destination to the plan's "address changed" rule; see design D8.)_
- [x] 6.8 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 7. Remove the first-version change detection and total-limit work

- [x] 7.1 Delete `App\Services\OrderChangeDetector`, `App\DTO\Order\OrderChangesDTO`, `App\Constants\Order\OrderChangeState` and their tests (`OrderChangeDetectorTest`, `OrderCalculationResourceChangeStateTest`). _(Also removed: `holds_coupon_usage`, `count_other_usages` and the `usage_limited_coupon` test helper.)_
- [x] 7.2 Remove `OrderService::holds_coupon_usage()`, the subtraction in `DiscountService::validate_conditions()` and their tests (including `test_a_reversed_coupon_use_is_not_held_by_the_order`). A stored coupon is not validated again, so the rule has no use. Verify that the existing total-limit tests for create still pass.
- [x] 7.3 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 8. Calculation endpoint for edit previews

- [x] 8.1 Keep the optional `order_id` on `OrderCalculationRequest` and add the optional `order_item_id` on each line (`nullable|integer`, `Sanitizer::INT`). In `OrderCalculationController`, when `order_id` is set: load the order (404 when missing), return 422 when it is not editable, and build the frozen context. Remove the detector call and `OrderChangesDTO`. Verify with integration tests for the four scenarios in spec "The calculation accepts an order ID to preview an edit".
- [x] 8.2 Revise `OrderCalculationResource` as in design D13: each item gets `order_item_id`, `is_reachable` and the six stock fields. Remove `current_state`, the deleted-line rows and the removed-coupon entries. Verify with unit tests in `tests/Unit/Resources/` and an integration test: a create preview has null `order_item_id` and live stock fields; an edit preview shows `is_reachable` false for a draft product and for a deleted variant (with null stock fields); the existing `OrderCalculationResourceCouponFormattingTest` cases still pass.
- [x] 8.3 _(Superseded by 13.3: the preview now fails with 422 like the save.)_ Verify with an integration test that the preview does not fail when a line's quantity is above the stock or the per-order limit, or when an unreachable line's quantity changed, and that it returns the live values. A save with the same payload must fail with 422.
- [x] 8.4 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 9. Documentation

- [x] 9.1 Rewrite `docs/order-editing.md` in the `docs/emails.md` structure:
  - a table of contents
  - quick start (preview with `order_id` and `order_item_id`, then save)
  - when an order is editable
  - what an edit freezes and what it re-syncs
  - line rules (identification, reachable, new, duplicate, limits, stock)
  - coupons (stored, order-wide and product, removed, new)
  - shipping and tax (address change)
  - currency, exchange rate and tax mode
  - the preview payload (`is_reachable`, stock fields)
  - errors
  - "Where this differs from WooCommerce" (frozen prices and coupons by design, no recalculate button, no paid-order edit, no edit history or emails, product coupons never reach new lines)
- [x] 9.2 Update `docs/order-data-and-calculations.md` sections 7 and 9 to show the frozen behavior, record the decisions taken, add `order_coupons.discount_rate` to the data tables, and link to the new doc. Verify that each statement in both docs matches a test from groups 3 to 8.

## 10. End-to-end integration check

- [x] 10.1 Add one integration test that runs the full flow on one order:
  1. Create an order with two variants, a product coupon and an order-wide percent coupon.
  2. Raise one variant's price, expire the order-wide coupon, delete the other variant, raise the flat shipping rate and the tax rate.
  3. Preview an edit with `order_id` that raises the quantity of the live line, and assert that the price, the coupons, the shipping cost and the tax rate are the stored ones, and that the deleted-variant line has `is_reachable` false.
  4. Save the same payload, and assert that the saved totals equal the preview totals, that the coupon usage count is unchanged, and that the deleted-variant line is still on the order.
  5. Change the delivery state and save again, and assert that the shipping cost and the tax rate are the current ones. _(`test_an_edit_preview_prices_the_order_with_the_promised_terms_and_the_save_matches_it`.)_
- [x] 10.2 Run `openspec validate order-edit-sync --strict`, the four composer commands, and `npm run typecheck && npm test` in `resources/app/`, and verify that all pass. _(Strict validation passes. Unit 532 and integration 1,151 tests pass. `phpcs:wporg` and `phpcs:docblocks` report no errors; the remaining warnings were there before. Frontend typecheck passes and 2,005 frontend tests pass. A merge-conflict marker in `AnalyticsMetricRequest.php`, left in commit f6901fca, was a PHP parse error that failed 152 analytics tests. It is fixed.)_

## 11. Review follow-up: immutable coupon maxima

- [x] 11.1 Store `base_max_discount_amount` on order coupons and item coupons for fixed discounts. Preserve it independently of applied amounts, including zero-discount attribution rows. Cover repeated quantity decreases and increases, deleted coupons, and a temporarily exhausted product coupon with integration tests; update the schema, DTOs, models, seeder, docs and planning artifacts, and run the required verification checks. _(532 unit tests, 1,154 Docker integration tests and 2,005 frontend tests pass. Frontend typecheck, both PHP coding checks, strict OpenSpec validation and diff checks pass.)_

## 12. Review follow-up: preserve zero-amount shipping tax rates

- [x] 12.1 Preserve shipping tax rates with zero amounts in the stored-rate and live EU strategies, including each split rate when all taxable amounts are zero. Cover free shipping at checkout and free shipping applied in repeated edits, then removing the deleted coupon after the live rate changes. Verify preview/save agreement, update the docs and spec, and run the required verification checks. _(534 unit tests, 1,156 Docker integration tests and 2,005 frontend tests pass. Frontend typecheck, both PHP coding checks, strict OpenSpec validation and diff checks pass.)_

## 13. Review follow-up: one validation for preview and save, stored-first coupons, typed data

Tasks 6.1 and 8.3 describe the first version (`$is_saving`, a soft preview). This group replaces them.

- [x] 13.1 Remove `$is_saving` from `OrderCalculationContextService::build()`, `build_items()`, `build_new_item()` and `build_existing_item()` (design D3). The per-order limit on a new line, the locked-line check and the increase-over-limit check on an existing line always run. Update every caller: `OrderCalculationController`, `CreateOrderAction`, `UpdateOrderAction` and checkout. Verify: no `is_saving` is left in `app/`.
- [x] 13.2 Add the stock check to the context service (design D4): a new line is checked for its full quantity, a kept line only for its increase over the stored quantity (`has_stock`), a lowered or removed line is not checked. Keep `has_stock` and `reserve_stock` in `UpdateOrderAction` inside `lock_order()`. Verify with integration tests for the spec scenarios in "Calculation and save apply the same quantity and stock rules", including a sold-out variant on an unchanged line, and a save that fails when stock is used between the preview and the save.
- [x] 13.3 Change the tests that expected a soft preview (the test from 8.3): a preview that breaks a quantity, limit, stock or locked-line rule now returns 422, the same as a save with the same payload. Add one test that runs the same payloads through the preview and the save and expects the same result.
- [x] 13.4 In `DiscountService::calculate()`, price the stored coupons before the new coupons in each pass (design D5), and fix the comment that says "after them within a pass". Verify with the two spec scenarios in "A stored order-wide coupon keeps its stored terms" (10 and 18 for 10% stored plus 20% new; 95 and 5 for fixed 95 stored plus fixed 20 new).
- [x] 13.5 Add `App\DTO\Calculation\TaxRateDTO` (design D14). Use it in `StoredOrderTermsDTO`, `StoredOrderTermsService` and the tax strategies that read the stored rates, in place of the nested arrays. Verify: the existing tax and edit tests pass unchanged.
- [x] 13.6 Add `OrderCalculationInputDTO` and `OrderCalculationLineDTO` (design D3), and `to_calculation_input()` on `CreateOrderPayloadDTO` and `UpdateOrderPayloadDTO`. Change `build()` to take the input DTO, and the controller to build it from the request. Verify: the existing create, checkout, update and preview tests pass unchanged.
- [x] 13.7 Update `docs/order-editing.md` and `docs/order-data-and-calculations.md`: one validation for preview and save, the stock check in the preview and why the save checks again, stored coupons first, and the "Where this differs" section if it mentions a soft preview.
- [x] 13.9 Update the Bruno collection in `docs/ecommerce/orders/`: `edit-5.yml` sends lines by `order_item_id` or `variant_id` and has 422 examples (order not editable, locked line, per-order limit, stock); `Calculate Order Totals.yml` keeps the new-order preview with the new item keys; the new `calculate-order-edit-preview.yml` previews an edit with `order_id`. _(The response bodies are written from the code and the API resource, not captured from a running site.)_
- [x] 13.8 Verify the group: run the four composer commands, `npm run typecheck && npm test` in `resources/app/`, and `openspec validate order-edit-sync --strict`. _(546 unit tests, 1,162 Docker integration tests and 2,005 frontend tests pass. Frontend typecheck, `phpcs:docblocks`, `phpcs:wporg` on the changed files, and strict OpenSpec validation pass.)_

## Workflow follow-up

- Run `/opsx:archive` after review, and list the pre-existing bugs that this change fixed: the mixed old-price/new-total line, the missing tax profile on create, checkout and update, the cancel or edit failure for deleted variants and coupons, the display-currency default on update, and the stale `shipping_metadata` after an address change.
