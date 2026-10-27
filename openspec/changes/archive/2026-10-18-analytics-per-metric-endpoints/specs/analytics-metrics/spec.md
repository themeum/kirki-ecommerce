## MODIFIED Requirements

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
`has_orders`. `data` SHALL contain only the metrics of that key. An unknown
key SHALL return a 404 response. Every money metric SHALL use the `base_`
columns of the counted orders and the base currency. The response SHALL NOT
include a `currencies` list. A `currency` parameter SHALL be ignored. Only
users with the `manage_options` capability SHALL get a response. Invalid
parameters SHALL return a 422 response with a field error.

#### Scenario: Shop manager without the capability

- **WHEN** a user without `manage_options` calls the endpoint
- **THEN** the response is 403 and contains no data

#### Scenario: Custom range in the future

- **WHEN** a custom range ends after today
- **THEN** the response is 422

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
- **THEN** `data` has `gross_sales`, `orders`, `average_order_value` and `returning_customer_rate`, each with its series

#### Scenario: Unknown key

- **WHEN** the merchant requests `GET /analytics/metrics/profit`
- **THEN** the response is 404 and contains no data

#### Scenario: Old overview endpoint

- **WHEN** a client requests `GET /analytics/overview`
- **THEN** the response is 404

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
