## Context

The backend resources already return one money object per pricing figure, in the tax mode of the order (`OrderResource`) or of the store (`OrderCalculationResource`). See proposal.md for motivation. Only the frontend schemas and their consumers still use the paired keys.

Current consumers of the paired keys, all under `resources/app/features/orders/`:

```
schemas/catalog/order.ts
   ├─ components/order-create/order-item/order-item-row.tsx   (ternary on calculation.is_tax_inclusive)
   ├─ components/order-details/items-table.tsx                (ternary on isTaxInclusive prop)
   │     └─ pages/order-details.tsx                           (passes order.is_tax_inclusive)
   └─ components/order-create/payment-summary-card.tsx        (Pick<> keys + always reads exclusive)
```

Zod object schemas strip unknown keys, so a missed fixture or consumer fails at runtime as `undefined`, not at typecheck for fixtures typed as `Record<string, unknown>`.

## Goals / Non-Goals

**Goals:**
- Make the order schemas match the two PHP resources key for key for the pricing figures.
- Remove the client-side tax-mode switching that the backend now does.
- Show tax in the payment summary card in the way that fits the tax mode (see D4).

**Non-Goals:**
- No backend change and no API docs change (`docs/ecommerce/orders/*.yml` already match).
- No change to `OrderListItemSchema`, coupon, tax line or refund schemas, which already match.
- No change to the `item-pricing-tax-exclusivity` capability (backend drift, separate change).

## Decisions

**D1. Collapse each pair to one field, keep nullability.**
Each `*_exclusive_*` / `*_inclusive_*` pair becomes one `*_money_object`. Strikethrough and unit strikethrough stay `.nullish()` because the resource returns `null` when nothing is struck through. Unit price and subtotal stay required because `get_unit_amount()` returns `null` only for a `null` line amount, and the subtotal is never `null`.
Alternative: keep both pair fields as optional for a transition. Rejected - the backend never returns them again, and the project keeps response schemas lenient only where the backend varies, not for removed keys.

**D2. Keep `is_tax_inclusive` in both schemas.**
The resources still return it and it documents the mode of every figure. The item row and the items table no longer read it. The order-create and order-details pages read it only to tell the payment summary card which tax display to use (D4). It stays because the schema mirrors the payload.

**D3. Remove the `isTaxInclusive` prop from `ItemsTable`.**
The prop only existed to pick between the paired fields. Leaving it would be an orphan created by this change.

**D4. The payment summary card shows tax by tax mode.**
The card reads `base_items_subtotal_money_object`, which includes tax on a tax-inclusive order, so its label is plain `Subtotal` (user edit). The card takes a new optional `isTaxInclusive` prop. `pages/order-create.tsx` passes `calculation?.is_tax_inclusive` and `pages/order-details.tsx` passes `order.is_tax_inclusive`.
- Tax exclusive: keep the "Estimated tax" section, with the tax lines in a column so that several lines do not sit side by side. When there are no lines, show the empty amount as today.
- Tax inclusive: hide that section. After the "Order total" row, when tax lines exist, show `Includes %s in taxes` (new i18n string) and then one row per tax line (name, rate and `base_amount_money_object`). When there are no tax lines, show no tax text.
- The total tax amount comes from `base_tax_total_money_object`, which both payloads and both `totals` schemas already carry. It is added to the card's `PaymentSummaryTotals` `Pick<>`.
Alternative: sum the tax lines in the client. Rejected - the backend total is the source of truth and the resource drops zero-amount lines.
Alternative: a conditional `Incl. tax` / `Excl. tax` subtotal label. Not needed - the plain label plus the inclusive tax description tells the reader the tax is inside the amounts.

**D5. Update fixtures in place, keep assertions.**
`order.test.ts` and `use-order-create.test.tsx` replace paired fields with the single field. Assertions on parsed output stay the same, so they prove the new keys survive parsing.

## Risks / Trade-offs

- [A fixture still has a paired key and passes silently because Zod strips it] → Verification includes a grep for `(exclusive|inclusive)_money_object` under `features/orders`; expect no matches.
- [The `PaymentSummaryTotals` `Pick<>` references removed keys] → `npm run typecheck` fails on a stale key, so this is caught before tests.
- [The tax lines merge item and shipping tax, while the "Includes" total is the order's tax total, so the lines might not add up to the total] → The backend total stays the source of truth. The card test uses a payload where the two agree, and the lines are shown as a breakdown, not recomputed.
- [A caller forgets `isTaxInclusive`, so a tax-inclusive order shows the exclusive "Estimated tax" row] → The prop is optional on purpose, as in the other card props. Both current callers pass it, and the card test covers both modes.
