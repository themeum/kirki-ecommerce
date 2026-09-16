## 1. Rate label derivation

- [x] 1.1 Add `resources/app/features/settings/tax/shared/lib/rate-label.ts` exporting a pure `formatTaxRateLabel(rates)` that ignores non-numeric entries and returns `''` for none, `'20%'` when one distinct value remains, and `'5–20%'` for a min–max range
- [x] 1.2 Cover it in `shared/tests/lib/rate-label.test.ts`: empty, all-nullish, single value, repeated identical values, a range, mixed string/number input, and a configured `0`
- [x] 1.3 Add the required `resolveRateLabel: (region: TaxRegion) => string` member to `shared/contracts/tax-region-strategy.ts`, documented alongside the existing members
- [x] 1.4 Implement `resolveGeneralRegionRateLabel` in `strategies/general/lib/region-display.ts` — `central_product_tax` when `is_central_tax_enabled`, otherwise the states' `product_tax_rate` values — and wire it into `strategies/general/index.ts`
- [x] 1.5 Implement `resolveEuRegionRateLabel` in `strategies/eu/lib/region-display.ts` over the member countries' `rate`, and wire it into `strategies/eu/index.ts`
- [x] 1.6 Add `strategies/general/tests/lib/region-display.test.ts` and `strategies/eu/tests/lib/region-display.test.ts` covering country-wide vs per-sub-territory rates for each kind

## 2. Region row

- [x] 2.1 In `shared/components/tax-region-list.tsx`, replace each region's two-line block with one horizontal row: flag, name, the region's badges, the destructive "Inactive" badge when disabled, then a trailing action group holding the rate label, an edit control and the overflow menu
- [x] 2.2 Delete the `hoverVisibleCss` / `activeCardCss` styles and the `activeIndex` state so the actions render unconditionally, and drop the `onOptionToggle` handler that existed only to keep them visible
- [x] 2.3 Remove the `Switch` from the row and add an Enable/Disable item to the overflow menu, labelled from the region's current state and calling the existing `handleToggleRegion`; widen the dropdown so the label fits
- [x] 2.4 Rework `handleEditAndDelete` from its two-branch `if/else` into explicit per-action early returns now that the menu has three actions, keeping the delete confirmation as-is
- [x] 2.5 Add the dedicated edit control beside the overflow menu, navigating via the region's strategy edit link — the same destination the menu's Edit uses
- [x] 2.6 Relabel the card's add button to "Add", leaving `HeaderActionsCard` itself unchanged
- [x] 2.7 Confirm the empty state, the add-region dialog and every save/delete/toggle handler are untouched

## 3. Badges and row surface

- [x] 3.1 Replace `resolveSummary` on the strategy contract with `resolveBadges: (region) => TaxRegionBadge[]`, adding the `TaxRegionBadge` (`{ label, variant }`) type beside it
- [x] 3.2 Return an `info` scheme badge plus a `default` coverage badge from the EU strategy, omitting the scheme badge when the region has no VAT scheme
- [x] 3.3 Return a single `default` coverage badge ("Entire country" or the state count) from the general strategy
- [x] 3.4 Render the badge list in the row, and move the row from `innerCard` to `innerDarkCard`/`innerDarkContent` so it sits on its own filled surface
- [x] 3.5 Cover both strategies' badge output in their `region-display` tests — scheme/coverage split, the no-scheme case, and country-wide vs per-state coverage

## 4. Overflow glyph

- [x] 4.1 In `resources/app/components/dropdown-button.tsx`, make the unused `direction: 'horizontal'` branch render lucide's three-dot `Ellipsis` instead of `EllipseIcon`, leaving the vertical default alone
- [x] 3.2 Pass `buttonProps={{ direction: 'horizontal' }}` from the tax region row

## 5. Verification

- [x] 5.1 `cd resources/app && npm test -- tax` — new rate-label and region-display suites pass and the existing tax suites stay green
- [x] 5.2 `cd resources/app && npm run typecheck` — confirms both strategies satisfy the widened contract
- [x] 5.3 `cd resources/app && npm run lint`
- [x] 5.4 Hand the visual check to the user (per CLAUDE.md §0, no browser preview): Settings → Tax with an EU region and a general region in both country-wide and per-state mode
