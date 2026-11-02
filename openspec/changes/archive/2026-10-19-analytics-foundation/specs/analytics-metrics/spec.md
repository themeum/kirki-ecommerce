## Purpose

Defines what every number on the Analytics page means: which orders, items,
coupons, taxes, refunds, customers and variants are counted, on which date, in
which currency, and with which formula.

## ADDED Requirements

### Requirement: Money is added up in minor units

Every money metric SHALL be added up as integer minor units (cents) from the
stored order columns. Values SHALL be converted to a decimal amount only for the
response. A ratio of money (for example Average order value) SHALL be rounded to
the nearest minor unit, half up, after the division.

#### Scenario: Large totals do not drift

- **WHEN** 3 paid orders have `base_total` 1001, 1001 and 1001
- **THEN** Total sales is 3003 minor units, shown as 30.03

### Requirement: Sales orders

A **sales order** SHALL be an order whose `payment_status` is `paid`, `refunding`
or `refunded`, and whose `base_currency_code` is the store's current base
currency. The sales date of an order SHALL be its `paid_at`. When `paid_at` is
empty, the sales date SHALL be its `created_at`. Orders with any other payment
status SHALL NOT count in any sales, product, coupon, tax or customer metric.
Orders in another base currency SHALL NOT count in any metric.

#### Scenario: Cash on delivery paid later

- **WHEN** an order is created on Oct 1 with payment status `unpaid` and is marked paid on Oct 5
- **THEN** it counts as a sale on Oct 5 and not on Oct 1

#### Scenario: Fully refunded order keeps its sale

- **WHEN** an order paid on Sep 3 is fully refunded on Sep 20, so its payment status is `refunded`
- **THEN** it still counts in Gross sales on Sep 3, and the refund counts in Returns on Sep 20

#### Scenario: Old base currency

- **WHEN** the store changed its base currency from EUR to USD and an order has `base_currency_code` EUR
- **THEN** that order is left out of every metric

### Requirement: Placed orders

A **placed order** SHALL be an order whose `payment_status` is not `failed` and
whose `base_currency_code` is the store's current base currency. The order date
SHALL be its `created_at`. Unpaid and cancelled orders SHALL count as placed
orders. An order with `payment_status = failed` SHALL NOT count as a placed
order, whatever its fulfillment status.

#### Scenario: Unpaid order counts as placed

- **WHEN** an unpaid cash on delivery order is created on Oct 1
- **THEN** it counts in Orders on Oct 1

#### Scenario: Failed order that is being shipped

- **WHEN** an order has payment status `failed` and fulfillment status `shipped`
- **THEN** it does not count in Orders, Items ordered or Orders by fulfillment status

### Requirement: Store days and weeks

Every date SHALL be converted from UTC to the site time zone before it is put on
a day. A week SHALL start on the site's `start_of_week` day. A range SHALL
include its start day and its end day.

#### Scenario: Late order in a positive offset zone

- **WHEN** the site time zone is Asia/Dhaka (UTC+6) and an order is paid at 2026-10-01 20:30 UTC
- **THEN** it is a sale on Oct 2

#### Scenario: Half-hour offset

- **WHEN** the site time zone is Asia/Kolkata (UTC+5:30) and an order is paid at 2026-10-01 18:45 UTC
- **THEN** it is a sale on Oct 2

#### Scenario: Sunday week start

- **WHEN** `start_of_week` is 0 (Sunday) and a range is grouped by week
- **THEN** each full week runs Sunday to Saturday

### Requirement: Date range presets

The date range SHALL be one of: Today, Yesterday, Last 7 days, Last 30 days
(default), Last 90 days, Last 12 months, Month to date, Year to date, or a
custom start and end day. "Today" SHALL be today in the site time zone. "Last N
days" SHALL end today and include N days. "Last 12 months" SHALL start on the day
after the same date one year ago. A custom range SHALL NOT end after today.

#### Scenario: Last 30 days

- **WHEN** today is Oct 14, 2026 and the preset is Last 30 days
- **THEN** the range is Sep 15 – Oct 14, 2026

#### Scenario: Last 12 months

- **WHEN** today is Oct 14, 2026 and the preset is Last 12 months
- **THEN** the range is Oct 15, 2025 – Oct 14, 2026

### Requirement: Comparison range

The comparison SHALL be one of: Previous period (default), Previous year, a
custom range, or No comparison. Previous period SHALL be the same number of days
that ends on the day before the range starts. Previous year SHALL be the same
dates one year earlier, with Feb 29 moved to Feb 28. The change of a metric SHALL
be `(current − comparison) ÷ comparison`, rounded to one decimal place. When the
comparison value is 0 or there is no comparison, the change SHALL be empty.

#### Scenario: Previous period

- **WHEN** the range is Sep 15 – Oct 14, 2026 and the comparison is Previous period
- **THEN** the comparison range is Aug 16 – Sep 14, 2026

#### Scenario: Leap day

- **WHEN** the range is Feb 29, 2028 and the comparison is Previous year
- **THEN** the comparison range is Feb 28, 2027

#### Scenario: Comparison value is zero

- **WHEN** Gross sales is 500.00 now and 0 in the comparison range
- **THEN** the change is empty, not a percentage

### Requirement: Chart granularity

Chart points SHALL be days when the range has 31 days or fewer, weeks when it
has 32 to 186 days, and months when it has more than 186 days. The first and
last week or month MAY be partial. The comparison series SHALL use the same
granularity and SHALL be matched to the current series by position.

#### Scenario: 90-day range

- **WHEN** the range is Last 90 days
- **THEN** each chart point is one week

#### Scenario: Partial first week

- **WHEN** weeks start on Monday and a weekly range starts on a Wednesday
- **THEN** the first point covers Wednesday to Sunday

### Requirement: Currency filter

By default every money metric SHALL use the `base_` columns of all counted
orders. When the currency filter is set to a currency code, only orders with that
`currency_code` SHALL count, and every money metric SHALL use the `invoiced_`
columns and the refunds' `invoiced_amount`. The filter SHALL NOT convert amounts
between currencies.

#### Scenario: EUR filter

- **WHEN** the currency filter is EUR
- **THEN** only orders placed in EUR count, and amounts are their EUR invoiced amounts

### Requirement: Customer identity

A customer SHALL be identified, in this order, by `orders.customer_id`; else by
the id of the customer whose email equals the order's `customer_email`
(case-insensitive, trimmed); else by the order's `customer_email`, lower-cased and
trimmed. A customer's **first paid order** SHALL be their sales order with the
earliest sales date (ties broken by order id), over all time.

#### Scenario: Guest and registered with the same email

- **WHEN** a registered customer with email lena@example.com has a paid order, and a guest order with LENA@example.com is paid later
- **THEN** both orders belong to one customer

#### Scenario: Deleted customer

- **WHEN** a customer is deleted and their orders lose `customer_id`
- **THEN** their orders are still one customer, keyed by email, and keep their new or returning status

### Requirement: Sales metrics

Over the sales orders in the range (by sales date), the system SHALL calculate:

| Metric | Formula |
|---|---|
| Paid orders | number of sales orders |
| Gross sales | Σ `order_items.base_subtotal` |
| Discounts | Gross sales − Σ (`order_items.base_total` − `order_items.base_tax_total`) |
| Returns | Σ completed refunds in the range by refund completion date (see "Returns") |
| Net sales | Gross sales − Discounts − Returns |
| Shipping charges | Σ (`orders.base_shipping_total` − `orders.base_shipping_tax_amount`) |
| Taxes | Σ `orders.base_tax_total` |
| Total sales | Net sales + Shipping charges + Taxes |
| Average order value | (Gross sales − Discounts) ÷ Paid orders |
| Items sold | Σ `orders.items_count` |
| Customers | number of different customers |

Discounts SHALL NOT include the free-shipping discount, because Shipping charges
are already reduced by it. When a range has no Returns, Total sales SHALL equal
Σ `orders.base_total`.

#### Scenario: Tax-exclusive worked example

- **WHEN** the only sales order has items with `base_subtotal` 5000 and 1200, `base_total` 4516 and 1205, `base_tax_total` 411 and 110, `base_shipping_total` 880, `base_shipping_tax_amount` 80, `base_tax_total` 601 and `base_total` 6601
- **THEN** Gross sales is 6200, Discounts is 1000, Net sales is 5200, Shipping charges is 800, Taxes is 601, Total sales is 6601 and Average order value is 5200

#### Scenario: Tax-inclusive worked example

- **WHEN** the only sales order has one item with `base_subtotal` 1000, `base_discount_amount` 110, `base_tax_total` 90 and `base_total` 990, and no shipping
- **THEN** Gross sales is 1000, Discounts is 100, Net sales is 900, Taxes is 90 and Total sales is 990

#### Scenario: Free shipping

- **WHEN** a sales order uses a free-shipping coupon that removed an 800 shipping fee
- **THEN** Shipping charges for that order is 0 and Discounts does not include the 800

#### Scenario: No sales

- **WHEN** the range has no sales orders
- **THEN** Average order value is empty, not zero

### Requirement: Returns

A **completed refund** SHALL be a refund with status `completed` on a sales
order. Its return date SHALL be the refund's `updated_at`, converted to the
site time zone. Its base amount SHALL be `invoiced_amount × orders.base_total ÷
orders.invoiced_total`, rounded half up; a refund on an order with
`invoiced_total = 0` SHALL have a base amount of 0. Returns SHALL be one amount
per refund. They SHALL NOT be split into product, shipping and tax, and SHALL NOT
change Taxes or Shipping charges.

#### Scenario: Partial refund

- **WHEN** an order paid on Sep 3 has `base_total` 10000 and `invoiced_total` 9000, and a refund of 1800 (invoiced) completes on Sep 20
- **THEN** Returns on Sep 20 is 2000, and Gross sales on Sep 3 does not change

#### Scenario: Refund edited after completion

- **WHEN** a refund completed on Sep 20 is edited on Sep 25 and stays `completed`
- **THEN** its Returns amount moves to Sep 25

#### Scenario: Pending refund

- **WHEN** a refund has status `pending` or `cancelled`
- **THEN** it does not count in Returns

### Requirement: Product sales metrics

Over the items of sales orders in the range, grouped by product or by category,
the system SHALL calculate Net items sold (Σ `quantity`), Gross sales (Σ
`base_subtotal`), Net sales (Σ (`base_total` − `base_tax_total`)) and Discounts
(Gross − Net). Product Net sales SHALL NOT subtract Returns. Items whose product
no longer exists (an empty `product_id`, or a `product_id` with no product) SHALL
be grouped by their saved `product_name`, marked as deleted, and returned with an
empty product id. A product SHALL count once in each category it is in now. A product in
no category SHALL count under "Uncategorized".

#### Scenario: Product in two categories

- **WHEN** a product with Net sales 3000 is in the categories Hoodies and Sale
- **THEN** both Hoodies and Sale show 3000

#### Scenario: Deleted product

- **WHEN** an item's product was deleted and its `product_id` is empty
- **THEN** the item is grouped under its saved `product_name`, marked as deleted

#### Scenario: Product deleted after the sale

- **WHEN** a product sold on Oct 1 is deleted on Oct 5
- **THEN** on Oct 6 its sales show under its saved name, marked as deleted, with an empty product id

### Requirement: Coupon metrics

Over the `order_coupons` rows of sales orders in the range, grouped by `code`,
the system SHALL calculate Orders using code (number of rows) and Discount given
(Σ `base_discount_amount`). Free-shipping coupons SHALL be included.

#### Scenario: Free-shipping code

- **WHEN** 4 sales orders used FREESHIP50, each removing an 800 shipping fee
- **THEN** FREESHIP50 shows 4 orders and 3200 discount given

### Requirement: Payment method and shipping method metrics

Over the sales orders in the range, grouped by `payment_provider`, the system
SHALL calculate Total sales and Orders. Grouped by `shipping_method`, it SHALL
calculate Shipping charges and Orders. The name SHALL be the current name of the
provider or method, else the name saved in `payment_metadata` or
`shipping_metadata`, else the stored id.

#### Scenario: Uninstalled gateway

- **WHEN** a sales order's payment provider is no longer installed
- **THEN** the method shows the name saved in that order's payment metadata

### Requirement: Tax metrics

Over the `order_taxes` rows of sales orders in the range, grouped by the order's
shipping country and shipping state, the system SHALL calculate Product tax (Σ
`base_amount` where `type = product`), Shipping tax (Σ `base_amount` where
`type = shipping`) and Total tax (Σ `base_amount`).

#### Scenario: Tax by shipping region

- **WHEN** an order is billed to Canada but shipped to Texas, US
- **THEN** its tax counts under "Texas, United States"

### Requirement: Placed order metrics

Over the placed orders in the range (by order date), the system SHALL calculate
Orders (number of placed orders), Items ordered (Σ `items_count`) and the number
of orders in each **current** `fulfillment_status`: unfulfilled, processing,
on-hold, shipped, delivered, returned, cancelled.

#### Scenario: Returned order

- **WHEN** a placed order was fully refunded and its fulfillment status is `returned`
- **THEN** it counts under Returned in Orders by fulfillment status

### Requirement: Customer metrics

Over the sales orders in a period (the range, or one chart point), the system
SHALL count:

- **Customers**: different customers with a sales order in the period.
- **New customers**: customers whose first paid order is in the period.
- **Returning customers**: customers with a sales order in the period that is not
  their first paid order.
- **Returning customer rate**: Returning customers ÷ Customers.

A customer who has their first paid order and another sales order in the same
period SHALL count as both new and returning. Customers SHALL count each
customer once.

#### Scenario: Returning only

- **WHEN** Lena's first paid order is on Sep 3 and her second is on Sep 20, and the range is Sep 15 – Oct 14
- **THEN** Lena is a returning customer and not a new customer

#### Scenario: New and returning

- **WHEN** the same orders and the range is September
- **THEN** Lena counts as new and as returning, and Customers counts her once

### Requirement: Inventory metrics

Inventory metrics SHALL read the variants as they are now and SHALL NOT use the
date range, the comparison or the currency filter. Each variant's status SHALL
be: when inventory is not tracked, in stock if `in_stock` is set, else out of
stock; when tracked, out of stock if `available_quantity ≤ 0`, low stock if
`available_quantity` ≤ its `low_stock_threshold` (the store default threshold
when the variant has none), else in stock. The product stock shown next to a
product SHALL be Σ `max(available_quantity, 0)` of its tracked variants.

#### Scenario: Variant without its own threshold

- **WHEN** the store default threshold is 5 and a tracked variant with no threshold has 4 available
- **THEN** the variant is low stock

#### Scenario: Backorder variant

- **WHEN** a tracked variant allows backorders and has −2 available
- **THEN** the variant is out of stock

### Requirement: Data freshness

Every analytics response SHALL be calculated from the order, order item,
coupon, tax, refund, customer, product and variant data as it is when the
request runs. A response SHALL reflect every change saved before the request
started, including changes made by database foreign keys (a deleted customer or
product), and SHALL use the site time zone and week start in effect at that
moment. The endpoint SHALL NOT need a preparation step, a background job or a
second request to return metrics.

#### Scenario: First visit

- **WHEN** a store with existing orders opens Analytics for the first time
- **THEN** the first response returns the metrics

#### Scenario: Order marked paid

- **WHEN** an admin marks an order as paid and then opens Analytics
- **THEN** the order is in the sales metrics for today

#### Scenario: Order edited after payment

- **WHEN** an admin edits a paid order and its `base_total` changes
- **THEN** the next response uses the new amounts on the order's original sales date

#### Scenario: Time zone changed

- **WHEN** the site time zone changes from UTC to Asia/Dhaka
- **THEN** the next response puts every order on its Asia/Dhaka day

#### Scenario: Guest registers later

- **WHEN** a guest paid with lena@example.com on Sep 3, and a customer with that email is created on Sep 10
- **THEN** the next response counts the Sep 3 order and the customer's later orders as one customer

### Requirement: Analytics endpoint access

`GET /analytics/overview` SHALL accept the range, the comparison and the
currency, and SHALL return every metric the Analytics page needs in one response.
Only users with the `manage_options` capability SHALL get a response. Invalid
parameters SHALL return a 422 response with a field error.

#### Scenario: Shop manager without the capability

- **WHEN** a user without `manage_options` calls the endpoint
- **THEN** the response is 403 and contains no data

#### Scenario: Custom range in the future

- **WHEN** a custom range ends after today
- **THEN** the response is 422

#### Scenario: Unknown currency

- **WHEN** the currency parameter is `ZZZ`, or is not 3 letters
- **THEN** the response is 422 with an error on `currency`

#### Scenario: Known currency without orders

- **WHEN** the currency parameter is `JPY`, a valid ISO 4217 code, and no order was placed in JPY
- **THEN** the response is 200 and every money metric is 0 in JPY
