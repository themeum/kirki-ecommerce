## Why

The product edit Price card does not match the Figma design: checkbox rows duplicate label text via `FieldDescription`, overflow fixed-height inner rows, and hide right-side controls with `visibility: hidden` instead of the designed checked/unchecked states. Merchants need a clear, pixel-aligned pricing UI with optional label info tooltips.

## What Changes

- Add optional `infoText` on `FieldLabel`: when set, show a fixed info icon beside the label and a tooltip on hover
- Plumb `infoText` through form field wrappers under `resources/app/components/form/` that render a primary label
- Keep `description` as below-field helper text (`FieldDescription`); do not rename or replace it with `infoText`
- Align the Price card layout with Figma: remove duplicate descriptions, conditional-render unit-price and tax-profile controls when checked, unify inner dark-row layout and vertical spacing
- Keep existing Price behaviors: currency `$` prefixes, Tax Profile select + create popup when charging tax, Controllers + `syncVariantField` (no full migration to form wrappers this change)

## Capabilities

### New Capabilities

- `form-field-info-text`: Optional label info tooltip (`infoText`) on `FieldLabel` and form field wrappers
- `product-price-card`: Product edit Price card layout, checkbox row states, and pricing field presentation

### Modified Capabilities

- (none — no existing specs under `openspec/specs/`)

## Impact

- [`resources/app/components/ui/field.tsx`](resources/app/components/ui/field.tsx) — `FieldLabel` API
- Form wrappers under [`resources/app/components/form/`](resources/app/components/form/)
- [`resources/app/pages/products/edit-product/price/price.tsx`](resources/app/pages/products/edit-product/price/price.tsx)
- Uses existing `Tooltip` and info icon components; no backend/API changes
