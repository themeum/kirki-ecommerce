## 1. Pure logic

- [x] 1.1 Add a React-free module beside the card with `calculateDiscountPercentage(basePrice, salePrice)` returning a whole number, or `null` unless `basePrice > 0 && 0 < salePrice < basePrice`
- [x] 1.2 Add `getInitialOpenRows(values)` to the same module, returning which of `sale`, `unit`, `cost` hold a value (unit = any of the four unit fields)
- [x] 1.3 Unit-test both: `29 / 26.10` → `10`; equal, greater, zero, empty and absent prices → `null`; open-rows for no data, each row alone, and all three

## 2. Card structure

- [x] 2.1 Replace the two-column price/sale grid with a single full-width price `MoneyField`, no visible label, carrying an accessible name — `MoneyField` has a closed prop type with no rest spread, so a bare `aria-label` was silently dropped; added an `ariaLabel` prop to the wrapper that reaches the input
- [x] 2.2 Add the row-visibility state, seeded from `getInitialOpenRows` and re-seeded when the form goes from empty to populated — never in response to the merchant's own edits (see design.md; this is the subtle part)
- [x] 2.3 Add the "+ Sale price" / "+ Unit price" / "+ Cost & profit" controls, each shown only while its row is hidden, each revealing its row and focusing its first field via `autoFocus`
- [x] 2.4 Add a shared row wrapper rendering the label, optional trailing slot and the ⊖ remove control

## 3. The three rows

- [x] 3.1 Sale price row: `MoneyField` on `base_sale_price`, with a `Badge variant="success"` reading `N% off` from `calculateDiscountPercentage`, hidden when it returns null; ⊖ clears `base_sale_price`
- [x] 3.2 Unit price row: the existing `BaseUnitPopover` trigger, full width; ⊖ clears `total_unit_amount`, `total_unit`, `base_unit_amount`, `base_unit`
- [x] 3.3 Cost & profit row: three columns — `MoneyField` on `base_cost_of_goods` labelled "Cost per item", then Profit and Margin as read-only `Text` from `calculateProfit`; ⊖ clears `base_cost_of_goods`
- [x] 3.4 Remove the now-unused disabled `Input`s and the `inputLeftSymbol` style if nothing else uses it

## 4. Charge tax row

- [x] 4.1 Move the charge-tax checkbox out of its dark inner card to a plain row beneath the separator, keeping the `infoText`
- [x] 4.2 Keep the tax profile `CreatableSelectField` and `TaxProfilePopup` behaviour when checked, still not reserving layout space while hidden

## 5. Verification

- [x] 5.1 `npm run typecheck` passes
- [x] 5.2 Lint passes on the changed files
- [x] 5.3 `npm test` in `resources/app/` passes, including the new pure-logic tests
- [x] 5.4 Re-read the card against the spec: row order, add focuses the field, ⊖ clears exactly the listed fields, typing-to-empty does not collapse a row — also corrected the structure requirement's wording, which read as if the add controls sat between the price input and the shown rows; both readings are identical in the screenshots (they show all-closed and all-open), and trailing controls is the better of the two
- [x] 5.5 Hand both surfaces to the user for visual confirmation — the product form and the variant edit page, which inherits the same card
