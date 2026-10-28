# Proposal

## Why

An order edit keeps the stored shipping charge unless the shipping country, the shipping state or the shipping method changes. But the shipping rules also use the items, the quantities, the weight, the subtotal and the full address. When an admin adds a line, changes a quantity or changes the postal code, the order keeps a shipping charge that is wrong for the new order. The edit preview (`POST /calculate/order` with `order_id`) and the save (`PUT /orders/{id}`) must quote the shipping again on every edit.

## What Changes

- An edit always quotes the shipping charge and the shipping method record (`shipping_metadata`) again from the current shipping settings, for the preview and for the save. The stored shipping charge is never used again.
- The shipping tax of an edit is always calculated again from the current settings with the new charge. The stored line tax rates do not change: they stay stored while the address that tax follows stays in the same country and state.
- **BREAKING**: An edit always checks the shipping method against the current settings. When the order's method is disabled, deleted or does not serve the address, every edit fails with a 422 error until the admin selects another method. This includes an edit that does not change the shipping. The error message tells the admin to select another shipping method.
- **BREAKING**: An edit that changes nothing can give a different shipping charge, when the shipping rates changed after the order was placed.
- Remove the code that kept the stored shipping charge and the stored shipping tax rates: `StoredOrderTermsDTO::$shipping_subtotal`, `$shipping_tax_rates`, `$is_shipping_tax_split`, `has_stored_shipping()`, `CalculationContextDTO::uses_stored_shipping()`, the stored-shipping branches in `StoredOrderTermsService`, `RecalculateCartAction`, `UpdateOrderAction` and `OrderCalculationContextService`, and the shipping-tax code in `StoredRateTaxStrategy`.
- Update the specs, the docs and the tests that describe the stored shipping charge.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-editing`: an edit always quotes shipping and shipping tax again; the method is always checked; the stored shipping charge and the stored shipping tax rates are no longer used by an edit.
- `admin-order-calculation-breakdown`: the edit preview no longer returns the stored shipping.

## Impact

- **Backend**: `app/Services/StoredOrderTermsService.php`, `app/DTO/Calculation/StoredOrderTermsDTO.php`, `app/DTO/Calculation/CalculationContextDTO.php`, `app/Services/OrderCalculationContextService.php`, `app/Actions/Cart/RecalculateCartAction.php`, `app/Actions/Order/UpdateOrderAction.php`, `app/Tax/Strategies/StoredRateTaxStrategy.php`.
- **API**: same endpoints and same payload. Edit responses can have a different shipping charge and shipping tax. More edits can fail with 422 for the shipping method.
- **Admin UI**: no code change. The edit screen already shows a preview error as a toast and reverts the form. The admin selects another method to continue.
- **Tests**: `tests/Unit/Services/StoredOrderTermsServiceTest.php`, `tests/Unit/Tax/StoredRateTaxStrategyTest.php`, `tests/Unit/Actions/Cart/RecalculateCartActionTest.php`, `tests/Unit/Services/OrderCalculationContextServiceTest.php`, `tests/Integration/OrderEditApiTest.php`.
- **Docs**: `docs/order-editing.md`, `docs/order-data-and-calculations.md`, `docs/ecommerce/orders/calculate-order-edit-preview.yml`.
- **Order creation and checkout**: not changed.
