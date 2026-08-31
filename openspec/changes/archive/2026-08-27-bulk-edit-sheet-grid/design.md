## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **The backend already fits.** `PUT /variants/bulk` → `VariantService::bulk_update()` calls `$variant->update($data)`, a mass-assignment merge, so absent keys are left untouched. `BulkUpdateVariantRequest` requires only `variants.*.id`; every other field is `nullable`, and unlisted keys are dropped by `filters()`. `prepare_for_validation()` runs `Money::to_minor()` on `base_price`, `base_sale_price`, and `base_cost_of_goods`, so money crosses the wire in **major** units. No PHP change is needed.
- **The app has no virtualization library.** `@tanstack/react-table` 8.21 is present and used by 11 features through `components/data-table/`; nothing virtualizes.
- **`components/form/*` fields are RHF-bound** — each pulls `control` from `useFormContext()` and renders its own `Controller` inside a `Field` wrapper with `FieldLabel` / `FieldDescription` / `FieldError`. They all accept `cssOverride`.
- **Variants have no dimension fields.** `length`/`width`/`height` live on shipping boxes, reached through `shipping_box_id`. `ShippingBoxField` already renders `${name} - ${l} × ${w} × ${h} ${unit}` and has a `compact` borderless mode.
- **Entry points already work.** Both callers navigate to `/variants/bulk?ids=…`; neither is in scope.

## Goals / Non-Goals

**Goals:**

- One column registry driving headers, cells, widths, and visibility — the current code keeps `allTableHeaders` and a fixed source order in `single-row.tsx` hand-synced.
- Keep per-keystroke work proportional to what is on screen, not to the number of loaded variants.
- Keep form state and selection state in separate subscriptions so a mousemove never re-renders a form-bound cell.
- Reuse the product form's variant validation rules rather than restating them.

**Non-Goals:**

- Generalizing `components/data-table/DataTable` to cover spreadsheets. Its `Card` wrapper, pagination, row-selection column, bulk-action bar, and noop `onColumnPinningChange` all fight this surface; adding escape hatches would put regression risk on 11 other tables.
- Column virtualization. 21 columns do not warrant it.
- Column reordering or resizing.

## Decisions

### Bespoke `useReactTable` in the feature

Build `useReactTable` directly in `features/bulk-edit/`, reusing only the leaf pieces: `getPinnedCss` / `getPinningStyle` from `components/data-table/column-styles.ts` and the `components/ui/table` primitives. Column extras ride on TanStack `meta`, which `global.d.ts` already augments with `alignment` and `cssOverride`; extend it with `cellKind` and `gatedBy`.

*Alternative rejected:* extending the shared `DataTable`. See Non-Goals.

### Row virtualization via spacer rows, not transforms

Add `@tanstack/react-virtual`. Render a `<tr>` of height `paddingTop` before the visible window and one of height `paddingBottom` after it, with real `<tr>` rows in between. The conventional `position: absolute; transform: translateY()` pattern requires abandoning table layout, which would break `position: sticky` on the pinned cell and force every column width to become a hardcoded pixel value.

Row height is a **fixed 32px**, so `estimateSize: () => 32` is exact — no dynamic measurement, no scroll drift. This is why `FieldError` must never render inline: a wrapped error message would change a row's height and desynchronize the virtualizer from its own arithmetic.

Because widths must not shift as rows swap in and out, every `ColumnDef` carries an explicit `size` and the table uses `tableLayout: fixed`. This also gives the custom scrollbar a stable `scrollWidth`.

### React Hook Form without `useFieldArray`

`useForm({ defaultValues: { variants } })` + `FormProvider`; cells address `variants.${rowIndex}.${field}`. `useFieldArray` exists for arrays that grow and shrink — rows here are fixed, so its `fields` bookkeeping and synthetic ids would be pure overhead at 1000 rows and would have to be reconciled with the virtualizer's index math.

The scale objection to RHF mostly dissolves under virtualization: only ~20 rows are mounted at a time, so only ~440 fields are ever registered, not ~22,000. Values for unmounted rows persist in RHF's internal store, which is exactly what is needed when a fill spans rows that have scrolled out.

What this buys, all of which the current reducer lacks: `formState.isDirty` for a real unsaved indicator and navigation guard, a Zod resolver reusing `ProductFormVariantShape`'s rules (notably `requiredWhen` for sale ≤ regular), uncontrolled inputs so typing re-renders nothing, and direct use of `components/form/*`.

*Alternative rejected:* a `useSyncExternalStore` store. Best possible per-cell granularity, but it cannot use `components/form/*` at all, needs hand-rolled validation, and diverges from the project's RHF+Zod convention for no behavior the specs ask for.

### Range writes as looped `setValue`

A range edit loops `setValue(path, value, { shouldDirty: true })` over the range. Writing to an unmounted row is a plain object write with no render, so a 400-row fan-out costs 400 cheap writes and at most ~20 re-renders. `reset()` would be one pass but destroys focus and remounts controllers, which is unacceptable mid-edit.

### Selection state lives outside the form

Selection is `{ field, anchorRow, focusRow, mode }` in its own context — single column, no 2D ranges, since filling across heterogeneous column types (money → checkbox → select) has no defined meaning. Keeping it out of the form context is what stops a mousemove from re-rendering form-subscribed cells. The range is derived from `(anchorRow, focusRow)` on read rather than accumulated per row, which is what makes per-row `mouseenter` survive virtualization: only the row under the pointer must be mounted.

Two consequences that are load-bearing, not polish:

- **Edge auto-scroll is mandatory.** Without it a drag-fill cannot reach row 400 from row 1, because rows that never mount never fire `mouseenter`.
- **A `mousemove` fallback on the container** is needed so a wheel-scroll mid-drag still resolves the row under the pointer.

One `mouseup` listener at the table root, never per row.

### Two-stage editing

The control is always rendered (so the grid looks live) but sits under `pointer-events: none` until its cell is active. First mousedown selects and may begin a body-drag; a second click, Enter, or double-click activates and focuses. This is the only model where body-drag is reliable — with a focused `<input>` under the pointer the browser wants to select text, and no amount of `user-select: none` plus `preventDefault` makes that robust across text, checkbox, and select cells.

### Cell composition under the 32px lock

Use `components/form/*` + `cssOverride` where the field cannot error and its `Field` wrapper collapses cleanly to 32px. Where it can error — money, number, text — use `<Controller>` + `components/ui/*` primitives with `cssOverride` instead, and present the error as a red border plus tooltip. Controls get `height: 32px` with no vertical padding; cells get `height: 32px; padding: 0 8px`.

### Payload

Send all rows, with the keys `filters()` provably discards stripped (`*_money_object`, `display_*`, `committed_quantity`, `profit`, `margin`, timestamps). Money stays in major units. This was chosen over a dirty-rows-only diff at the user's direction; the trade-off is recorded below.

### Option queries hoisted

Tax profiles, shipping profiles, and shipping boxes are fetched once at table level with `{ limit: -1 }` and passed down. Per-row hooks would issue 1000 duplicate queries.

## Risks / Trade-offs

- **Full-payload save clobbers concurrent edits** → A ~1000-row save posts ~1.5–2 MB (under PHP's 8 MB `post_max_size`) and rewrites every column of every variant, including ones nobody touched. If another admin edited a variant in the same window, that edit is overwritten. Accepted by decision; stripping discarded keys limits the payload but not the clobbering. Revisit by switching to a dirty-fields diff — the backend's merge semantics already support it.
- **Money round-trip drift** → Untouched rows round-trip `minor → major → minor` on every save. `Money::to_minor()` is a rounding conversion, so pathological float values could drift over repeated saves. Mitigate by sending the value exactly as received rather than reformatting it.
- **Virtualizer desync if any row deviates from 32px** → Scroll position and fill targeting both depend on `estimateSize` being exact. Mitigation: never render inline errors or wrapping content in a cell; enforce `height: 32px` on the row and overflow-hidden on cells.
- **`mouseenter`-driven drag is lossy under fast pointer movement** → Mitigated by deriving the range from `(anchor, focus)` rather than accumulating, plus the container `mousemove` fallback.
- **Immediate propagation on every keystroke across a large range** → 400 `setValue` calls per keystroke. Cheap because unmounted writes do not render, but it is the first thing to profile. Fallback if it bites: debounce propagation to non-anchor rows while keeping the edited cell live.
- **No undo** → A fill across 400 rows is irreversible short of discarding everything. Explicitly out of scope; the Cancel-confirm flow is the only safety net.
- **New dependency on a wp.org-distributed plugin** → `@tanstack/react-virtual` is small and from a vendor already in the bundle; it must appear in the build's third-party disclosure alongside the existing TanStack packages.

## Migration Plan

Self-contained within `features/bulk-edit/`. `routes.tsx`, `services/`, and `skeletons/` survive; the store, table, row, hooks, and lib files are deleted and replaced in one change. The feature barrel currently exports `BulkEditFormProvider` and `useBulkEditForm`; only `features/inventory/pages/inventory.tsx` reaches into this feature from outside, and only for `useUpdateBulkVariantsMutation`, which is unchanged. Rollback is reverting the change — there is no data migration and no API contract change.
