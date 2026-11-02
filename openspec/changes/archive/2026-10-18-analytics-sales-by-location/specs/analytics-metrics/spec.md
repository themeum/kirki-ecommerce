## ADDED Requirements

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

### Requirement: Regions endpoint

`GET /analytics/regions` SHALL accept a `country` parameter (an ISO 3166-1
alpha-2 code) and the same range and comparison parameters as
`GET /analytics/overview`, and SHALL return the top 5 states of that country
for Sales, Orders and Customers, as in "Location metrics", in one response.
The same access rule as `GET /analytics/overview` SHALL apply. An empty or
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
