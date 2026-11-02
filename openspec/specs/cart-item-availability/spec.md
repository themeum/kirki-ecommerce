# cart-item-availability Specification

## Purpose

Defines how a cart line's availability — whether its product and variant are still sellable — is surfaced to the shopper and enforced at checkout, once a product is added to a cart and then later made unavailable by an admin.

## Requirements

### Requirement: Cart response reflects current item availability
When a cart is fetched, the system SHALL report, for each line item, whether that item is currently available for purchase (its product is published and its variant is visible), independent of what was true when the line was added.

#### Scenario: Item's product and variant are still available
- **WHEN** a shopper fetches their cart, and a line's product is published and its variant is visible
- **THEN** that line is reported as available

#### Scenario: Item's product was made draft or trashed after being added to the cart
- **WHEN** a shopper fetches their cart, and a line's product status is no longer published
- **THEN** that line is reported as unavailable

#### Scenario: Item's variant was made not visible after being added to the cart
- **WHEN** a shopper fetches their cart, and a line's variant is no longer visible
- **THEN** that line is reported as unavailable

### Requirement: Checkout rejects an order containing an unavailable cart line
When a shopper submits an order, the system SHALL validate every cart line's availability and reject order creation if any line is unavailable, without creating a partial order.

#### Scenario: All cart lines are available
- **WHEN** a shopper submits an order and every cart line's product is published and variant is visible
- **THEN** order creation proceeds to the existing stock and limit checks

#### Scenario: A cart line has become unavailable since it was added
- **WHEN** a shopper submits an order and at least one cart line's product is no longer published or its variant is no longer visible
- **THEN** the system rejects order creation with an unavailable-item error
- **AND** no order is created

### Requirement: Unavailable cart lines are not automatically removed
The system SHALL leave an unavailable cart line in the cart rather than removing it automatically; the line remains until the shopper (or an explicit remove action) removes it.

#### Scenario: Fetching a cart with an unavailable line does not modify the cart
- **WHEN** a shopper fetches a cart containing a line whose product or variant has become unavailable
- **THEN** the line remains in the cart with its stored quantity unchanged
