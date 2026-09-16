## Why

The Tax Regions card on Settings → Tax no longer matches its design. Each region renders as a two-line block whose row actions are hidden behind `visibility: hidden` until hover — unreachable on touch and undiscoverable everywhere else — and the card gives no indication of what rate a region actually charges, so a merchant has to open a region to find out.

## What Changes

- Present each tax region as a single-line row: flag, name, a summary badge, then a right-aligned tax-rate label and the row's actions.
- Show each region's effective tax rate in the list: the country-wide rate when the region charges one, otherwise the range across its sub-rates.
- Make the row actions permanently visible, and give Edit a dedicated control beside the overflow menu.
- Move enabling/disabling a region out of an inline switch and into the row's overflow menu, keeping the inactive treatment (badge + dimmed name) that already signals a disabled region.
- Relabel the card's add control to "Add".
- Keep the card's existing subtitle copy, summary wording, empty state, add-region dialog, and every save/delete/toggle behaviour unchanged.

## Capabilities

### New Capabilities

- `tax-region-list-card`: How the tax region list presents one region — row composition, the summary badge, the effective-rate label and how it is derived, the inactive treatment, and the row's action affordances.

### Modified Capabilities

- `tax-region-strategies`: the per-region-kind contract gains the effective tax-rate label, so the region list obtains a region's rate from its strategy rather than computing it.
- `tax-region-rate-model`: enabling/disabling a region moves from an inline switch to the row's action menu; the underlying behaviour (configuration preserved across the toggle) is unchanged.

## Impact

- `resources/app/features/settings/tax/shared/components/tax-region-list.tsx` — row layout, action affordances, add-button label
- `resources/app/features/settings/tax/shared/contracts/tax-region-strategy.ts` — contract gains `resolveRateLabel`
- `resources/app/features/settings/tax/strategies/{general,eu}/lib/region-display.ts` and their `index.ts` — implement and wire the rate label
- New `resources/app/features/settings/tax/shared/lib/rate-label.ts` plus co-located Vitest coverage
- `resources/app/components/dropdown-button.tsx` — its unused `direction="horizontal"` branch renders a lucide oval instead of the three-dot overflow glyph
- No backend, API, schema, or persisted-shape change; display only
