# Proposal

## Why

A review of the order-edit feature found six faults. Some live settings still
change an edit. The preview can show totals that the save then refuses. Some
coupon data and one doc statement are wrong. Fix them now, before the plugin is
released, so the edit keeps what the customer was promised and the docs are true.

## What Changes

- **Stored tax destination.** An edit takes the tax destination from the order, not
  from the live tax setting.
- **Docs for coupon order.** `docs/order-editing.md` section 6 and the order-editing
  spec say that a stored coupon is priced before a new coupon only inside the
  same pass. Product coupons (stored and new) run before order-wide coupons, so a
  new product coupon can lower what a stored order-wide coupon gives.
- **Preview checks what the save checks.** `POST /calculate/order` with an
  `order_id` also refuses a different `currency_code` and an unavailable shipping
  method with 422. One shared check is used by the preview and the save.
- **Safe fallback for fixed product coupons.** The seeder writes the fixed amount the
  coupon was set to in `base_max_discount_amount`. When that column is empty on
  an old row, a fixed product coupon uses the line's stored amount per line, not
  the coupon total for the order.
- **Case-insensitive kept coupons.** A code sent as `spring10` keeps the stored
  `SPRING10` coupon and its stored terms.
- **Stock failure is 422.** A stock shortage found in the save's own step gives 422
  ("Not enough stock for variant: N"), not 500.
- Not in this change: the shipping charge that does not follow the items (decided
  later), and the live "is shipping taxable" lookup. That lookup matters only when
  tax follows the billing address, billing moves and the shipping charge is kept.
  The docs state this limit.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-editing`: stored tax destination;
  coupon pass order wording; edit preview runs the currency and shipping-method
  checks; case-insensitive coupon keep; fixed product coupon fallback; stock
  failure gives 422.

## Impact

- Code: `app/Actions/Cart/RecalculateCartAction.php`,
  `app/Services/StoredOrderTermsService.php`, `app/Services/OrderCalculationContextService.php`,
  `app/Http/Controllers/Api/OrderCalculationController.php`,
  `app/DTO/Calculation/OrderCalculationInputDTO.php`, `app/Actions/Order/UpdateOrderAction.php`,
  `app/Concerns/PersistsOrderCoupons.php`, `app/Services/DiscountService.php`,
  `database/seeders/OrderSeeder.php`.
- Docs: `docs/order-editing.md` (sections 6, 7, 9, 10, 11).
- API: the edit preview can now return 422 for a currency or shipping-method fault.
  No new field, no removed field.
- No migration change is needed.
