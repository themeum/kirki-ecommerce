## MODIFIED Requirements

### Requirement: Only an authenticated user may access account endpoints
The system SHALL reject any request to an account self-service endpoint (`PUT /account/profile`, `PUT /account/password-change`, `PUT /account/addresses`, `GET /account/orders`, `GET /account/orders/{id}`) from a user who is not logged in.

#### Scenario: Unauthenticated request
- **WHEN** a request to any of the five account endpoints is made without a logged-in session
- **THEN** the request is rejected as unauthorized and no data is read or changed

## ADDED Requirements

### Requirement: Customer can list their own orders
`GET /account/orders` SHALL return a paginated list of orders belonging only to the authenticated customer's own `Customer` record. Any `customer_id` value supplied in the request SHALL be ignored in favor of the requester's own customer id. Filtering (by status, fulfillment status, payment status, date range, search), sorting, and pagination SHALL behave the same as the equivalent admin order list, applied within the requester's own orders only.

#### Scenario: Successful order list
- **WHEN** an authenticated customer with existing orders requests `GET /account/orders`
- **THEN** the response contains only orders whose `customer_id` matches the requester's own `Customer` record

#### Scenario: Client attempts to list another customer's orders
- **WHEN** an authenticated customer requests `GET /account/orders` with a `customer_id` value belonging to a different customer
- **THEN** the supplied `customer_id` is ignored and the response still contains only the requester's own orders

#### Scenario: Filters apply within the requester's own orders
- **WHEN** an authenticated customer requests `GET /account/orders` with a status, fulfillment status, payment status, date range, or search filter
- **THEN** the response contains only the requester's own orders that also match the supplied filter

#### Scenario: Customer with no linked Customer record has no orders
- **WHEN** an authenticated user with no linked `Customer` record requests `GET /account/orders`
- **THEN** the response is an empty, successfully-paginated order list rather than an error

### Requirement: Customer can view their own order details
`GET /account/orders/{id}` SHALL return the full details of a single order only when that order's `customer_id` matches the authenticated customer's own `Customer` record.

#### Scenario: Successful order details fetch
- **WHEN** an authenticated customer requests `GET /account/orders/{id}` for an order belonging to their own `Customer` record
- **THEN** the response contains that order's details

#### Scenario: Order belongs to another customer
- **WHEN** an authenticated customer requests `GET /account/orders/{id}` for an order that exists but belongs to a different customer
- **THEN** the request fails with a not-found error, identical in shape to requesting an id that does not exist at all

#### Scenario: Order id does not exist
- **WHEN** an authenticated customer requests `GET /account/orders/{id}` for an id that does not correspond to any order
- **THEN** the request fails with a not-found error

#### Scenario: Customer with no linked Customer record cannot view any order
- **WHEN** an authenticated user with no linked `Customer` record requests `GET /account/orders/{id}` for any id
- **THEN** the request fails with a not-found error

### Requirement: Account order details response excludes internal-only fields
The response body for `GET /account/orders/{id}` SHALL NOT include an order's internal admin annotations (`admin_notes`) or internal flags (`flags`). It SHALL include a `payment_next_step` value describing how to complete payment, using the same rule as the checkout order-confirmation response.

#### Scenario: Internal fields are absent
- **WHEN** an authenticated customer requests `GET /account/orders/{id}` for their own order
- **THEN** the response body does not contain an `admin_notes` field or a `flags` field

#### Scenario: Payment next step is present for an unpaid order
- **WHEN** an authenticated customer requests `GET /account/orders/{id}` for their own order that is awaiting payment
- **THEN** the response includes a `payment_next_step` value describing how to complete payment
