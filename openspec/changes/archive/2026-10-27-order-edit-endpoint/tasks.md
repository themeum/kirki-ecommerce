# Tasks

## 1. Shared pieces

- [x] 1.1 `app/Concerns/FormatsVariantStock.php` exists with `format_variant_stock_fields($variant)`, no casts, and `OrderCalculationResource` uses it (already done; verify `tests/Unit/Resources/OrderCalculationResourceItemTest.php` passes unchanged)
- [x] 1.2 Add `app/Concerns/FormatsShippingOptions.php` with `format_shipping_options($options)` (`base_cost` to `base_cost_money_object`), with docblocks, and use it in `OrderCalculationResource` in place of the inline code; verify the calculation tests pass unchanged and `composer phpcs:docblocks` passes
- [x] 1.3 Add `OrderCalculationInputDTO::from_order(Order $order)`, with a unit test in `tests/Unit/DTO/` that checks the lines, coupon codes, method, customer and both addresses; verify the test passes
- [x] 1.4 Add `OrderService::find_editable_order_or_fail($id)` (404 when missing, 422 when not editable) and use it in `OrderCalculationController` when an `order_id` is sent; verify the existing preview integration tests (`previewing an edit of a paid order`, `of an unknown order`) pass unchanged
- [x] 1.5 Verify: `composer test:unit`, `composer phpcs:docblocks` and `composer phpcs:wporg` pass, and `npm run typecheck && npm test` (from `resources/app/`) passes

## 2. The edit endpoint

- [x] 2.1 Undo the earlier plan in `OrderResource` (remove the `FormatsVariantStock` use, `is_reachable`, the `$variant` variable and the stock merge in `prepare_items()`, and its docblock change) and remove `items.variant.product` from `OrderService::find_order()`; verify `git diff` of both files shows no change against `main` (note: `OrderService` still differs from `main` because group 1 added `find_editable_order_or_fail()` and the 404 code on `find_order_or_fail()`; `OrderResource` differs only by the unneeded `(bool)` cast removed from `is_tax_inclusive`)
- [x] 2.2 Add `app/Resources/Order/OrderEditResource.php` extending `OrderResource`: `prepare_items()` adds `is_reachable` and the stock keys, `to_array()` adds `available_shipping_methods`; use `FormatsVariantStock` and `FormatsShippingOptions`, with docblocks
- [x] 2.3 Add `OrderController::edit()` and the route `GET /orders/{id}/edit` in `routes/api.php`: find the order with `find_editable_order_or_fail()`, load `items.variant.product`, build the context with `from_order()` and the context service, and return the resource
- [x] 2.4 Retarget `tests/Unit/Resources/AdminOrderResourceItemTest.php` to `OrderEditResource` (rename it to `OrderEditResourceItemTest.php`), and keep its cases: normal variant, stock changed, deleted variant, unpublished product, hidden variant; verify it passes
- [x] 2.5 In `tests/Integration/OrderEditApiTest.php`, replace the detail-versus-preview test with edit-read tests: the seven item keys and `available_shipping_methods` equal the preview of the unchanged order; unknown order gives 404; paid order gives 422; `GET /orders/{id}` has none of the new keys; verify `composer test:integration` passes
- [x] 2.6 Verify: `composer test:unit`, `composer test:integration`, `composer phpcs:docblocks` and `composer phpcs:wporg` pass, and `npm run typecheck && npm test` (from `resources/app/`) passes

## 3. Documentation

- [x] 3.1 In `docs/order-editing.md`, replace the paragraph about `GET /orders/{id}` items with the new `GET /orders/{id}/edit` section: the extra keys, the shipping list, the 404 and 422 cases, and that the values are live; add the endpoint to the quick start in section 1
- [x] 3.2 Revert the example change in `docs/ecommerce/orders/get-by-id-5.yml` and add `docs/ecommerce/orders/get-edit.yml` with an example response; verify the YAML parses and `git diff` of `get-by-id-5.yml` is empty
- [x] 3.3 Verify: the docs describe only what the tests in 2.5 prove, and `npm run typecheck && npm test` (from `resources/app/`) passes
