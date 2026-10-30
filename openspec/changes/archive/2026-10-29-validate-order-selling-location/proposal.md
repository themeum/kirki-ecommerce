# Proposal

## Why

The store can now limit which countries it sells to (selling locations). Nothing checks an order's
addresses against that setting. A customer can check out with a saved address whose country the
store no longer sells to, and an admin can create or edit an order for such a country.

## What Changes

- Reject an order whose shipping country is not a selling location.
- Reject an order whose billing country is not a selling location. When billing is the same as
  shipping, the one shipping check covers both.
- The rule applies to storefront checkout, admin manual orders, and admin order edit.
- Order edit always validates both countries, even when the country is unchanged from the stored
  order. An old order with a now-unsupported country cannot be saved until its address is fixed.
- The error is a field-level validation error on `shipping_country` / `billing_country`.
- No change to the checkout UI, the saved address picker, the address book, or the cart. This is
  server validation only.

## Capabilities

### New Capabilities
- `order-selling-location-validation`: orders (storefront, manual, and edited) are accepted only
  when their shipping and billing countries are selling locations.

### Modified Capabilities

None.

## Impact

- `app/Concerns/ValidatesAddressFields.php`: shared selling-country rule.
- `app/Http/Requests/Order/OrderCreateRequest.php` and `OrderUpdateRequest.php`: apply the rule.
- Uses `CountryData::get_selling_countries()`; the selling-location settings are unchanged.
- Docs: `docs/order-editing.md` gets a note on the new rejection.
