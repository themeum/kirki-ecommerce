## Why

The bulk variant editor at `/variants/bulk` is the only place in the admin where most variant fields can be edited across many variants at once, but its implementation cannot carry that load. It is a hand-rolled `<table>` over a `useReducer` store where every keystroke shallow-copies the entire variants array and re-renders every cell, every row binds its own `window` mouseup listener, and drag state is prop-drilled so a single mousemove re-renders all rows. It also ships visible defects: the Tax Profile cell renders an empty `<SelectContent />` (no options at all), Shipping Profile options are hardcoded to four fictional names at ids 1-4, the SKU cell is `readOnly`, and the "Unsaved Changes" badge is a literal that is always on with no dirty tracking and no navigation guard behind it.

Merchants with large catalogues need to edit 500-1000 variants in one pass with spreadsheet ergonomics — range selection, fill-down, and a pinned identity column — and the current architecture cannot be tuned into that.

## What Changes

- **BREAKING (internal)**: Remove the `useReducer` store (`contexts/bulk-edit-form-context.tsx`), the hand-rolled row renderer (`pages/bulk-edit-table/single-row.tsx`), the split selection engine (`hooks/use-bulk-edit-row.ts`, `hooks/use-bulk-edit-list.ts`), and the fill/column helpers (`lib/fill-down.ts`, `lib/utils.tsx`). Nothing outside `features/bulk-edit/` imports them except through the feature barrel.
- Rebuild the grid on a bespoke `useReactTable` instance inside the feature, with a single `ColumnDef[]` registry driving both headers and cells (today two hand-synced orderings must be kept in step).
- Add row virtualization via a new `@tanstack/react-virtual` dependency, implemented as spacer `<tr>` elements inside a real `<table>` so the pinned column's `position: sticky` and separated borders keep working. Fixed 32px row height throughout.
- Replace drag-fill-only interaction with the three Google Sheets gestures: body-drag to select a range, shift-click to extend from the anchor, and fill-handle drag to copy the anchor value down. Selection is single-column. Editing any cell in a selection propagates immediately to the whole range.
- Adopt a two-stage edit model: a cell is first selected, then activated (second click / Enter / double-click) before its control takes focus.
- Move editable state from the reducer to React Hook Form (`useForm` with `defaultValues.variants`, no `useFieldArray`) with a Zod resolver, giving real dirty tracking, cross-field validation (sale price <= regular price), and per-cell error presentation.
- Add a navigation guard and a confirming Cancel; drive the "Unsaved Changes" badge from `formState.isDirty`.
- Fix the broken cells: populate Tax Profile from `useTaxProfilesQuery`, Shipping Profile from `useShippingProfilesQuery`, and make SKU editable.
- Add a custom horizontal scrollbar pinned to the viewport bottom, and persist the column show/hide choice to `localStorage`.
- Render an empty state when `?ids=` is missing or resolves to nothing — reachable today from the inventory page's "select all matching" mode, which navigates with an empty id list.

Out of scope: undo/redo, 2D rectangular selection, a Barcode column, row-select checkboxes, and any backend change (`PUT /variants/bulk` already accepts what this needs).

## Capabilities

### New Capabilities

- `bulk-edit-grid`: The spreadsheet surface — column registry and set, virtualized rendering at fixed row height, pinned identity column, custom horizontal scrollbar, cell selection and fill gestures, the two-stage edit model, and column visibility.
- `bulk-edit-form`: The editing lifecycle — form state ownership, range propagation semantics, gated-cell behavior, validation and error presentation, dirty tracking and navigation guarding, save payload construction, and post-save reconciliation.

### Modified Capabilities

- `product-form`: The "Payload mapping on submit" requirement asserts that the bulk-edit table "has its own reducer-based state and an untyped request body." That carve-out no longer holds once bulk edit moves onto React Hook Form with a typed, Zod-validated payload; the requirement's narrative must be corrected.

## Impact

- [`resources/app/features/bulk-edit/`](resources/app/features/bulk-edit/) — rebuilt; `routes.tsx`, `services/bulk-edit.ts`, `services/query-keys.ts`, and `skeletons/` survive, everything else is replaced.
- `resources/app/package.json` — adds `@tanstack/react-virtual`.
- Reused without modification: `calculateProfit` ([`utils/common.ts`](resources/app/utils/common.ts)), `BaseUnitDialog` and `ShippingBoxField` (feature barrels), `getPinnedCss`/`getPinningStyle` ([`components/data-table/column-styles.ts`](resources/app/components/data-table/column-styles.ts)), `VariantSchema`, `useTaxProfilesQuery`/`useShippingProfilesQuery`/`useShippingBoxesQuery`.
- Entry points unchanged: the product form's Edit Variants / Bulk Edit button and the inventory page's bulk action already navigate to `/variants/bulk?ids=…`.
- No API, DB, or PHP changes. `BulkUpdateVariantRequest` requires only `variants.*.id`; every other field is nullable and unlisted keys are stripped by `filters()`.
