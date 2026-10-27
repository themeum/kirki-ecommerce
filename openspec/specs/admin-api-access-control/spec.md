# admin-api-access-control Specification

## Purpose

Defines who may call each group of the store's REST API - store administrators, logged-in customers, or anyone - so store management data and actions are never reachable by customers or anonymous visitors.

## Requirements

### Requirement: Store management endpoints require a store administrator

Every store management endpoint - catalog (products, variants, categories, tags, brands, collections, attributes, product schemas), orders and refunds, customers, coupons, currencies, tax, shipping, settings and email templates, pages, payment gateways, onboarding and app configuration - SHALL only be processed for a logged-in user who holds the WordPress `manage_options` capability. Any other caller SHALL be rejected before the request is processed, and the endpoint SHALL NOT read or change any store data for them.

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

### Requirement: Customer self-service endpoints are available to any logged-in user

The account endpoints (`/account/*`: orders, order activities, profile, password change, addresses, wishlist, resend verification email) SHALL be processed for any logged-in user, regardless of capabilities, and SHALL be rejected for visitors who are not logged in. They SHALL only return or change data belonging to the requesting user.

#### Scenario: Customer reads their own orders

- **WHEN** a logged-in customer without `manage_options` requests `GET /account/orders`
- **THEN** the request is processed and only that customer's orders are returned

#### Scenario: Visitor calls an account endpoint

- **WHEN** a visitor who is not logged in requests `GET /account/addresses`
- **THEN** the request is rejected with `401 Unauthorized`

### Requirement: Storefront shopping endpoints remain public

The shop product listing, cart, cart coupon and checkout endpoints SHALL remain available to visitors who are not logged in, so guest shopping and guest checkout keep working.

#### Scenario: Guest adds an item to the cart

- **WHEN** a visitor who is not logged in sends `POST /cart/items`
- **THEN** the request is processed as it is today

#### Scenario: Guest lists shop products

- **WHEN** a visitor who is not logged in requests `GET /shop/products`
- **THEN** the product listing is returned

### Requirement: Development and debug endpoints are not exposed

The API SHALL NOT expose development-only or debug endpoints - in particular endpoints that return database query logs or write store settings as a side effect of a test call - to any caller.

#### Scenario: Debug endpoint is requested

- **WHEN** any caller, logged in or not, requests `GET /test-public` or `GET /test`
- **THEN** the route does not exist and no query log or store data is returned
- **AND** no store setting is changed

### Requirement: Admin checks inside endpoints agree with the route gate

A user the admin route gate admits SHALL NOT be rejected by an admin-only endpoint for lacking a specific WordPress role. Where an endpoint shared with shoppers (checkout) decides whether the caller is a store administrator - to allow ordering for another customer or flagging an order as manual - it SHALL use the same `manage_options` capability as the gate.

#### Scenario: Non-administrator role with manage_options creates a manual order

- **WHEN** a logged-in user whose role is not `administrator` but who holds `manage_options` sends `POST /orders` with `is_manual` set
- **THEN** the order is created
- **AND** it is recorded as a manual order

#### Scenario: Non-administrator role with manage_options updates an order

- **WHEN** a logged-in user whose role is not `administrator` but who holds `manage_options` sends `PUT /orders/{id}` for an existing order
- **THEN** the request is not rejected with `403 Forbidden`

#### Scenario: Shopper cannot flag a checkout order as manual

- **WHEN** a signed-in user without `manage_options` sends `POST /checkout` with `is_manual` set
- **THEN** the request is rejected with an authorization error
- **AND** no order is created

#### Scenario: Administrator role without manage_options is not treated as a store admin

- **WHEN** a user has the `administrator` role but `manage_options` has been removed from them
- **THEN** they are not treated as a store administrator by those checks
