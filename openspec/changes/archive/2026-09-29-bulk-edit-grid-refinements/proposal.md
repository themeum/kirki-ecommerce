## Why

Real-usage testing of the bulk-edit grid (against a live WordPress instance, via Browser MCP) surfaced eleven concrete defects and one missing capability: layout bugs (scrollbar overlap, clipped fill-handle, an oversized variant thumbnail, a fill-handle that visually floats over the pinned Variants column when scrolled), an incomplete column show/hide control (no grouping, no way to add an icon/label, and a Radix default that closes the menu after every checkbox click), a keyboard-input gap on the Weight column, a missing native reload/close warning, and a backend bug that makes every bulk save fail response validation. Each was root-caused by reading the actual code and/or reproducing it live rather than guessed, so this change fixes exactly what was found.

## What Changes

- Reserve bottom clearance inside the grid's scroll container so the native horizontal scrollbar no longer overlaps the last row.
- Add right-side clearance inside the scrollable table content so the fill-handle grabber is never clipped on the right-most column.
- Shrink the Variants column's media thumbnail to 24×24px (cell height stays 32px), scoped via `cssOverride`, without touching the shared `MediaPicker` component.
- Lower the fill-handle grabber's `z-index` below the pinned Variants column's, so it never paints over the pinned column once its own (unpinned) cell scrolls underneath.
- Replace the column show/hide control's underlying implementation (`DropdownButton`) with `DropdownMenu` primitives: an icon+label trigger, columns grouped under labeled categories, an always-checked/disabled Variants entry, and a menu that stays open across checkbox toggles (closing only on an explicit outside click or Escape) — fixing both the dropdown's own bug and the standing "grouped column visibility" gap.
- Fix the Weight column so the first keystroke on a selected (not yet active) cell seeds its value directly, matching every other numeric column, instead of requiring an extra activation click.
- Add a native `beforeunload` warning when the page is reloaded or closed with unsaved changes, alongside the in-app navigation guard that already exists.
- **Backend fix**: eager-load the variant's `product` (and `attribute_values`) relation in the bulk-update path before building the response, so `VariantResource`'s `name` field is populated the same way the read endpoints already populate it — fixing a save-time response-validation failure.

## Capabilities

### Modified Capabilities

- `bulk-edit-grid`: adds a requirement for the column-visibility menu's grouping and open/close behavior (grouped categories, an always-on Variants entry, stays open until dismissed).

## Impact

- Frontend: `resources/app/features/bulk-edit/**` (table/cell styling, the column-visibility control rebuilt as a small feature-local component, `lib/editable-kind.ts`, the navigation-guard hook).
- Backend: `app/Services/VariantService.php` and/or `app/Http/Controllers/Api/VariantController.php` (eager-loading fix only — no API contract change).
- No shared component files (`components/ui/dropdown-menu.tsx`, `components/dropdown-button.tsx`, `components/media-picker.tsx`, `components/data-table/column-styles.ts`) are modified — every fix is scoped locally within the bulk-edit feature to avoid regressing their other consumers.
