# Tasks

## 1. Shipping tax of an edit is always live

- [x] 1.1 In `app/Tax/Strategies/StoredRateTaxStrategy.php`, set `$result->shipping` to `$live_result->shipping` always, and remove `calculate_shipping_lines()`, `first_item_rate()` and any import that becomes unused. Update the class and `calculate()` docblocks. Verify: `composer phpcs:wporg` and `composer phpcs:docblocks` pass for the file.
- [x] 1.2 In `app/Services/StoredOrderTermsService.php`, stop setting `shipping_tax_rates` and `is_shipping_tax_split`, and remove `get_shipping_tax_rates()`. Keep `get_line_keys_by_order_item_id()` only if `get_item_tax_rates()` still uses it. Verify: `grep -rn "shipping_tax_rates\|is_shipping_tax_split" app` gives no result after 1.3. (Also removed `TaxRateDTO::$line_key` and the `$line_key` parameter of `make_tax_rate()`: only the split shipping tax used them.)
- [x] 1.3 In `app/DTO/Calculation/StoredOrderTermsDTO.php`, remove `$shipping_tax_rates` and `$is_shipping_tax_split`, and update the class docblock. Verify: `composer phpcs:docblocks` passes.
- [x] 1.4 Update `tests/Unit/Tax/StoredRateTaxStrategyTest.php`: remove the stored-shipping-rate cases and add one case that shows the shipping lines are the live strategy's lines while the item lines keep the stored rates, and one that shows no shipping lines when the live strategy is null. Update the shipping-tax assertions in `tests/Unit/Services/StoredOrderTermsServiceTest.php` and the `shipping_tax_rates` setup in `tests/Unit/Actions/Cart/RecalculateCartActionTest.php`. Verify: `composer test:unit` passes.
- [x] 1.5 Update `tests/Integration/OrderEditApiTest.php::test_shipping_tax_rate_survives_free_shipping_and_is_used_when_it_is_removed` so that the restored shipping is taxed at the current rate (spec: "Shipping tax rates survive a zero shipping charge"), and add a test for "The shipping tax of an edit follows the new shipping quote" (tax rate raised, only a quantity changed: lines keep the stored rate, shipping at the current rate). Verify: `composer test:integration` passes.
- [x] 1.6 In `docs/order-editing.md` section 7, replace the paragraphs about the stored shipping tax rate and free shipping with the new rule: the shipping tax is always calculated from the current settings, including the case where the store no longer calculates tax. Verify: the section has no text that says the shipping tax keeps a stored rate.
- [x] 1.7 Run `npm run typecheck && npm test` in `resources/app/` and verify both pass.

## 2. Shipping charge of an edit is always quoted again

- [x] 2.1 In `app/Services/StoredOrderTermsService.php`, stop setting `shipping_subtotal` and remove `is_shipping_quoted_again()` and `get_shipping_subtotal()`. Update the class docblock and `build()` docblock. Verify: `composer phpcs:docblocks` passes.
- [x] 2.2 Remove `StoredOrderTermsDTO::$shipping_subtotal` and `has_stored_shipping()`, and `CalculationContextDTO::uses_stored_shipping()` and its `$stored` docblock mention of shipping if any. Verify: `grep -rn "uses_stored_shipping\|has_stored_shipping\|stored->shipping_subtotal" app tests` gives no result after 2.3 to 2.6.
- [x] 2.3 In `app/Actions/Cart/RecalculateCartAction.php::get_shipping_total()`, remove the stored-charge branch and update the `@return` text. Verify: `composer phpcs:docblocks` passes.
- [x] 2.4 In `app/Actions/Order/UpdateOrderAction.php`, always set `shipping_metadata` from `get_selected_shipping_method_snapshot($context)`. Verify: the line no longer reads `$order->shipping_metadata`.
- [x] 2.5 In `app/Services/OrderCalculationContextService.php::validate_edit()`, always run the shipping method check, with the message "The shipping method of this order is not available. Select another shipping method." (translatable, `kirki-ecommerce` text domain). Update the method docblock and the `get()` docblock in `OrderCalculationController`. Verify: `composer phpcs:wporg` passes.
- [x] 2.6 Update the unit tests: remove the stored-charge case in `tests/Unit/Actions/Cart/RecalculateCartActionTest.php` (around line 1033) and keep the "quoted again" case; update `tests/Unit/Services/OrderCalculationContextServiceTest.php` (around line 591) and the shipping assertions in `tests/Unit/Services/StoredOrderTermsServiceTest.php`. Verify: `composer test:unit` passes.
- [x] 2.7 Update `tests/Integration/OrderEditApiTest.php` for the specs "An edit always quotes shipping again" and "An edit always checks the shipping method": change `test_an_edit_keeps_the_shipping_cost_and_method_name_for_an_address_that_did_not_change` to expect the new charge and method name; change `test_the_preview_keeps_the_stored_shipping_charge_when_the_method_was_removed_and_the_address_did_not_change` to expect a 422 with the new message on the preview and on the save; add tests for a raised quantity under a weight-based rate, a notes-only edit after a rate change, and a removed method replaced by an available one. Verify: `composer test:integration` passes.
- [x] 2.8 Update the docs: `docs/order-editing.md` sections 3, 7, 9 and 11 (shipping is quoted again on every edit; the method is always checked; an unchanged edit can change the charge, in "Where this differs from WooCommerce"); `docs/order-data-and-calculations.md` lines 541 and 642; `docs/ecommerce/orders/calculate-order-edit-preview.yml` line 913. Verify: `grep -rn -i "stored shipping\|shipping charge is kept\|quoted again only" docs` gives no stale text.
- [x] 2.9 Update the Purpose of `openspec/specs/order-editing/spec.md`, which says shipping changes only for a new delivery address. Verify: `openspec validate requote-shipping-on-order-edit --strict` passes.
- [x] 2.10 Run `npm run typecheck && npm test` in `resources/app/` and verify both pass.

## 3. Integration check

- [x] 3.1 Run `composer test`, `composer phpcs:wporg` and `composer phpcs:docblocks`, and verify all pass. (Unit 576 and integration 1254 pass; `phpcs:wporg` passes. `phpcs:docblocks` reports one error that existed before this change: a missing docblock for `get_message()` in `app/Actions/Order/PerformOrderAction.php`, from commit 0a7229ed. Not fixed here.)
- [x] 3.2 Run `grep -rn "shipping_subtotal\|shipping_tax_rates" app/DTO/Calculation/StoredOrderTermsDTO.php app/Services/StoredOrderTermsService.php app/Tax/Strategies/StoredRateTaxStrategy.php` and verify no stored-shipping code is left.
- [x] 3.3 Run `npm run typecheck && npm test` in `resources/app/` and verify both pass.

## Workflow follow-up

- Ask the user to check the edit screen by hand: an order whose shipping method was removed shows the new 422 message, and selecting another method lets the edit continue.
- Sync the delta specs and archive the change after review.
