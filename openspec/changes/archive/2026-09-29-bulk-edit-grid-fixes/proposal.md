## Why

Real-browser testing of the just-shipped `bulk-edit-grid-polish` change (jsdom had already missed several layout/focus bugs there) surfaced 10 further issues: a click-selection behavior that needs reverting to plain click-to-select-one, an editing model that still takes too many clicks to type or toggle a checkbox, missing row borders, a mispositioned/unhideable scrollbar, a clipped fill handle, layout shift on selection, and a variant title that doesn't show which attribute combination a row is.

## What Changes

- **Selection click semantics REVERSED**: clicking any cell — selected or not — now collapses the selection to just that cell, instead of preserving a multi-cell selection when the clicked cell is already part of it. **BREAKING** (reverses a `bulk-edit-grid-polish` behavior shipped in the prior change).
- **Sheets-style click-to-type editing**: a single click on a text/number/money cell selects it without focusing its input; the first printable keystroke while it's selected focuses the input and replaces its entire value (not two-stage activate-then-type).
- **Checkbox click/keyboard model**: clicking the checkbox glyph directly toggles it and selects the cell; clicking elsewhere in the cell only selects. Space toggles every selected checkbox cell in that column.
- **Select-like cells stay two-click** (select, then open) — re-verified/re-affirmed against a real-browser regression that showed 3 clicks.
- **Variant title format**: the Variants column shows `{Product Title} - {Attribute1} | {Attribute2}` instead of `{name} (#N)`.
- **Bug fixes** (real-browser-only, diagnosed live): selecting a cell no longer changes its height/vertical alignment; the fill handle is no longer clipped; the horizontal scrollbar sticks to the grid's own bottom edge (not the page) and the native scrollbar stays hidden; row (horizontal) grid lines render again alongside column (vertical) lines.

## Capabilities

### Modified Capabilities

- `bulk-edit-grid`: cell selection click semantics reverted to click-to-select-one; two-stage editing changes to Sheets-style click-to-type with value-replace semantics; checkbox cells gain a direct-toggle + Space-toggle interaction; the Variants column's identity format is made precise (`{Product Title} - {Attribute1} | {Attribute2}`), fulfilling the existing "variant name and attribute combination" requirement text that the current implementation falls short of.

## Impact

- Frontend: `resources/app/features/bulk-edit/contexts/cell-selection-context.tsx`, `lib/selection.ts`, `pages/bulk-edit-table/bulk-edit-cell.tsx`, `pages/bulk-edit-table/bulk-edit-table.tsx`, `pages/bulk-edit-table/horizontal-scrollbar.tsx`, `components/fields/bulk-edit-cell-fields.tsx`.
- Frontend (additive schema field): `resources/app/features/products/schemas/catalog/variant.ts` gains `attribute_value_labels`.
- Backend (additive response field): `app/Resources/Variant/VariantResource.php`'s `to_array()` gains an `attribute_value_labels` key resolved from the already-loaded `attribute_values` relation.
- No shared `components/ui/*` files are expected to need edits — the border/scrollbar/clipping bugs are diagnosed as bulk-edit-scoped CSS issues, consistent with `bulk-edit-grid-polish`'s precedent of fixing everything via scoped overrides in `features/bulk-edit/` files.
