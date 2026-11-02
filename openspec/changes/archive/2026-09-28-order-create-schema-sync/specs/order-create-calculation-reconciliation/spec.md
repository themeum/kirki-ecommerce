## Purpose

Defines how the admin order-create form reconciles itself against the manual-order calculation result when that result disagrees with the payload that produced it, so the merchant is never left looking at a form whose totals no longer match what will actually be charged.

## ADDED Requirements

### Requirement: A calculation-clamped item quantity is synced back to the form

When the calculation result's quantity for a line differs from the quantity currently submitted for that line (for example, the backend clamped it to available stock), the system SHALL update that line's quantity in the create form to match the calculation result.

#### Scenario: Backend clamps a line's quantity to available stock

- **WHEN** the calculation result reports a lower quantity for a line than the form currently holds for it
- **THEN** the form's quantity for that line is updated to the calculation result's quantity

### Requirement: A coupon code the calculation did not accept is removed from the form and surfaced to the merchant

When a coupon code present in the form's applied-coupons list has no corresponding entry in the calculation result's coupon list, the system SHALL remove that code from the form and SHALL surface it to the merchant as a rejected code in the discount editor, without requiring the merchant to notice its absence from the totals on their own.

#### Scenario: A previously-applied coupon is no longer valid for the current cart contents

- **WHEN** the calculation result's coupon list does not include a code that is present in the form's applied-coupons list
- **THEN** that code is removed from the form's applied-coupons list
- **AND** the discount editor displays that code as rejected

#### Scenario: Dismissing a rejected-code notice

- **WHEN** a merchant dismisses a rejected-code notice in the discount editor
- **THEN** the notice for that code is no longer shown
- **AND** the notice for that code reappears if the merchant reopens the discount editor while that code is still currently rejected

### Requirement: A calculation-defaulted shipping method is synced back to the form

When the calculation result's shipping method differs from the shipping method currently submitted, the system SHALL update the form's shipping method to match the calculation result.

#### Scenario: Submitted shipping method is unavailable for the current cart contents

- **WHEN** the calculation result reports a different shipping method than the one currently selected in the form
- **THEN** the form's selected shipping method is updated to match the calculation result

### Requirement: Reconciling the form does not trigger a redundant recalculation request

Updating the form to match the calculation result, as described in the requirements above, SHALL NOT by itself cause an additional calculation request for the same, now-matching payload.

#### Scenario: Form is updated to match an already-received calculation result

- **WHEN** the form's quantity, coupon list, or shipping method is updated to match the calculation result that was just received
- **THEN** no new calculation request is issued solely as a result of that update
