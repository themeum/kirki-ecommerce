# tax-region-list-card Specification

## Purpose

Defines how the Tax Regions card presents the regions a merchant has configured: what one row shows, how a region's effective tax rate is summarised for the list, how a disabled region is distinguished, and which actions a row offers.

## Requirements

### Requirement: A region occupies a single row

Each configured tax region SHALL be presented as one horizontal row, set on its own filled surface distinct from the card behind it, reading in order: the region's flag, its name, one badge per configured property, and — aligned to the opposite end of the row — the region's effective tax rate followed by its actions.

#### Scenario: Rendering a configured region

- **WHEN** the card renders a region the merchant has configured
- **THEN** its flag, name, badges, rate and actions all appear on one filled row, with the rate and actions aligned to the row's trailing edge

#### Scenario: No regions configured

- **WHEN** no tax region has been added
- **THEN** the card's existing empty state is shown instead of any row

### Requirement: Each configured property is its own badge

A region's configuration SHALL be shown as one badge per property rather than as a single combined summary, so that properties of different kinds are separable at a glance. Properties of different kinds SHALL be styled differently: the scheme a region is registered under and the extent of territory it covers SHALL NOT share a badge treatment.

A property that does not apply to a region SHALL be omitted rather than shown empty. This presentation SHALL NOT introduce per-country subdivision terminology.

#### Scenario: A region registered under a scheme

- **WHEN** a region is registered under a named scheme and covers a number of territories
- **THEN** the scheme and the extent of coverage appear as two separate badges, styled differently from one another

#### Scenario: A region with no scheme

- **WHEN** a region has no scheme to name
- **THEN** only its coverage badge is shown, and no empty badge appears in its place

#### Scenario: A region covering one whole country

- **WHEN** a region charges one rate across an entire country
- **THEN** a single coverage badge says so, styled as coverage rather than as a scheme

### Requirement: The row reports the region's effective tax rate

Each row SHALL show the product tax rate the region charges, expressed as a percentage.

- A region that charges one rate across its whole territory SHALL show that rate.
- A region whose rate varies across its sub-territories SHALL show the range from its lowest to its highest configured rate, or a single value when every sub-territory charges the same.
- A region with no rate configured yet SHALL show nothing in place of a rate rather than a placeholder or a zero it has not been given.

A configured rate of zero is a rate, and SHALL be shown as such.

#### Scenario: One rate for the whole region

- **WHEN** a region charges a single rate across its entire territory
- **THEN** the row shows that rate as a percentage

#### Scenario: Rates vary within the region

- **WHEN** a region's sub-territories charge different rates
- **THEN** the row shows the range from the lowest to the highest of them

#### Scenario: Every sub-territory charges the same

- **WHEN** a region's sub-territories all charge the same rate
- **THEN** the row shows that single rate rather than a range of one value repeated

#### Scenario: No rate configured

- **WHEN** a region has no rate configured
- **THEN** the row shows no rate

#### Scenario: A rate of zero

- **WHEN** a region charges zero percent
- **THEN** the row shows zero percent, not an empty rate

### Requirement: A disabled region is visibly inactive

A region that is disabled SHALL be distinguished in the list by an inactive badge alongside its summary and by a dimmed name, while still showing its summary, its rate, and its full set of actions.

#### Scenario: Listing a disabled region

- **WHEN** a disabled region is rendered
- **THEN** it carries an inactive badge and a dimmed name, and its rate and actions remain available

### Requirement: Row actions are always visible

A row's actions SHALL be visible whenever the row is, without requiring hover or focus. Each row SHALL offer a dedicated edit control and an overflow menu; the overflow menu SHALL offer Edit, the region's enable/disable action, and Delete.

Activating either edit affordance SHALL take the merchant to that region's editor. Delete SHALL continue to require confirmation before the region is removed.

#### Scenario: Viewing a row without interacting with it

- **WHEN** a row is rendered and the pointer is elsewhere
- **THEN** its edit control and overflow menu are visible

#### Scenario: Editing from either affordance

- **WHEN** the merchant activates the row's edit control, or Edit within its overflow menu
- **THEN** the merchant is taken to that region's editor

#### Scenario: Deleting a region

- **WHEN** the merchant chooses Delete from a row's overflow menu
- **THEN** the merchant is asked to confirm, and the region is removed only on confirmation
