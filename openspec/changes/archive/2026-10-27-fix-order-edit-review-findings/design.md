# Design

## Context

An edit prices the order with `StoredOrderTermsDTO` (built by
`StoredOrderTermsService`) and `RecalculateCartAction`. The stored terms hold the
tax mode, the shipping charge, the tax rates and the kept coupons. The tax
destination still comes from live state
(`RecalculateCartAction::resolve_tax_destination` calls `Tax::get_tax_destination()`).
The shipping taxability also comes from live state (`is_shipping_method_taxable`
asks the live method). The stored rate strategy ignores that flag when stored
shipping tax rates exist. So it matters only when tax follows the billing
address, billing moves and the stored shipping charge is kept.

The preview (`OrderCalculationController`) and the save (`UpdateOrderAction`) share
`OrderCalculationContextService::build`. The save adds two checks after it: the
currency check and `has_valid_shipping_method` (only when the charge is quoted
again). The preview does not do them. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**
- No live tax-destination setting changes an edit.
- The preview fails with 422 for the same currency and shipping-method faults as the save.
- A fixed product coupon never gets the order total as a per-line cap.
- All fixes covered by tests and by `docs/order-editing.md`.

**Non-Goals:**
- The shipping charge that does not follow the items (decided later).
- Changing the coupon pass order. Only the docs and spec wording change.
- The live shipping-taxability lookup. A billing move alone does not quote shipping
  again, and the case is rare. Docs state the limit.
- Changing `CreateOrderAction` or the new-order preview. A new-order preview may
  still run with no shipping method chosen.

## Decisions

**1. Stored tax destination.** `resolve_tax_strategy` and `resolve_tax_destination`
take the calculation context. When `$context->stored->tax_destination` is set,
use it; otherwise use `Tax::get_tax_destination()`. Alternative: read it in
`StoredOrderTermsService` and pass a ready address. Rejected: the address
fallback to the store address stays in one place.

**2. Shipping taxability stays live.** Not changed. Storing it needs a new key in
`shipping_metadata` or a guess from tax rows, for a case that needs a billing tax
destination, a billing move and a deleted method. The docs state the limit.

**3. Preview runs the save's checks.** Move the two checks into
`OrderCalculationContextService` as `validate_edit(Order, OrderCalculationInputDTO, CalculationContextDTO)`,
called by the preview and by `UpdateOrderAction`. It needs `currency_code`, so
`OrderCalculationInputDTO` gets that field (the request already accepts it) and
`UpdateOrderPayloadDTO::to_calculation_input` passes it. The shipping check
needs `ShippingService`, which the context service takes in its constructor.
**Correction during implementation:** the calculation controller took the
context service in its own constructor. The REST layer (`Route::make`) builds
a controller's constructor chain with plain reflection and ignores the app
container's bindings, so `ShippingService` (it needs a settings array) failed
with a 500 on every preview. The controller now takes the context service as a
method argument of `get()`, which the app container resolves. Only edits (an order is given) run it. Alternative: copy the two
`throw_if` lines into the controller. Rejected: the two paths would drift again.

**4. Fixed product coupon fallback.** In `PersistsOrderCoupons::sync_order_coupons`, a
kept coupon with a null `base_max_discount_amount` keeps it null when its
target is products, and uses the stored total only for an order-wide coupon.
`DiscountService` already falls back to the line's own stored share for a
product coupon, and `make_stored_coupon` gets the same rule. `OrderSeeder`
writes the coupon's fixed amount per line (product) or in total (order-wide)
instead of the applied amount. Trade-off: with a null column, a capped line
cannot return to the full amount. That only affects old rows.

**5. Case-insensitive kept coupons.** `get_kept_coupons` compares codes with a
lower-cased copy of `coupon_codes`. The array stays keyed by the stored code, so
`array_keys($stored->coupons)` (used in `get_discount_result`) removes the sent
code with a matching comparison there too: that `array_diff` must compare
lower-cased codes, or `spring10` is still resolved as a new coupon.

**6. Stock 422.** `add_order_item` and `update_order_item` pass
`ValidationException::class` and `Response::UNPROCESSABLE_ENTITY` to `throw_if`.
The docs error table loses the 500 row.

**7. Docs.** Rewrite section 6 (coupon pass order and the 100.00 example),
section 7 (the tax destination comes from the order; state the billing-destination limit for shipping tax), section 9
(preview refuses a different currency and a bad shipping method; drop "exactly
the same way" for a precise sentence), section 10 (remove the 500 row) and section 11
(remove the 500 sentence).

## Risks / Trade-offs

- [Shipping tax can drop in the billing-destination case] → Accepted and documented.
- [Preview now fails more often] → That is the goal. The edit screen must show the
  422 message and not a stale total. Note it in the docs for screen builders.
- [Case-insensitive match differs from a case-sensitive DB collation] → The lookup
  already ignores case on the default MySQL collation. A case-sensitive collation
  could treat `spring10` and `SPRING10` as different coupons. Accepted.
