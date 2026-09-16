## ADDED Requirements

### Requirement: Every applied coupon's discount amount is reported in the shopper's display currency
The system SHALL report each applied coupon's discount amount both as a raw amount and as a formatted amount in the shopper's requested display currency, matching how every other cart monetary amount is reported.

#### Scenario: Cart response includes a coupon's discount in the shopper's currency
- **WHEN** a coupon is applied to a cart and the cart is requested in a display currency different from the store's base currency
- **THEN** the applied coupon's discount amount is included in that display currency, formatted the same way as the cart's other monetary amounts
