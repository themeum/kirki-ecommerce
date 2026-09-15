## Context

See proposal.md - Why. Two Resource classes format the same calculation
result today with near-duplicate code: `app/Resources/Cart/CartResource.php`
(live cart preview) and `app/Resources/Order/OrderCalculationResource.php`
(order-edit recalculation preview). Both read from the same
`CalculationResultDTO`/`CalculationItemDTO`/`TaxLineDTO` shapes produced by
`RecalculateCartAction`. `OrderResource.php` (a placed, persisted order) is
untouched by this change — it reads persisted `order_taxes` rows directly
and doesn't share this formatting code.

All the data this change needs already exists on `CalculationResultDTO`,
`CalculationItemDTO`, and `DiscountCalculationResultDTO` (specifically
`CouponDiscountResultDTO::discount_target`, already `products` or `order`).
No changes to `RecalculateCartAction` or the calculation DTOs are needed —
this is a Resource-layer reshaping of already-correct numbers.

## Goals / Non-Goals

**Goals:**
- Reshape `CartResource` output to match the spec's breakdown, with
  unambiguous field names.
- Keep the actual amount charged (`base_total` / the "Pay" amount)
  byte-for-byte identical to today's behavior in both tax-inclusive and
  tax-exclusive modes.

**Non-Goals:**
- No change to `OrderCalculationResource` in this change. It duplicates
  `CartResource`'s pre-restructuring formatting code and is intentionally
  left as-is; a follow-up change mirrors this same restructuring there.
- No change to `RecalculateCartAction`, `CalculationResultDTO`, or any tax
  strategy's rate/amount math — only `DefaultTaxStrategy`'s shipping line
  *name* changes.
- No change to `OrderResource` (persisted order display) — it already
  satisfies the "every tax line its own record" behavior via `order_taxes`.
- No frontend changes in this change's tasks — consumers are updated
  separately once the new shape lands.
- No deduplication of the two Resource classes into a shared trait —
  deferred; doing it now would couple this change to the
  `OrderCalculationResource` follow-up.

## Decisions

**Group tax lines by `name|rate`, not by identity.** `TaxLineDTO` has no
stable rate identifier (no `tax_rate_id`); `name` is a hardcoded literal per
strategy. A `name . '|' . rate` string key is enough to satisfy the spec
(distinct rates under the same name stay distinct; identical name+rate
lines merge) without adding a new DTO field. This is the same key already
used for the item/shipping tax-line merge fixed earlier in this
conversation — extending it to also merge across item and shipping lines in
one pass is a natural continuation, not a new mechanism.

**Merge item and shipping tax lines by concatenating before grouping**,
rather than computing two breakdowns and merging the results. One
`format_tax_breakdown()` call over `flatten_item_tax_lines($result) +
$result->shipping_tax_lines` combined produces the single root `tax_lines`
array directly — simpler than merging two already-grouped breakdowns and
re-summing collisions between them.

**Compute the items subtotal / order discount / order total in the
Resource, from `coupon_results`.** `CouponDiscountResultDTO::discount_target`
already distinguishes `products` from `order`. Summing `total_discount`
for `order`-target results gives the order discount directly; item
subtotal is each item's `base_subtotal` minus only its `products`-target
`item_discounts` share (the existing `get_product_coupon_discount_for_item`
helper already computes this per item — it's reused, not reinvented).

**Shipping amount = `base_shipping_subtotal - base_shipping_discount`,
computed directly, not derived from `base_shipping_total`.**
`base_shipping_total` already has tax folded in when pricing is
tax-exclusive (see `RecalculateCartAction::build_shipping_result`), which
is exactly the ambiguity the spec rules out for the new
`display_shipping_amount_money_object`. Subtracting the two tax-free inputs
directly avoids needing to "un-add" tax from a total that may or may not
contain it.

**`DefaultTaxStrategy`'s shipping tax line name changes to `'Shipping Tax'`;
`EUTaxStrategy` is untouched.** This is the minimal change that satisfies
the spec's two merge scenarios: EU's shipping tax already shares `'VAT'`
with item lines by design (correct merge), while Default's shared `'Tax'`
name would otherwise wrongly merge shipping tax into item tax once both
lists are combined at the root. Renaming only the shipping line (not the
item line) keeps `DefaultTaxStrategy`'s per-item tax label unchanged.

**Field renames, not additive aliases.** Old field names
(`display_line_price_money_object`, the pre-coupon `display_subtotal_money_object`,
`display_shipping_tax_money_object`, split `tax_lines`/`shipping_tax_lines`)
are removed rather than kept alongside the new ones. Per CLAUDE.md this
codebase doesn't carry backwards-compatibility shims; consumers update in a
follow-up.

## Risks / Trade-offs

- **Breaking API shape change** → frontend cart/checkout consumers
  (currently unknown scope — not audited as part of this change) will
  break until updated. Mitigation: proposal.md flags this explicitly.
- **`CartResource` and `OrderCalculationResource` now diverge** — the two
  previously near-identical files temporarily have different pricing
  shapes until the follow-up change mirrors this one. Mitigation: the
  follow-up is expected soon; `OrderCalculationResource` is unaffected in
  the meantime since nothing in this change touches it.

## Migration Plan

No data migration — this only changes API response shape for the live
cart preview (`CartResource`), not persisted data, and not the
order-recalculation preview (`OrderCalculationResource`, unchanged here).
Deploy PHP changes; frontend consumers of the changed cart fields must be
updated in the same release to avoid rendering broken/missing pricing rows.
