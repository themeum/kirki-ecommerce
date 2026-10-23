# Order Editing

How an admin edits an existing order through the REST API, and what the store
does when the edit is saved. This document is for developers who build an
order-edit screen or call the API directly.

An edit **syncs the whole order to the store's current state**. When the edit
is saved, every line gets its variant's current price, coupons are checked
again, and shipping, tax and the exchange rate are calculated again with
today's settings. An edit never keeps an old price.

- [1. Quick start](#1-quick-start)
- [2. Previewing an edit](#2-previewing-an-edit)
- [3. When an order can be edited](#3-when-an-order-can-be-edited)
- [4. What a save changes](#4-what-a-save-changes)
- [5. Line rules](#5-line-rules)
- [6. Stock and per-order limits](#6-stock-and-per-order-limits)
- [7. Currency and exchange rate](#7-currency-and-exchange-rate)
- [8. Coupons](#8-coupons)
- [9. Errors](#9-errors)
- [10. Where this differs from WooCommerce](#10-where-this-differs-from-woocommerce)

---

## 1. Quick start

1. Read the order with `GET /orders/{id}`. Do not show an edit screen when
   `is_editable` is `false`.
2. After each change on the screen, send the full order with its `order_id`
   to `POST /calculate/order` to show the new totals and what changed
   (section 2).
3. To save, send the full order to `PUT /orders/{id}`. The payload has the same shape
   as `POST /orders`: `items` (each with `variant_id` and `quantity`),
   `coupon_codes`, `shipping_method`, the `shipping_*`, `billing_*` and
   `customer_*` fields, `order_notes` and `flags`.

```json
{
  "items": [
    { "variant_id": 12, "quantity": 3 },
    { "variant_id": 40, "quantity": 1 }
  ],
  "coupon_codes": ["SPRING10"],
  "shipping_method": "method-0001",
  "shipping_first_name": "John",
  "shipping_country": "US"
}
```

The payload is the **complete** new order, not a list of changes:

| You want to | Do this |
|---|---|
| Change a quantity | Send the line with the new `quantity`. |
| Add a line | Add a line with a new `variant_id`. |
| Remove a line | Leave the line out. |
| Remove a coupon | Leave the code out of `coupon_codes`. |

Lines are matched to the stored order by `variant_id`.

---

## 2. Previewing an edit

`POST /calculate/order` calculates an order without saving it. With no
`order_id` it previews a new order. With an `order_id` it previews an
**edit** of that order, and it also reports what changed since the order was
last saved. Send the same payload that you will send to `PUT /orders/{id}`,
plus `order_id`.

The preview calculates in exactly the same way as the save. For the same
payload and the same store settings, the saved totals equal the preview
totals.

The preview fails with 404 when the order does not exist, and with 422 when
the order cannot be edited (section 3).

### `current_state`

The root, every item and every coupon in the preview have a `current_state`
list. Each key in it is a change since the order was **last saved** (its
creation or its last edit) that affects the calculation. The list is empty
when nothing changed, and it is always empty in a new-order preview. After an
edit is saved, the next preview compares with that save, so the same change
is not reported again.

| Where | Key | When |
|---|---|---|
| Item | `item_deleted` | The line's variant or product was deleted. The save removes the line. No other key is set on that item. |
| Item | `price_changed` | The variant's current price (sale price, or regular price when there is no sale) or its regular price differs from the price stored on the line. A quantity change alone does not set it. A new line never has it. |
| Coupon | `coupon_removed` | The coupon is on the order, but the preview does not apply it: it was deleted, expired, made inactive, reached a limit, is no longer eligible, or was left out of `coupon_codes`. No other key is set on that coupon. |
| Coupon | `coupon_changed` | The coupon still applies, but one of its discount rules changed: discount type, target, value type, fixed amount, percentage, eligible item type, reward quantity, reward value, target products (with their reward flag) or target categories. A change to dates, limits, spend conditions, countries or customers does not set it. |
| Root | `shipping_method_removed` | The payload uses the order's stored shipping method, and that method is no longer available. `shipping_cost_changed` is then not set. |
| Root | `shipping_cost_changed` | The shipping total (after shipping discount, with shipping tax) differs from the stored one. |
| Root | `tax_mode_changed` | The store's tax-inclusive setting differs from the one stored on the order. It can be set together with a shipping key. |

The keys are constants on `App\Constants\Order\OrderChangeState`.

### Extra rows and fields in an edit preview

- **Deleted lines.** Each stored line whose variant was deleted is added to
  `items` as a row with `id: null`, its `order_item_id`, its stored quantity
  and stored amounts, and `current_state: ["item_deleted"]`. These rows are
  **not** part of `totals` or `items_count`.
- **Removed coupons.** Each stored coupon that the preview does not apply is
  added to `coupons` with a zero discount and
  `current_state: ["coupon_removed"]`. Its terms come from the coupon record
  stored on the order. A new code that does not apply is not listed, the same
  as in a new-order preview.
- **`order_item_id`** on every item: the ID of the stored line for the same
  variant, or `null` for a new line and in a new-order preview.

### Stock and limit values

Every item has the variant's current `allow_back_order`, `track_inventory`,
`available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order`.
They are `null` on a deleted-line row.

The preview does **not** fail when a quantity is above the available stock or
the per-order limit. Use these values to show the problem. The save enforces
both rules (section 6).

---

## 3. When an order can be edited

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

## 4. What a save changes

A save runs in one database transaction, after it locks the order.

| Thing | After the save |
|---|---|
| Line price, regular price, catalog prices | The variant's **current** values |
| Line name, SKU, barcode, image, weight, `product_data` | The variant's and product's **current** values |
| Line subtotal, discount, tax, total | Calculated again from the current price |
| Coupons | Checked again. A coupon that is no longer valid is removed (section 8). |
| Shipping cost | Today's shipping settings for the chosen method |
| `shipping_metadata` (method name and type) | The chosen method's current name and type |
| Tax rates and `is_tax_inclusive` | Today's tax settings |
| `exchange_rate` and every `invoiced_*` amount | Today's exchange rate (section 7) |
| Currency | Not changed (section 7) |
| Payment, fulfillment and order status | Not changed |
| Order number, invoice number, UUID | Not changed |

The calculation uses each variant's own tax profile (or the product's tax
profile when the variant has none), in the same way as the cart, the order
calculation preview and order creation. So for the same payload and the same
store settings, the saved totals equal the preview totals.

---

## 5. Line rules

| Line | Rule |
|---|---|
| Already on the order, product published | Normal line. |
| Already on the order, product is **draft, scheduled or trashed**, or the variant is hidden | Stays on the order. Its quantity can change. It uses the current price. |
| Already on the order, **variant or product deleted** | **Removed** on save. Its stock is not released, because the variant is gone. The client cannot send this line, because it has no `variant_id`. |
| New line | The product must be published and the variant visible, the same as for order creation. Otherwise the save fails with 422. |
| The same `variant_id` on two lines | The save fails with 422. To add more of an item already on the order, raise that line's quantity. |

---

## 6. Stock and per-order limits

**Stock** is reserved when an order is placed. So an edit checks stock only
for the **difference**:

| Change | Stock |
|---|---|
| Quantity raised from 2 to 4 | 2 units must be available. They are reserved. |
| Quantity lowered from 5 to 2 | 3 units are released. |
| Quantity unchanged | Nothing is checked. A line on a sold-out variant can still be saved. |
| Line removed (variant still exists) | Its full quantity is released. |
| New line | Its full quantity must be available. It is reserved. |

Variants that do not track inventory, or that allow back orders, are not
limited by stock.

The **per-order limit** (`max_per_order`) applies to the **full** quantity of
every line, new or existing. If the limit was lowered after the order was
placed, the save fails with 422 until the line's quantity is within the limit.

---

## 7. Currency and exchange rate

- **The currency cannot change.** When `currency_code` is not sent, the order
  keeps its currency. When it is sent and differs from the order's currency,
  the save fails with 422.
- **The exchange rate is today's rate.** Every `invoiced_*` amount is
  converted again with the current rate, and the new rate is stored on the
  order. To keep the rate the order was placed at instead, change
  `UpdateOrderAction::resolve_exchange_rate()` to return
  `$order->exchange_rate`.

---

## 8. Coupons

Every coupon in `coupon_codes` is checked again with today's rules. A coupon
that is expired, inactive, deleted, over a limit or no longer eligible is not
applied. It is removed from the order, and its use is given back.

| Case | Result |
|---|---|
| Coupon kept | Its use is not counted again. |
| Coupon added | One use is counted. The save fails if the coupon reached its limit in the meantime. |
| Coupon removed | One use is given back. |
| Coupon deleted from the store | The order coupon record is removed. No use is given back, because the coupon is gone. |

**Usage limits.** When a coupon's total usage limit is checked for an edit,
the use held by the order itself is not counted. So an order that took the
**last** use of a coupon keeps that coupon when it is edited. The
per-customer limit leaves out the edited order in the same way.

---

## 9. Errors

| Status | When |
|---|---|
| 404 | The order does not exist, or a `variant_id` does not exist. |
| 422 | The order cannot be edited (section 3). |
| 422 | `currency_code` differs from the order's currency. |
| 422 | The same `variant_id` is on two lines. |
| 422 | A new line's product is not published, or its variant is hidden. |
| 422 | A line's quantity is above the variant's `max_per_order`. |
| 422 | Stock was taken by another request between the check and the reservation ("Insufficient stock to reserve."). |
| 500 | Stock is short for an added quantity ("Not enough stock for variant: N"). This is the same status that order creation gives. |
| 500 | The shipping method is not available for the order ("Invalid shipping method"). This is the same status that order creation gives. |

When a save fails, nothing on the order changes: not the lines, the stock, the
coupons nor the totals.

---

## 10. Where this differs from WooCommerce

- **No old-price option.** WooCommerce keeps a line's price until you choose
  to recalculate. Here every save re-prices every line at the current price.
- **A different edit rule.** WooCommerce lets you edit items only while the
  order status is *pending payment* or *on hold*. Here the rule uses the
  payment and fulfillment statuses (section 3). An unpaid order that is
  *processing* can be edited. A paid, cancelled or shipped order cannot. A
  changed total never triggers an extra charge or a refund.
- **Deleted products leave the order.** WooCommerce keeps a line whose product
  was deleted, with its stored name and price. Here such a line is removed on
  the next save.
- **One line per variant.** WooCommerce allows the same product on two lines.
  Here a variant can be on one line only.
- **The exchange rate is not kept.** Every save converts with today's rate.
- **No edit history and no emails.** WooCommerce adds order notes when items
  are added or removed and when stock changes. Here a save does not add a
  timeline entry, it does not keep the old totals, and it does not email the
  customer.
- **Stock shortage gives HTTP 500.** The API answers 500, not 422, with the
  message "Not enough stock for variant: N" (section 9).
- **No manual price or custom discount.** You cannot set a line price by hand
  or add a discount that is not a coupon.
