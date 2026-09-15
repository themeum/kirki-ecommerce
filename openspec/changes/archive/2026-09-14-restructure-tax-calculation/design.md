## Context

See proposal.md - Why. Current state, briefly: `order_items.tax_rate` is one
merged float, `order_items.tax_breakdown` is a JSON blob with no persisted
shipping counterpart on `orders`. `AbstractTaxStrategy` exposes
`calculate_product_tax(ProductTaxContextDTO)` (one item at a time) and
`calculate_shipping_tax(int $shipping_cost)` (a bare integer) — neither can
see the rest of the cart, which is why shipping tax can't be split against
the item tax mix today.

## Goals / Non-Goals

**Goals:**
- `order_taxes` supports any number of tax lines per item and per shipping.
- The tax strategy contract collapses to one call that sees the whole cart
  and returns every line — item and shipping — in one result.
- `EUTaxStrategy` can split shipping tax across the item tax rates actually
  present in the cart.
- `RecalculateCartAction::execute()` reads as a short, named sequence of
  steps rather than one loop mixing discount, tax, and Money conversion.

**Non-Goals:**
- No backfill of historical orders (confirmed: drop the old columns, accept
  the itemized-breakdown loss on pre-existing orders; their cached totals
  remain correct).
- No refund tax tracking — refunds carry no tax columns today and stay that
  way.
- No change to the merchant-facing tax settings data model (regions,
  per-state rates, EU per-country rates, rules) — only how those resolved
  rates combine into shipping tax and how the combined result is persisted.
- No change to the decision-engine rule mechanism
  (`SetProductTaxRateAction`/`SetShippingTaxRateAction`) — strategies keep
  using it internally to resolve a rate per item/category/profile.

## Decisions

### 1. `order_taxes` schema

```
order_taxes
  id
  order_id            fk -> orders, cascade delete
  order_item_id        fk -> order_items, nullable, cascade delete when set
  type                  string, default 'product' ('product' | 'shipping')
  name                  string   ("VAT", "GST", "PST", "State Tax", ...)
  rate                  decimal(8,4)   -- same precision as today's tax_rate
  base_amount            integer (minor units)
  invoiced_amount         integer (minor units)
  timestamps
  index: [order_id], [order_item_id]
```

`type` is an explicit discriminator rather than inferring "shipping" from a
null `order_item_id` — agreed during exploration so nullability isn't a
silent convention baked into every query, and so a future order-level,
non-shipping taxable subject (e.g. a taxed handling fee) is a new `type`
value, not a reinterpretation of what null means.

Alternative considered: keep a single richer JSON column, now covering
shipping too. Rejected — still unqueryable/unindexable per rate, and doesn't
change the fact that JSON blobs are exactly the representation this change
is moving away from.

### 2. One new migration file

Ships as a new upgrade migration (table create + `orders` column adds +
`order_items` column drops), not an edit to `CreateOrderItemsTable`/
`CreateOrdersTable`, following this codebase's existing
`schema-upgrade-migrations` convention — it runs automatically when an
existing install updates the plugin.

### 3. `TaxCalculationContextDTO` + `TaxableItemDTO` (not the shared `CalculationContextDTO`)

```
TaxCalculationContextDTO
  shipping_address     array
  billing_address       array
  shipping_fee            int   (minor units, net of shipping discount)
  is_shipping_taxable      bool
  items                     TaxableItemDTO[]

TaxableItemDTO
  item_id               int|string   (keys results back to the right cart/order item)
  taxable_amount          int   (minor units, net of item discount)
  tax_profile_id            int|null
  product_categories          array
```

Decided during exploration: Discount and Shipping legitimately need most of
the cart-wide `CalculationContextDTO` (coupons, customer id, order count,
shipping method), so they keep using it unchanged. Tax only ever needs
amount, address, and profile/category identifiers — reusing the wide
context would leak irrelevant fields into every country strategy, the exact
surface this change is trying to keep narrow and futureproof. `items` is a
typed `TaxableItemDTO[]`, not a plain associative array, matching how
`CalculationItemDTO` and every other DTO in this codebase is already typed.

### 4. Result shape and the collapsed strategy method

```
TaxLineDTO                          (replaces TaxItemResultDTO)
  name         string
  rate          float
  base_amount    int
  item_id         int|string|null   (always set on an item's own line; set on a
                                     shipping line only when split per item, else null)

TaxCalculationResultDTO
  items        array<item_id, TaxLineDTO[]>
  shipping       TaxLineDTO[]
```

`AbstractTaxStrategy::calculate(TaxCalculationContextDTO $context):
TaxCalculationResultDTO` replaces `calculate_product_tax()` and
`calculate_shipping_tax()`. `DefaultTaxStrategy` keeps today's behavior: one
line per item, one flat line for shipping (its `item_id` left null — the
line applies to the order's shipping as a whole). `EUTaxStrategy` resolves
each item's VAT rate (still via the existing per-tax-profile rule
mechanism), then allocates the shipping fee across the cart's items
proportioned to each item's own taxable value (Brick\Money's `allocate()`,
remainder-safe) and taxes each item's portion at that item's own rate —
emitting one shipping `TaxLineDTO` per item, each tagged with that item's
`item_id`. Two items that happen to resolve to the same rate still produce
two separate lines rather than being merged: `order_taxes` needs the
per-item attribution to record which order item each portion of shipping
tax belongs to (see decision 1's revision below), and a normalized row
can only carry one `order_item_id`.

**Revision during implementation**: decision 1's original schema note said
a shipping-scoped `order_taxes` row always has `order_item_id` null. That
was wrong the moment the EU split needed to record *which item's share* a
shipping-tax portion represents — a merged "one row per rate" shape has
nowhere to put that. Fixed by tagging each shipping `TaxLineDTO` with the
item it was allocated to (`item_id`, null when not split) and having
`order_taxes` persistence resolve that to the item's real `order_item_id`
when present, matching what `order-tax-lines`'s spec now describes.

### 5. `RecalculateCartAction` shape

Illustrative, not final code:

```
execute(context):
    shipping_subtotal = resolve_shipping_subtotal(context)
    discounts          = resolve_discounts(context)
    tax_context         = build_tax_context(context, discounts, shipping_subtotal)
    tax_result           = tax_strategy?->calculate(tax_context)
    items                 = context.items.map(item => build_item_result(item, discounts, tax_result))
    shipping                = build_shipping_result(shipping_subtotal, discounts, tax_result)
    return aggregate(items, shipping, discounts)
```

Each step is single-purpose and named for what it does; the discount → tax
→ build → aggregate ordering mirrors the real dependency chain (tax needs
discounted amounts; totals need both). No behavior change for non-EU
flows — the EU shipping-tax numbers changing for mixed-rate carts is the
intended fix, not a side effect.

### 6. Persistence

`CreateOrderAction`/`UpdateOrderAction` insert one `order_taxes` row per
`TaxLineDTO` returned for an item (`order_item_id` = that item, `type` =
`product`, the column's default) and per `TaxLineDTO` returned for shipping
(`type` = `shipping`; `order_item_id` = the item its `TaxLineDTO->item_id`
resolves to when the strategy split the shipping tax per item, or null when
it didn't), in the same transaction as the order/order-item writes.
`order_items.base_tax_total`/`invoiced_tax_total` and
`orders.base_shipping_tax_amount`/`invoiced_shipping_tax_amount`/
`base_tax_total`/`invoiced_tax_total` are set from the sums
`RecalculateCartAction` already computed in memory — no re-querying
`order_taxes` to populate the cache.

### 7. Resources

`OrderResource`/`OrderCalculationResource`/`CartResource` read tax lines
from new `OrderItem::taxes()` / `Order::shipping_taxes()` relations instead
of the JSON column. Every `base_*`/`invoiced_*` tax amount they output keeps
shipping its `*_money_object` sibling per this codebase's money-field
convention.

## Risks / Trade-offs

- **Two shapes of tax data coexist after this ships** (old orders: flat
  rate + JSON; new orders: `order_taxes` rows) → any code that renders an
  order's tax detail (admin order view, invoices/exports) must treat this as
  a deliberate branch — render the aggregate for old orders, the itemized
  lines for new ones — not an oversight. Tracked explicitly in tasks.md.
- **EU shipping-tax-split changes the numbers** on future EU orders with
  mixed item tax rates → intentional per the proposal, but worth a reviewer
  double-checking against real EU multi-rate scenarios before merge.
- **`order_taxes` fans out one row per rate per item** → acceptable; indexed
  by `order_id`/`order_item_id`, the same shape `order_item_coupons` already
  uses for its own per-item fan-out.

## Migration Plan

1. Ship the new migration (`order_taxes` table, `orders` columns,
   `order_items` column drops) — runs automatically on plugin update via the
   existing upgrade-migration mechanism, no manual data step.
2. Ship the strategy/DTO/`RecalculateCartAction`/`CreateOrderAction`/
   `UpdateOrderAction` changes in the same release — the new columns only
   make sense once the code writing to them lands too.
3. No rollback path beyond restoring a pre-upgrade backup for the dropped
   columns, consistent with the confirmed no-backfill decision.

## Open Questions

- Exact rounding rule for splitting EU shipping tax proportionally across
  multiple rates (per-line HALF_UP vs. a largest-remainder reconciliation) —
  deferred to implementation; either satisfies the spec's "proportioned to
  that rate's share" requirement without changing the contract or the task
  breakdown.
- Whether the admin order-detail UI shows multiple tax lines per item now or
  as a fast-follow — deferred; the API/data model support either timing,
  so this is UI scope, not calculation scope.
