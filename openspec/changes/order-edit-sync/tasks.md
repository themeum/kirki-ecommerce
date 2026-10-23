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

## 3. Shared calculation context builder

- [x] 3.1 Create `App\Services\OrderCalculationContextBuilder` with `build()` and `build_items()` as in design D2:
  - one line per variant (422)
  - the variant must exist and have a product (404)
  - a new line must pass `Variant::is_available()` (422), but a line already on `$order` does not need to
  - `max_per_order` applies to the full quantity, only when saving (422)
  - `tax_profile_id` = the variant's profile, or the product's profile when the variant has none
  - a variant map that callers can read

  Verify with `tests/Unit/Services/OrderCalculationContextBuilderTest.php` for each rule.
- [x] 3.2 Make `OrderCalculationController` use the builder, and remove `prepare_context_dto()` and `prepare_items()`. Verify that the existing calculation tests still pass, and that a new integration test shows the preview's item `id` is still the payload index. _(Premise correction: no integration test called `calculate/order` before this change. The first one showed that the endpoint returned HTTP 500 whenever notices were on, because `OrderCalculationResource` read `$result->shipping_method`, a property that `CalculationResultDTO` does not have. It now returns the selected method's ID when that method is available, otherwise null. The create screen's sync uses this value only when it is not null, so its behavior does not change.)_
- [x] 3.3 Make `CreateOrderAction` use the builder (admin create and storefront checkout), and remove its `prepare_context_items()` and its own context assembly. Verify with integration tests:
  - for a variant with a reduced-rate tax profile, the admin create preview tax equals the saved order tax
  - checkout tax equals the cart total tax
  - a payload with a duplicate variant fails with 422
  - all existing create and checkout tests still pass
- [x] 3.4 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 4. Coupon total usage limit leaves out the order's own use

- [x] 4.1 Add `OrderService::holds_coupon_usage($order_id, $coupon_id)`. It is true when an `order_coupons` row for the pair has an empty `usage_reversed_at`. Use it in `DiscountService::validate_conditions()` to subtract this order's own use from `current_usage_count` when `context->order_id` is set (design D10). Verify with `tests/Unit/Services/DiscountServiceTest.php` cases:
  - a coupon at its limit stays valid for the order that holds the last use
  - a coupon at its limit stays invalid for an order that does not hold a use
  - a reversed use is not subtracted _(a mock cannot show this rule, because it is in the query, so `OrderEditApiTest::test_a_reversed_coupon_use_is_not_held_by_the_order` tests it against the database)_
- [x] 4.2 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 5. Order update: full sync on save

- [x] 5.1 Reorder `UpdateOrderAction::execute()` to: lock → load → `is_editable()` check (422) → currency check → build with the builder (`$is_saving = true`) → check the shipping method → calculate → write (design D4). Remove its `prepare_calculation_context_dto()`, `prepare_context_items()` and `$variants_map`. Verify with integration tests:
  - saving an edit of a paid, a cancelled or a shipped order fails with 422 and leaves the order, its lines, stock and coupons unchanged
  - an order marked paid between the preview and the save is refused
- [x] 5.2 Lock the currency. Remove the `currency_code` default from `OrderUpdateRequest::prepare_for_validation()`. Use `$order->currency_code` when no currency is sent, and return 422 when the sent currency is different. Verify with integration tests for "No currency sent" (the order stays in its currency while the display currency differs) and "Different currency sent".
- [x] 5.3 Add `resolve_exchange_rate(Order $order)`, which returns the latest rate (design D6), and use it for every conversion in the update. Verify with an integration test: an edit stores the current rate and converts the invoiced amounts with it.
- [x] 5.4 Make line sync a full sync (design D5):
  - one shared `fill_order_item_dto()` gives new and existing lines the current price, regular price, catalog prices, name, SKU, barcode, image, weight and `product_data`
  - stored lines with no live variant are deleted with no stock release
  - stock is reserved or released only for the quantity difference

  Verify with integration tests:
  - the price-raised scenario (unit price and totals use the new price)
  - a deleted-product line is removed and the save succeeds
  - a draft-product line can change its quantity
  - an unchanged line on a sold-out variant saves
  - raising beyond stock fails and rolls back
  - lowering releases the difference
  - a limit lowered below the stored quantity fails with 422

  Update `test_update_order_keeps_existing_regular_price_and_records_it_for_added_items` and any other existing test that asserts that old prices are kept, so that it asserts the sync behavior instead.
- [x] 5.5 Move `build_shipping_method_snapshot()` to a place both actions can use _(now `ShippingService::get_selected_shipping_method_snapshot()`)_. Write `shipping_metadata` on update. Verify with an integration test: after the method is renamed, an edit stores the new name.
- [x] 5.6 Verify with an integration test that an edit under a changed tax-inclusive setting stores the current setting. Extend the existing `test_update_order_refreshes_is_tax_inclusive_when_the_setting_has_changed` if it already covers this. _(The existing test already covers this, and it passes with the rewritten action. No change was needed.)_
- [x] 5.7 Write `docs/order-editing.md` in the `docs/emails.md` structure:
  - a table of contents
  - quick start (preview, then save)
  - when an order is editable
  - what an edit syncs
  - line rules (deleted, draft, new, duplicate, limits, stock)
  - currency and exchange rate
  - coupons and usage limits
  - errors
  - "Where this differs from WooCommerce" (no old-price option, no paid-order edit, no edit history or emails, deleted lines removed, latest exchange rate)

  Update `docs/order-data-and-calculations.md` sections 7 and 9 to show the new behavior, mark G2, G3 and G6 as fixed, record the D1–D4 decisions taken, and link to the new doc. Verify that each statement in the doc matches a test from this group.
- [x] 5.8 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`.

## 6. Change detection

- [x] 6.1 Add the `App\Constants\Order\OrderChangeState` final constants class with these keys: `ITEM_DELETED`, `PRICE_CHANGED`, `COUPON_REMOVED`, `COUPON_CHANGED`, `SHIPPING_METHOD_REMOVED`, `SHIPPING_COST_CHANGED`, `TAX_MODE_CHANGED`. Add `App\DTO\Order\OrderChangesDTO` with `order_state`, `item_states`, `coupon_states`, `deleted_items` and `removed_coupons`, all empty by default. Verify that `composer phpcs:docblocks` passes for both files.
- [x] 6.2 Create `App\Services\OrderChangeDetector` with `detect()`. It calls the protected methods `detect_item_states()`, `detect_coupon_states()` and `detect_order_state()`, as in design D8. The coupon rule comparison casts values to the `Coupon` model types, sorts the product and category ID lists, and skips the comparison when the snapshot is empty. Verify with `tests/Unit/Services/OrderChangeDetectorTest.php`, which covers every scenario in `specs/order-change-detection`:
  - deleted line
  - sale price changed, and only the regular price changed
  - quantity changed only, and new line
  - coupon expired, deleted, and dropped from the payload
  - a new code that does not apply is not listed
  - percentage changed, and target products changed
  - discount changed only because of quantity, and usage limit changed: not reported
  - empty snapshot
  - method removed (with no cost key)
  - admin picked another method
  - flat rate raised
  - free-shipping coupon removed
  - tax mode changed, and two root keys together
- [x] 6.3 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`. _(Unit tests and phpcs pass. Nothing calls the detector until group 7, so group 7's full integration run covers it.)_

## 7. Calculation endpoint for edit previews

- [x] 7.1 Add the optional `order_id` (`nullable|integer`, `Sanitizer::INT`) to `OrderCalculationRequest`. In `OrderCalculationController`, when `order_id` is set: load the order (404 when missing), return 422 when it is not editable, build with the order, and run `OrderChangeDetector`. Otherwise use an empty `OrderChangesDTO`. Pass `order` and `changes` to the resource. Verify with integration tests for the four scenarios in spec "The calculation accepts an order ID to preview an edit".
- [x] 7.2 Extend `OrderCalculationResource` as in design D9:
  - items get `order_item_id`, `current_state` and the six stock fields
  - one row for each deleted line, which is not counted in totals or `items_count`
  - applied coupons get `current_state`
  - one entry for each removed coupon, with a zero discount and `["coupon_removed"]`
  - the root gets `current_state`

  Verify with unit tests in `tests/Unit/Resources/` and an integration test:
  - a create preview has empty states, null `order_item_id`, live stock fields, and no removed-coupon entries
  - an edit preview with a deleted line, a price change, a removed coupon and a tax-mode change returns each key in the right place, and its totals leave out the deleted line
  - existing `OrderCalculationResourceCouponFormattingTest` cases still pass
- [x] 7.3 Verify with an integration test that the preview does not fail when a line's quantity is above the stock or the per-order limit, and that it returns the live values. A save with the same payload must fail with 422.
- [x] 7.4 Add the preview section to `docs/order-editing.md`: the `order_id` input, the `current_state` keys and when each is set, the deleted-line rows, the removed-coupon entries, the stock fields, and that the preview does not enforce stock or limits. Verify that each key in the doc matches an `OrderChangeState` constant and a test from groups 6–7.
- [x] 7.5 Verify the group: run the four composer commands and `npm run typecheck && npm test` in `resources/app/`. _(Passed: 493 unit tests, 1,109 integration tests through the project's Docker runner, both PHP coding checks, frontend typecheck and 1,978 frontend tests. Approved analytics follow-up: restored the dependencies already pinned in the lockfile, removed trailing zeroes from compact currency formatting, and documented the JSON-validation-error escaping false positive.)_

## 8. End-to-end integration check

- [x] 8.1 Add one integration test that runs the full flow on one order:
  1. Create an order with two variants and a coupon.
  2. Raise one variant's price.
  3. Delete the other variant.
  4. Change the shipping flat rate.
  5. Preview an edit with `order_id`, and assert `price_changed`, `item_deleted` and `shipping_cost_changed`.
  6. Save the same payload, and assert that the saved totals equal the preview totals, that the deleted line is gone, and that the coupon usage count is unchanged.
  7. Preview again, and assert that every `current_state` is empty.
- [x] 8.2 Run `openspec validate order-edit-sync --strict`, the four composer commands, and `npm run typecheck && npm test` in `resources/app/`, and verify that all pass. _(Strict validation and all checks pass; integration uses the project's Docker runner because the host has no WordPress test library. See 7.5 for counts and the approved analytics follow-up.)_

## Workflow follow-up

- Run `/opsx:archive` after review, and list the pre-existing bugs that this change fixed: the mixed old-price/new-total line, the missing tax profile on create, checkout and update, the cancel or edit failure for deleted variants and coupons, the coupon total limit that counted the order itself, the display-currency default on update, and the stale `shipping_metadata` after an edit.
