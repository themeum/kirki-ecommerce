## Context

See proposal.md for motivation. All root causes below were confirmed either by reading the actual source (frontend and backend) or by reproducing the bug live via Browser MCP against the running WordPress instance — none are guesses. Current relevant files:

- `resources/app/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table.tsx` — scroll container, table structure.
- `resources/app/features/bulk-edit/pages/bulk-edit-table/bulk-edit-cell.tsx` — per-cell rendering, grabber, activation effect.
- `resources/app/features/bulk-edit/components/fields/bulk-edit-cell-fields.tsx` — per-column-kind controls (`VariantIdentityControl`, `WeightControl`, etc.).
- `resources/app/features/bulk-edit/lib/editable-kind.ts` + `resources/app/features/bulk-edit/contexts/cell-selection-context.tsx` — the "select, then just type" keydown capture.
- `resources/app/features/bulk-edit/pages/bulk-edit.tsx` — page shell, column-visibility control, save/cancel/navigation-guard wiring.
- `resources/app/features/bulk-edit/hooks/use-bulk-edit-navigation-guard.ts` — in-app navigation guard (`useBlocker`).
- `resources/app/components/data-table/column-styles.ts` — shared pinned-column styles (`zIndex: 1` on a pinned body cell), used by `DataTable` elsewhere too — read-only reference, not edited.
- `app/Services/VariantService.php`, `app/Http/Controllers/Api/VariantController.php`, `app/Resources/Variant/VariantResource.php` — backend bulk-update path.

## Goals / Non-Goals

**Goals:**
- Fix all eleven confirmed defects without regressing any other consumer of the shared components they touch (`MediaPicker`, `DropdownMenu`, `Tooltip`, `column-styles.ts`).
- Make the bulk-update API response shape match what every read endpoint already returns, with no contract change.

**Non-Goals:**
- No redesign of the selection/fill model itself (`lib/selection.ts`) — none of the eleven items require it.
- No attempt to force-reproduce item 7 (intermittent blank cells) beyond the dropdown-close race already found; no speculative defensive code (extra remounts, keys, etc.) without a confirmed cause.
- No visual redesign beyond what each item specifically asks for.

## Decisions

### 1. Scrollbar overlap — reserve bottom clearance, don't restructure scrolling
Add `paddingBottom` inside `#bulk-edit-scroll-container`'s content (or on the table's last-row spacer) sized to a safe scrollbar-height estimate (e.g. `theme.spacing[4]`, 16px) so the browser's native horizontal scrollbar always has empty space below the last row's content to sit in. Alternative considered: reintroduce a custom overlay scrollbar (like the one removed in the prior `bulk-edit-grid-fixes` change) — rejected, since the user explicitly asked to keep using the native scrollbar and only fix the overlap.

### 2. Grabber clipping — add right-side clearance to scrollable content
Add a small fixed spacer (~`theme.spacing[3]`, 12px) to the right of the table's content inside the scrollable region (e.g. as `paddingRight` on the scroll container's inner content, or a trailing spacer cell) so the grabber's `right: -4px` / 6px-wide box always has room before hitting the container's `overflow: auto` boundary — confirmed via live `getBoundingClientRect()` that the current clip is ~3px into a 6px-wide element, so 8-12px of clearance is comfortably sufficient with margin for different zoom levels.

### 3. Variant thumbnail size — `cssOverride` from the feature, not the shared component
`MediaPicker`'s `size="small"` is hardcoded to 32×32px and has one other consumer (`variant-media-selector.tsx`) that wants that size — so the 24×24px shrink is applied purely via the `cssOverride` prop `MediaPicker` already accepts and merges onto its wrapper. If `MediaPicker`'s internal `Image`/`smallImage` sizing turns out to be driven by the wrapper's own `width`/`height` (likely, since it's a small square crop), the override alone suffices; if the inner image element needs its own explicit size, the override adds a scoped `'& [data-slot=...]'`/`'& img'` rule rather than editing `media-picker.tsx`. Cell height (32px) is untouched; the smaller image centers within it via the existing `<Flex align="center">` wrapper in `VariantIdentityControl`.

### 4. Grabber floats over the pinned column — lower the grabber's z-index, don't raise the shared column's
Root cause: `bulk-edit-cell.tsx`'s `styles.grabber` sets `zIndex: 2`; `column-styles.ts`'s pinned-cell style sets `zIndex: 1`. The `<td>` (`TableCell`, `position: relative` with no explicit `z-index`) does not establish its own stacking context, so the grabber's z-index escapes into the shared row stacking context and outranks the pinned column once the grabber's own (unpinned) cell has scrolled underneath it. Fix by lowering the grabber's z-index below 1 (or removing it, letting it default to `auto`/0) — scoped entirely to `bulk-edit-cell.tsx`. Alternative considered: raise the shared pinned-cell `zIndex` in `column-styles.ts` — rejected, since that file is shared with `DataTable` and any other pinned-column consumer, and the correct fix is local to the grabber that's overreaching, not the column being reached over.

### 5. Column-visibility control — rebuild locally with `DropdownMenu`, don't edit `DropdownButton`
`DropdownButton` (`resources/app/components/dropdown-button.tsx`) is shared with `data-table-row-actions.tsx` and has no icon/label/grouping support (`hasLeftIcon` is destructured and silently discarded — dead prop). Build a small new trigger+menu directly in the bulk-edit feature (either inline in `bulk-edit.tsx` or a colocated component under `features/bulk-edit/`) using `@/components/ui/dropdown-menu`'s primitives directly: `DropdownMenuTrigger asChild` wrapping a `Button` with a `Table2` icon and "Columns" text, `DropdownMenuLabel` per category, `DropdownMenuCheckboxItem` per column (each with `onSelect={(event) => event.preventDefault()}` so Radix's default close-on-select never fires), `DropdownMenuSeparator` between groups, and a disabled always-checked `DropdownMenuCheckboxItem` for Variants rendered outside the grouped list. This is also the fix for item 7 (intermittent blank cells): the most plausible cause found live-testing was the *current* `DropdownButton`'s menu unpredictably closing mid-toggle (Radix's default behavior racing its controlled `open` state, since its `DropdownMenuItem`'s `onSelect` never calls `preventDefault()`), leading to confused clicks landing on the table underneath. The rebuilt menu structurally cannot do that. No separate, speculative fix is added for item 7 beyond this.

### 6. Weight column keyboard input — extend the existing type-to-edit bucket, don't add new plumbing
`editable-kind.ts`'s `editableKindOf()` currently maps `cellKind` to `'text' | 'number' | 'money' | 'checkbox' | 'other'`; `'weight'` falls into `'other'` and is invisible to the "select, then type" keydown listener in `cell-selection-context.tsx`. Map `'weight'` to the existing `'number'` bucket (the weight value is numeric — no new `EditableKind` variant needed) and add a matching `'weight'` case to `bulk-edit.tsx`'s `coerceTypedValue`, seeding `variants.${row}.weight` the same way a plain `number` column is seeded. The adjacent unit `<Select>` is untouched — typing doesn't apply to a dropdown trigger.

### 7. Reload/close warning — native `beforeunload`, additive to the existing guard
Add a `window.addEventListener('beforeunload', ...)` effect guarded by `isDirty` (the same signal `useBulkEditNavigationGuard` already uses), calling `event.preventDefault()` and setting `event.returnValue = ''` — the standard cross-browser pattern for triggering the browser's own native prompt. This is additive to, not a replacement for, the existing in-app `useBlocker`-based guard, which already covers back-button/in-app navigation and needs no change. Note: `bulk-edit-form`'s existing spec already states "leaving the application while changes are unsaved SHALL trigger the browser's native prompt" — this change makes the implementation match a requirement that was already written but not yet built, so no spec delta is needed for this item.

### 8. Save-response validation failure — backend eager-loading fix, no API contract change
Confirmed via live network capture: PUT `/variants/bulk` returns `name: null` for every variant, which `VariantSchema` (correctly) rejects since `name` is documented as a non-nullable string everywhere else. `VariantResource::to_array()` reads `$this->product->title`; every *read* path (`VariantService::list_query()`, `find_or_null()`) eager-loads `product` via `Variant::with(['product.media', 'attribute_values'])` first, but `VariantService::update_variant()` does a bare `Variant::find($id)` with no eager-load before `VariantController::bulk_update()` hands those instances to `VariantResource::collection(...)`. Fix by eager-loading the same relations in the update path — either `$variant->load('product.media', 'attribute_values')` after each `update()` inside `update_variant()`, or re-fetching the updated IDs via the same `with([...])` pattern `list_query()` already uses, inside `bulk_update()`. The exact call site is decided during implementation by matching whichever the surrounding code already reads more naturally — both are equivalent in effect. No spec delta: `api-response-validation`'s existing requirement ("write response fails validation → operation fails, user is shown an error rather than the interface appearing to succeed") is already being honored correctly by the frontend; this is purely a backend data-correctness bug that the existing, correctly-behaving validation caught.

## Risks / Trade-offs

- **[Risk] The bottom/right clearance paddings (items 1, 2) are fixed-px estimates, not measured from the actual OS/browser scrollbar width.** → Mitigation: pick generous but small values (12-16px) verified visually via Browser MCP after implementation; if a specific OS renders a wider classic scrollbar, the padding degrades gracefully to "slightly more gap" rather than reintroducing the overlap.
- **[Risk] Item 7 (blank cells) has no clean repro, so the fix is inference-based, not proof-based.** → Mitigation: explicitly re-verify with the same manual toggle sequence via Browser MCP after the rebuild, and call this out to the user as "best available diagnosis" rather than "confirmed fixed," per the proposal's own framing.
- **[Risk] Backend fix touches a service method used by both single-row and bulk update paths (need to confirm `update_variant` isn't also called somewhere that assumes a bare, relation-less model for performance).** → Mitigation: re-read all call sites of `update_variant()`/`bulk_update()` during implementation before choosing the eager-load call site.
