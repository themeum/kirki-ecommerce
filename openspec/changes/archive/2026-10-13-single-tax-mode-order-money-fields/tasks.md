## 1. Schema, consumers and fixtures

All edits are under `resources/app/features/orders/`. The schema edit breaks typecheck until the consumers are updated, so they stay in one group.

- [x] 1.1 In `schemas/catalog/order.ts`, collapse the paired fields in `OrderSchema.totals` to `invoiced_items_subtotal_money_object`, `base_items_subtotal_money_object`, `invoiced_order_total_money_object`, `base_order_total_money_object`
- [x] 1.2 In `OrderLineItemSchema`, collapse subtotal, strikethrough price, unit price and unit strikethrough price pairs to single `invoiced_*` / `base_*` `_money_object` fields (strikethrough fields stay `.nullish()`)
- [x] 1.3 In `OrderCalculationSchema.totals`, collapse to `base_items_subtotal_money_object` and `base_order_total_money_object`
- [x] 1.4 In `OrderCalculationItemSchema`, collapse to `base_subtotal_money_object`, `base_strikethrough_price_money_object`, `base_unit_price_money_object`, `base_unit_strikethrough_price_money_object`
- [x] 1.5 In `components/order-create/order-item/order-item-row.tsx`, read `calculationItem.base_subtotal_money_object.display` and remove the `is_tax_inclusive` ternary
- [x] 1.6 In `components/order-details/items-table.tsx`, read the single subtotal, unit price and unit strikethrough fields and remove the `isTaxInclusive` prop and its type
- [x] 1.7 In `pages/order-details.tsx`, stop passing `isTaxInclusive` to `ItemsTable`
- [x] 1.8 In `components/order-create/payment-summary-card.tsx`, update the `PaymentSummaryTotals` `Pick<>` keys and the two reads to `base_items_subtotal_money_object` and `base_order_total_money_object` (the subtotal label was later changed by the user to plain `Subtotal`, see group 3)
- [x] 1.9 In `tests/schemas/catalog/order.test.ts`, replace the paired fields in the order, line item and calculation fixtures with the single fields; keep the assertions
- [x] 1.10 In `tests/hooks/use-order-create.test.tsx`, update `buildCalculationResponse` and the inline item fixtures to the single fields
- [x] 1.11 Run `npm run typecheck && npm test` from `resources/app/` and confirm both pass

## 2. Residual check

- [x] 2.1 Run `grep -rnE "(exclusive|inclusive)_money_object" resources/app/features/orders` and confirm no matches
- [x] 2.2 Run `openspec validate single-tax-mode-order-money-fields` and confirm it passes
- [x] 2.3 Run `npm run typecheck && npm test` from `resources/app/` once more and confirm both pass (no source edits since 1.11, so the 1.11 run of typecheck clean and 1452/1452 tests applies)

## 3. Tax display by tax mode

All edits are under `resources/app/features/orders/`. See design.md D4.

- [x] 3.1 In `components/order-create/payment-summary-card.tsx`, add `'base_tax_total_money_object'` to the `PaymentSummaryTotals` `Pick<>` and add an optional `isTaxInclusive?: boolean` prop
- [x] 3.2 In the same file, for tax exclusive (`isTaxInclusive` false or undefined): keep the "Estimated tax" section, render the tax lines in a column keyed by `name` and `rate`, and show the empty amount when there are no lines
- [x] 3.3 In the same file, for tax inclusive: hide the "Estimated tax" section; after the "Order total" row, when tax lines exist, render `Includes %s in taxes` with `totals.base_tax_total_money_object.display` (new `__()` string in domain `kirki-ecommerce` with a translators comment), then one row per tax line with name, rate and `base_amount_money_object.display`; render nothing when there are no tax lines
- [x] 3.4 In `pages/order-create.tsx`, pass `isTaxInclusive={calculation?.is_tax_inclusive}` to `PaymentSummaryCard`
- [x] 3.5 In `pages/order-details.tsx`, pass `isTaxInclusive={order.is_tax_inclusive}` to `PaymentSummaryCard`
- [x] 3.6 Create `tests/components/order-create/payment-summary-card.test.tsx` with two cases: tax exclusive shows "Estimated tax" and each tax line and no "Includes" text; tax inclusive hides "Estimated tax" and shows the "Includes … in taxes" line and the breakdown after "Order total" (a third case was added: tax inclusive with no tax lines shows no tax text, as design D4 requires)
- [x] 3.7 Run `npm run typecheck && npm test` from `resources/app/` and confirm both pass (typecheck clean; 168 files, 1455/1455 tests)
- [x] 3.8 Run `npx prettier --check` on the three edited source files and the new test file, and run `openspec validate single-tax-mode-order-money-fields`; confirm both pass (Prettier and ESLint clean on the four touched files)
