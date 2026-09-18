## Context

See `proposal.md` for motivation. Relevant current state:

- `app/Resources/Site/Order/OrderResource.php` extends
  `app/Resources/Order/OrderResource.php` (admin) and `array_merge`s a few
  storefront-only fields on top. The admin resource's shape assumes a
  single coupon and has no items-subtotal/order-discount/shipping-amount
  split.
- `app/Resources/Cart/CartResource.php` already has the target shape: a
  `pricing` block (items subtotal, order discount, order total, tax total,
  coupons, shipping amount, total, merged tax lines) and an `items` block
  (per-item subtotal net of only its own product-coupon share,
  strikethrough price, `applied_product_coupons`). It builds this from a
  **live** `CalculationResultDTO` (via `RecalculateCartAction`), because a
  cart isn't priced yet.
- An order is already priced and frozen: `kirki_ecommerce_orders`,
  `..._order_items`, `..._order_coupons`, `..._order_item_coupons`, and
  `..._order_taxes` hold the exact invoiced figures from checkout
  (`order-coupon-attribution`, `order-tax-lines`). The new storefront
  resource reshapes these persisted rows — it does not recalculate
  anything.
- `order_coupons` has one row per applied coupon (`discount_target`
  ORDER/PRODUCTS), and `order_item_coupons` attributes each coupon's
  discount to the specific items it discounted — this is already
  multi-coupon-shaped at the persistence layer (`order-coupon-attribution`).
  A free-shipping order-coupon has no item attributions at all; its full
  discount is the shipping amount it waived.
- `orders` stores only the **net** `invoiced_shipping_total` (post-discount,
  and — after this change — always post-tax-added) plus
  `invoiced_shipping_tax_amount` separately. There is no persisted
  pre-discount shipping subtotal or a per-order shipping-discount column.
- Shipping tax is currently computed with the same inclusive/exclusive
  logic as product tax (`AbstractTaxStrategy::calculate_tax_amount`, used
  by both `DefaultTaxStrategy` and `EUTaxStrategy` for their shipping tax
  lines), and `RecalculateCartAction::build_shipping_result()` reuses the
  product `$is_inclusive_tax` flag to decide whether to add shipping tax on
  top of the shipping total. Shipping is never sold at a tax-inclusive
  price, so both of these are wrong when a store has tax-inclusive product
  pricing on and shipping is taxable.

## Goals / Non-Goals

**Goals:**
- Make `Site\Order\OrderResource` structurally independent of
  `Order\OrderResource` (admin).
- Give the storefront order-details payload the same breakdown shape as
  `CartResource`, built from persisted data, `invoiced_*`-only.
- Fix shipping tax to always be additive, at both the tax-strategy level
  (line amount) and the cart-recalculation level (whether it's added to
  the total), so the storefront order resource inherits correct persisted
  totals going forward.

**Non-Goals:**
- No changes to the admin `Order\OrderResource` or `OrderCalculationResource`.
- No changes to how coupons/tax lines are persisted
  (`order-coupon-attribution`, `order-tax-lines` stay as-is) — this is a
  read-side reshape only.
- No backfill/migration for orders placed before order-coupon attribution
  existed (per that capability's own "not migrated" requirement) — the new
  resource must degrade gracefully for them instead.
- No changes to the storefront frontend/template that consumes this
  payload — flagged as breaking in the proposal, follow-up work.

## Decisions

### 1. Independent class, no shared base with admin

`Site\Order\OrderResource` becomes a standalone `Resource` subclass. It does
not extend `Order\OrderResource`. Its `to_array()` is built from scratch;
the few genuinely storefront-only computed fields (`shipping_country`,
`billing_country`, `formatted_status`, `payment_next_step`,
`item_product_data`, `customer`) move from the subclass's `array_merge`
into this class directly, unchanged in behavior. `resolve_payment_next_step()`
carries over as-is.

**Alternative considered**: keep extending admin but override more methods.
Rejected — the two resources' shapes are diverging by design (invoiced-only
vs. base+invoiced, breakdown vs. flat totals), so inheritance only forces
future changes to reason about both call sites at once, which is exactly
what the user wants to stop.

### 2. `invoiced_*`-only, no `display_*`

Because an order's `currency_code`/invoiced figures are already fixed at
checkout, there is no display-currency conversion step. Every money field
is `invoiced_<name>_money_object` (via `Money::prepare_amount_object_from_minor($amount, $this->currency_code)`), no bare
`base_*` field.

**Following `CartResource`'s convention, not admin `OrderResource`'s**:
Cart's pricing/coupons/items blocks expose only `*_money_object` keys (no
bare float sibling); admin's flat `totals` block exposes both a bare
formatted string and a `_money_object` for every field. Since the explicit
goal is for the checkout summary and order-details summary UI to be driven
by the same shape, the new resource follows Cart's `_money_object`-only
convention for the `pricing`/`items`/`coupons` blocks. Non-pricing scalar
fields (status, addresses, etc.) are untouched.

### 3. Deriving the item/order coupon split from persisted attribution

Mirrors `CartResource`'s split, sourced from persisted rows instead of a
live `CouponDiscountResultDTO[]`:

- **Per-item product-coupon discount** (nets out of that item's own
  `invoiced_subtotal`): sum of the item's `order_item_coupons` rows whose
  parent `order_coupons.discount_target === PRODUCTS`.
- **Root order-wide discount** (against the items subtotal only): for each
  `order_coupons` row with `discount_target === ORDER`, the **sum of its
  own `order_item_coupons` rows** — i.e. the portion of that coupon's
  discount that *was* attributed to items. This is the direct analog of
  `CartResource::get_order_coupon_discount`'s `total_discount -
  shipping_discount` (the items-attributed portion), just computed from
  the attribution rows directly instead of by subtracting a
  separately-tracked shipping-discount field, since no such field is
  persisted on the order.
- **Coupon's own fixed/percentage fields** (`discount_value_type`,
  `discount_amount_percentage`, `discount_amount_fixed`) are read from
  `order_coupons.coupon_snapshot` (already the full `Coupon::to_array()` at
  checkout time) instead of a live `Coupon` model — this is exactly what
  the snapshot exists for.

### 4. Shipping breakdown: derive discount and strikethrough, don't drop them

Rejected the fallback of showing only the flat net `invoiced_shipping_total`
(what admin does). Instead, reuse the same leftover-attribution trick at
the order level:

- **Shipping discount** = sum, over every `discount_target === ORDER`
  order-coupon, of (`invoiced_discount_amount` − sum of its own
  `order_item_coupons`). This is the aggregate of the same per-coupon
  remainder computed in Decision 3, so it's one pass over the same data.
- **Shipping amount (post-discount, pre-tax)** = `invoiced_shipping_total −
  invoiced_shipping_tax_amount`. This is only reliable once shipping tax is
  always additive (Decision 5) — otherwise a tax-inclusive store's
  `invoiced_shipping_total` could have tax netted into it inconsistently.
- **Shipping strikethrough (pre-discount, pre-tax)** = shipping amount +
  shipping discount.

This depends on the tax fix landing in the same change (per the user's
explicit request to do both together) — called out as a hard dependency,
not an incidental grouping.

### 5. Shipping tax always additive, at both layers

- `AbstractTaxStrategy`: add `calculate_shipping_tax_amount(float $rate, int
  $base_amount)`, always computing tax as added-on-top (the existing
  non-inclusive branch of `calculate_tax_amount`), independent of
  `$this->is_tax_inclusive_price`. `calculate_tax_amount()` is untouched
  and stays inclusive-aware, for product lines only.
- `DefaultTaxStrategy::calculate_shipping_tax()` and
  `EUTaxStrategy::calculate_shipping_tax()` (including its no-items
  fallback branch) switch to the new method for every shipping `TaxLineDTO`
  they build.
- `RecalculateCartAction::build_shipping_result()` drops the
  `$is_inclusive_tax` parameter and always does `$total_money =
  $total_money->plus($tax_money)` — shipping tax is never netted into a
  tax-inclusive shipping fee.

**Alternative considered**: keep one `calculate_tax_amount()` and pass a
per-call `$force_exclusive` bool. Rejected in favor of a separately named
method — it makes call sites self-documenting (`calculate_shipping_tax_amount`
vs. a bare bool argument) and matches this class's existing pattern of
one method per tax-amount computation.

### 6. Pre-existing orders (no order-coupons rows) degrade to zero, not error

Per `order-coupon-attribution`'s "orders placed before this change are not
migrated" — an order with an empty `order_coupons` collection produces:
empty `coupons` list, `invoiced_order_discount` of 0, and every item's
`invoiced_subtotal` equal to its own `invoiced_subtotal` column (no
subtraction, since there's nothing to subtract). No special-casing code is
needed for this — it falls out naturally from summing over an empty
collection.

### 7. Per-item strikethrough price only covers the coupon case, not the sale-price case

`CartResource::prepare_strikethrough_price()` has two cases: a
product-coupon discount, or (absent a coupon) an active sale price shown
against the regular price — using `CalculationItemDTO::$base_product_total`
(the regular, pre-sale unit price) to detect and render the second case.
`kirki_ecommerce_order_items` has no equivalent column: it persists
`invoiced_price`/`invoiced_subtotal` (the price actually charged, already
sale-adjusted if a sale applied) but never the regular pre-sale price
alongside it. There is nothing to derive a sale-driven strikethrough from
after checkout.

The storefront order item's strikethrough therefore only covers the
product-coupon case (`invoiced_subtotal` before that coupon's discount) and
is `null` whenever no product coupon discounted the item — including when
a sale price was the only reason the charged price was lower than the
product's current regular price. This is a real, permanent gap (not a
"fix later"): closing it would require adding a new persisted column to
order items, which is out of scope for this change. Caught while
implementing task 2.3.

## Risks / Trade-offs

- **[Risk]** The shipping-discount derivation (Decision 4) assumes
  `order-coupon-attribution`'s reconciliation invariant holds exactly for
  every order-coupon (its total minus its item attributions equals its
  shipping share). That invariant is already enforced at write time
  (`PersistsOrderCoupons::assert_order_coupons_reconcile`), so this is
  reading an existing guarantee, not introducing a new assumption →
  Mitigation: none needed beyond what already exists; if that invariant
  is ever violated, the write-side assertion fails first, before an order
  is ever persisted for this resource to read.
- **[Risk]** The tax fix changes the invoiced/base totals of new orders
  placed by a tax-inclusive-price store with taxable shipping (shipping
  tax now correctly adds a small amount that was previously absorbed) →
  Mitigation: proposal.md already calls this out explicitly as expected,
  correct behavior change, not a regression; no historical order is
  recalculated or touched.
- **[Trade-off]** Choosing Cart's `_money_object`-only convention over
  admin's bare+money_object pairing means the storefront order payload's
  money-field shape now differs from the admin order payload's — this is
  intentional (Decision 2) but means the two "OrderResource" names in the
  codebase produce genuinely different-shaped `pricing`/`totals` blocks by
  design; not a defect, but worth knowing when reading both side by side.

## Correction during implementation

Decision 3's original wording swapped the items-share and shipping-share
formulas: it described "invoiced_discount_amount minus the sum of its own
order_item_coupons" (the leftover, not-attributed-to-any-item remainder —
i.e. the *shipping* share) as if it were the root order-wide discount
against the items subtotal. It is the opposite: the items-attributed
portion used for the root order-discount is the **sum of the coupon's own
`order_item_coupons` rows directly** (not a subtraction). The leftover
formula was already correctly assigned to the shipping-discount derivation
in Decision 4 — only Decision 3's label was wrong. Caught and fixed before
writing any code, by re-deriving both formulas against
`order-coupon-attribution`'s reconciliation invariant while implementing
task 2.2.

## Migration Plan

Single change, no data migration. Deploy order:
1. Land the tax-strategy fix (`AbstractTaxStrategy`,
   `DefaultTaxStrategy`, `EUTaxStrategy`, `RecalculateCartAction`) — this
   is self-contained and safe to ship alone.
2. Land the storefront `OrderResource` rewrite, which depends on (1) for
   the shipping-amount derivation in Decision 4.

No rollback concerns beyond a normal revert — no schema or persisted-data
changes are involved.
