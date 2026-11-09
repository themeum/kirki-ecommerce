# Design

## Context

Tax runs in one place for the cart and for orders: `RecalculateCartAction::get_tax_result()`.

```
Tax::should_calculate_tax()        store setting on + a tax region exists
        |
get_tax_result()
        |
build_tax_context()                builds the TaxableItemDTO list
        |
Default / EU / StoredRate strategy loop over that list
        |
build_item_result()                reads $tax_result->items[$line_key] ?? []
```

Calculation items (`CalculationItemDTO`) come from three builders:
`CalculationContextDTO::from_cart()` (cart), and
`OrderCalculationContextService::build_new_item()` and `build_existing_item()` (orders).

Facts that shape the approach:

- `Variant` casts `charge_taxes` to boolean, so the value needs no cast.
- `build_item_result()` already treats a missing entry in the tax result as "no tax lines". With no tax lines the tax fraction is zero, so an item under tax-inclusive pricing keeps its catalog price as subtotal and total.
- `StoredOrderTermsService::get_item_tax_rates()` stores an empty rate list for every line already on an order. An untaxed line therefore stays untaxed when the order is edited.

See proposal.md for the motivation and scope.

## Goals / Non-Goals

**Goals:**
- One place decides which items go to the tax engine.
- No change to the three tax strategies.
- No new setting check. The store setting is already checked before this point.

**Non-Goals:**
- The "Incl. Tax" labels and `should_show_incl_tax_on_shop_page()`. A variant-specific override comes later.
- Shipping tax rules.
- A product-level `charge_taxes` flag. It does not exist today.

## Decisions

### D1. Leave untaxed items out of the item list for the tax engine

`build_tax_context()` skips items with `charge_taxes` off. Those items get no entry in the tax result, and `build_item_result()` already reads that as zero tax.

Alternative: add the flag to `TaxableItemDTO` and check it in each strategy. Rejected: the same rule would live in three files, and each new country strategy would need it too.

### D2. Add `charge_taxes` to `CalculationItemDTO`, default `true`

The default `true` keeps every builder that does not set the flag on the old behavior. The cart builder and `build_new_item()` set it with `$variant->charge_taxes`, no cast.

### D3. A line already on an order does not read the flag

`build_existing_item()` keeps the default `true`. The stored rates of the line decide its tax (see Context). This keeps the rule in the order-edit docs: an edit keeps stored prices and tax. A line that was untaxed has an empty stored rate list, so it stays untaxed.

Alternative: read the current variant flag on edit. Rejected: changing the flag later would change the tax of placed orders.

### D4. Shipping tax is left as it is

Shipping tax does not depend on item flags. One effect follows from D1 for the EU strategy, which shares shipping tax across the items by taxable amount:

- Untaxed items leave the item list, so shipping tax is shared only across taxed items.
- If every item is untaxed, the list is empty, and the EU strategy uses its existing fallback: one shipping line at the plain rate of the member country. This is the same path as a shipping-only quote.

The Default strategy has one shipping rate and is not affected.

### D5. Variant DTOs default `charge_taxes` to `true`

Correction during implementation: the plan assumed the stored `charge_taxes` values were right. They are not always. `CreateVariantDTO` and `UpdateVariantDTO` defaulted `charge_taxes` to `false`, while the database column defaults to `1` and the admin form sends `true`. A variant sent through the API without the field was stored with `false`. Nothing read the value before, so it had no effect. With D1 it removes the tax of those variants. 11 integration tests that create variants without the field showed this.

Both DTOs now default to `true`. A full product update that omits the field on a variant therefore writes `true`, not `false`.

Alternative: keep the DTO defaults and change only the tests. Rejected: API clients that omit the field would get untaxed variants.

## Risks / Trade-offs

- [All items untaxed, EU strategy: shipping is still taxed] → This matches the rule that shipping tax is separate from item tax. It is noted in the docs "Where this differs" part. A later change can add a rule if merchants need it.
- [Tax-inclusive store with an untaxed item: the shop shows "Incl. Tax" for it] → Known and out of scope. It will be handled by the variant-specific override of the label.
- [A caller builds `CalculationItemDTO` without the flag] → The default `true` keeps the old behavior.

## Open Questions

None that block this change.
