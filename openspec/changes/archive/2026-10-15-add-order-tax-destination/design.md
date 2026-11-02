# Design

## Context

Tax is calculated in `RecalculateCartAction`. It passes the shipping address to `Tax::get_tax_strategy()`. `TaxStrategyFactory::make()` picks the strategy from that address's country. The strategy gets that one address. The shipping and billing addresses are also in `TaxCalculationContextDTO`. Billing is never used for the rate choice. The store address is in the `general.store_address` setting. See proposal.md for why we need to record the address.

## Goals / Non-Goals

**Goals:**
- Record on the order which address set its tax.
- Keep the strategy as the only owner of "which address". A new country must not need a change in shared code.

**Non-Goals:**
- A settings UI for "tax based on". The setting key exists; the UI can come later.
- A strategy that must switch the country of its own region by a different address. The factory still picks the strategy from one country (see Risks).
- Backfill of old orders. The product is not released.

## Decisions

**1. The strategy reports its destination.**
`AbstractTaxStrategy` gets `tax_destination(): string`. It returns the label the strategy was built with. A country strategy overrides it only when it uses another address. The label comes from the strategy because only the strategy knows what it used. The cart code cannot know.
*Alternative:* the cart code decides and stores the label. Rejected: it breaks when a country picks its own address.

**2. The result carries the label.**
`TaxCalculationResultDTO` gets `tax_destination`. `AbstractTaxStrategy` strategies fill it from `tax_destination()`. `RecalculateCartAction` copies it to `CalculationResultDTO`. The order actions copy it to the order, next to `is_tax_inclusive`.
*Alternative:* store it on the order from the context. Rejected: it can differ from what the strategy really did.

**3. A setting names the address; the strategy gets named addresses, not a raw one.**
`Tax::get_tax_destination()` reads `tax.tax_destination` and returns `shipping` when it is missing or unknown. `TaxCalculationContextDTO` holds `shipping_address`, `billing_address` and `store_address`, and `address_for($destination)` returns the one a destination stands for. `RecalculateCartAction` builds that context, then `resolve_tax_destination()` returns the destination as a plain string: the setting's value, or `store` when that address has no country, or null when no address has a country. The action passes only the country and the destination to the factory.
The strategy is built from its region settings and a destination. In `calculate()` it reads its tax address with `$context->address_for($this->destination)` and can read the other named addresses too. The decision rules get the real `shipping_address` and `billing_address` from the context, never the tax address under another name.
*Alternative:* pass one raw address to the strategy. Rejected: it was passed to the rules as `shipping_address` even when it was a billing address, and a strategy could not read any other address.

**4. Constants class.**
`OrderTaxDestination` in `app/Constants/Order/` holds `SHIPPING`, `BILLING`, `STORE`, like `OrderTaxType`.

**5. Column.**
`tax_destination` string(20), nullable, after `is_tax_inclusive` in `CreateOrdersTable.php`. The comment lists the values. Null means no tax was calculated. The migrations are squashed, so we edit the create file.

```
cart action: setting names shipping | billing | store
   address has country? ─ yes ─► (that address, its label)
                        └ no ──► (store address, 'store')
            │
            ▼
   factory(country of that address) ─► strategy(region settings, destination)
            │ calculate(context with shipping, billing, store)
            │ strategy reads context.address_for(destination)
            ▼
   result { lines, tax_destination = strategy->tax_destination() }
            │
            ▼
   CalculationResultDTO ─► Order create/update ─► orders.tax_destination
```

## Risks / Trade-offs

- **The factory picks the strategy from one country before the strategy picks its address.** If a future law needs billing country to choose the region, the factory country is wrong. → Today a strategy may only use another address for rates inside the same country. When a real country needs more, the factory will ask the strategy class for its address first. That is a later change and it does not alter the column.
- **The EU micro-business rule ignores the shopper's address.** It charges one fixed rate of the seller's country. → `EUTaxStrategy` overrides `tax_destination()` and returns `store` for a micro business, because the seller's country set the tax. For OSS it returns the received label.
- **Tax disabled or no strategy.** → The result has no label and the column stays null. This is covered in the spec.
