# Tasks

## 1. Editability rule on the order model

- [x] 1.1 Add `&& $this->base_currency_code === Money::get_base_currency()` to `Order::is_editable()` in `app/Models/Order.php` and update its docblock. Verify with `composer phpcs:docblocks` and the unit tests in 1.2.
- [x] 1.2 Update `tests/Unit/Models/OrderEditableTest.php`: bind the unit test base currency with `bind_money_dependencies()`, give `make_order()` a matching `base_currency_code`, and add tests for an order in a different base currency (not editable) and for the same order after the store returns to its currency (editable). Verify with `composer test:unit`. (Also removed the stale `instances` property from `reset_route_state()` in `tests/Unit/TestCase.php`: the framework `Route` now uses the application container. Plain `composer test:unit` prints nothing locally; run it with `-d auto_prepend_file=bootstrap/abspath.php`, as `kirki-ecommerce-test` does.)
- [x] 1.3 Verify the group: run `composer test:unit`, `composer phpcs:wporg`, and `npm run typecheck && npm test` in `resources/app/` (the SPA reads `is_editable`; no frontend file changes). (Unit: 891/891 pass. `RouteDiTest` expected the old per-route instance cache, which the container change removed; it now checks that `make()` resolves through the container, and that a bound singleton is shared. phpcs:wporg clean. Typecheck passes. Frontend 2229/2229 pass.)

## 2. Integration tests

- [x] 2.1 Add integration tests to `tests/Integration/OrderEditApiTest.php` (it holds the edit read, preview and save tests and their helpers). Place an unpaid order, then switch the store base currency. Cover: `is_editable` is false on the detail and the list row; the edit read, the preview and the update return 422; the order keeps its `base_currency_code` and amounts; switching back makes `is_editable` true and the update succeed; a base-currency change between preview and save makes the save fail. A `with_base_currency()` helper restores USD, because a base-currency switch commits its own transaction. Verify with `composer test:integration`. (Also removed `reset_route_instance_cache()` from `tests/Support/RestTestCase.php`: it reflected on the removed `Route::$instances`. Mutation check: without the new condition, all 3 new tests fail.)
- [x] 2.2 Verify the group: run `composer test`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`. (Result: `OrderEditApiTest` and `OrderApiTest` pass, 214 tests. The earlier full integration run had 2 failures in `StorePresetsTest` ("Failed images still create the products", "Bangladesh store gets inside and outside dhaka zones"); both fail the same way with the HEAD versions of the changed app files, so this change does not cause them.)

## 3. Base amounts in the order payloads use the order's own currency

- [x] 3.1 In `app/Resources/Order/OrderResource.php`, `app/Resources/Order/OrderListResource.php` and `app/Resources/Site/Order/OrderListResource.php`, pass `$this->base_currency_code` to every `base_*` money call (`prepare_amount_from_minor`, `prepare_amount_object_from_minor`, and `prepare_unit_amount_object` in place of `null`). This covers totals, items, unit prices, strikethrough prices, item tax, order and item coupon discounts, the coupon snapshot fixed amount, tax lines and the list `base_total`. Verify with a search that no `base_*` money call in these files lacks the currency argument. (The `totals` block of `OrderResource` was already done before this change started.)
- [x] 3.2 Add an integration test to `tests/Integration/OrderEditApiTest.php`: place an order with tax, an order coupon and a product coupon; switch the store base currency; check that every `base_*_money_object` in the detail payload and the list row has the order's currency code. Verify with `composer test:integration`. (Fails on the HEAD versions of the three resources, passes with the fix. The storefront list row has no REST test; it uses the same one-line change.)
- [x] 3.3 Verify the group: run `composer test`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`.

## 4. Documentation

- [x] 4.1 Update `docs/order-editing.md`: add the base-currency condition to the table in section 2, explain that the order stays viewable, payable, cancellable and refundable, and mention the base-currency case in the 422 row of section 10 "Errors". Check that the section-11 "Where this differs from WooCommerce" part stays honest. Verify by reading the page against the spec delta.
- [x] 4.2 Check `docs/currencies.md` for a section about changing the base currency, and add that old unpaid orders cannot be edited after the change. Add a paragraph to `docs/order-data-and-calculations.md` (section 2) that an order keeps its `base_currency_code` and the payloads show it. Verify with a search for "base currency" in both files. (`currencies.md` section 3 said "Stored product, cart and order amounts do not change. They are read in the new base currency", which is not true for orders; it now says orders keep their own base currency.)

## Workflow follow-up

- Archive the change after review with `/opsx:archive`. It syncs the delta into `openspec/specs/order-editing/spec.md`.
- Backward compatibility note for the final response: `Order::is_editable()` is a released public method. Its signature stays the same. It returns `false` in a new case. The `is_editable` payload field keeps its shape.
