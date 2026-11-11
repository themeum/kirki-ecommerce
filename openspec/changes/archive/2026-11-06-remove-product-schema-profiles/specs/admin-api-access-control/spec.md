## MODIFIED Requirements

### Requirement: Store management endpoints require a store administrator

Every store management endpoint - catalog (products, variants, categories, tags, brands, collections, attributes), orders and refunds, customers, coupons, currencies, tax, shipping, settings and email templates, pages, payment gateways, onboarding and app configuration - SHALL only be processed for a logged-in user who holds the WordPress `manage_options` capability. Any other caller SHALL be rejected before the request is processed, and the endpoint SHALL NOT read or change any store data for them.

#### Scenario: Administrator uses a management endpoint

- **WHEN** a logged-in user with `manage_options` requests `GET /orders`
- **THEN** the request is processed and the order list is returned

#### Scenario: Logged-in customer calls a management endpoint

- **WHEN** a logged-in user without `manage_options` (for example a store customer) requests `GET /customers`
- **THEN** the request is rejected with `403 Forbidden`
- **AND** no customer data is returned

#### Scenario: Logged-in customer tries to change store data

- **WHEN** a logged-in user without `manage_options` sends `PUT /settings`, `POST /orders/{id}/refunds`, or `POST /online-payments/install`
- **THEN** the request is rejected with `403 Forbidden`
- **AND** no setting, order, refund or installed add-on is changed

#### Scenario: Anonymous visitor calls a management endpoint

- **WHEN** a visitor who is not logged in requests `GET /orders`
- **THEN** the request is rejected with `401 Unauthorized`
- **AND** no order data is returned

#### Scenario: Logged-in customer tries to create an order through the management endpoint

- **WHEN** a logged-in user without `manage_options` sends `POST /orders`
- **THEN** the request is rejected with `403 Forbidden` and no order is created
- **AND** the same user can still place their own order through `POST /checkout`
