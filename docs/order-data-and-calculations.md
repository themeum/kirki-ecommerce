# How an Order Is Calculated and Stored

This page explains how the store turns a product price into an order total, and
where each number is saved. It is for the design team and other non-engineers.
You do not need to read code. Every number in the examples is real: it follows
the rules the store uses today.

We wrote it to help decide how **order edit** should work. Section 7 explains
what happens today when an order is edited. Section 9 lists the decisions we need.

- [1. The short version](#1-the-short-version)
- [2. Five ideas to know first](#2-five-ideas-to-know-first)
- [3. Where the numbers come from](#3-where-the-numbers-come-from)
- [4. The calculation, step by step](#4-the-calculation-step-by-step)
- [5. Worked example](#5-worked-example)
- [6. Table reference](#6-table-reference)
- [7. What happens when an order is edited](#7-what-happens-when-an-order-is-edited)
- [8. Cancel, stock and refunds](#8-cancel-stock-and-refunds)
- [9. Gaps and decisions for order edit](#9-gaps-and-decisions-for-order-edit)

---

## 1. The short version

1. The shop owner sets prices on **variants**. A variant is one buyable version of a product (for example "T-shirt, Blue, M").
2. When a customer places an order, the store runs one calculation: **price → discounts → tax → shipping → total**.
3. The store saves the result in the **order** and its **order items**. It saves it as a **snapshot**. The order does not point back to the live price.
4. Discounts and taxes also get their own rows, so we can always see which coupon gave which discount and which tax was charged on which line.
5. Every money value is saved **twice**: once in the store's main currency (`base_`) and once in the currency the customer paid in (`invoiced_`).
6. When an admin **edits** an order, the store runs the **whole calculation again** with today's prices, coupons, tax and shipping settings. Then it overwrites the totals. This is the most important thing to know for the edit decision. See section 7.

---

## 2. Five ideas to know first

**Money is saved as whole numbers (cents).**
$25.00 is saved as `2500`. This avoids rounding errors. In this page we write the number and the dollar value together, for example `2500` ($25.00).

**`base_` and `invoiced_` columns.**

| Prefix | Meaning | Example (store is USD, customer pays EUR at rate 0.92) |
|---|---|---|
| `base_` | The amount in the store's main currency. This is the "true" value. All calculation happens here. | `base_total = 6601` |
| `invoiced_` | The same amount converted to the order currency, at the exchange rate saved on the order. This is what the customer sees on the invoice. | `invoiced_total = 6073` |

If the order currency is the same as the store currency, both values are equal.
Each value is converted on its own and rounded half up. This means the
`invoiced_` parts can differ from the `invoiced_` total by a cent or two
(see section 5, step 9).

**Snapshot.**
When an order is placed, the store copies the product name, SKU, price, weight
and more into the order item. It also saves a full JSON copy of the product and
variant. If the shop owner later renames the product or changes its price, the old order does not change.

**Some things are NOT snapshots.**
The store does **not** save a copy of the tax settings, the shipping zones or
the shipping rates. They live in Settings and are read **live** each time a
calculation runs. For a new order this is fine. For an **edit** it matters, because
the calculation runs again with today's settings.

**Tax can be "exclusive" or "inclusive".** This is one store-wide setting.

| Setting | What the catalog price means | Tax is |
|---|---|---|
| Exclusive (default) | $25.00 is the price before tax | added on top |
| Inclusive | $25.00 already contains the tax | taken out of the price to show it |

The order saves which mode was used (`orders.is_tax_inclusive`). In both modes
the order item's `price` and `subtotal` are always saved **without tax**. The
price as the shop owner typed it is saved separately in the `catalog_` columns.

---

## 3. Where the numbers come from

Before an order exists, these tables and settings feed the calculation.

### 3.1 Products and variants

A **product** is the general item (title, description, images). A **variant** holds
the price, stock and shipping facts. A product with no options still has one variant.
All money is on the variant.

**Product table (`products`), columns that matter for orders**

| Column | Meaning |
|---|---|
| `id`, `title`, `slug` | Identity. `title` is copied to the order item as `product_name`. |
| `status` | `draft`, `published` or `trashed`. Only published products can be bought. |
| `has_variants` | Whether the product has options such as size and colour. |
| `brand_id` | The brand. Not used in calculation. |

Product categories (a separate link table) are used by coupons: a coupon can be limited to certain categories.

**Variant table (`variants`)**

| Column | Meaning | Used in order calculation? |
|---|---|---|
| `id`, `product_id` | Identity and parent product. | Yes (links the order item) |
| `sku`, `barcode` | Codes. Copied to the order item. | Copied only |
| `base_price` | **Regular price**, in cents, in store currency. | **Yes** |
| `base_sale_price` | **Sale price**. Empty or 0 means "no sale". | **Yes**. The price charged is `sale price`, or `regular price` when there is no sale. |
| `base_cost_of_goods` | What the shop owner paid for the item. | No. Only found inside the JSON snapshot. |
| `base_unit`, `base_unit_amount`, `total_unit`, `total_unit_amount` | "Price per 100 g" style display. | No |
| `weight`, `weight_unit` | Weight of one unit. | Yes, for weight-based shipping. Copied to the order item. |
| `charge_taxes` | A "charge tax on this item" switch. | **No**. The calculation does not read this column today. |
| `tax_profile_id` | Link to a tax profile (a named group for tax rules). | Partly. See section 9, gap G6. |
| `shipping_profile_id`, `shipping_box_id` | Link to a shipping profile and box. | Profile is passed to shipping. |
| `track_inventory` | Count stock for this variant. | Yes (stock) |
| `available_quantity` | Units free to sell. | Yes (stock) |
| `committed_quantity` | Units held by open orders (ordered, not yet shipped). | Yes (stock) |
| `allow_back_order` | Keep selling at zero stock. | Yes (stock) |
| `in_stock` | Only used when `track_inventory` is off. | Availability |
| `has_limit_per_order`, `max_per_order` | Limit on quantity per order. | Checked at create time |
| `is_visible` | Show in the store. | Hidden variant cannot be bought |
| `is_physical_product` | Physical or digital. | Copied to the order item |

There is **no date range for a sale**. A sale price is either on or off.

### 3.2 Coupons (`coupons`)

| Column | Meaning |
|---|---|
| `code`, `title`, `method` | Code the customer types, or an `automatic` discount. |
| `discount_type` | `amount-off`, `free-shipping` or `buy-x-get-y` (buy-x-get-y does nothing yet). |
| `discount_target` | `products` (only chosen items) or `order` (the whole order). |
| `discount_value_type` | `percentage` or `fixed`. |
| `discount_amount_percentage` | The percentage, for example `10`. |
| `base_discount_amount_fixed` | The fixed amount in cents, for example `500` ($5.00). |
| `eligible_item_type` | `specific-products`, `specific-categories` or `all-products`. |
| `spend_condition_type` / `spend_condition_value` | Minimum cart amount or minimum item count. |
| `start_datetime`, `has_end_datetime`, `end_datetime`, `is_active` | When the coupon works. |
| `target_country_type`, `target_countries` | Limit to some countries or states. |
| `first_time_buyer_only`, `customer_include_eligibility`, `customer_exclude_eligibility` | Who can use it. |
| `has_usage_limit`, `usage_limit`, `current_usage_count` | Total uses allowed and used so far. |
| `has_customer_limit`, `customer_limit` | Uses allowed per customer. |

### 3.3 Settings (not tables)

| Setting | What it controls |
|---|---|
| Base currency and exchange rates | Which currency is "base" and the rate to each other currency. |
| Tax: on/off, inclusive/exclusive, shipping tax on/off | The tax mode. |
| Tax regions | One entry per country: a central rate, or a rate per state. EU countries use one VAT rate per country. Optional rules can change the rate (for example by category). |
| Shipping zones and methods | Which methods exist for which country or state, their price (flat, weight-based, pickup), whether each method is taxable, and optional rules. |

---

## 4. The calculation, step by step

This is the order of the steps. Each step uses the result of the one before.
The same calculation runs when an order is **created**, when it is **edited**, and in the admin "preview" while building a manual order.

| # | Step | What happens |
|---|---|---|
| 1 | **Shipping fee** | If a shipping address and method are chosen, find the fee: flat rate, local pickup, or weight-based (by total weight). Optional rules may change or disable it. Without address and method the fee is 0. |
| 2 | **Line price** | For each line: `unit price × quantity`. The unit price is the variant's sale price, or its regular price when there is no sale. This is the "before discount" amount. |
| 3 | **Check coupons** | Each coupon is checked: active, dates, minimum spend, usage limits, country, customer rules. A coupon that fails is dropped and reported. The rest still apply. Only one free-shipping coupon is allowed. |
| 4 | **Product coupons** | Coupons with target `products` apply first. Each one works alone on its own eligible lines. If two product coupons hit the same line, both apply and the amounts are added up. |
| 5 | **Order coupons** | Coupons with target `order` apply next, one after the other, on **what is left** after step 4. The discount is shared between lines by their remaining value. The store splits cents fairly so the shares add up exactly. |
| 6 | **Free shipping** | A free-shipping coupon removes the whole shipping fee. |
| 7 | **Cap** | A line can never go below zero. If the discounts on a line add up to more than the line price, the last coupons are cut back. |
| 8 | **Taxable amount** | For each line: `line price − discount`. For shipping: `shipping fee − shipping discount`. Shipping is only taxed if the method is taxable and shipping tax is on. |
| 9 | **Tax rate** | The tax region of the **shipping address country** gives the rate. Rate rules can change it. EU: the rate of the destination country. |
| 10 | **Tax amount** | Per line, rounded half up. **Exclusive:** `taxable × rate ÷ 100`. **Inclusive:** `taxable × rate ÷ (100 + rate)` (this is the tax already inside the price). Shipping tax is always added on top, even in inclusive mode. |
| 11 | **Line total** | **Exclusive:** `taxable + tax`. **Inclusive:** `taxable` (tax is already inside). |
| 12 | **Reference numbers** | The store also works out numbers used only for display: the regular price without tax, the tax on the regular price, the line value after product coupons only, and the tax the discounts removed. |
| 13 | **Shipping total** | `shipping fee − shipping discount + shipping tax`. |
| 14 | **Order totals** | Add up all lines. `order total = sum of line totals + shipping total`. It is never below 0. |
| 15 | **Convert** | Every `base_` amount is converted to the order currency (`invoiced_`) with the exchange rate. |
| 16 | **Save** | One database transaction saves: the order, the order items, the stock reservation, the coupon rows, the tax rows, and clears the cart. If any check fails, nothing is saved. |

Two safety checks run at save time. The tax rows must add up exactly to the
order's tax total. The coupon rows must add up to the order's discount total.
If not, the order is not saved.

**Cheat sheet**

```
line price      = unit price × quantity
taxable amount  = line price − line discount
line total      = taxable amount + line tax          (tax exclusive)
line total      = taxable amount                     (tax inclusive; tax is already inside)
shipping total  = shipping fee − shipping discount + shipping tax
order total     = Σ line totals + shipping total
```

---

## 5. Worked example

### The setup

- Store currency: **USD**. Prices are **tax exclusive**. Tax is a flat **10%** on products and on shipping. The shipping method is taxable.
- The customer pays in **USD** (we show the euro conversion at the end).

**The cart**

| Product | Regular price | Sale price | Qty |
|---|---|---|---|
| T-shirt | `3000` ($30.00) | `2500` ($25.00) | 2 |
| Mug | `1200` ($12.00) | none | 1 |

**Shipping:** flat rate `800` ($8.00).

**Coupons**

- `SAVE10`: 10% off, target **products**, only the T-shirt.
- `TAKE5`: `500` ($5.00) off, target **order**.

### Step by step

| Step | T-shirt | Mug | Shipping |
|---|---|---|---|
| Line price (unit price × qty) | 2500 × 2 = **5000** | 1200 × 1 = **1200** | fee **800** |
| Product coupon `SAVE10` (10% of 5000) | −500 | 0 | |
| Left after product coupons | 4500 | 1200 | |
| Order coupon `TAKE5` (500, shared by what is left: 4500 / 1200 of 5700) | −395 | −105 | |
| **Total discount on the line** | **895** | **105** | 0 |
| Taxable amount (line price − discount) | 5000 − 895 = **4105** | 1200 − 105 = **1095** | **800** |
| Tax at 10% (rounded half up) | 410.5 → **411** | 109.5 → **110** | **80** |
| **Total** (taxable + tax) | **4516** | **1205** | **880** |

The `TAKE5` share is exact: 395 + 105 = 500. The store gave the one leftover cent to the T-shirt, because it had the larger remainder.

**Order**

```
Items subtotal       5000 + 1200       = 6200   ($62.00)  before discounts
Discounts            895 + 105         = 1000   ($10.00)
Tax on items         411 + 110         =  521
Shipping total       800 + 80 tax      =  880
Tax total            521 + 80          =  601
Order total          4516 + 1205 + 880 = 6601   ($66.01)
```

Check: `6200 − 1000 + 601 + 800 = 6601`.

### How it is stored

**`orders`** (one row)

| Column | Value | Note |
|---|---|---|
| `base_subtotal` | 6200 | Sum of line prices, before discount, without tax |
| `base_discount_total` | 1000 | Item discounts, plus any shipping discount |
| `base_shipping_total` | 880 | Fee − shipping discount + shipping tax |
| `base_shipping_tax_amount` | 80 | The shipping part of the tax |
| `base_tax_total` | 601 | Item tax + shipping tax |
| `base_total` | 6601 | What the customer pays |
| `is_tax_inclusive` | 0 | Mode used |
| `items_count` | 3 | Total quantity (2 + 1) |
| `currency_code`, `base_currency_code`, `exchange_rate` | USD, USD, 1 | |
| `invoiced_*` | same as `base_*` | Same currency |
| `payment_status`, `order_status`, `fulfillment_status` | unpaid, pending, unfulfilled | Start values |

**`order_items`** (two rows)

| Column | T-shirt | Mug | Meaning |
|---|---|---|---|
| `product_name`, `variant_name`, `sku` | copied | copied | Snapshot of names and codes |
| `quantity` | 2 | 1 | |
| `base_price` | 2500 | 1200 | Unit price charged, without tax |
| `base_regular_price` | 3000 | 1200 | Unit regular price, without tax. Greater than `base_price` means "bought on sale" |
| `base_catalog_sale_price` | 2500 | 1200 | Unit price exactly as the shop owner typed it |
| `base_catalog_regular_price` | 3000 | 1200 | Regular price exactly as typed |
| `base_subtotal` | 5000 | 1200 | `price × qty`, before discount, without tax |
| `base_discount_amount` | 895 | 105 | All coupons together, on this line |
| `base_tax_total` | 411 | 110 | Tax charged on this line |
| `base_total` | 4516 | 1205 | What this line costs the customer |
| `base_regular_tax_total` | 600 | 120 | Tax if the line were at regular price (6000 × 10%). For display |
| `base_catalog_product_coupon_discounted_subtotal` | 4500 | 1200 | Line value after product coupons only. Used to show a "was" price |
| `base_discount_tax_total` | 89 | 10 | Tax the discounts removed (500 − 411, 120 − 110) |

**`order_coupons`** (one row per coupon on the order)

| code | discount_type | discount_target | base_discount_amount | Also saved |
|---|---|---|---|---|
| SAVE10 | amount-off | products | 500 | A full JSON copy of the coupon rules at checkout |
| TAKE5 | amount-off | order | 500 | Same |

**`order_item_coupons`** (which coupon gave which line how much)

| Coupon | Order item | base_discount_amount |
|---|---|---|
| SAVE10 | T-shirt | 500 |
| TAKE5 | T-shirt | 395 |
| TAKE5 | Mug | 105 |

Add these up per line: T-shirt 500 + 395 = 895. Mug 105. This matches `order_items.base_discount_amount`.

**`order_taxes`** (one row per tax charged)

| type | order_item | name | rate | base_amount |
|---|---|---|---|---|
| product | T-shirt | Tax | 10.0000 | 411 |
| product | Mug | Tax | 10.0000 | 110 |
| shipping | none (whole order) | Shipping Tax | 10.0000 | 80 |

These add up to 601, the same as `orders.base_tax_total`.

### The same order in tax inclusive mode (one line only)

A mug has a catalog price of `1100` ($11.00) and the store prices **include** 10% tax. No discount.

| Value | Result | How |
|---|---|---|
| Tax | 100 | 1100 × 10 ÷ 110 |
| `base_price`, `base_subtotal` | 1000 | Price without tax |
| `base_catalog_sale_price` | 1100 | Price as typed, with tax |
| `base_total` | 1100 | Customer pays exactly the catalog price |

### The same order paid in euros

Order currency EUR, rate `0.92`. Each amount is converted on its own and rounded half up.

| Value | Base (USD) | Invoiced (EUR) |
|---|---|---|
| T-shirt line total | 4516 | 4155 (4154.72) |
| Mug line total | 1205 | 1109 (1108.6) |
| Shipping total | 880 | 810 (809.6) |
| **Sum of the parts** | | **6074** |
| **Order total** (converted on its own) | 6601 | **6073** (6072.92) |

The parts add up to 6074 but the order total is 6073. This 1-cent gap is normal. The store only requires the **base** amounts to add up exactly. For the `invoiced_` amounts it allows a small rounding gap.

---

## 6. Table reference

The Variant, Product and Coupon tables are in section 3. These are the order tables.
Money columns come in pairs (`base_` and `invoiced_`) with the same meaning, so each pair is shown in one row.

### 6.1 `orders`: one row per order

**Identity and status**

| Column | Meaning |
|---|---|
| `id`, `uuid` | Internal id and public id. |
| `order_number`, `invoice_number` | Numbers shown to people. Made from the number settings. |
| `customer_id` | The customer. Empty for a guest. If the customer is deleted this becomes empty. The contact fields below stay. |
| `is_manual` | `1` when an admin created the order. |
| `order_status` | One combined status (for example `paid_processing`, `completed`, `unpaid_cancelled`, `refund_requested`). It is the pair of payment status and fulfillment status, with refund and failed variants. |
| `payment_status` | `pending`, `unpaid`, `paid`, `failed`, `refunding`, `refunded`. |
| `fulfillment_status` | `unfulfilled`, `processing`, `shipped`, `delivered`, `on-hold`, `cancelled` and return/refund variants. |
| `is_refund_initiated` | `1` after a refund is requested. While `1`, other order actions are blocked. |

**Money: these hold the calculation result**

| Column pair | Meaning |
|---|---|
| `base_subtotal` / `invoiced_subtotal` | Sum of the line prices before discount, **without** tax. |
| `base_discount_total` / `invoiced_discount_total` | All discounts: item discounts plus the free-shipping discount. |
| `base_shipping_total` / `invoiced_shipping_total` | Shipping after shipping discount, **including** shipping tax. The original fee is not saved on its own. |
| `base_shipping_tax_amount` / `invoiced_shipping_tax_amount` | The tax part of shipping. |
| `base_tax_total` / `invoiced_tax_total` | All tax: item tax plus shipping tax. |
| `base_total` / `invoiced_total` | The amount the customer pays. |
| `base_payment_provider_fee` / `invoiced_payment_provider_fee` | The fee the payment provider kept (for example PayPal). Saved after the payment. It is **not part of the total**. It starts at 0. |
| `is_tax_inclusive` | The tax mode used in the last calculation. |
| `items_count` | Total quantity of all items. |
| `total_weight` | Exists, but the calculation does not fill it today. |

**Currency**

| Column | Meaning |
|---|---|
| `currency_code` | The currency the customer pays in. |
| `base_currency_code` | The store currency when the order was made. |
| `exchange_rate` | Rate from base to order currency, used for all `invoiced_` values. |

**Tax identity**

| Column | Meaning |
|---|---|
| `tax_id_number`, `tax_id_type`, `reverse_charge` | Customer tax ID (VAT, GST...) and the EU reverse-charge flag. Stored for the invoice. The calculation does not use them today. |

**Payment and shipping**

| Column | Meaning |
|---|---|
| `payment_provider`, `payment_transaction_id`, `payment_metadata` | Which provider, the provider's reference, and a snapshot of the provider (id, name, icon, offline or not) under `payment_provider`, and the gateway's own data under `gateway`. |
| `shipping_method`, `shipping_metadata` | The chosen method id, and a snapshot (id, name, type). |
| `shipping_carrier`, `shipping_tracking_number`, `shipping_tracking_url` | Tracking details. |

**The payment provider snapshot stays in step with `payment_provider`.** The snapshot is taken when the order is placed. When an admin marks the order as paid with a provider, the store compares it with the provider in the snapshot:

| Mark as paid with | `payment_provider` | `payment_metadata` |
|---|---|---|
| A different provider | Changed to the new provider | Replaced with the new provider's snapshot. The old `gateway` data is dropped. |
| The same provider | Same | **Not touched.** The `gateway` data stays. |
| No provider (an online gateway webhook does this) | **Not touched** | **Not touched** |
| An id that is not registered | **Rejected** (422). The order stays unpaid. | Not touched |

A disabled provider is accepted, as it is for a manual order. An order with no provider gets one, and a snapshot, the first time it is marked as paid with a provider.

**Addresses and contact (all copied as text, not linked)**

| Group | Columns |
|---|---|
| Shipping address | `shipping_first_name`, `_last_name`, `_company`, `_address_line1`, `_address_line2`, `_city`, `_state`, `_postal_code`, `_country`, `_phone`, `_email` |
| Billing address | The same fields with the `billing_` prefix, plus `is_billing_same_as_shipping` |
| Customer contact | `customer_first_name`, `customer_last_name`, `customer_email`, `customer_phone` |
| Request info | `ip_address`, `user_agent` |

The shipping address country and state decide the **tax rate** and the **shipping zone**. This is why an address change on an edit can change the price.

**Notes and dates**

| Column | Meaning |
|---|---|
| `customer_notes`, `admin_notes`, `flags`, `cancellation_reason` | Free text. |
| `paid_at`, `shipped_at`, `delivered_at`, `fulfilled_at`, `cancelled_at`, `archived_at`, `estimated_delivery_date` | When each thing happened. |
| `created_by`, `updated_by`, `created_at`, `updated_at` | Who and when. |

### 6.2 `order_items`: one row per variant on the order

An order has **one row per variant**. If the same variant is added twice it is one row with a bigger quantity.

| Column | Meaning |
|---|---|
| `order_id`, `product_id`, `variant_id` | Links. The product and variant links become empty if the product is deleted. The snapshot columns stay. |
| `product_name`, `variant_name`, `sku`, `barcode`, `product_image` | Snapshot at the time of purchase. `variant_name` is the options joined, for example "Blue, M". |
| `quantity` | How many. |
| `base_price` / `invoiced_price` | Unit price charged, without tax. |
| `base_regular_price` / `invoiced_regular_price` | Unit regular price, without tax. |
| `base_catalog_sale_price` / `invoiced_catalog_sale_price` | Unit price as the shop owner typed it (has tax in inclusive mode). |
| `base_catalog_regular_price` / `invoiced_catalog_regular_price` | Regular price as typed. |
| `base_subtotal` / `invoiced_subtotal` | Line price before discount, without tax. |
| `base_discount_amount` / `invoiced_discount_amount` | Total discount on this line. |
| `base_tax_total` / `invoiced_tax_total` | Tax on this line. |
| `base_total` / `invoiced_total` | Line total. |
| `base_regular_tax_total` / `invoiced_regular_tax_total` | Tax on the regular-price line. Display only. |
| `base_catalog_product_coupon_discounted_subtotal` / `invoiced_...` | Line value after product coupons only. Display only. |
| `base_discount_tax_total` / `invoiced_discount_tax_total` | Tax removed by discounts. Display only. |
| `is_physical_product`, `weight`, `weight_unit` | Copied from the variant. |
| `product_data` | A JSON copy of the whole product and variant at purchase time (includes things like cost of goods). |

**Per-line check**

| Tax mode | Formula |
|---|---|
| Exclusive | `base_total = base_subtotal − base_discount_amount + base_tax_total` |
| Inclusive | `base_total = catalog price × quantity − base_discount_amount`. The tax is already inside this number. `base_subtotal` has the tax taken out, so it is smaller than the catalog total. |

### 6.3 `order_taxes`: one row per tax charged

| Column | Meaning |
|---|---|
| `order_id`, `order_item_id` | The order. The item is empty for shipping tax on the whole order. With EU VAT, shipping tax is split over the items, so each row points to an item. |
| `type` | `product` or `shipping`. |
| `name` | Label shown on the invoice. "Tax", "Shipping Tax" or "VAT". |
| `rate` | The rate used, for example `10.0000`. |
| `base_amount` / `invoiced_amount` | The tax amount. |

### 6.4 `order_coupons`: one row per coupon on the order

| Column | Meaning |
|---|---|
| `order_id`, `coupon_id` | Links. A coupon can be on an order only once. If the coupon is deleted the link becomes empty and the snapshot stays. |
| `customer_id` | Copy of the order's customer. Used to count per-customer uses. |
| `code`, `title`, `discount_type`, `discount_target` | Copied from the coupon. |
| `coupon_snapshot` | JSON copy of all the coupon's rules at that moment. |
| `base_discount_amount` / `invoiced_discount_amount` | Total this coupon gave. |
| `usage_reversed_at` | Set when the order is cancelled. The coupon use is given back but the row stays. |

### 6.5 `order_item_coupons`: how a coupon was shared over the lines

| Column | Meaning |
|---|---|
| `order_item_id`, `order_coupon_id` | The line and the coupon. |
| `base_discount_amount` / `invoiced_discount_amount` | The part of the coupon's discount that went to this line. |

Per coupon, the lines add up to `order_coupons.base_discount_amount`. Per line, the coupons add up to `order_items.base_discount_amount`. A free-shipping coupon has no rows here, because it is not tied to a line.

### 6.6 `refunds`: one row per refund

| Column | Meaning |
|---|---|
| `order_id` | The order. |
| `status` | `pending`, `completed`, `failed`, `cancelled`. |
| `refund_type` | `full` (the whole refundable amount) or `partial`. |
| `invoiced_amount` | The refund amount in cents, in the **order currency**. There is no `base_` value. |
| `reason` | Free text. |
| `refund_id` | The payment provider's refund reference. |
| `created_by`, `updated_by`, dates | Who and when. |

A refund is **one amount only**. It is not linked to lines, tax or stock.

### 6.7 `order_activities`: the timeline

| Column | Meaning |
|---|---|
| `order_id` | The order. |
| `activity_type` | For example `order-placed`, `payment-completed`, `status-changed`, `comment-added`, `partially-refunded`, `refunded`. |
| `description`, `metadata` | Text and extra data for the entry. A `payment-completed` entry keeps the provider id and the provider name at the time of payment, so a renamed provider does not change old entries. |
| `created_by`, `created_at` | Who and when. |

An order **edit does not write a timeline entry today**, and it does not keep the old values. See section 9.

---

## 7. What happens when an order is edited

The edit action takes the new list of items, the coupon codes, the shipping
method and the addresses. Then it does the following in one transaction.

1. **Locks the order**, so two edits cannot run at the same time.
2. **Runs the full calculation again** (section 4) with the new input, but with **today's** values for everything the calculation reads.
3. **Updates the order items**:
   - Variant already on the order → the row is updated (quantity and money).
   - New variant → a new row, with a new snapshot.
   - Variant removed (or quantity 0) → the row is deleted.
4. **Updates stock**: reserves more or gives back stock for the quantity difference. If stock is short, the whole edit fails.
5. **Overwrites the order totals** (`subtotal`, `discount`, `shipping`, `tax`, `total`, `items_count`) and the addresses and notes.
6. **Deletes and rebuilds** all `order_coupons`, `order_item_coupons` and `order_taxes` rows from the new result. The coupon usage count goes up for a new coupon and down for a removed coupon.

### What is frozen and what is refreshed

| Thing | On edit |
|---|---|
| Product name, SKU, image, weight, `product_data` of a line **already on the order** | **Kept** (old snapshot) |
| `price` and `regular_price` of a line already on the order | **Kept** (old snapshot) |
| Line `subtotal`, `discount`, `tax`, `total`, and the `catalog_` prices | **Recalculated from today's variant price** |
| Variant price (sale or regular) | **Today's value** |
| A new line's snapshot | Taken now |
| Coupon rules | **Today's rules.** A coupon that is now expired, inactive or over its limit is dropped. Its discount disappears. |
| Coupon snapshot (`coupon_snapshot`) | Replaced with today's coupon |
| Tax rate and tax mode | **Today's settings**, and the `is_tax_inclusive` flag is updated |
| Shipping fee | **Today's shipping settings** for the chosen method |
| Exchange rate | **Today's rate.** The old rate is lost. All `invoiced_` values are converted again. |
| Currency of the order | Sent in the request. It can be changed. |
| Shipping method id | Taken from the request |
| Shipping method snapshot (`shipping_metadata`) | **Not refreshed.** It can show the old method name after the method was changed. |
| Payment status, paid date, payment provider, transaction id | **Not touched** |
| Fulfillment status, order status | **Not touched** |
| Existing refunds | **Not touched** |
| Order number, invoice number, uuid | Kept |

### An example of the problem

Our T-shirt order (section 5) was placed with the T-shirt at a sale price of `2500`.
Later the shop owner raises the sale price to `2800`. An admin edits the order and changes the quantity from 2 to 3.

| Value on the T-shirt line | Result |
|---|---|
| `base_price` | **2500** (old snapshot, kept) |
| `quantity` | 3 |
| `base_subtotal` | **8400** (3 × 2800, today's price) |
| What `price × quantity` would give | 7500 |

The line now says "3 × $25.00" but its subtotal is $84.00. The old price is not applied to the new quantity. Section 9 asks what we want here.

### Limits of the edit today

- The backend does **not** check the order status. A paid, shipped, cancelled or refunded order can be edited. There is an open note in the code about cancelled and refunded orders.
- The admin screen has an **Edit button that is not working yet**. The backend edit exists, the screen does not use it.
- An edit does not change `payment_status`. If a paid order gets more expensive, the order still says "paid" and nothing asks for the difference. If it gets cheaper, nothing refunds the difference.
- An edit does not write an activity entry and does not keep the old totals.

---

## 8. Cancel, stock and refunds

### Stock

| Event | `available_quantity` | `committed_quantity` |
|---|---|---|
| Order placed (or quantity added on edit) | goes down | goes up |
| Order cancelled (or quantity removed on edit) | goes up | goes down |
| Order is delivered **and** paid | | the held stock is confirmed and no longer "on hold" |

Stock only moves for variants with `track_inventory` on. If `allow_back_order` is on, the order is accepted even when stock is zero.

### Cancel

Cancelling does **not** change any money on the order. It:
- gives back the held stock,
- gives back each coupon use and sets `usage_reversed_at`,
- sets `cancelled_at` and `cancellation_reason`,
- changes the order status.

### Refunds today

- A refund can only be made when `payment_status` is **paid** and the fulfillment status is **delivered** or **cancelled**.
- **Refundable amount** = `order total − refunds already pending or completed − shipping total`. Shipping (with its tax) can never be refunded.
- The refund is one amount. It is not linked to lines, quantities or tax. Stock is not given back and the order totals do not change.
- If the order has a payment provider transaction, the refund is sent to the provider. A manual order has only the local record.
- Creating a refund sets `is_refund_initiated` and moves the order to `refund_requested`. After that other order actions are blocked. The rest of the refund flow (approve, decline, complete) is not built yet. There are open notes in the code.

---

## 9. Gaps and decisions for order edit

### What we found (facts)

| # | Finding |
|---|---|
| G1 | **Edit reprices the whole order at today's values.** It uses today's variant prices, coupon rules, tax settings, shipping settings and exchange rate. |
| G2 | **Mixed price data on one line.** After a price change, an edited line keeps the old `price` and `regular_price` but gets a new `subtotal` and `total` from the new price. |
| G3 | **No status protection.** Paid, shipped, cancelled and refunded orders can be edited by the backend. |
| G4 | **Payment is not adjusted.** The order stays "paid" even when the total changes. No extra charge, no automatic refund. |
| G5 | **No history.** The old totals, old items and old coupons are lost on edit. The timeline gets no entry. |
| G6 | **Tax profile is not passed on create or edit.** The cart and the admin preview pass the variant's tax profile to the tax rules. The order create and edit actions do not. This could make an order tax differ from its preview if rules depend on tax profiles. This needs to be confirmed by engineering. |
| G7 | **A coupon can silently disappear on edit.** If a coupon expired after the order was placed, an edit removes it and the customer's discount is gone. |
| G8 | **Refunds are not connected to lines or tax.** One amount, order currency only. Editing an order after a refund does not look at the refund. |
| G9 | **`charge_taxes` on the variant is not used** by the calculation. A "no tax" item is still taxed. |
| G10 | **Original shipping fee is not saved.** Only the total after discount and tax is. The free-shipping discount is mixed into `discount_total`. |
| G11 | **Rounding:** `invoiced_` amounts are converted one by one. A sum of parts can differ from the total by a cent or two. |

### Decisions we need from the business

For each question we list the options and what the current system would do.

**D1. Which orders can be edited?**
Options: only unpaid and unfulfilled · also paid but not shipped · any status.
*Today:* any status (G3). The screen does not offer edit yet.

**D2. Which prices apply when an item is edited?**
Options: (a) keep the price the customer originally paid for lines already on the order, and use today's price only for new lines · (b) use today's price for the whole order (today's behavior, G1/G2) · (c) the admin chooses per edit.
*Today:* (b) for totals, while the displayed unit price stays old (G2).

**D3. Should the discount stay the same?**
Options: keep the coupon the customer used even if it expired · check coupons again and drop invalid ones (today, G7) · the admin decides.

**D4. Should tax, shipping and exchange rate be fixed at order time?**
Options: keep the original tax rate, shipping fee and exchange rate unless the address or currency changes · recalculate everything with today's settings (today).
*Why it matters:* a customer who paid 10% VAT yesterday could see 12% today after an edit.

**D5. What can the admin change?**
Options: quantities only · add and remove items · addresses · shipping method · coupons · manual price override · custom discount · notes.
*Today:* items, coupons, shipping method, addresses, customer details and notes. There is no manual price override.

**D6. How is a changed total handled for a paid order?**
Options: not allowed · ask the customer to pay the difference (payment link) · refund the difference automatically · record the change and let the admin handle it outside the system.
*Today:* nothing happens (G4).

**D7. Do we keep a history of edits?**
Options: only a timeline note ("Order edited by Sam") · a note plus before-and-after totals · a full copy of the order for each version.
*Today:* nothing (G5). This is the choice that affects data storage most. A full history needs new tables.

**D8. Should the customer be told?**
Options: no email · email on every edit · email only when the total changes. (An "order updated" email does not exist today.)

**D9. How do refunds work with edits?**
Options: refunds only for the whole refundable amount (today) · refund by line and quantity (with stock back and tax split) · edit the order to remove the item and refund the difference.
*Why it matters:* "refund by line" needs refunds to be linked to order items and taxes. Today they are not (G8).

**D10. What do we show on the screen after an edit?**
For lines whose price changed, we can show the old price struck through, or a "price updated" label, or the original price only. This depends on D2.

### Suggested starting point (for discussion only)

If the team wants the safest first version: allow edit only on **unpaid, unfulfilled** orders (D1), **keep the original unit price** for lines already on the order (D2), keep the original exchange rate (D4), write a timeline entry with the old and new total (D7). Leave paid-order changes for a second version, and use a refund or a new payment link for them (D6). This changes the smallest number of tables.
