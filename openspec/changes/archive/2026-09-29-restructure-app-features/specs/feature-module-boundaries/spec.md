## Purpose

Defines how the admin app is partitioned into features: what a feature owns, the shape every feature takes, and which dependencies between features and shared code are permitted. The point is that a feature can be read, changed, or deleted as one unit, and that the boundary holds automatically rather than by reviewer vigilance.

## ADDED Requirements

### Requirement: A feature owns everything specific to it

Code that exists to serve exactly one area of the admin app SHALL live inside that feature's directory. This includes its route components, its UI, its API access, its request and response schemas, its pure logic, its types, and its tests.

A file SHALL be classified as shared only when it is genuinely independent of any feature's domain — a UI primitive, a formatting helper, reference data available to the whole app, or infrastructure such as response parsing. Being imported by two features is NOT by itself grounds for treating something as shared: an entity belongs to the feature that owns it, and other features reach it through that feature's public API.

#### Scenario: Adding an entity to an existing feature

- **WHEN** a new schema, service call, component, or test is written for an existing feature
- **THEN** it is placed inside that feature's directory, and no new file for it appears in a shared root directory

#### Scenario: Two features need the same entity

- **WHEN** a second feature needs to read or mutate an entity another feature owns
- **THEN** the entity's schema and service remain with the owning feature, and the second feature consumes them through that feature's public API

#### Scenario: Deleting a feature

- **WHEN** a feature is removed from the app
- **THEN** deleting its directory and its entry in the route composition removes it completely, leaving no orphaned schema, service, type, or test elsewhere in the tree

### Requirement: Every feature follows the same anatomy

A feature SHALL be organised into a fixed, closed set of parts, so that the location of any given kind of code is predictable without searching:

- a public API module declaring what other features may use
- route definitions for the feature's own routes
- route components
- feature UI components
- stateful React logic
- pure logic, free of React
- API access, including the feature's own query keys
- schemas, separated into query-response schemas and form/payload schemas
- types that are not derived from a schema
- React contexts, only where the feature has one
- tests

No other top-level part SHALL be introduced within a feature. Pure logic SHALL be kept under a single name across the whole app rather than the several interchangeable names in use today.

Nesting a sub-feature inside a feature SHALL be permitted only where a single route shell genuinely owns several sub-areas, SHALL NOT go more than one level deep, and each sub-feature SHALL follow this same anatomy.

#### Scenario: Locating a feature's pure logic

- **WHEN** a developer looks for the non-React decision logic of any feature
- **THEN** it is found under the same part name in every feature, with no equivalent logic filed under an alternative name

#### Scenario: Introducing an unlisted part

- **WHEN** a directory outside the defined set is added at a feature's top level
- **THEN** it is rejected in review as outside the agreed anatomy

#### Scenario: Sub-feature nesting depth

- **WHEN** a sub-feature is added under a feature that owns several sub-areas
- **THEN** it sits exactly one level deep and follows the same anatomy as a top-level feature

### Requirement: Cross-feature access goes through a public API

A feature SHALL declare the surface other features may use in a single public API module. Another feature SHALL import only from that module, never from a path inside the feature.

This SHALL be enforced automatically: a deep import across a feature boundary fails the project's lint check rather than relying on review to catch it.

A feature's public API SHALL be restricted to what other features actually consume, so that the surface records real coupling rather than exposing everything the feature contains.

#### Scenario: Embedding another feature's dialog

- **WHEN** one feature renders a create-or-edit dialog owned by another — for example creating a brand while editing a product, or adding a customer while creating an order
- **THEN** the dialog is imported from the owning feature's public API and the code passes lint

#### Scenario: Reaching past the public API

- **WHEN** code in one feature imports a path inside another feature rather than its public API
- **THEN** the project lint check fails

#### Scenario: Importing within a feature

- **WHEN** code imports another file inside its own feature
- **THEN** it may import that file directly, and is not required to route through its own public API

#### Scenario: A cycle between features

- **WHEN** two features' public APIs come to depend on each other, directly or transitively
- **THEN** the project lint check fails, because such a cycle resolves to an undefined value at module initialisation and would otherwise surface only at runtime

### Requirement: Shared code never depends on a feature

Every shared root directory SHALL be free of any dependency on `features/`. The dependency arrow points one way: features may use shared code, shared code may never use a feature.

A shared component MAY use shared API access — reference data and application configuration — but a component that needs data owned by a feature is by definition not shared, and SHALL be relocated into the feature that owns that data.

#### Scenario: Shared code importing a feature

- **WHEN** any file outside `features/` imports from `features/`
- **THEN** the project lint check fails

#### Scenario: A shared component needs feature-owned data

- **WHEN** a component in a shared directory requires data or UI that a feature owns
- **THEN** the component is moved into that feature and exposed through the feature's public API, rather than the dependency rule being relaxed for it

#### Scenario: A shared component needs reference data

- **WHEN** a shared component requires reference data or application configuration that no feature owns
- **THEN** it may use the shared API access for that data and remains in the shared directory

### Requirement: A type is imported from where it is defined

Types SHALL be obtained from the module that defines them — for data shapes, the schema that declares them. The app SHALL NOT provide a global module that re-exports types or schemas from across features.

A barrel that re-exports runtime values, rather than types alone, is not erased when the app is built and therefore creates a real module edge between whatever it joins; such a barrel SHALL NOT span features.

A barrel SHALL remain permissible for a genuinely shared, feature-independent group of types.

#### Scenario: Importing an entity's type

- **WHEN** code needs the type of an entity
- **THEN** it imports it from that entity's schema, in the feature that owns the entity

#### Scenario: Reintroducing a global re-export

- **WHEN** a module is added that re-exports types or schemas belonging to more than one feature
- **THEN** it is rejected, since it restores the cross-feature edge this boundary exists to remove

### Requirement: A feature owns its query keys and declares cross-feature invalidation

Each feature SHALL define the cache keys for the data it owns, alongside its API access. Every key group SHALL expose a root that identifies all of that group's entries, and cache invalidation SHALL be expressed through those declared keys.

Invalidation SHALL NOT be written as an inline literal key. A literal key silently matches another feature's cache entries while bypassing every boundary check, making a cross-feature dependency invisible to both the type system and lint.

Where invalidating one feature's data must also invalidate another's, the dependency SHALL be expressed by using the other feature's declared key through its public API, so the edge is visible.

#### Scenario: Invalidating a feature's own data

- **WHEN** a mutation invalidates data its own feature owns
- **THEN** it references that feature's declared key rather than an inline literal

#### Scenario: A mutation affects another feature's data

- **WHEN** a mutation in one feature invalidates data owned by another — for example a product change affecting inventory
- **THEN** it uses the other feature's declared key obtained through that feature's public API, making the dependency explicit

#### Scenario: Reading and invalidating the same data

- **WHEN** a query reads data and a mutation later invalidates it
- **THEN** both derive from the same declared key group, so the invalidation cannot drift out of alignment with the read

### Requirement: A feature owns its route definitions

Each feature SHALL declare the routes it serves, and the application router SHALL compose those declarations rather than enumerate every route itself.

Route paths SHALL continue to be read from the central route configuration rather than written as literal strings, and route components SHALL continue to be loaded on demand so that each feature remains a separate bundle.

#### Scenario: Adding a route to a feature

- **WHEN** a new route is added to an existing feature
- **THEN** only that feature's route declarations change, and the application router is untouched

#### Scenario: Removing a feature

- **WHEN** a feature is removed
- **THEN** its routes disappear with it, and the application router changes only where it composed that feature

#### Scenario: Route loading behaviour

- **WHEN** the app is built after routes are distributed to features
- **THEN** route components are still loaded on demand and each feature's routes still resolve to their configured paths

### Requirement: Tests live in a feature's test directory, mirroring the source

A feature's tests SHALL live in a single test directory within the feature, laid out to mirror the structure of the code under test, so a test's location is derivable from the file it covers.

Tests for shared code SHALL follow the same convention in a corresponding shared test location.

#### Scenario: Locating a test

- **WHEN** a developer looks for the tests covering a given source file
- **THEN** the test path is derivable from the source path by prefixing the feature's test directory

#### Scenario: Adding a test to a feature

- **WHEN** a test is written for feature code
- **THEN** it is placed in that feature's test directory at the mirrored path, not beside the file it covers

#### Scenario: Moving a file within a feature

- **WHEN** a source file changes location inside its feature
- **THEN** its test moves to the correspondingly mirrored location
