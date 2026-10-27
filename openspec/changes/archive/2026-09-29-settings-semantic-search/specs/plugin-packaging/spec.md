## ADDED Requirements

### Requirement: Package ships a search index built from the packaged source

The packaging command SHALL regenerate the settings search index from the current
settings source before the admin frontend is bundled, so that the shipped plugin
can never carry an index describing wording that is not in the interface it ships
with.

#### Scenario: Stale local index at package time

- **WHEN** `npm run make:package` is run while the packaging machine's local search
  index was generated from older settings copy, or is absent entirely
- **THEN** the index is regenerated from the current source before the frontend is
  built
- **AND** the zip contains the regenerated index rather than the stale one

#### Scenario: Regeneration precedes bundling

- **WHEN** the packaging command builds the admin frontend
- **THEN** the search index has already been regenerated, so the bundled index and
  the bundled interface come from the same source
