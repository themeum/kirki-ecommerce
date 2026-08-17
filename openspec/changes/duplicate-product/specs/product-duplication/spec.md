## Purpose

Lets a store admin create a new product pre-populated from an existing one, rather than re-entering every field, association, and variant by hand.

## ADDED Requirements

### Requirement: Duplicate a product via the products action endpoint
The system SHALL accept a `duplicate` action against `PATCH /products/{id}/action` and create a new product as a copy of the product identified by `{id}`.

#### Scenario: Successful duplication
- **WHEN** an admin sends `PATCH /products/{id}/action` with `{"action": "duplicate"}` for an existing product
- **THEN** a new product is created and returned in the response, distinct from the source product (different id)

#### Scenario: Duplicating a non-existent product
- **WHEN** an admin sends the `duplicate` action for a product id that does not exist
- **THEN** the system returns a not-found error and creates no product

#### Scenario: Unrecognized action value
- **WHEN** an admin sends `PATCH /products/{id}/action` with an `action` value other than `duplicate`
- **THEN** the system returns a bad-request error and performs no action

### Requirement: Duplicated product starts as a draft with a distinguishable title
The system SHALL set the duplicated product's status to draft regardless of the source product's status, and SHALL suffix the duplicated product's title to distinguish it from the source.

#### Scenario: Duplicating a published product
- **WHEN** an admin duplicates a product whose status is published
- **THEN** the new product's status is draft

#### Scenario: Duplicating an already-draft product
- **WHEN** an admin duplicates a product whose status is draft
- **THEN** the new product's status is draft

#### Scenario: Title is suffixed
- **WHEN** an admin duplicates a product titled "Blue T-Shirt"
- **THEN** the new product's title is "Blue T-Shirt - Copy"

### Requirement: Duplicated product retains its associations
The system SHALL carry over the source product's media, categories, tags, collections, and attribute/value assignments to the duplicated product.

#### Scenario: Associations carried over
- **WHEN** an admin duplicates a product that has media, categories, tags, collections, and attribute values assigned
- **THEN** the new product has the same media, categories, tags, collections, and attribute/value assignments as the source product

### Requirement: Duplicated product includes a copy of every variant with identifying and stock fields reset
The system SHALL create one new variant for every variant on the source product, carrying over each variant's non-identifying fields (price, weight, shipping/tax profile, physical/visibility flags, attribute value assignments, etc.) while clearing fields that must be unique or that represent real, order-linked stock state.

#### Scenario: SKU is cleared on duplicated variants
- **WHEN** an admin duplicates a product whose variant has a SKU assigned
- **THEN** the corresponding duplicated variant has no SKU

#### Scenario: Stock quantities reset on duplicated variants
- **WHEN** an admin duplicates a product whose variant has a non-zero available quantity, a non-zero committed quantity, and is marked in stock
- **THEN** the corresponding duplicated variant has zero available quantity, zero committed quantity, and is marked not in stock

#### Scenario: Non-reset variant fields and attribute values are preserved
- **WHEN** an admin duplicates a product whose variant has a price, weight, and one or more attribute values assigned
- **THEN** the corresponding duplicated variant has the same price, weight, and attribute value assignments as the source variant
