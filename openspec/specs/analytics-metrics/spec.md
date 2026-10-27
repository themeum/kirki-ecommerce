# analytics-metrics Specification

## Purpose

Defines what every number on the Analytics page means: which orders, items,
coupons, taxes, refunds, customers and variants are counted, on which date, in
which currency, and with which formula.

## Requirements

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

Every date SHALL be converted from UTC to the request time zone before it is put
on a day. The request time zone SHALL be the time zone in the `X-Kecom-Timezone`
header, which the admin app sends with every API request from the browser time
zone. When the header is missing or is not a valid time zone, the request time
zone SHALL be the site time zone. A week SHALL start on the site's `start_of_week` day. A range SHALL
include its start day and its end day.

#### Scenario: Late order in a positive offset zone

- **WHEN** the request time zone is Asia/Dhaka (UTC+6) and an order is paid at 2026-10-01 20:30 UTC
- **THEN** it is a sale on Oct 2

#### Scenario: Half-hour offset

- **WHEN** the request time zone is Asia/Kolkata (UTC+5:30) and an order is paid at 2026-10-01 18:45 UTC
- **THEN** it is a sale on Oct 2

#### Scenario: Browser time zone header

- **WHEN** the site time zone is UTC, the request has `X-Kecom-Timezone: Asia/Dhaka`, and an order is paid at 2026-10-01 20:30 UTC
- **THEN** it is a sale on Oct 2

#### Scenario: Invalid time zone header

- **WHEN** the site time zone is Asia/Dhaka and the request has `X-Kecom-Timezone: Mars/Base`
- **THEN** the site time zone Asia/Dhaka is used

#### Scenario: Sunday week start

- **WHEN** `start_of_week` is 0 (Sunday) and a range is grouped by week
- **THEN** each full week runs Sunday to Saturday

### Requirement: Date range presets

The date range SHALL be one of: Today, Yesterday, Last 7 days, Last 30 days
(default), Last 90 days, Last 12 months, Month to date, Year to date, or a
custom start and end day. "Today" SHALL be today in the request time zone. "Last N
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

Chart points SHALL be grouped by the number of days in the range:

| Days in the range | One chart point |
|---|---|
| 1 to 31 | one day |
| 32 to 186 | one week |
| more than 186 | one month |

Weeks SHALL start on the site's start-of-week day, and months on day 1. The
first and last point MAY be partial, and each point SHALL cover only days inside
the range. The response SHALL give the granularity (day, week or month). Every
point SHALL be one day, one week or one month; the chart SHALL NOT group 2 or
more days or months into one point.

The comparison series SHALL use the same granularity and SHALL be matched to the
current series by position.

Each point SHALL have a label with the first day of the point ("Oct 8" for days
and weeks; "Oct 2026" for months) and a span label with the first and last day
of the point ("Oct 5 – Oct 11, 2026"). A one-day point SHALL have a span label
with the day and year ("Oct 8, 2026"). Comparison points SHALL have the same two
labels.

#### Scenario: 7-day range

- **WHEN** the range is Last 7 days
- **THEN** the chart has 7 points, one for each day

#### Scenario: 30-day range

- **WHEN** the range is Sep 19 to Oct 18, 2026
- **THEN** the chart has 30 points, one for each day, the first with the label "Sep 19" and the span label "Sep 19, 2026"

#### Scenario: 31-day range

- **WHEN** a custom range is Oct 1 to Oct 31, 2026
- **THEN** the chart has 31 points, one for each day

#### Scenario: 32-day range

- **WHEN** a custom range has 32 days
- **THEN** each chart point is one week

#### Scenario: 90-day range

- **WHEN** the range is Jul 21 to Oct 18, 2026 and weeks start on Monday
- **THEN** the chart has 13 points of one week, the first covering Jul 21 to Jul 26, 2026

#### Scenario: Partial first week

- **WHEN** weeks start on Monday and a weekly range starts on a Wednesday
- **THEN** the first point covers Wednesday to Sunday

#### Scenario: 12-month range

- **WHEN** the range is Last 12 months
- **THEN** each chart point is one month, with the label "Oct 2026" for October 2026

#### Scenario: Two-year range

- **WHEN** a custom range is Jan 1, 2025 to Dec 31, 2026
- **THEN** the chart has 24 points, one for each month, the first covering Jan 1 to Jan 31, 2025

#### Scenario: Comparison points

- **WHEN** the range is Sep 19 to Oct 18, 2026 and the comparison is Previous year
- **THEN** the comparison has 30 daily points, the first for Sep 19, 2025

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
request time zone. Its base amount SHALL be `invoiced_amount × orders.base_total ÷
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
no category SHALL count under "Uncategorized". Each product row and each category
row SHALL have the change of its Net sales.

#### Scenario: Product in two categories

- **WHEN** a product with Net sales 3000 is in the categories Hoodies and Sale
- **THEN** both Hoodies and Sale show 3000

#### Scenario: Category growth

- **WHEN** the category Hoodies has Net sales 3000, and 2000 in the comparison range
- **THEN** its row has the change 50.0

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

For each payment method in the list, the system SHALL also calculate its Total
sales in the comparison range and the change in Total sales. When there is no
comparison, the previous Total sales and the change SHALL be empty. When the
method had no sales orders in the comparison range, the previous Total sales
SHALL be 0 and the change SHALL be empty.

For each shipping method in the list, the system SHALL also calculate its
Shipping charges in the comparison range and the change in Shipping charges.
When there is no comparison, the previous Shipping charges and the change SHALL
be empty. When the method had no sales orders in the comparison range, the
previous Shipping charges SHALL be 0 and the change SHALL be empty.

#### Scenario: Uninstalled gateway

- **WHEN** a sales order's payment provider is no longer installed
- **THEN** the method shows the name saved in that order's payment metadata

#### Scenario: Payment method change

- **WHEN** Stripe has Total sales 13600 in the range and 10000 in the comparison range
- **THEN** the Stripe row has previous Total sales 10000 and a change of 36.0

#### Scenario: Payment method new in the range

- **WHEN** Klarna has Total sales 2000 in the range and no sales orders in the comparison range
- **THEN** the Klarna row has previous Total sales 0 and no change

#### Scenario: Shipping method change

- **WHEN** Standard has Shipping charges 1200 in the range and 1000 in the comparison range
- **THEN** the Standard row has previous Shipping charges 1000 and a change of 20.0

#### Scenario: Shipping method new in the range

- **WHEN** Express has Shipping charges 500 in the range and no sales orders in the comparison range
- **THEN** the Express row has previous Shipping charges 0 and no change

### Requirement: Tax metrics

Over the `order_taxes` rows of sales orders in the range, grouped by the order's
shipping country and shipping state, the system SHALL calculate Product tax (Σ
`base_amount` where `type = product`), Shipping tax (Σ `base_amount` where
`type = shipping`) and Total tax (Σ `base_amount`).

For each region in the list, the system SHALL also calculate its Total tax in
the comparison range and the change in Total tax. When there is no comparison,
the previous Total tax and the change SHALL be empty. When the region had no tax
in the comparison range, the previous Total tax SHALL be 0 and the change SHALL
be empty.

#### Scenario: Tax by shipping region

- **WHEN** an order is billed to Canada but shipped to Texas, US
- **THEN** its tax counts under "Texas, United States"

#### Scenario: Tax region change

- **WHEN** Texas, US has Total tax 750 in the range and 600 in the comparison range
- **THEN** the Texas row has previous Total tax 600 and a change of 25.0

#### Scenario: Tax region new in the range

- **WHEN** Ontario, CA has Total tax 300 in the range and no tax in the comparison range
- **THEN** the Ontario row has previous Total tax 0 and no change

### Requirement: Placed order metrics

Over the placed orders in the range (by order date), the system SHALL calculate
Orders (number of placed orders), Items ordered (Σ `items_count`) and the number
of orders in each **current** `fulfillment_status`: unfulfilled, processing,
on-hold, shipped, delivered, returned, cancelled.

#### Scenario: Returned order

- **WHEN** a placed order was fully refunded and its fulfillment status is `returned`
- **THEN** it counts under Returned in Orders by fulfillment status

### Requirement: Orders by time of day

For a range, the system SHALL count the placed orders for each weekday
(Monday to Sunday) and each hour (0 to 23), in the request time zone, of their order
date. The counts SHALL use the same placed orders as Orders, so the sum of all
the counts SHALL be equal to Orders for the same range. When a comparison
range is selected, the system SHALL also give the same counts for the
comparison range.

#### Scenario: Order late in the evening in a positive offset zone

- **WHEN** the request time zone is Asia/Dhaka (UTC+6) and an order is created at 2026-10-01 20:30 UTC, a Thursday in UTC
- **THEN** it counts under Friday at hour 2

#### Scenario: Half-hour offset

- **WHEN** the request time zone is Asia/Kolkata (UTC+5:30) and an order is created at 2026-10-05 12:45 UTC, a Monday
- **THEN** it counts under Monday at hour 18

#### Scenario: Failed order

- **WHEN** an order with payment status `failed` is created in the range
- **THEN** it does not count in any weekday or hour

#### Scenario: Comparison counts

- **WHEN** the comparison is Previous period, and one order is created in the comparison period on a Wednesday at 9:10 store time
- **THEN** the comparison count for Wednesday at hour 9 is 1

### Requirement: Location metrics

The **location** of an order SHALL be its shipping country and shipping
state. When the shipping country is empty, the location SHALL be the billing
country and billing state. An order with no country on both addresses SHALL
NOT count in any location metric.

For a range, grouped by the location country, the system SHALL calculate:

| Metric | Formula |
|---|---|
| Sales | Net sales of the items of the sales orders in the range, as in "Product sales metrics" (Returns are not subtracted) |
| Orders | number of placed orders in the range |
| Customers | number of different customers with a sales order in the range |

Each country SHALL have the change of each metric against the comparison
range. A country with no value in all three metrics SHALL NOT be in the
result. Each country SHALL have its ISO 3166-1 alpha-2 code, its ISO numeric
code and its name.

For one country, the system SHALL calculate the same three metrics grouped by
the location state, and SHALL return the top 5 states for each metric, by
that metric, with the change. The state name SHALL be the same name as in
"Tax metrics". Orders of that country with an empty state SHALL group into one
"Unknown region" row.

#### Scenario: Shipping address wins

- **WHEN** a sales order is billed to Canada and shipped to Texas, US
- **THEN** it counts under United States, and under Texas in the regions of United States

#### Scenario: No shipping address

- **WHEN** a sales order for a digital product has no shipping country and is billed to Ontario, Canada
- **THEN** it counts under Canada, and under Ontario in the regions of Canada

#### Scenario: No country at all

- **WHEN** a placed order has no shipping country and no billing country
- **THEN** it does not count under any country, and Orders over time still counts it

#### Scenario: Placed but not paid

- **WHEN** an unpaid cash on delivery order is created in the range and shipped to Germany
- **THEN** Germany has 1 order, 0 sales and 0 customers

#### Scenario: One customer, two orders

- **WHEN** one customer has 2 sales orders shipped to Australia in the range
- **THEN** Australia has 2 orders and 1 customer

#### Scenario: Empty state

- **WHEN** 3 sales orders shipped to the United States have no shipping state
- **THEN** the regions of United States have an "Unknown region" row with 3 orders

#### Scenario: Country change

- **WHEN** Germany has Net sales 5672.15 in the range and 2686.00 in the comparison range
- **THEN** Germany's Sales change is 111.2

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
date range or the comparison. Each variant's status SHALL
be: when inventory is not tracked, in stock if `in_stock` is set, else out of
stock; when tracked, out of stock if `available_quantity ≤ 0`, low stock if
`available_quantity` ≤ its `low_stock_threshold` (the store default threshold
when the variant has none), else in stock. The product stock shown next to a
product SHALL be Σ `max(available_quantity, 0)` of its tracked variants. The
Inventory health list SHALL contain up to 4 tracked variants with status out of
stock or low stock, lowest `available_quantity` first, and SHALL NOT contain an
in-stock variant.

#### Scenario: Variant without its own threshold

- **WHEN** the store default threshold is 5 and a tracked variant with no threshold has 4 available
- **THEN** the variant is low stock

#### Scenario: Backorder variant

- **WHEN** a tracked variant allows backorders and has −2 available
- **THEN** the variant is out of stock

#### Scenario: In-stock variant with low quantity

- **WHEN** a tracked variant has 1 available and a low-stock threshold of 0
- **THEN** the variant is in stock and the Inventory health list does not contain it

### Requirement: Data freshness

Every analytics response SHALL be calculated from the order, order item,
coupon, tax, refund, customer, product and variant data as it is when the
request runs. A response SHALL reflect every change saved before the request
started, including changes made by database foreign keys (a deleted customer or
product), and SHALL use the request time zone and week start in effect at that
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

- **WHEN** the request time zone changes from UTC to Asia/Dhaka, because the browser time zone or, with no header, the site time zone changes
- **THEN** the next response puts every order on its Asia/Dhaka day

#### Scenario: Guest registers later

- **WHEN** a guest paid with lena@example.com on Sep 3, and a customer with that email is created on Sep 10
- **THEN** the next response counts the Sep 3 order and the customer's later orders as one customer

### Requirement: Analytics endpoint access

`GET /analytics/metrics/{key}` SHALL accept the range and the comparison, and
SHALL return the data of one metric key. The keys SHALL be `kpis`,
`total_sales_over_time`, `total_sales_breakdown`, `sales_by_product`,
`sales_by_category`, `average_order_value_over_time`, `orders_over_time`,
`orders_by_fulfillment_status`, `new_vs_returning_customers`,
`sales_by_coupon_code`, `orders_by_time_of_day`, `sales_by_location`,
`sales_by_payment_method`, `taxes_by_region`, `shipping_charges_by_method` and
`inventory_health`. The response SHALL have `meta` and `data`. `meta` SHALL
contain `range`, `compare`, `granularity`, `base_currency_code` and
`has_orders`. `data` SHALL contain only the metrics of that key. The `kpis` key SHALL
contain the key metrics Gross sales, Orders, Average order value, Returning
customer rate, Net sales, Total sales, Items ordered, Discounts, New customers,
Customers and Shipping charges, as in "Sales metrics", "Placed order metrics"
and "Customer metrics". Each key metric SHALL have its value, its comparison
value, its change and a series at the chart granularity. Money key metrics
SHALL have a money object. An unknown
key SHALL return a 404 response. Every money metric SHALL use the `base_`
columns of the counted orders and the base currency. The response SHALL NOT
include a `currencies` list. A `currency` parameter SHALL be ignored. Only
users with the `manage_options` capability SHALL get a response. Invalid
parameters SHALL return a 422 response with a field error. Each custom date
(`from`, `to`, `compare_from`, `compare_to`) SHALL be a real calendar day in the
`Y-m-d` format.

#### Scenario: Shop manager without the capability

- **WHEN** a user without `manage_options` calls the endpoint
- **THEN** the response is 403 and contains no data

#### Scenario: Custom range in the future

- **WHEN** a custom range ends after today
- **THEN** the response is 422

#### Scenario: Custom date that does not exist

- **WHEN** a custom range has `from=2026-02-30`, or a date that is not in the `Y-m-d` format
- **THEN** the response is 422 with an error on that date field

#### Scenario: Currency parameter is ignored

- **WHEN** the store base currency is USD, there are orders placed in USD and in EUR, and the request has `currency=EUR`
- **THEN** the response is 200 and every money metric is the same as without the parameter, in USD, counting both orders

#### Scenario: No currencies list

- **WHEN** the endpoint returns a metric
- **THEN** `meta` has `base_currency_code` and the response has no `currencies` field

#### Scenario: One key only

- **WHEN** the merchant requests `GET /analytics/metrics/sales_by_coupon_code` for Last 30 days
- **THEN** `data` has the coupon items, and the response has no other card and no key metrics

#### Scenario: Key metrics key

- **WHEN** the merchant requests `GET /analytics/metrics/kpis`
- **THEN** `data` has `gross_sales`, `orders`, `average_order_value`, `returning_customer_rate`, `net_sales`, `total_sales`, `items_ordered`, `discounts`, `new_customers`, `customers` and `shipping_charges`, each with its change and its series

#### Scenario: Unknown key

- **WHEN** the merchant requests `GET /analytics/metrics/profit`
- **THEN** the response is 404 and contains no data

#### Scenario: Old overview endpoint

- **WHEN** a client requests `GET /analytics/overview`
- **THEN** the response is 404

#### Scenario: Items ordered series

- **WHEN** the range has 2 placed orders with 3 and 2 items on Sep 3 and 1 placed order with 4 items on Sep 4, at day granularity
- **THEN** `items_ordered` is 9, and its series has 5 on Sep 3 and 4 on Sep 4

### Requirement: Regions endpoint

`GET /analytics/regions` SHALL accept a `country` parameter (an ISO 3166-1
alpha-2 code) and the same range and comparison parameters as
`GET /analytics/metrics/{key}`, and SHALL return the top 5 states of that country
for Sales, Orders and Customers, as in "Location metrics", in one response.
The same access rule as `GET /analytics/metrics/{key}` SHALL apply. An empty or
unknown country, or invalid range parameters, SHALL return a 422 response with
a field error. A known country with no orders SHALL return three empty lists.

#### Scenario: Three lists in one response

- **WHEN** the merchant requests the regions of US for Last 30 days
- **THEN** the response has the top 5 states by Sales, by Orders and by Customers, each with its change

#### Scenario: Unknown country

- **WHEN** the request has `country=ZZ`
- **THEN** the response is 422 with an error on `country`

#### Scenario: Shop manager without the capability

- **WHEN** a user without `manage_options` calls the endpoint
- **THEN** the response is 403 and contains no data

### Requirement: Short money display

Every money object in an Analytics metric response SHALL have a
`short_display` string next to `display`. `short_display` SHALL use the store's
currency symbol, symbol position, decimal separator and thousand separator, as
`display` does. When the absolute amount is less than 1,000, `short_display`
SHALL be the same as `display`. From 1,000, `short_display` SHALL divide the
amount by the largest unit that is not more than the absolute amount (1,000 is
`K`, 1,000,000 is `M`, 1,000,000,000 is `B`, 1,000,000,000,000 is `T`), round
it to one decimal, remove a decimal that is 0, and add the unit letter. When the
rounding gives 1,000 of a unit and a larger unit exists, it SHALL use the larger
unit. The unit letters SHALL be the same in every language. A negative amount
SHALL keep its sign in the same place as in `display`. Money objects of other
APIs SHALL NOT change, except the dashboard overview metrics and top products
(see the merchant home dashboard "Overview endpoint" requirement).

#### Scenario: Thousands

- **WHEN** a money amount is 20,345.00 USD and the symbol is before the amount
- **THEN** `display` is `$20,345.00` and `short_display` is `$20.3K`

#### Scenario: Decimal that is 0

- **WHEN** a money amount is 20,000.00 USD
- **THEN** `short_display` is `$20K`

#### Scenario: Less than 1,000

- **WHEN** a money amount is 850.00 USD
- **THEN** `short_display` is `$850.00`

#### Scenario: Rounding moves to the next unit

- **WHEN** a money amount is 999,950.00 USD
- **THEN** `short_display` is `$1M`

#### Scenario: Larger units

- **WHEN** the money amounts are 1,234,567.00, 3,000,000,000.00 and 1,000,000,000,000.00 USD
- **THEN** their `short_display` values are `$1.2M`, `$3B` and `$1T`

#### Scenario: Store separators and position

- **WHEN** the store uses `,` as the decimal separator, puts the symbol after the amount, and an amount is 20,345.00 EUR
- **THEN** `short_display` is `20,3K€`

#### Scenario: Other APIs

- **WHEN** another API, such as the order list, returns a money object
- **THEN** that money object has no `short_display`

### Requirement: Amount example in meta

The `meta` of every Analytics metric response SHALL contain `amount_example`, a
money object of 20,345 in the base currency, with `display` and
`short_display`.

#### Scenario: Example in USD

- **WHEN** the base currency is USD and the client calls any metric key
- **THEN** `meta.amount_example.display` is `$20,345.00` and `meta.amount_example.short_display` is `$20.3K`
