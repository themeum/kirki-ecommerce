## Purpose

Lets the admin create an attribute together with its values, and batch-create or recolor an existing attribute's values, as single all-or-nothing requests. The Product Variations card needs this so it can commit a draft on Apply without leaving partial data behind.

## ADDED Requirements

### Requirement: Create an attribute with values

`POST /attributes` SHALL accept an optional `values` array. Each entry has a required `value` (string) and an optional `color` (hex string or `null`). The attribute and all of its values SHALL be created in one database transaction. If any part fails validation or persistence, nothing SHALL be created. The response SHALL include the created attribute with its values and their ids. Requests without `values` SHALL behave as they do today.

#### Scenario: Attribute with values

- **WHEN** an admin posts `{name: "Fabric", type: "list", values: [{value: "Cotton"}, {value: "Linen"}]}`
- **THEN** the response is 201 with the attribute and both values, each carrying an id

#### Scenario: Duplicate attribute name

- **WHEN** the posted `name` already exists
- **THEN** the response is a 422 validation error on `name`
- **AND** no attribute or value is created

#### Scenario: Duplicate value names in the payload

- **WHEN** `values` contains "Cotton" twice (compared case-insensitively after trimming)
- **THEN** the response is a 422 validation error on `values`
- **AND** nothing is created

#### Scenario: Invalid color

- **WHEN** a value's `color` is not a valid hex color or `null`
- **THEN** the response is a 422 validation error for that entry
- **AND** nothing is created

### Requirement: Batch-write an attribute's values

A new endpoint `POST /attributes/{attribute_id}/values/batch` SHALL accept a `create` array (`{value, color?}`) and an `update` array (`{id, color}`). Both are optional, but at least one SHALL be non-empty. All writes SHALL run in one database transaction. Every `update` id SHALL belong to `{attribute_id}`. A `create` entry SHALL NOT duplicate an existing value name of that attribute or another entry in the batch. The response SHALL return the attribute with all of its values and their ids, in the same shape as `POST /attributes`. On any failure, no write SHALL persist.

The endpoint SHALL use the same capability check and nonce handling as the existing attribute value endpoints.

#### Scenario: Create and recolor together

- **WHEN** an admin posts `{create: [{value: "Teal", color: "#008080"}], update: [{id: 12, color: "#0000cc"}]}` for attribute 1, and value 12 belongs to attribute 1
- **THEN** "Teal" is created and value 12's color becomes `#0000cc`
- **AND** the response is the attribute with all its values, including the new "Teal" id

#### Scenario: Value from another attribute

- **WHEN** an `update` id belongs to a different attribute
- **THEN** the response is a 422 validation error and nothing is written

#### Scenario: Created value already exists

- **WHEN** a `create` entry's value matches an existing value of the attribute
- **THEN** the response is a 422 validation error on that entry and nothing is written

#### Scenario: Unknown attribute

- **WHEN** `{attribute_id}` does not exist
- **THEN** the response is 404 and nothing is written
