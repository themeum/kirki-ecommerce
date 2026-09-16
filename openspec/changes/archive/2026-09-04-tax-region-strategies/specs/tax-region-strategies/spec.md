## Purpose

Defines how the tax settings UI is partitioned by region kind: what one region kind owns, the contract every kind satisfies, how a stored region is dispatched to the kind that handles it, and what adding a future region kind requires. The point is that a region kind can be added, read, or removed as one unit without editing the kinds that already exist.

## ADDED Requirements

### Requirement: Each region kind is a self-contained strategy

Everything specific to one region kind SHALL live inside that kind's own directory: its route components, its UI, its pure logic, its form schemas, and its tests. The tax feature SHALL be organised into three layers whose dependencies run one way only — a composition layer that resolves strategies, the strategies themselves, and a shared layer beneath both.

A strategy SHALL NOT depend on a sibling strategy, directly or transitively. Code needed by two strategies SHALL be moved into the shared layer rather than imported across the boundary between them.

The shared layer SHALL NOT depend on any strategy. A shared module that needs to know which region kind it is dealing with is by definition not shared, and SHALL be moved into the composition layer that resolves strategies.

#### Scenario: One strategy imports another

- **WHEN** code inside one region kind's directory imports a path inside another region kind's directory
- **THEN** it is rejected, and the imported code is moved to the shared layer instead

#### Scenario: Shared code needs to know the region kind

- **WHEN** a module in the shared layer requires behaviour that differs per region kind
- **THEN** it is moved into the composition layer rather than the layering being relaxed for it

#### Scenario: Removing a region kind

- **WHEN** a region kind is removed from the admin
- **THEN** deleting its directory and its registry entry removes it completely, leaving no orphaned schema, component, logic module, or test elsewhere in the feature

### Requirement: A stored region is dispatched to a strategy by its code, with a default fallback

The admin SHALL resolve a stored region to exactly one strategy using the region's persisted country code. A code with no strategy of its own SHALL resolve to the default strategy, so that every region the API returns is renderable.

Resolution SHALL be the single place that names region kinds. No other module SHALL branch on a region's code to decide presentation, navigation, or the shape of a newly created region.

This mirrors the server, which resolves the same two kinds from the same code with the same fallback; the two SHALL agree on which kind handles a given code.

#### Scenario: Resolving the European Union region

- **WHEN** a stored region carries the European Union's code
- **THEN** it resolves to the European Union strategy

#### Scenario: Resolving an ordinary country

- **WHEN** a stored region carries any other country code
- **THEN** it resolves to the default strategy

#### Scenario: Resolving an unrecognised code

- **WHEN** a stored region carries a code no strategy claims
- **THEN** it resolves to the default strategy and the region still renders, rather than the list failing

#### Scenario: Branching outside resolution

- **WHEN** a module other than the resolver tests a region's code to choose behaviour
- **THEN** it is rejected, and the decision is moved behind the strategy contract

### Requirement: Every strategy satisfies one declared contract

The admin SHALL declare a single contract that every region strategy satisfies, covering the decisions that differ per region kind:

- the display name and flag shown for a region
- the summary line describing how that region is configured
- the destination a merchant is taken to when editing the region
- the initial stored shape of a newly added region of that kind
- the routes the kind serves

The region list SHALL obtain each of these from the resolved strategy rather than computing any of them itself.

#### Scenario: Rendering the region list

- **WHEN** the region list renders a stored region
- **THEN** its name, flag, and summary line all come from the strategy that region resolves to

#### Scenario: Editing a region

- **WHEN** a merchant activates Edit on a region
- **THEN** the destination comes from that region's strategy, and a European Union region and an ordinary country region each reach their own editor

#### Scenario: Adding a region

- **WHEN** a merchant adds a region for a given country
- **THEN** the strategy claiming that country supplies the new region's initial stored shape

#### Scenario: A strategy omits part of the contract

- **WHEN** a strategy does not supply every part of the contract
- **THEN** the project's type check fails

### Requirement: A strategy owns the routes it serves

Each strategy SHALL declare its own routes, and the tax feature SHALL compose those declarations rather than enumerate every tax route itself. The settings router SHALL reference the tax feature's composed routes as a single unit.

Route path templates SHALL continue to be read from the central route configuration rather than written as literal strings, and route components SHALL continue to be loaded on demand.

Only route components SHALL live in a route-components directory. A dialog, row, card, or any other component that is not itself a route target SHALL live with the components of the layer that owns it.

#### Scenario: Adding a route to a region kind

- **WHEN** a route is added to an existing region kind
- **THEN** only that kind's route declarations change, and the settings router is untouched

#### Scenario: Route resolution is unchanged

- **WHEN** the app is built after routes are distributed to strategies
- **THEN** every tax route resolves to the same path it did before, the European Union editor still takes precedence over the parameterised country editor, and route components are still loaded on demand

#### Scenario: A non-route component under route components

- **WHEN** a component that is not a route target is placed in a route-components directory
- **THEN** it is rejected, and moved to the owning layer's components

### Requirement: Adding a region kind is additive

Introducing a new region kind SHALL require only: a new strategy directory satisfying the contract, one entry in the resolver's map, and — where the kind serves new paths — an entry in the central route configuration.

It SHALL NOT require editing an existing strategy, the region list, or any shared module.

#### Scenario: Introducing a third region kind

- **WHEN** a new region kind is added
- **THEN** no file inside an existing strategy is modified, and the region list, the shared layer, and the settings router are untouched

#### Scenario: A new kind needs shared behaviour

- **WHEN** a new region kind needs behaviour an existing kind already implements
- **THEN** that behaviour is first moved into the shared layer, and both kinds consume it from there

### Requirement: Reading and writing the whole tax settings record is one shared responsibility

Every region editor persists by writing the entire tax settings record, not a single region. That read-merge-write flow SHALL be implemented once in the shared layer and consumed by every region editor, so the editors differ only in how their own region merges into the record.

Merging a region into the record SHALL remain the responsibility of the strategy that owns it.

The shared flow SHALL surface a save failure to its caller rather than handling it, so each editor keeps reporting server-side validation errors on its own form fields.

#### Scenario: Saving a region

- **WHEN** a merchant saves any region editor
- **THEN** the whole tax settings record is written with only that region's fields changed, exactly as before

#### Scenario: A save is rejected by the server

- **WHEN** the settings endpoint rejects a save with field-level validation errors
- **THEN** those errors are reported on the offending fields of the editor that submitted, unchanged from current behaviour

#### Scenario: Removing a state from a region

- **WHEN** a merchant removes a state, which persists immediately rather than on Save
- **THEN** it still persists immediately, clears the unsaved-changes marker, refreshes the tax settings, and reports any failure as a toast

### Requirement: The restructure preserves presentation exactly

This partition SHALL NOT alter any styling. Every style definition SHALL move with the component that owns it, unchanged.

#### Scenario: Comparing rendered pages

- **WHEN** any tax settings page is rendered after the restructure
- **THEN** it is visually identical to before, with no changed spacing, colour, typography, or hover behaviour
