## Context

See proposal.md — Why. Two constraints shape the approach:

- There is no stored "the region's tax rate". A general region stores either `central_product_tax` (when `is_central_tax_enabled`) or a `product_tax_rate` per state; the EU region stores a `rate` per member country. The rate shown in the list is therefore derived, and derived differently per region kind.
- `tax-region-strategies` already forbids the region list from computing anything kind-specific: name, flag, summary, edit link and creation shape all come from the resolved strategy. A rate label computed inside `tax-region-list.tsx` would have to branch on region kind and would violate that spec.

## Goals / Non-Goals

**Goals:**

- Keep every kind-specific decision behind the strategy contract, so the region list stays kind-agnostic.
- Make the rate derivation pure and unit-testable, separate from the component.

**Non-Goals:**

- Changing what is persisted, validated, or sent to the API. This is display only.
- Touching the region editors, or the other settings cards that share `HeaderActionsCard`.
- Per-country subdivision terminology ("Provinces" vs "Regions") in the summary badge.

## Decisions

### Rate label: country-wide rate, else the range

A general region shows `central_product_tax` when it charges one rate country-wide, and otherwise the min–max range across its states' `product_tax_rate`; the EU region shows the min–max range across its member countries' `rate`. When min and max coincide the label collapses to a single value.

*Why:* the mockup shows one percentage per row, but two of its three rows (EU/OSS, Canada with five provinces) are regions that have no single rate in our model. A range is the honest rendering of what is stored. *Alternatives:* showing a rate only for country-wide regions (leaves most rows blank); picking one representative rate such as the highest (misrepresents mixed regions).

### The derivation lives in the strategy contract, with a shared formatter

`TaxRegionStrategy` gains a required `resolveRateLabel(region): string`, implemented per kind next to the existing `resolveMeta`/`resolveSummary` in each strategy's `lib/region-display.ts`. Both implementations delegate the "no rates → `''`, one distinct value → `20%`, several → `5–20%`" formatting to one shared pure helper in the tax feature's shared layer.

*Why:* it is the seam the spec already mandates, and making the contract member required means a future region kind that forgets it fails the type check rather than silently rendering no rate. The formatting rule is identical for both kinds, so it belongs in the shared layer rather than being duplicated — which is also what `tax-region-strategies` requires of code two strategies need. *Alternative:* a single helper in the shared layer that branches on region kind — rejected, the spec explicitly moves such code into the composition layer instead.

### One badge per property, styled by what the property is

`resolveSummary` (one combined string per region) is replaced on the contract by `resolveBadges`, returning a list of `{ label, variant }`. The EU region's single `"OSS, 5 Countries"` string becomes an `info` (blue) scheme badge and a `default` (neutral) coverage badge; a general region returns one coverage badge, `"Entire country"` or its state count.

*Why:* the scheme a region is registered under and how much territory it covers are different kinds of fact, and rendering them as one string made them inseparable — the list could neither style nor omit one independently. Returning the pair from the strategy keeps that decision with the kind that owns it, which is what `tax-region-strategies` requires; the list just maps over what it is handed. *Alternative:* keeping `resolveSummary` and splitting the string in the list — rejected, that puts kind-specific parsing back in the list.

Variants are assigned by kind of property, not by region: blue marks the scheme, neutral grey marks coverage. A region with no scheme returns only the coverage badge rather than an empty chip.

### The row sits on its own filled surface

Each region row uses the card style that already backs the card's empty state (`innerDarkCard`/`innerDarkContent`: `surfaceAlt`, no border) instead of a bordered `innerCard`.

*Why:* the design separates rows from the card by fill, not by outline, and that fill already exists as a card style used elsewhere in this same card — so the row picks it up rather than introducing a one-off background. The neutral coverage badge (`surfaceTertiary`) stays legible against it because it is a step darker than the row.

### Enable/disable becomes a menu item, not a switch

The inline `Switch` is removed and enable/disable becomes an item in the row's overflow menu, labelled for the state it moves the region to. It calls the same handler, so the save-immediately behaviour is unchanged.

*Why:* the design has no switch in the row, and the row already carries an overflow menu that owns the region's other state-changing action (Delete). The inactive badge and dimmed name stay, so a disabled region is still identifiable at a glance without the switch.

### Row actions lose their hover gate

`visibility: hidden`-until-hover is dropped, along with the "keep visible while this row's menu is open" state it needed.

*Why:* the design draws the actions as always present, and a hover-gated control is unreachable on touch. Removing the gate also removes the state that existed only to work around it.

### The overflow glyph

The row's overflow menu uses the horizontal three-dot glyph the design shows. `DropdownButton` already has a `direction: 'horizontal'` branch, but it renders an oval outline rather than three dots, and no caller uses it today — so that branch is corrected rather than worked around locally. The default vertical branch, which every existing caller uses, is untouched.

## Risks / Trade-offs

- **A range reads as a rate the merchant never entered** (e.g. `5–20%` for a region with per-state rates) → the badge beside it already says how many sub-territories the region has, so the range is read in that context; the alternative renderings are worse (blank, or a single misleading number).
- **Edit is reachable two ways** (the dedicated control and the menu item) → intentional, per the design; the menu item costs nothing and keeps the menu self-sufficient.
- **Correcting `DropdownButton`'s horizontal glyph touches a shared component** → no caller passes `direction="horizontal"` today, so the blast radius is this change alone; the vertical default is not modified.
