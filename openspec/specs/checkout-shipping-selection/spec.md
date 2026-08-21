# checkout-shipping-selection Specification

## Purpose

Defines how the storefront checkout page keeps the shipping method shown as selected and the cart totals it displays in sync with each other, so a shopper never sees a shipping method marked selected while the order summary reflects no shipping cost.

## Requirements

### Requirement: Displayed totals match the selected shipping method
The checkout page SHALL ensure that whenever a shipping method appears selected in the UI, the displayed cart totals (including shipping cost) reflect that same shipping method having been applied to the cart.

#### Scenario: Cart already has a saved shipping method
- **WHEN** the checkout page loads for a cart that already has a `shipping_method` saved
- **THEN** the order summary displays totals that include that shipping method's cost without requiring any further shopper action

#### Scenario: No shipping method saved yet, but methods are available
- **WHEN** the checkout page loads for a cart that has an address and available shipping methods, but no `shipping_method` saved yet
- **THEN** the system selects a default shipping method
- **AND** persists that selection to the cart
- **AND** the order summary displays totals that include the default method's shipping cost, without requiring the shopper to edit an address field or manually reselect a method first

#### Scenario: No address or no available shipping methods yet
- **WHEN** the checkout page loads for a cart with no address, or with no available shipping methods
- **THEN** no shipping method is marked as selected
- **AND** the order summary displays no shipping cost

#### Scenario: Shopper manually changes the shipping method
- **WHEN** the shopper selects a different shipping method
- **THEN** the system persists the new selection to the cart
- **AND** the order summary updates to reflect the new method's shipping cost
