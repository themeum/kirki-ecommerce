## MODIFIED Requirements

### Requirement: Inventory metrics

Inventory metrics SHALL read the variants as they are now and SHALL NOT use the
date range or the comparison. Each variant's status SHALL
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

### Requirement: Analytics endpoint access

`GET /analytics/overview` SHALL accept the range and the comparison, and SHALL
return every metric the Analytics page needs in one response. Every money
metric SHALL use the `base_` columns of the counted orders and the base currency.
The response SHALL include `base_currency_code` and SHALL NOT include a
`currencies` list. A `currency` parameter SHALL be ignored. Only users with the
`manage_options` capability SHALL get a response. Invalid parameters SHALL
return a 422 response with a field error.

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

- **WHEN** the endpoint returns the overview
- **THEN** the response has `base_currency_code` and has no `currencies` field

## REMOVED Requirements

### Requirement: Currency filter

**Reason**: Merchants do not need to filter Analytics by order currency. The
filter did not convert amounts, so its numbers were easy to misread.

**Migration**: Every money metric uses the base currency. Clients that sent
`currency` get base-currency values; the parameter is ignored.
