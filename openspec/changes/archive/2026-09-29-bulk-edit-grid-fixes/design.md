## Context

This change follows directly on `bulk-edit-grid-polish` (archived), which introduced non-contiguous Cmd/Ctrl-click selection, outline-based selection indicators, and a "click preserves selection" behavior. Real-browser testing (the user explicitly authorized Browser MCP for this pass, overriding CLAUDE.md §0's default) found that behavior wrong in practice and surfaced four more implementation bugs plus one missing capability. See `proposal.md` for the full list and grill-me decisions; this document covers only the technical approach.

Two existing architectural facts shape the approach:

- `CellSelectionProvider` (`contexts/cell-selection-context.tsx`) has no access to `react-hook-form`'s form context — it only tracks selection/active-cell state and exposes callbacks. Anything that needs to write a form value already goes through a callback prop supplied by the page that owns the form: `onFillCommit` is the existing precedent (selection context detects a fill-drag completion and calls the prop; the parent, which has `useFormContext`, performs the actual `setValue` calls).
- Every cell's `<td>` already carries `data-bulk-row`/`data-bulk-field` (used by `resolveCellAtPoint` for drag auto-scroll); `bulk-edit-cell.tsx` stamps these unconditionally on selectable cells.

## Goals / Non-Goals

**Goals:**
- Revert the click-selection-collapse behavior without touching the still-wanted Cmd/Ctrl-click toggle machinery in `lib/selection.ts`.
- Add "select then type to edit" for text/number/money cells and "click glyph to toggle, Space to fan-toggle" for checkboxes, using the existing callback-to-form-owner pattern rather than giving the selection context form access.
- Fix four real-browser-only bugs (layout shift, grabber clipping, scrollbar position/visibility, row borders) via the same live-diagnose-before-fix methodology `bulk-edit-grid-polish` used for its own Group 7 fixes — root causes are not yet known and must not be guessed at in this document.
- Make the Variants column identity resolve real attribute labels end-to-end (backend Resource → schema → cell).

**Non-Goals:**
- No change to fill-handle drag mechanics, edge-auto-scroll, or the non-contiguous selection data model itself (`toggleSelection`, `commitFill`, etc. are untouched).
- No change to validation rules or the save/submit payload shape.
- No move away from real per-cell `<input>` elements toward a canvas/virtual-input rendering model — the click-to-type mechanism is designed to work within the current DOM-per-cell architecture.

## Decisions

**1. Selection-collapse revert.** Remove the `isCellSelected(current, field, row)` branch from `onCellMouseDown` in `cell-selection-context.tsx` that currently preserves the selection on a re-click. A plain click always falls through to `startSelection`. Shift-click and Cmd/Ctrl-click branches, and `handleOutsideMouseDown`'s `clear()`, are unchanged.

**2. Click-to-type via a new callback prop, not context-embedded form access.** `CellSelectionProvider` gains a document-level `keydown` listener (added alongside its existing `mousedown`/`mousemove` window listeners) that fires when: a selection exists, `document.activeElement` is not already an editable element (input/textarea/button/contenteditable — checked the same way `handleOutsideMouseDown` already checks `event.target`), and the pressed key is a single printable character (not a modifier combo, not Enter/Escape/Space/Tab, which keep their existing handling). On match, it reads the target cell's DOM node via `data-bulk-row`/`data-bulk-field` (the selection's `field` + `focusRow`, i.e. the most recently touched cell) to confirm it's a text/number/money kind (a new `data-bulk-editable-kind` attribute on the `<td>`, written in `bulk-edit-cell.tsx` from `column.columnDef.meta.cellKind`, keeps this DOM-attribute-driven lookup consistent with `resolveCellAtPoint`'s existing pattern instead of importing `columns.tsx` into the selection context). It then calls a new `onTypeToEdit(field, row, char)` prop — mirroring `onFillCommit` — which the form-owning parent (wherever `onFillCommit` is currently wired, in the page component around `bulk-edit-table.tsx`) implements by calling `setValue(rowPath(row, field), coerced(char))` for every row `getPropagationTargets` returns, then `selection.activateCell(field, row)`. `bulk-edit-cell.tsx`'s existing focus-on-activate `useEffect` (from `bulk-edit-grid-polish`'s task 7.5) then focuses the now-active, already-seeded input with no further change needed there — the effect doesn't care whether the value was seeded or original.

Double-click and Enter keep today's path (`activateCell` with no seed), so the input activates with its existing value and cursor placed, satisfying the "edit in place" scenario.

**3. Checkbox toggle uses the same two hooks, not new machinery.** A direct click on the checkbox glyph already reaches `CheckboxControl`'s own `onCheckedChange` (it sits under `pointerEvents: active ? 'auto' : 'none'` today, which blocks it while inactive — this must change to let the glyph itself always receive pointer events, independent of `active`, while the rest of the cell keeps the existing pointer-events gate). On check, `CheckboxControl` calls the existing `usePropagatedChange` fan-out (unchanged) and also calls `selection.onCellMouseDown`/an equivalent "select this cell" call so it becomes active — reusing `onCellMouseDown`'s existing selection-start path rather than inventing a second one. Space-to-toggle reuses the same `keydown` listener from Decision 2: when the target cell's `data-bulk-editable-kind` is `checkbox` and the key is `' '`, it calls a sibling `onSpaceToggle(field, row)` prop (same callback-to-form-owner shape as `onTypeToEdit`) instead of seeding a keystroke.

**4. Real-browser bugs are diagnosed live before any fix is written**, per the `bulk-edit-grid-polish` Group 7 precedent (five bugs there turned out to have non-obvious root causes — a CSS specificity fight, a missed control, an overflow-bubbling conflict, a ref-lifecycle deadlock, and a missing `.focus()` call — none guessable from reading the code alone). `tasks.md` records each bug as "diagnose live, then fix," not as a pre-decided CSS change.

**5. Attribute labels: additive backend field, not a new endpoint.** `VariantResource::to_array()` already has `$this->attribute_values` loaded (used today for the ID array); the fix projects the label field too (e.g. `attribute_value_labels: string[]`) in the same response, avoiding a new route or a second network round-trip. Frontend: `VariantSchema` gains the matching optional array field; `VariantIdentityControl` renders `{name}{labels.length ? ' - ' + labels.join(' | ') : ''}`.

## Risks / Trade-offs

- **[Risk]** A document-level `keydown` listener could intercept keystrokes not meant for the grid (e.g. a merchant typing into an unrelated modal that happens to be open over the grid). → **Mitigation:** guard on `document.activeElement` not already being an editable element, the same defensive check `handleOutsideMouseDown` already uses for clicks; a modal's own input would already hold focus and be excluded.
- **[Risk]** Replacing a cell's entire value on the first keystroke is a data-destructive default if a merchant intended to append. → **Mitigation:** this is the explicitly requested Sheets semantic (confirmed via grill-me); double-click/Enter remains the discoverable path to edit-in-place.
- **[Risk]** Handling Space for checkbox-toggle must call `preventDefault()`, or the browser's default page-scroll-on-Space fires simultaneously. → **Mitigation:** call `preventDefault()` only when the resolved target cell's kind is `checkbox`; all other Space presses (nothing selected, or a real input already focused) are left alone.
- **[Risk]** The four real-browser bugs may have root causes as structurally deep as `bulk-edit-grid-polish`'s ref-lifecycle deadlock, which could make them take longer than a typical CSS tweak. → **Mitigation:** budgeted as open-ended "diagnose then fix" tasks rather than fixed-effort line items, consistent with how Group 7 was actually executed last time.

## Migration Plan

No data migration. The backend response field is additive (existing consumers of `VariantResource` ignore an unknown key). The frontend schema field is additive/optional, so it doesn't break parsing of responses from a not-yet-deployed backend during a rolling release. No feature flag needed — this ships as a normal deploy once verified.

## Open Questions

None blocking implementation — all decisions were resolved via grill-me before this document was written. The exact backend response key name (`attribute_value_labels`) can be adjusted during implementation if a closer existing convention is found in `VariantResource.php` or its siblings; that would not change the spec or the frontend-visible behavior.
