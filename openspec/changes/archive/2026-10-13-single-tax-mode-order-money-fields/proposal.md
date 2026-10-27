## Why

`OrderResource` and `OrderCalculationResource` now return each item, strikethrough, per-unit and root pricing figure once, in the order's tax mode (`is_tax_inclusive` reports it). The admin frontend schemas in `resources/app/features/orders/schemas/catalog/order.ts` still declare paired `*_exclusive_*` / `*_inclusive_*` fields. Zod strips the new keys, so order details and order create read `undefined` for subtotals, unit prices and strikethrough prices.

## What Changes

- **BREAKING** (frontend schema shape): in `OrderSchema`, `OrderLineItemSchema`, `OrderCalculationSchema` and `OrderCalculationItemSchema`, replace each `*_exclusive_money_object` / `*_inclusive_money_object` pair with one `*_money_object` field. Nullability is kept as it is today.
- Update every consumer of the removed keys: the order-create item row, the order-details items table, the payment summary card and the order-details page.
- Remove the `isTaxInclusive` prop from the items table and the `is_tax_inclusive` ternaries in the item row, because the backend already picks the tax mode.
- The payment summary label is plain `Subtotal` (changed by the user), because the amount now follows the order's tax mode.
- Show tax in the payment summary card by tax mode. Tax exclusive: keep the "Estimated tax" section. Tax inclusive: hide that section and, after "Order total", show the total tax amount and then the per-tax breakdown as a description. The card takes a new optional `isTaxInclusive` prop from the order-create and order-details pages.
- Update the order schema test fixtures and the `use-order-create` hook test fixtures to the new shape.
- Update the stale `admin-order-calculation-breakdown` requirements that still describe paired exclusive/inclusive figures.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-order-calculation-breakdown`: the requirements for item/root subtotal figures, line strikethrough price, per-unit price and per-unit strikethrough price change from paired tax-exclusive/tax-inclusive money objects to one money object in the store's current tax mode. This aligns the capability with the "Every pricing figure is exposed once, in the order's tax mode" requirement already present in `admin-order-pricing-breakdown`.

## Impact

- Code: `resources/app/features/orders/schemas/catalog/order.ts`, `components/order-create/order-item/order-item-row.tsx`, `components/order-details/items-table.tsx`, `components/order-create/payment-summary-card.tsx`, `pages/order-details.tsx`, `pages/order-create.tsx`.
- Tests: `features/orders/tests/schemas/catalog/order.test.ts`, `features/orders/tests/hooks/use-order-create.test.tsx`, and a new `features/orders/tests/components/order-create/payment-summary-card.test.tsx`.
- API: no backend or API change. `docs/ecommerce/orders/*.yml` already use the single-field names.
- Known drift, not changed here: `item-pricing-tax-exclusivity` still says calculated item subtotals always exclude tax, while `ResolvesLineItemPricing` now documents catalog-basis figures. That is a backend capability and needs its own change.
