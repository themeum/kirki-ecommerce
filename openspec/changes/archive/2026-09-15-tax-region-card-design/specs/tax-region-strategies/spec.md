## MODIFIED Requirements

### Requirement: Every strategy satisfies one declared contract

The admin SHALL declare a single contract that every region strategy satisfies, covering the decisions that differ per region kind:

- the display name and flag shown for a region
- the badges describing how that region is configured, each with its own styling
- the effective tax rate shown for that region in the region list
- the destination a merchant is taken to when editing the region
- the initial stored shape of a newly added region of that kind
- the routes the kind serves

The region list SHALL obtain each of these from the resolved strategy rather than computing any of them itself. In particular, the region list SHALL NOT inspect a region's stored fields to decide what to show: which properties a kind has, how each is styled, and how its rates collapse to one value or a range are all that kind's own business.

#### Scenario: Rendering the region list

- **WHEN** the region list renders a stored region
- **THEN** its name, flag, badges, and tax rate all come from the strategy that region resolves to

#### Scenario: Editing a region

- **WHEN** a merchant activates Edit on a region
- **THEN** the destination comes from that region's strategy, and a European Union region and an ordinary country region each reach their own editor

#### Scenario: Adding a region

- **WHEN** a merchant adds a region for a given country
- **THEN** the strategy claiming that country supplies the new region's initial stored shape

#### Scenario: A strategy omits part of the contract

- **WHEN** a strategy does not supply every part of the contract
- **THEN** the project's type check fails
