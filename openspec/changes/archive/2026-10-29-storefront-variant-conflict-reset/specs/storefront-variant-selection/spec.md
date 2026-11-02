# Spec Delta

## Purpose

Defines how option buttons on the storefront product page behave when a choice conflicts with another selected choice.

## ADDED Requirements

### Requirement: Option buttons are never disabled by the current selection

An option button SHALL stay clickable whatever the shopper has selected in the other attributes. An option that has no purchasable variant together with the other selected options SHALL show the unavailable look.

#### Scenario: Blue is clickable while Gray-L is selected

- **GIVEN** Color (Blue, Gray), Size (S, M, L), and only Blue-L is unavailable
- **WHEN** the shopper has Gray and L selected
- **THEN** the Blue button shows the unavailable look
- **AND** the Blue button is clickable

#### Scenario: Unavailable look clears when the selection changes

- **GIVEN** the Blue button shows the unavailable look because L is selected
- **WHEN** the shopper selects M
- **THEN** the Blue button no longer shows the unavailable look

### Requirement: Add to cart is disabled for an unpurchasable selection

When the selected combination is not purchasable, or no variant matches it, the Add to cart button SHALL be disabled and SHALL read "Out of Stock".

#### Scenario: Unavailable combination selected

- **GIVEN** only Blue-L is unavailable, and Gray and L are selected
- **WHEN** the shopper clicks Blue
- **THEN** Blue and L are selected
- **AND** the Add to cart button is disabled and reads "Out of Stock"

#### Scenario: No variant matches the selection

- **GIVEN** no variant exists for Blue-L
- **WHEN** the shopper has Blue and L selected
- **THEN** the Add to cart button is disabled and reads "Out of Stock"

#### Scenario: Add to cart returns for a purchasable combination

- **GIVEN** Blue and L are selected
- **WHEN** the shopper clicks M
- **THEN** the Add to cart button is enabled for Blue-M
