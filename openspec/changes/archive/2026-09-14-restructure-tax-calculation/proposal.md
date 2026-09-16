## Why

Order tax is currently stored as one merged rate plus a JSON blob on `order_items`
(`tax_rate`, `tax_breakdown`), and shipping tax is never persisted on the order at
all — it's folded into `base_shipping_total` and lost. The calculation side has
the same shape problem: `AbstractTaxStrategy::calculate_shipping_tax()` only ever
receives the raw shipping cost as an integer, so a strategy has no way to see the
cart's items and split shipping tax across their rates — the EU's common
"shipping tax follows the goods" model. Every country whose tax needs more than
one flat rate per line (mixed VAT rates via rules, GST+PST, etc.) hits the same
ceiling. This reshapes both the schema and the strategy contract so a country's
entire tax behavior lives inside its own strategy, and adding the next country
never means touching the ones that already work.

## What Changes

- **BREAKING**: Replace `order_items.tax_rate` / `order_items.tax_breakdown`
  (JSON) with a new `order_taxes` table: one row per tax line, scoped to either
  an order item (`order_item_id` set) or the order's shipping (`order_item_id`
  null, `type = 'shipping'`), each with its own name, rate, and amount. No
  backfill — existing orders keep their current flat shape; only orders created
  after this ships write `order_taxes` rows. Shipped as a new migration file,
  not an edit to the existing `CreateOrderItemsTable`/`CreateOrdersTable`
  migrations, so it runs as an upgrade step.
- Add `orders.base_shipping_tax_amount` / `orders.invoiced_shipping_tax_amount`
  so the shipping tax split is actually persisted at the order level (today it
  only exists transiently during cart calculation).
- Collapse `AbstractTaxStrategy`'s two methods (`calculate_product_tax`,
  `calculate_shipping_tax`) into one: `calculate(TaxCalculationContextDTO
  $context): TaxCalculationResultDTO`, given the whole cart (items, shipping
  fee, shipping + billing address) at once and returning tax lines for every
  item and for shipping in one result. This is what lets `EUTaxStrategy` derive
  shipping tax from the cart's actual item tax mix instead of a flat configured
  rate, and lets any future strategy emit more than one tax line per item,
  without changing the contract other strategies implement.
- `TaxCalculationContextDTO` carries its own narrow, purpose-built shape (not
  the cart-wide `CalculationContextDTO` reused by Discount/Shipping) — tax only
  needs per-item taxable amounts and addresses, not coupons or customer data.
  Its item list is a typed `TaxableItemDTO[]`, not a plain associative array.
- Simplify `RecalculateCartAction::execute()` into named, single-purpose steps
  (resolve discounts → resolve tax for the whole cart in one call → build item
  results → build shipping result → aggregate totals) instead of the current
  single loop that interleaves discount, tax, and Money conversion logic with
  inline comments marking each phase.
- `CreateOrderAction` / `UpdateOrderAction` persist `order_taxes` rows instead
  of writing `tax_rate`/`tax_breakdown` onto `order_items`.
- `OrderResource`, `OrderCalculationResource`, `CartResource` read tax lines
  from the new structure. Frontend order schema/types updated to match.

## Capabilities

### New Capabilities
- `order-tax-lines`: the `order_taxes` table and its persistence rules — one
  row per tax line, scoped to an order item or to the order's shipping, and how
  `order_items`/`orders` cached tax totals stay in sync with it.
- `tax-calculation-strategy`: the strategy contract used at calculation time —
  a single `calculate()` call per cart that returns item-level and
  shipping-level tax results, with country-specific behavior (EU shipping-tax
  splitting, multi-line-per-item) fully encapsulated inside each strategy.

### Modified Capabilities
- `model-attribute-persistence`: removes `OrderItem.tax_breakdown` from the
  set of array/JSON attributes this capability guarantees persist — the column
  is dropped; multi-line tax breakdown now lives in `order_taxes`, not a JSON
  attribute on `OrderItem`.
- `tax-region-rate-model`: the "Checkout matches a shopper to a region, rate,
  and rule set by address" requirement currently states the EU's single VAT
  rate is applied to both product and shipping tax. That changes — for a region
  whose strategy splits shipping tax (EU), the shipping tax line(s) are derived
  from the cart's resolved item tax rates rather than always being the same
  single rate reused verbatim. General (non-EU) regions are unaffected: they
  keep using their own configured shipping tax rate.

## Impact

- New migration: `order_taxes` table, `orders` shipping-tax columns,
  `order_items` column drops (new file, not an edit to existing migrations).
- New `OrderTax` model + relations on `Order`/`OrderItem`.
- `AbstractTaxStrategy`, `DefaultTaxStrategy`, `EUTaxStrategy`,
  `TaxStrategyFactory` — contract change.
- New DTOs: `TaxCalculationContextDTO`, `TaxableItemDTO`,
  `TaxCalculationResultDTO`; retires `ProductTaxContextDTO`.
- `RecalculateCartAction`, `CreateOrderAction`, `UpdateOrderAction`.
- `OrderResource`, `OrderCalculationResource`, `CartResource` — response shape
  change for tax fields (breaking for existing API consumers of persisted
  order tax breakdown).
- Frontend: `resources/app` order schemas/types and `resources/site/ts/types.ts`
  updated to the new tax line shape.
- Out of scope: refunds (no tax columns today, untouched), historical order
  backfill (explicitly declined).
