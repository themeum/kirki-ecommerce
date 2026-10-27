# Order Editing

How an admin edits an existing order through the REST API, and what the store
does when the edit is saved. This document is for developers who build an
order-edit screen or call the API directly.

An edit **keeps what the customer was promised**. The customer bought at a
price, with a coupon, at an exchange rate, with shipping and tax for an
address. An edit never re-prices those to today's catalog and settings. Only a
**new delivery address** (or a new shipping method) asks for a new shipping
quote and new tax, because the store never quoted those.

- [1. Quick start](#1-quick-start)
- [2. When an order can be edited](#2-when-an-order-can-be-edited)
- [3. What an edit keeps and what it changes](#3-what-an-edit-keeps-and-what-it-changes)
- [4. Lines](#4-lines)
- [5. Stock and per-order limits](#5-stock-and-per-order-limits)
- [6. Coupons](#6-coupons)
- [7. Shipping, tax, currency and exchange rate](#7-shipping-tax-currency-and-exchange-rate)
- [8. Reading an order for an edit](#8-reading-an-order-for-an-edit)
- [9. Previewing an edit](#9-previewing-an-edit)
- [10. Errors](#10-errors)
- [11. Where this differs from WooCommerce](#11-where-this-differs-from-woocommerce)

---

## 1. Quick start

1. Read the order with `GET /orders/{id}/edit` (section 8). It fails with 422
   when the order cannot be edited, so do not show an edit screen then.
2. After each change on the screen, send the full order with its `order_id`
   to `POST /calculate/order` to show the new totals (section 9).
3. To save, send the full order to `PUT /orders/{id}`. The payload has the same
   shape as `POST /orders`: `items`, `coupon_codes`, `shipping_method`, the
   `shipping_*`, `billing_*` and `customer_*` fields, `order_notes` and
   `flags`.

A line **already on the order** is sent with its `id` and the new
`quantity`. A **new line** is sent with a `variant_id`.

```json
{
  "items": [
    { "id": 301, "quantity": 3 },
    { "id": 302, "quantity": 1 },
    { "variant_id": 40, "quantity": 2 }
  ],
  "coupon_codes": ["SPRING10"],
  "shipping_method": "method-0001",
  "shipping_first_name": "John",
  "shipping_country": "US",
  "shipping_state": "NY"
}
```

The payload is the **complete** new order, not a list of changes:

| You want to | Do this |
|---|---|
| Change a quantity | Send the line with the new `quantity`. |
| Add a line | Add a line with a `variant_id` and no `id`. |
| Remove a line | Leave the line out. |
| Remove a coupon | Leave the code out of `coupon_codes`. |
| Add a coupon | Add the code to `coupon_codes`. |

---

## 2. When an order can be edited

An order can be edited only when **all** of these are true:

| Field | Allowed values |
|---|---|
| `payment_status` | `pending`, `unpaid`, `failed` |
| `cancelled_at` | empty |
| `fulfillment_status` | `unfulfilled`, `processing`, `on-hold` |

So these orders cannot be edited:
- paid orders
- orders that are refunding or refunded
- cancelled orders
- orders that are shipped, delivered or returned (also unpaid ones, for
  example cash on delivery)

`GET /orders` (each row) and `GET /orders/{id}` give this result as
`is_editable`. The rule is in `Order::is_editable()`.

The save checks the rule **after** it locks the order. If the order was paid
or shipped after the screen was opened, the save is refused and nothing
changes.

---

## 3. What an edit keeps and what it changes

A save runs in one database transaction, after it locks the order.

| Thing | After the save |
|---|---|
| Unit price, regular price and catalog prices of a line already on the order | **Kept** as sold |
| Name, SKU, barcode, image, weight and `product_data` of a line already on the order | **Kept** as sold |
| Subtotal, discount, tax and total of a line | Calculated again from the stored price and the new quantity |
| A new line | The variant's **current** price, with a full snapshot of the variant |
| Coupons that were on the order | **Kept** with their stored terms (section 6) |
| Exchange rate and every `invoiced_*` conversion | **Kept** (section 7) |
| `is_tax_inclusive` (tax mode) | **Kept** (section 7) |
| Shipping charge and tax rates | **Kept**, unless the delivery address or the shipping method changes (section 7) |
| Currency | Cannot change (section 7) |
| Payment, fulfillment and order status | Not changed |
| Order number, invoice number, UUID | Not changed |

The calculation uses the stored values where the order has them. A new line
uses the variant's own tax profile (or the product's tax profile when the
variant has none), the same as the cart, the order calculation preview and
order creation. So for the same payload and the same store settings, the saved
totals equal the preview totals.

---

## 4. Lines

Every line is sent by `id` (a line already on the order) or by
`variant_id` (a new line). When both are sent, the `variant_id` is ignored.

| Line | Rule |
|---|---|
| Already on the order, product reachable | Normal line. The quantity can go up or down (section 5). |
| Already on the order, **not reachable** | **Locked.** The quantity cannot go up or down. The line can stay as it is or be removed. |
| New line | The product must be published and the variant visible, the same as for order creation. Otherwise the save fails with 422. |
| A new line for a variant the order already holds | The save fails with 422. To add more of an item that is on the order, raise that line's quantity. |
| The same `variant_id` on two new lines | The save fails with 422. |
| An item `id` of another order, or sent twice | The save fails with 422. |

A line is **not reachable** when its variant or product was deleted, when its
product is draft, scheduled or trashed, or when its variant is hidden. A line
whose variant was deleted stays on the order with its stored values. It has no
stock to check or to release, and the preview marks it with
`is_reachable: false`.

---

## 5. Stock and per-order limits

**Stock** is reserved when an order is placed. So an edit checks the live stock
only for the **difference**:

| Change | Stock |
|---|---|
| Quantity raised from 2 to 4 | 2 units must be available now. They are reserved. |
| Quantity lowered from 5 to 2 | 3 units are released. |
| Quantity unchanged | Nothing is checked. A line on a sold-out variant can still be saved. |
| Line removed (variant still exists) | Its full quantity is released. |
| Line removed (variant deleted) | Nothing is released. |
| New line | Its full quantity must be available. It is reserved. |

Variants that do not track inventory, or that allow back orders, are not
limited by stock.

The preview and the save check these rules in the same way (section 9). The
preview only reads the stock, so it cannot hold it. The save checks the stock
again and reserves it while the order is locked. If another order takes the
stock after your preview, the save fails.

The **per-order limit** (`max_per_order`) only stops a **raised** quantity. The
quantity on the order is never taken away because a limit was lowered:

| Stored quantity | Limit now | Quantity sent | Result |
|---|---|---|---|
| 4 | 5 | 5 | Saved |
| 4 | 5 | 6 | Refused (422) |
| 4 | 2 | 4 | Saved. The 4 stay. |
| 4 | 2 | 3 | Saved |
| 4 | 2 | 5 | Refused (422) |

A new line must stay within the limit for its full quantity.

---

## 6. Coupons

A coupon that is **already on the order** is locked. It stays applied with the
terms stored on the order, even when the coupon was changed, expired, made
inactive, reached its limit or was deleted since. It is not checked again and
it does not count a second use.

The terms are in the `order_coupons` and `order_item_coupons` rows: the type,
the target, the percentage (`discount_rate`), the fixed amount the coupon was
set to (`base_max_discount_amount`), the amount currently applied, and
which lines it discounted.

| Stored coupon | When a quantity changes | When a line is added |
|---|---|---|
| Product coupon, percentage | The line gets the stored percentage of its new subtotal. | The new line gets **nothing**, even if it would have qualified. |
| Product coupon, fixed amount | The line keeps the stored amount, capped at its new subtotal. | The new line gets **nothing**. |
| Order-wide coupon, percentage | The stored percentage of what is left after product coupons. | The new line is discounted too. |
| Order-wide coupon, fixed amount | The stored total, capped at what is left, shared over all lines. | The new line gets a share of the same total. |
| Free shipping | Waives the shipping charge. | - |

Coupons are priced in three steps: product coupons, then order-wide coupons,
then free shipping. In each step a stored coupon is priced **before** a new
coupon, and a new coupon takes only what the stored coupons leave. A step
works on what the earlier steps left. So a new coupon never lowers a stored
coupon of the **same** step, but a new coupon of an **earlier** step can.

| Stored coupon | New coupon | Subtotal | Stored coupon gives | New coupon gives |
|---|---|---|---|---|
| 10% order-wide | 20% order-wide (same step) | 100.00 | 10.00 | 18.00 |
| 10% order-wide | $20 fixed product coupon (earlier step) | 100.00 | 8.00 | 20.00 |

In the second row the product coupon takes 20.00 first. The stored coupon is
then priced on the 80.00 that is left. The total discount is 28.00, which is
more than the 10.00 before the edit. The stored coupon keeps its terms (10%),
but its amount is smaller.

A fixed coupon stores the amount it was set to when it was first applied (for
example $10), one value on the order coupon. A product coupon gives up to that
amount to each line it discounted. An order-wide coupon gives up to that amount
in total. The applied amount is the stored amount capped at the new subtotal,
and it is kept separately from the stored amount. If a $10 discount is capped to
$6 on one edit, an edit that raises the subtotal can use the full $10 again. This
is also true for a line that was too small for the full $10 at checkout: it can
reach $10 when its subtotal grows. A stored attribution stays even when its
current discount is zero.

| Case | Result |
|---|---|
| Coupon kept | Its use is not counted again. |
| Coupon removed (code left out) | One use is given back. |
| Code that is on the order, in other letter case (`spring10` for `SPRING10`) | Same as the stored coupon. It is kept with its stored terms. |
| Code that is not on the order | Treated as a **new** coupon: checked and priced from the coupon record, and one use is counted. The save fails if the coupon reached its limit in the meantime. |
| Code that matches no coupon | Not applied. It is not an error. |
| Coupon deleted from the store | Stays on the order while the order keeps it. Once an admin removes it, the code matches no coupon, so it cannot be applied again. |

A fixed product coupon on an order that has no stored fixed amount
(`base_max_discount_amount` is empty, for example on an order that an old
version saved) gives each line the amount that line already has. It cannot
return to the full amount after an edit capped it. Orders placed now always
store the amount.

---

## 7. Shipping, tax, currency and exchange rate

**Exchange rate and currency.** The order keeps its exchange rate. Every
`invoiced_*` amount is converted with it. The currency cannot change: when
`currency_code` is not sent, the order keeps its currency, and when it is sent
and differs, the save fails with 422.

**Tax mode.** The order keeps `is_tax_inclusive`. If the store changes how it
prices, an edit of an old order still calculates in the old mode.

**Shipping and tax.** An edit uses the shipping charge, the shipping method
name and the tax rates stored on the order. It quotes them again from today's
settings only in these cases:

| What changed | Quoted again |
|---|---|
| The shipping **country or state** | The shipping charge and `shipping_metadata`. |
| The **shipping method** | The shipping charge and `shipping_metadata`. |
| The country or state of the address that **tax follows** (the order's `tax_destination`: shipping or billing address) | The tax rates of every line and of shipping. |

Street, city, postcode, names and phone numbers never count as a new address.
When tax follows the store address, the tax rates are never quoted again.

The address that tax follows comes from the order's `tax_destination`, also
when the tax rates are quoted again. A change of the store's tax destination
setting does not change an order that is already placed.

One value is still read from the current shipping settings: whether the
shipping method is taxable. It matters only when tax follows the **billing**
address, the billing country or state changes, and the stored shipping charge
is kept. Then the shipping tax is calculated again with the current shipping
method. If an admin deleted that method or made it not taxable, the shipping tax
can be lower or zero. A change of the shipping address or method quotes the
shipping again, so this does not apply to it.

Free shipping sets the shipping tax amount to zero but keeps its saved rate.
Removing free shipping later restores tax at that saved rate, even if the live
rate changed. This also applies to orders placed with free shipping and to
shipping tax split between items with different rates.

A new line has no stored tax rate, so it is taxed at the current rate for the
order's address. A shipping method that is not available for the new address
fails the save with 422. When the shipping charge is kept, the chosen method is
not checked against today's settings.

---

## 8. Reading an order for an edit

`GET /orders/{id}/edit` returns everything `GET /orders/{id}` returns, plus what
the screen needs before the first preview:

| Key | Meaning |
|---|---|
| `items[].is_reachable` | `false` when the line is locked (section 4). Disable its quantity buttons. |
| `items[].allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order`, `max_per_order` | The variant's live values. All `null` when the variant was deleted. |
| `available_shipping_methods` | The shipping methods you can choose for the order's address, each with `base_cost_money_object`. Same list as the preview gives (section 9). |

The values are read when the response is built. They are not saved on the order,
and they change when the stock or the shipping settings change. For a line that
has not changed, the preview gives the same values. The saved shipping method can
be missing from `available_shipping_methods` when the store no longer offers it.

It fails with 404 when the order does not exist, and with 422 when the order
cannot be edited (section 2). `GET /orders/{id}` does not have these keys.

---

## 9. Previewing an edit

`POST /calculate/order` calculates an order without saving it. With no
`order_id` it previews a new order. With an `order_id` it previews an **edit** of
that order with the terms in sections 3 to 7. Send the same payload that you
will send to `PUT /orders/{id}`, plus `order_id`. The preview uses the same
inputs as the save and refuses the same faults with 422:

- a `currency_code` that is not the order's currency (section 7)
- a shipping method that is not available when the shipping is quoted again
  (section 7)
- a line, quantity, per-order limit or stock fault (sections 4 and 5)

When the stored shipping charge is kept, the method is not checked. The preview
does not reserve stock, and it does not claim a coupon use. Only the save does
these.

The preview fails with 404 when the order does not exist, and with 422 when
the order cannot be edited (section 2).

The items in the response come back in the same order as the items you sent, so item `i` of the result belongs to item `i` of the request. Every item in the response has:

| Key | Meaning |
|---|---|
| `id` | The stored order item's ID, the same `id` as in the order response, or `null` for a new line and in a new-order preview. Send it back to keep that line. |
| `is_reachable` | `false` when the line is locked (section 4). Disable its quantity buttons. |
| `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order`, `max_per_order` | The variant's live values. All `null` when the variant was deleted. |

The preview applies the same quantity, per-order limit and stock rules as the
save (sections 4 and 5). When a rule is broken, it fails with 422, the same as
the save does for the same payload. It does not reserve stock. Use the values
above to disable the buttons that would break a rule, so the admin does not
meet the error.

There is no marker for a changed catalog price. The edit keeps the price the
customer paid.

---

## 10. Errors

| Status | When |
|---|---|
| 404 | The order does not exist, or a `variant_id` does not exist. |
| 422 | The order cannot be edited (section 2). |
| 422 | `currency_code` differs from the order's currency. The preview gives it too. |
| 422 | A line has neither `id` nor `variant_id`. |
| 422 | An item `id` is not on the order or is sent twice. |
| 422 | A variant is on more than one line, or a new line is for a variant the order already holds. |
| 422 | A new line's product is not published, or its variant is hidden. |
| 422 | The quantity of a locked line (section 4) changed. |
| 422 | A raised quantity, or a new line, is above the variant's `max_per_order`. |
| 422 | Stock is short for an added quantity, or for a new line ("Not enough stock for variant: N"). The preview and the save both give it. The save also gives it when another request takes the stock after the preview. |
| 422 | The shipping method is not available for a new shipping address or a new method ("Invalid shipping method"). The preview gives it too. |
| 422 | Stock was taken by another request between the check and the reservation ("Insufficient stock to reserve."). |

When a save fails, nothing on the order changes: not the lines, the stock, the
coupons nor the totals.

---

## 11. Where this differs from WooCommerce

- **Prices and coupons are frozen on purpose.** WooCommerce keeps a line's
  price until you press *Recalculate*, and then it re-prices and re-applies
  coupons with today's rules. Here there is no recalculate. The order keeps its
  promised prices and coupon terms, and only the shipping and tax follow a new
  address.
- **A product coupon never reaches a new line.** The order stores which lines
  a coupon discounted, not the coupon's conditions. WooCommerce checks the
  coupon again on recalculation.
- **A different edit rule.** WooCommerce lets you edit items only while the
  order status is *pending payment* or *on hold*. Here the rule uses the
  payment and fulfillment statuses (section 2). An unpaid order that is
  *processing* can be edited. A paid, cancelled or shipped order cannot. A
  changed total never triggers an extra charge or a refund.
- **Deleted and unpublished products stay, locked.** WooCommerce lets you
  change the quantity of such a line. Here its quantity cannot change, and the
  line can only stay or be removed.
- **One line per variant for new lines.** WooCommerce allows the same product
  on two lines. Here a new line cannot repeat a variant on the order. Old
  orders that already hold two lines for one variant keep both, and each is
  edited by its own `id`.
- **The exchange rate and the tax mode are kept.**
- **No edit history and no emails.** WooCommerce adds order notes when items
  are added or removed and when stock changes. Here a save does not add a
  timeline entry, it does not keep the old totals, and it does not email the
  customer.
- **Stock shortage gives HTTP 422 in a preview and in a save.** WooCommerce
  has no preview of an edit. Here the preview checks stock and the per-order
  limit too, so the admin sees the same error before the save. A stock
  shortage that appears only in the save's own check also gives HTTP 422
  (section 10).
- **No manual price or custom discount.** You cannot set a line price by hand
  or add a discount that is not a coupon.
