## Context

For motivation, see proposal.md. Current state that shapes the approach:

- `attribute-list.tsx` renders the sortable cards (dnd-kit) and a single `editingId` (`number | 'new' | null`). `add-or-edit-attribute.tsx` owns a nested `react-hook-form` sub-form (`ProductAttributeFormSchema`) and commits through `useVariantMatrix()` (`addAttribute` / `updateAttribute` / `removeAttribute` / `reorderAttributes`). Each of these returns a `MatrixMutation` with `discarded` and `commit()`.
- `lib/variant-matrix.ts` keys variants by **attribute value id** (`variant.attribute_values`). A rename creates new value ids, so saved variants must be remapped or they fall into `discarded`.
- `AttributeValuesField` wraps `MultiSelect` and creates values on the server immediately (`useCreateAttributeValueMutation`). `attribute-value-types.tsx` is the per-type registry (`renderOption`, `renderChip`, `createVia`).
- `MultiSelect` already supports `onCreate`, `panel`, and render slots. It has no pinned footer action.
- `useAttributesQuery({ limit: -1 })` already loads every attribute with its values, ordered by `id asc` (`AttributeController::get`). Presets, the add popover and the uniqueness check can all derive from this one cache.
- The backend has single-row create/update endpoints only. `AttributeService` has no transaction. `AddressService::create` shows the house pattern: `DB::begin_transaction()` / `commit()` / `rollback()`.

## Goals / Non-Goals

**Goals:**

- All attribute-table writes from the card happen once, on Apply, in one request.
- The card's draft is fully local, so Cancel is a pure state reset.
- A rename keeps saved variants intact.
- `MultiSelect` additions are opt-in, and existing consumers render identically.

**Non-Goals:**

- Settings → Variation Library UI and its endpoints.
- Deleting attributes or values from the attributes table.
- Changing the product save payload or the variant table.
- Per-product color overrides.

## Decisions

### 1. Draft model: one card-local form, values carry `id | null`

Each open card owns a `react-hook-form` instance whose shape is `{ source_attribute_id?, name, type, values: [{ id?: number, value, color?: string|null }] }`.

- `source_attribute_id` is the attribute the card opened from: an applied attribute, a preset, or a popover pick. It is absent for the new-attribute form.
- A value with `id` is an existing row. A value without `id` is a draft create.
- A recolor is detected by comparing `color` with the cached value's color.

The schema goes in `schemas/forms/product-attribute-form.ts`, replacing the old shape, and its `.transform()` produces an **Apply plan**:

```
{ kind: 'create', name, type, values[] }                       // new form, or renamed
{ kind: 'sync', attribute_id, create[], update[] }             // same attribute, maybe no-op
```

`kind` is `create` when `source_attribute_id` is absent or `name` differs (trimmed) from the source's name. For a renamed `create`, every selected value is copied, including those that had ids, and the plan also carries `replaces: source_attribute_id` plus a name map, used for remapping (see decision 4).

*Alternatives:* keeping drafts in the parent product form would leak draft state into the product's dirty tracking and the unsaved-changes bar. A reducer instead of RHF would lose the resolver and error wiring the codebase already uses.

### 2. Apply runs one request, then one matrix commit

`useApplyAttribute()` (new hook, in `sections/variants/attribute-list/`) does the following:

1. Validate and parse the plan.
2. **Confirm first.** Only removing already-persisted values can discard saved variants. Draft values only add combinations, and a rename is remapped (see decision 4). So the discard set can be computed from the current value ids before any request. If saved variants would be discarded, show the existing confirmation, and stop if the merchant cancels.
3. **Request.** Skip it if the plan is `sync` with empty `create`/`update`. Otherwise call `POST /attributes` (with `values`) or `POST /attributes/{id}/values/batch`.
4. **Commit.** Build the committed `Attribute` from the response, using server ids for created values. Then call the matrix mutation (`add`, `update`, or the new `replace`) and `commit()`.
5. Invalidate `attributeKeys` so presets, the add popover and the value options refresh.

Server 422s are mapped onto the card via the existing `applyServerErrors`. `name` maps to the name field, and `values.*` / `create.*` map to the value field. The card stays in edit mode with its draft intact.

*Alternative:* request first, then confirm. Rejected, because cancelling the prompt would leave newly created rows the merchant just declined.

### 3. Backend: extend create, add a batch endpoint, one transaction each

- `AttributeCreateRequest`:
  - Add `values` (`array|nullable`), `values.*.value` (`required|string`) and `values.*.color` (nullable, hex pattern).
  - Sanitize through `Sanitizer` (`TEXT` for value, a hex-color rule for color).
  - Check payload-internal duplicates in the request's validation hook, case-insensitive after trimming.
- `CreateAttributeDTO` gains `values` (array of `CreateAttributeValueDTO`-like arrays).
- `AttributeService::create` wraps the attribute insert and `AttributeValueService::insert()` in `DB::begin_transaction()`.
- New `AttributeValueBatchRequest`, `BatchAttributeValuesDTO`, `AttributeValueController::batch` and `AttributeValueService::batch`, plus the route `POST /attributes/{attribute_id}/values/batch`, registered next to the existing value routes. The existing `unique_attribute_value` DB index is the last-line guard, and a constraint violation rolls back.
- Both return the fresh attribute via `AttributeResource` (the batch returns the attribute, not just the touched values), so the client has one response shape to reconcile.

Money rules don't apply. PHPCS wporg rules, docblocks (`@since` = next release version) and `protected` visibility all apply.

*Alternative:* sequential client calls. Rejected, because a failure part-way leaves partial state (grilled decision).

### 4. Rename remapping lives in the variant matrix

Add `replaceAttribute(previousId, next, valueIdMap)` to `use-variant-matrix.ts`, backed by a pure `remapAttributeValues(variants, valueIdMap)` in `lib/variant-matrix.ts`.

- It rewrites each variant's `attribute_values` ids from old to new before `syncVariantMatrix` runs, so saved variants match their new combinations and keep their `id`, SKU, stock and price.
- It puts `next` at `previousId`'s index.
- `valueIdMap` is built after the create response, by pairing old and new values on trimmed, lower-cased names.

This keeps the "single write path" requirement: `replace` is just another `prepare()` input.

### 5. Presets and the `+ Add` popover are derived, not stored

`usePresetAttributes(attachedIds, draftSourceId)` is a pure selector over the `limit: -1` cache:

- It builds `available`, which is every attribute not attached and not currently open as a draft, sorted by id.
- `presets = available.slice(0, 3)` and `overflow = available.slice(3)`.
- `+ Add` opens the popover when `overflow.length > 0`, and the new-attribute form otherwise.

The popover reuses the `Combobox`/command primitives with a pinned footer item. No new primitive is needed beyond what `MultiSelect` gets in decision 6.

### 6. `MultiSelect` gets an opt-in footer

- `footer?: (query: string) => ReactNode` renders a sticky action below the scrollable list, outside cmdk's filtered group, so it's always visible. When `footer` is supplied, the built-in create row is suppressed. The field renders `+ Add new value` / `+ Add "<query>"` itself and handles Enter through the existing `onCreate`.
The field keeps `MultiSelect`'s default boxed look, the same as Tags: chips and the cursor wrap inside one bordered box, and the popover takes the box's width through `--radix-popover-trigger-width`. No width or layout override is needed.

### 7. Value creation moves into the type registry

Extend `AttributeValueTypeConfig`:

- `resolveInlineColor?: (query) => string | null` (color → the CSS named-color lookup, list → absent).
- `dialogFields: ('title' | 'color')[]`.

`createVia` goes away, since both types now create inline on Enter and both open the dialog from an empty `+ Add new value`. `VariationDialog` renders its color field only when `dialogFields` includes `color`. Drafts are appended to the form's `values` with no `id`.

`utils/css-named-colors.ts` is a static `Record<string, string>` of the 148 CSS names. Lookup lower-cases the input and strips whitespace, so "Light Blue" matches `lightblue`.

### 8. Swatch recolor uses the existing `ColorPicker`

In edit mode on `color` types, `renderChip` wraps the swatch in `ColorPicker` (`value`, `onValueChange`), which writes the chip's `color` in the draft. The chip's remove button and the picker trigger are separate hit targets. `onPointerDown` stops propagation, so the picker doesn't open the value popover.

### 9. View mode keeps the hover Edit/Delete buttons

This is a user correction during proposal. The view card keeps today's `ActionGroup` with Edit and Trash, revealed on hover and on `:focus-within`, which adds keyboard reveal to today's hover-only CSS. Edit sets `editingId`. Trash calls the same detach flow as the edit-mode Delete. The card body is not clickable.

### 10. Name field: regular input, uniqueness on blur

This is the regular bordered `Input`, with no local styling, so it lines up with the value box below. `onBlur` compares `trim().toLowerCase()` against the cached names, excluding `source_attribute_id`'s own name, and calls `setError('name', …)`. The resolver re-runs the same check on Apply, so a merchant can't Apply past it without blurring.

## Risks / Trade-offs

- [The `limit: -1` cache is stale when another admin creates an attribute concurrently] → The server's `unique:name` still rejects, and the error maps back to the field.
- [A rename remaps by value name, but two old values normalise to the same name] → This can't happen, because the per-attribute unique index plus case-insensitive dedupe in the create request guarantees distinct names.
- [A recolor is global and may surprise merchants with other products using the value] → Accepted in grilling. No extra warning in this change.
- [The `MultiSelect` `footer` suppresses the built-in create row] → It's opt-in only. Existing consumers don't pass it, and tests cover both paths.
- [Presets change as attributes are attached, so buttons shift] → This is expected behavior. The row is below the cards, so it doesn't push content the merchant is working in.

## Migration Plan

No DB migration. The backend additions are backward compatible: `values` is optional on create, and the batch endpoint is new. Frontend and backend ship together in one release. Rollback is a plain revert.

## Corrections during implementation

- **Color-name lookup already existed.** `utils/color.ts` already had `getHexFromColorName` (backed by `utils/color-names.ts`, tested in `utils/color.test.ts`). It ignores case, whitespace and dashes, and deliberately maps `green` to the vivid `#00ff00` rather than CSS's `#008000`. The registry's `resolveInlineColor` reuses it, and no `utils/css-named-colors.ts` was added. So "Green" resolves to `#00ff00`, not the strict CSS value.
- **Name uniqueness is not schema context.** `ProductAttributeFormSchema` stays static, per the canonical form pattern, and `findAttributeNameClash()` in the same module is the check. The name input calls it on blur, and `useApplyAttribute` calls it again before anything else on Apply, so a merchant who never blurs is still caught. The Apply plan carries `replaces`, but the old-to-new value-id map for a rename is built from the create response by name, inside the hook, rather than in the transform.
- **A case-only rename is not a rename.** The plan compares names case-insensitively, so "size" → "Size" produces a `sync`, not a new attribute. Otherwise the server's `unique:name` rule (case-insensitive under MySQL collations) would reject the copy, because the source attribute still exists.
- **The draft confirmation uses provisional ids.** Draft values have no id before Apply, so the pre-request discard check gives them temporary negative ids. That way `syncVariantMatrix` still sees the full combination set, and only removals of persisted values surface as discards.
- **Review round: the value field is a plain boxed `MultiSelect`.** A first pass added `appearance="inline"` (chips unframed, a bordered input that shrank and wrapped) and an `anchorRef` that sized the popover to the card. On review, the field should look like Tags and the popover should match the input, so both props were removed and the default box is used. The name input's borderless, hover-bordered styling was dropped in the same round for a regular `Input`.
- **Swatch chips keep one line.** A chip's label sits in a `nowrap` span, and the swatch trigger inside it is a flex box, which broke the swatch onto its own line above the label. The registry now wraps the swatch and label in an `inline-flex` span.
- **The value dialog's color field is conditional.** `ProductVariationPopoverFormSchema` required `color`. It now requires it only when `requires_color !== false`, via `requiredWhen`, and `VariationDialog` sets that from a new `withColor` prop.
- **View-mode chips are rendered by the card.** `AttributeValuesField` has no read-only mode. The view card keeps today's `Chip` rendering and only puts the Edit/Delete `ActionGroup` behind `:hover, :focus-within`.
- **Orphans.** `components/ui/color-swatch.tsx` lost its only consumer (the old registry) and was removed. `ColorPickerSwatch` already renders the empty state the spec asks for.
