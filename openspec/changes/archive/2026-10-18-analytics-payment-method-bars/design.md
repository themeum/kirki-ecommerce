## Context

`build_sales_by_payment_method()` runs one query over the sales orders of the
range, grouped by `payment_provider`, and returns the top 5 by Total sales.
The Sales by coupon code card already has the same shape of change: its query
lives in `query_coupon_orders()`, which runs once for the range and once for
the comparison range. `HBarList` already shows a label, a value, a subdued
detail and a change badge per row.

## Goals / Non-Goals

**Goals:**

- Show the top 5 payment methods as horizontal bars with Total sales, order
  count and the change in Total sales, as in the screenshot.

**Non-Goals:**

- No change to the Shipping charges by method or Taxes collected by region
  cards. They keep `RankedList`.
- No change to `HBarList` styles (bar height, colors).
- No change in how Total sales or Orders are calculated.

## Decisions

- **Change on Total sales, not orders.** The list is sorted by Total sales and
  the bar shows Total sales, so the badge compares the same value. The user
  chose this in the grill. Sales by coupon code compares orders because that
  list is sorted by orders.
- **Same query for both windows.** Move the SQL into
  `query_payment_method_sales(string $from, string $to, $limit = null)`. The
  range call uses `LIST_LIMIT`; the comparison call has no limit, so a method
  outside the previous top 5 still gets its previous value. This is the
  `query_coupon_orders()` pattern.
- **Previous value as a money object.** The row gets
  `previous_total_sales_money_object` (null when there is no comparison) and
  `change` from `change()`. This keeps the money format the same as
  `total_sales_money_object`. Both fields are `nullish` in the Zod schema.
- **Bar value.** `Number(total_sales_money_object.raw)`, the same as the
  location card, because `raw` can be a string or a number.
- **Detail text.** The existing `formatOrders()` helper gives "209 orders"
  with `_n()`.

## Risks / Trade-offs

- One more query per overview request when a comparison is selected. The
  query is the same grouped scan as the range query, so the cost is small.
- `SalesByPaymentMethodCard` no longer uses `RankedCardShell`. The shell stays
  for the other two cards.
