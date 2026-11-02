## Context

`build_taxes_by_region()` and `build_shipping_by_method()` each run one query
over the sales orders of the range and return the top 5 rows. The Sales by
payment method card already has a change: its query lives in
`query_payment_method_sales()`, which runs once for the range and once for the
comparison range. `RankedList` shows a label, a subdued detail and a value per
row. It is used only by these 2 cards. `HBarList` shows a label, a value, a
subdued detail on the same line and a change badge, with a bar under the row.

## Goals / Non-Goals

**Goals:**

- Show the 2 cards as horizontal bars with the growth rate on each row.

**Non-Goals:**

- No change to `HBarList` bar styles (height, colors).
- No change in how tax or Shipping charges are calculated.

## Decisions

- **Change on the sorted value.** Taxes compare Total tax. Shipping compares
  Shipping charges. The list is sorted by this value and the row shows it, so
  the badge compares the same value. This matches the payment method card.
- **Same query for both windows.** Move each SQL into
  `query_region_taxes(string $from, string $to, $limit = null)` and
  `query_shipping_method_charges(string $from, string $to, $limit = null)`. The
  range call uses `LIST_LIMIT`. The comparison call has no limit, so a row
  outside the previous top 5 still gets its previous value.
- **Region key.** The previous tax values are keyed by `country|state`, the
  same group as the query.
- **Previous value as a money object.** The rows get
  `previous_total_tax_money_object` and `previous_shipping_charges_money_object`
  (null when there is no comparison) and `change` from `change()`. All new
  fields are `nullish` in the Zod schema.
- **Bars with `HBarList`.** Both cards use `HBarList`. The bar value is
  `Number(<money>.raw)`, the same as the payment method card.
- **Where the secondary data goes.** Shipping: "N orders" is short, so it is
  the `detail` on the value line, the same as the payment method card. Taxes:
  "Product $X · Shipping $Y" is too long for the value line of a half card, so
  `HBarItem` gets an optional `note`, shown in tiny subdued text under the bar.
  The user asked for a suitable place for this data.
- **Remove `RankedList`.** After this change no card uses `RankedList` or
  `RankedCardShell`, so both go.

## Risks / Trade-offs

- 2 more queries per overview request when a comparison is selected. They are
  the same grouped scans as the range queries, so the cost is small.
