# component-logic-separation Specification

## Purpose

Defines how feature code is layered into rendering, stateful wiring, and pure decision logic, and the guarantee that layering exists to provide: every decision the application makes is reachable by a test that renders nothing.

## Requirements

### Requirement: A route component renders and delegates

A route component SHALL be responsible for producing markup. It SHALL obtain the values and callbacks it renders from a single feature hook rather than assembling them itself.

A route component SHALL NOT contain data-shaping logic, multi-branch decisions about what an operation should do, or the orchestration of several server operations. Presentational branching on already-decided values — choosing a variant, rendering a loading or empty state, mapping a prepared list to elements — remains the component's own work.

#### Scenario: Reading a page's data flow

- **WHEN** a developer opens a route component
- **THEN** its data and callbacks arrive from one hook call, and what remains is markup and presentational branching

#### Scenario: A component needs a new derived value

- **WHEN** a route component requires a value computed from server data or form state
- **THEN** the computation is added to the feature's pure logic and surfaced through the feature hook, rather than being computed in the component body

### Requirement: Pure decision logic is free of React

Logic that decides what the application does — transforming a server response into the shape a form needs, applying an operation to a collection, determining which actions are available for a given state, merging a selection into an existing list, building a view model — SHALL live in modules that import nothing from React and hold no component state.

Such a module SHALL be callable directly with plain values and SHALL return plain values, so that exercising it requires no rendering, no test environment providing a DOM, and no mocked server.

#### Scenario: Applying an operation to a collection

- **WHEN** an operation transforms a collection — toggling an item's enabled state, removing an entry, merging newly selected items into existing ones
- **THEN** the transformation is a function taking the current collection and the operation's inputs and returning the new collection, with no component state involved

#### Scenario: Deciding available actions

- **WHEN** the set of actions offered for an entity depends on that entity's status
- **THEN** the decision is made by a function of the entity, and the component renders whatever that function returns

#### Scenario: Exercising pure logic in a test

- **WHEN** a test covers pure decision logic
- **THEN** it calls the function with plain values and asserts on the returned value, without rendering a component or providing a DOM

### Requirement: Stateful wiring lives in a feature hook

Server queries and mutations, form instances, dialog and other transient UI state, effects that synchronise them, and the handlers that sequence them SHALL be assembled in a hook belonging to the feature.

A hook SHALL delegate every decision to pure logic and confine itself to wiring: reading server state, invoking operations, and exposing the result. A hook SHALL return a named result whose members describe their purpose, so a component consuming it reads as a description of the page.

#### Scenario: A handler performs a multi-step operation

- **WHEN** a user action requires computing a new state, persisting it, and reconciling the form afterwards
- **THEN** the computation is a call into pure logic and the hook performs only the persistence and reconciliation around it

#### Scenario: Consuming a feature hook

- **WHEN** a component calls its feature hook
- **THEN** it receives a named result, not a positional tuple whose meaning depends on ordering

### Requirement: Extracted logic is tested when it is extracted

Every function moved into a feature's pure logic SHALL be covered by tests introduced alongside it, not deferred.

Because this layering rewrites statements rather than relocating files, the project typecheck is a weak guarantee — a transplanted condition can be inverted and still compile. The test introduced with the extraction is what establishes that behavior was preserved, so it SHALL be part of the same unit of work as the extraction.

Tests SHALL assert on concrete resulting values rather than on the fact that a function was called.

#### Scenario: Extracting a function

- **WHEN** logic is moved out of a component into the feature's pure logic
- **THEN** tests covering that function are added in the same unit of work, before the extraction is considered complete

#### Scenario: Behavior is described, not implementation

- **WHEN** a test is written for extracted logic
- **THEN** it states the behavior being relied upon and asserts the resulting value, rather than asserting which internal calls occurred

### Requirement: The test suite can exercise components and hooks

The project SHALL be able to run tests that require a DOM, in addition to tests that do not.

Tests that need no DOM SHALL continue to run in the faster environment they use today, and SHALL NOT be slowed or altered by the addition of DOM-capable tests. Both kinds SHALL run under the project's single test command.

A test file that requires a DOM SHALL be discovered and executed. It SHALL NOT be silently ignored — a test that never runs is worse than an absent one, because it reports safety that does not exist.

#### Scenario: Running the test suite

- **WHEN** the project's test command runs
- **THEN** both DOM-requiring and DOM-free tests are discovered and executed, and the DOM-free tests run in their existing environment

#### Scenario: Adding a DOM-requiring test

- **WHEN** a test requiring a DOM is added to a feature
- **THEN** it is executed by the test command, and its failure fails the suite

#### Scenario: Modules reading globals at import time

- **WHEN** a test loads a module that reads host-provided globals during import
- **THEN** those globals are available in both environments, so the module can be imported under either

### Requirement: Server response handling is verifiable against realistic payloads

The paths where a server response is parsed into the shapes the app relies on SHALL be exercisable in tests against representative response bodies, including the shapes known to differ from what callers assume.

This exists because the backend has repeatedly returned a keyed object where a list is read, and an empty collection where an object is expected — drift that currently surfaces to the user as a blank screen rather than as a reported failure.

#### Scenario: A response arrives in a documented shape

- **WHEN** a service response path is tested with a representative body for its endpoint
- **THEN** the body parses and the caller receives the expected value

#### Scenario: A response arrives in a known-divergent shape

- **WHEN** a response arrives as a keyed object where a list is read, or as an empty collection where an object is expected
- **THEN** the test demonstrates the handling of that shape, so a regression in the normalization fails the suite rather than reaching the user
