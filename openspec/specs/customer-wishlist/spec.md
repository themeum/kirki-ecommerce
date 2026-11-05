# customer-wishlist Specification

## Purpose

Defines the customer wishlist: a logged-in customer saves products to come back to later. An entry belongs to a product and can remember one chosen variant, so the entry stays valid when that variant is deleted.

## Requirements

### Requirement: One wishlist entry per product
The system SHALL keep at most one wishlist entry for each customer and product, whatever the variants of that product.

#### Scenario: Save a product twice
- **WHEN** a customer saves a product that is already on their wishlist
- **THEN** the system keeps one entry and returns the existing one

#### Scenario: Save two variants of one product
- **WHEN** a customer saves variant A of a product, then variant B of the same product
- **THEN** the wishlist has one entry for that product, and it remembers variant B

### Requirement: Add a product to the wishlist
The system SHALL accept a product ID and an optional variant ID when a customer adds to the wishlist. The product MUST be published. A given variant MUST belong to that product.

#### Scenario: Add from the shop listing
- **WHEN** a customer adds a product and sends no variant
- **THEN** the system creates an entry with the product and no variant, and answers 201

#### Scenario: Add from the product page
- **WHEN** a customer adds a product and sends the selected variant of that product
- **THEN** the system creates an entry with the product and that variant

#### Scenario: Re-add with a chosen variant
- **WHEN** a customer adds a product that is already saved, and sends a variant of that product
- **THEN** the system keeps the one entry and sets its variant to the sent variant

#### Scenario: Re-add without a variant
- **WHEN** a customer adds a product that is already saved with a variant, and sends no variant
- **THEN** the system keeps the entry unchanged, with its variant

#### Scenario: Unknown or unpublished product
- **WHEN** a customer adds a product that does not exist or is not published
- **THEN** the system answers 404 and creates no entry

#### Scenario: Variant of another product
- **WHEN** a customer sends a variant that does not belong to the sent product
- **THEN** the system answers 404 and creates no entry

#### Scenario: Visitor adds
- **WHEN** a visitor who is not logged in adds to the wishlist
- **THEN** the system rejects the request

### Requirement: Remove a product from the wishlist
The system SHALL remove a customer's wishlist entry by product ID, whether or not the entry has a variant.

#### Scenario: Remove a saved product
- **WHEN** a customer removes a product that is on their wishlist
- **THEN** the system deletes that one entry

#### Scenario: Remove a product that is not saved
- **WHEN** a customer removes a product that is not on their wishlist
- **THEN** the system answers 404

#### Scenario: Other customer's entry
- **WHEN** a customer removes a product that only another customer saved
- **THEN** the system answers 404 and the other customer's entry stays

### Requirement: Wishlist heart state follows the product
The system SHALL report a product as wishlisted for a customer when that customer has an entry for the product, whatever the entry's variant. The system SHALL report false for visitors.

#### Scenario: Listing card of a saved product
- **WHEN** a customer opens the shop listing and one product is on their wishlist with a chosen variant
- **THEN** that product's card is shown as wishlisted

#### Scenario: Product page with another variant selected
- **WHEN** a customer saved variant A of a product and then selects variant B on the product page
- **THEN** the product is still shown as wishlisted

#### Scenario: Toggle off
- **WHEN** a customer clicks the wishlist button of a product that is already shown as wishlisted
- **THEN** the system removes the entry for that product and the product is no longer shown as wishlisted

### Requirement: Wishlist shows a variant for each entry
The system SHALL show each wishlist entry as a product card. The card SHALL use the entry's variant for price, image and link when the entry has one. Otherwise the card SHALL use the product's default variant.

#### Scenario: Entry with a chosen variant
- **WHEN** an entry has a variant
- **THEN** the card shows that variant's price and image, and links to the product with that variant selected

#### Scenario: Entry without a variant
- **WHEN** an entry has no variant
- **THEN** the card shows the price and image of the product's default variant, and links to the product

#### Scenario: Default variant changes
- **WHEN** an entry has no variant and the merchant marks another variant as default
- **THEN** the card shows the new default variant on the next load

### Requirement: Wishlist survives deletion of a saved variant
The system SHALL keep a wishlist entry when its saved variant is deleted. The entry SHALL lose its variant and keep its product.

#### Scenario: Saved variant is deleted
- **WHEN** a merchant deletes a variant that a customer saved on their wishlist
- **THEN** the entry stays on the wishlist, shows the product's default variant, and counts as one entry for that product

### Requirement: Wishlist entry is deleted with its product or customer
The system SHALL delete a wishlist entry when its product is deleted or when its customer is deleted.

#### Scenario: Product is deleted
- **WHEN** a merchant deletes a product that customers saved
- **THEN** those wishlist entries are deleted

#### Scenario: Customer is deleted
- **WHEN** a customer account is deleted
- **THEN** that customer's wishlist entries are deleted
