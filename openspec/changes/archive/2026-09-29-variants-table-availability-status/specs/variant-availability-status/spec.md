## Purpose

Defines how a single variant's stock state and a product's overall stock state are derived from inventory data, what those states are called, and how merchants read and filter by them across the admin.

## ADDED Requirements

### Requirement: A variant carries a low stock threshold

Every variant SHALL carry a low stock threshold: the quantity at or below which the variant is considered to be running low. The threshold SHALL be persisted with the variant and SHALL survive a save-and-reload cycle.

The store SHALL provide a default low stock threshold that applies to any variant that does not specify its own. A variant with no threshold of its own SHALL resolve to the store default. A variant whose threshold is explicitly zero SHALL resolve to zero, meaning it never reports low stock, and SHALL NOT fall back to the store default.

The store default SHALL be zero unless a merchant changes it, so that installing this capability does not alter the reported stock state of any existing product.

#### Scenario: A threshold is persisted

- **WHEN** a merchant sets a variant's low stock threshold and saves the product
- **THEN** reloading the product reports the same threshold on that variant

#### Scenario: An unset threshold falls back to the store default

- **WHEN** a variant has no low stock threshold of its own and the store default is five
- **THEN** that variant is evaluated against a threshold of five

#### Scenario: A zero threshold is explicit, not unset

- **WHEN** a variant's low stock threshold is zero and the store default is five
- **THEN** that variant is evaluated against a threshold of zero
- **AND** the variant never reports low stock

#### Scenario: Existing stores are unaffected on upgrade

- **WHEN** a store that has never configured a threshold is upgraded to this release
- **THEN** the store default is zero
- **AND** no product's reported stock state differs from what it was before the upgrade

### Requirement: A variant resolves to one of three stock states

Each variant SHALL resolve to exactly one of In Stock, Low Stock, or Out of Stock, determined from whether it tracks inventory, its in-stock flag, its available quantity, and its resolved threshold:

- A variant that does not track inventory SHALL be In Stock when its in-stock flag is set, and Out of Stock otherwise. It SHALL never be Low Stock.
- A variant that tracks inventory SHALL be Out of Stock when its available quantity is zero or less.
- Otherwise it SHALL be Low Stock when its available quantity is at or below its resolved threshold, and In Stock when above it.

The available quantity SHALL be used as recorded, without subtracting committed quantity, because reserving stock already moves quantity out of available and into committed.

#### Scenario: Untracked variant follows its in-stock flag

- **WHEN** a variant does not track inventory and its in-stock flag is set
- **THEN** it reports In Stock regardless of its recorded quantity

#### Scenario: Untracked variant marked out of stock

- **WHEN** a variant does not track inventory and its in-stock flag is not set
- **THEN** it reports Out of Stock

#### Scenario: Tracked variant at zero quantity

- **WHEN** a variant tracks inventory and has zero available quantity
- **THEN** it reports Out of Stock

#### Scenario: Tracked variant at or below its threshold

- **WHEN** a variant tracks inventory, has three available, and resolves to a threshold of three
- **THEN** it reports Low Stock

#### Scenario: Tracked variant above its threshold

- **WHEN** a variant tracks inventory, has four available, and resolves to a threshold of three
- **THEN** it reports In Stock

#### Scenario: A zero threshold never yields low stock

- **WHEN** a variant tracks inventory, has one available, and resolves to a threshold of zero
- **THEN** it reports In Stock

### Requirement: Back-order availability does not affect the reported stock state

The reported stock state SHALL describe physical stock on hand, not whether a variant can be purchased. A variant that permits back-orders and has zero available quantity SHALL report Out of Stock.

This is a deliberate divergence: such a variant remains purchasable, so the reported state and purchasability disagree by design.

#### Scenario: Back-orderable variant at zero quantity

- **WHEN** a variant tracks inventory, permits back-orders, and has zero available quantity
- **THEN** it reports Out of Stock
- **AND** the variant remains purchasable

### Requirement: A set of variants resolves to one of four stock states

A group of variants — whether a whole product or one grouped subset of it — SHALL resolve to exactly one of In Stock, Low Stock, Out of Stock, or Partially Stocked, by evaluating the set of its variants' states:

- When every variant is Out of Stock, the group SHALL be Out of Stock.
- Otherwise, when any variant is Low Stock, the group SHALL be Low Stock.
- Otherwise, when any variant is Out of Stock, the group SHALL be Partially Stocked.
- Otherwise the group SHALL be In Stock.

The result SHALL NOT depend on the order in which variants are considered. A group containing a single variant SHALL report that variant's own state. A group containing no variants SHALL report no state at all rather than defaulting to any of the four.

#### Scenario: All variants healthy

- **WHEN** every variant in a group is In Stock
- **THEN** the group reports In Stock

#### Scenario: A low variant outweighs healthy ones

- **WHEN** a group holds one In Stock and one Low Stock variant
- **THEN** the group reports Low Stock

#### Scenario: Some available, some gone

- **WHEN** a group holds one In Stock and one Out of Stock variant, and none is Low Stock
- **THEN** the group reports Partially Stocked

#### Scenario: A low variant outweighs a partial mix

- **WHEN** a group holds one In Stock, one Out of Stock, and one Low Stock variant
- **THEN** the group reports Low Stock

#### Scenario: Everything gone

- **WHEN** every variant in a group is Out of Stock
- **THEN** the group reports Out of Stock

#### Scenario: Order does not matter

- **WHEN** the same three variant states are evaluated in any order
- **THEN** the group reports the same state every time

#### Scenario: A single-variant group

- **WHEN** a group holds exactly one variant, which is Low Stock
- **THEN** the group reports Low Stock

#### Scenario: An empty group

- **WHEN** a group holds no variants
- **THEN** it reports no state

### Requirement: Stock state is exposed through the API

Variant representations returned by the admin API SHALL include the variant's own stock state and a human-readable, translated label for it. Product representations returned by the admin API SHALL include the product's stock state, resolved across all of its variants, and a translated label for it.

Labels SHALL read "In Stock", "Low Stock", "Out of Stock", and "Partially Stocked".

This capability SHALL NOT change any storefront or customer-facing response.

#### Scenario: A variant response carries its state

- **WHEN** the admin API returns a variant
- **THEN** the response includes that variant's stock state and its translated label

#### Scenario: A product response carries its aggregate state

- **WHEN** the admin API returns a product with several variants
- **THEN** the response includes the state resolved across all of them and its translated label

#### Scenario: Storefront responses are unchanged

- **WHEN** a customer-facing response is produced
- **THEN** it contains no stock state field introduced by this capability

### Requirement: The product list can be filtered by stock state

The admin product list SHALL accept a filter selecting products by their resolved stock state, offering all four states. Filtering SHALL be performed by the server so that it applies across the entire result set, not only the current page. The filter SHALL resolve each variant's threshold the same way the reported state does, honouring per-variant thresholds and falling back to the store default.

A filter value outside the four known states SHALL be rejected.

The variant-level inventory list SHALL continue to offer only In Stock and Out of Stock, since Partially Stocked cannot describe a single variant.

#### Scenario: Filtering to low stock

- **WHEN** a merchant filters the product list by Low Stock
- **THEN** every returned product has at least one Low Stock variant
- **AND** no returned product is In Stock, Out of Stock, or Partially Stocked

#### Scenario: Filtering to partially stocked

- **WHEN** a merchant filters the product list by Partially Stocked
- **THEN** every returned product has at least one available and at least one Out of Stock variant
- **AND** no returned product has a Low Stock variant

#### Scenario: Filtering spans the whole result set

- **WHEN** a merchant filters a product list long enough to paginate
- **THEN** the results include matching products beyond the first page
- **AND** the reported total reflects only matching products

#### Scenario: An unknown filter value is rejected

- **WHEN** the product list is requested with a stock state value that is not one of the four
- **THEN** the request is rejected with a validation error

#### Scenario: The variant inventory list offers two states

- **WHEN** a merchant filters the variant-level inventory list
- **THEN** only In Stock and Out of Stock are offered
