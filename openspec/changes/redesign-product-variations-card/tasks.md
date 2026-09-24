## 1. Backend: transactional attribute writes

- [x] 1.1 Extend `AttributeCreateRequest` with `values`, `values.*.value` and `values.*.color` (a nullable hex rule), sanitizing through `Sanitizer`, plus a case-insensitive check for duplicate names within the payload
- [x] 1.2 Add `values` to `CreateAttributeDTO`, and wrap the attribute and value inserts in `AttributeService::create` in `DB::begin_transaction()`/`commit()`/`rollback()`
- [x] 1.3 Add `AttributeValueBatchRequest`, `BatchAttributeValuesDTO`, `AttributeValueService::batch` (one transaction; `update` ids must belong to the attribute; `create` must not duplicate existing names), `AttributeValueController::batch`, and the route `POST /attributes/{attribute_id}/values/batch`, returning `AttributeResource`
- [x] 1.4 Integration tests: create with values (success, duplicate name, duplicate values, bad color → nothing persisted); batch (create+update, foreign id, existing name, 404 → nothing persisted) — *written; not executed locally (Docker stack not running), run `composer test:docker:integration -- --filter=Attribute`*
- [x] 1.5 Verify: `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test:integration`, then `npm run typecheck && npm test` in `resources/app/` — *phpcs clean; typecheck clean; 1 pre-existing unrelated failure in `product-form.test.ts` (`committed_quantity`)*

## 2. Frontend services and pure helpers

- [x] 2.1 Add `values` to the create-attribute payload type, plus `useBatchAttributeValuesMutation` in `features/products/services/attribute.ts`, with response schemas and `attributeKeys` invalidation
- [x] 2.2 ~~Add `utils/css-named-colors.ts`~~ — *premise wrong: `utils/color.ts` already has a tested `getHexFromColorName` (CSS names, case/space/dash-insensitive, `green` → `#00ff00` override); reused it instead*
- [x] 2.3 Add `remapAttributeValues(variants, valueIdMap)` to `lib/variant-matrix.ts`, and `replaceAttribute(previousId, next, valueIdMap)` to `use-variant-matrix.ts` (keeps position, runs through `prepare()`), with cases added to `tests/lib/variant-matrix.test.ts`: saved variants keep id/SKU/stock/price after replace, and the attribute's order is preserved
- [x] 2.4 Add a preset selector (`available` / `presets` / `overflow`, from the `limit: -1` cache, excluding attached and draft-open attributes, by id ascending) with tests for 0, 2, 3, 5 attributes and the attached-backfill case
- [x] 2.5 Verify: `npm run typecheck && npm test` in `resources/app/` — *clean except the pre-existing `product-form.test.ts` failure*

## 3. Draft form schema

- [x] 3.1 Rewrite `schemas/forms/product-attribute-form.ts` to the draft shape (`source_attribute_id?`, `source_name?`, `name`, `type`, `values[{ id?, value, color?, original_color? }]`) with a required name — *correction: uniqueness is a pure `findAttributeNameClash()` helper (used on blur and at Apply) rather than schema context, keeping the schema static per the canonical pattern; `replaces` is carried but the value-name map is built from the response in the Apply hook* and at least one value. Its transform produces the Apply plan (`create` for new or renamed, including `replaces` and a value-name map; `sync` with `create[]`/`update[]` for recolors and drafts)
- [x] 3.2 Write `product-attribute-form.test.ts` covering: new form → create; unchanged → empty sync; draft + recolor → sync; rename → create with every value copied and `replaces` set; duplicate name → error; no values → error
- [x] 3.3 Verify: `npm run typecheck && npm test` in `resources/app/` — *schema tests pass; typecheck errors are confined to `add-or-edit-attribute.tsx` / `attribute-name-field.tsx`, which group 6 replaces*

## 4. MultiSelect opt-in additions

- [x] 4.1 Add a `footer?: (query) => ReactNode` prop, rendered pinned below the scrollable list; when it's supplied, the built-in create row is suppressed
- [x] 4.2 Add an `anchorRef?: RefObject<HTMLElement>` prop, which anchors the popover to that element and matches its width — *correction: the panel still opens beneath the field; `anchorRef` only sets its width and aligns its leading edge (anchoring to the card would drop it below the card's action row)*
- [x] 4.3 Make the chip row wrap: the input uses `flex: 1 1` with a 160px minimum and wraps to full width, with no layout shift — *delivered as opt-in `appearance="inline"` (chips unframed, border on the input alone) so the boxed look of existing consumers is unchanged*
- [x] 4.4 Tests: existing create-row behavior is unchanged without `footer`; with `footer`, it stays visible while the list is filtered and scrolled; the width follows `anchorRef`
- [x] 4.5 Verify: `npm run typecheck && npm test` in `resources/app/` — *53/53 MultiSelect tests pass, lint clean; typecheck errors still confined to the two group-6 files*

## 5. Value type registry and value field

- [x] 5.1 Replace `createVia` in `attribute-value-types.tsx` with `resolveInlineColor` and `dialogFields`; the `color` renderChip in edit mode wraps the swatch in `ColorPicker` (its pointer events don't open the popover)
- [x] 5.2 Make `VariationDialog` render the color field only when `dialogFields` includes `color` — *via a `withColor` prop; `product-variation-popover-form.ts` now requires `color` only when `requires_color !== false` (test updated)*
- [x] 5.3 Rework `AttributeValuesField` into a draft-only field: no server calls; the footer shows `+ Add new value` / `+ Add "<query>"`; Enter or footer-with-query appends a draft (resolving color for color types); an empty query opens the dialog; a case-insensitive match selects the existing value; the popover is anchored to the card; a read-only mode renders chips without remove or picker — *read-only chips are rendered by the view card straight from the registry (`renderChip` without `onColorChange`), so the field has no read-only mode*
- [x] 5.4 Tests: Enter on list and color (`Light Blue` → `#add8e6`, `Sky` → null), existing-name match, footer label switching, dialog fields per type, recolor updates the draft
- [x] 5.5 Verify: `npm run typecheck && npm test` in `resources/app/` — *11/11 field tests, schema tests pass, lint clean; typecheck errors still only in the two group-6 files*

## 6. Attribute card, presets and add popover

- [x] 6.1 Add an inline name input (borderless at rest, border on hover/focus, constant border width) with an on-blur uniqueness check that excludes the source attribute, replacing `attribute-name-field.tsx` (delete it and its test if it becomes unused) — *lives at `components/fields/attribute-name-input.tsx` (the `controller-only-in-fields` lint rule); focus-on-mount via ref instead of `autoFocus` (jsx-a11y); old field + test deleted*
- [x] 6.2 Add a `useApplyAttribute` hook: validate → pre-compute discards and confirm → create or batch request → build the committed attribute → `add`/`update`/`replace` commit → invalidate; 422s map onto the card and the draft is kept
- [x] 6.3 Rewrite `add-or-edit-attribute.tsx` into the edit-mode card: name, values, Delete (hidden on the new form; discards never-applied drafts without confirmation; detaches applied ones through the existing confirmation), Cancel (a pure reset), Apply; remove the List/Color toggle
- [x] 6.4 Update view mode in `attribute-list.tsx`: drag handle, name, read-only chips, and Edit/Delete revealed on hover and `:focus-within`; only Edit enters edit mode; view Delete uses the same detach flow; a single `editingId` covers applied cards, preset drafts (`source_attribute_id`) and the new form
- [x] 6.5 Add a preset row below the cards (up to 3 `+ <Name>` buttons and `+ Add`), and an `+ Add` popover with search, the overflow list and a pinned `+ Add new`; `+ Add` opens the new form directly when there's no overflow; everything is inert while an editor is open
- [x] 6.6 Apply card and spacing tokens (16px gaps and padding, per the spec) via `defineStyles` and `theme`; all strings through `__()` with `kirki-ecommerce`
- [x] 6.7 Component tests: preset click opens a draft; Cancel restores it; Apply on a new attribute sends one create request and regenerates the grid; rename → create + replace with saved variants kept; duplicate name on blur blocks Apply; hover Edit opens the editor while a card-body click does not; only one editor at a time
- [x] 6.8 Verify: `npm run typecheck && npm test` and lint in `resources/app/`, then ask the user to check the card visually (no browser preview, per CLAUDE.md) — *typecheck clean, lint clean on changed files, 1307/1308 tests (only the pre-existing `product-form.test.ts` failure); visual check handed to the user*

## 7. Docs and cleanup

- [x] 7.1 Remove orphans created by this change (unused `createVia`, the old schema exports, `useCreateAttributeValueMutation` if it's no longer imported anywhere) — *removed `createVia`, old `ProductAttributeValueSchema` exports, `attribute-name-field.tsx`(+test), and `components/ui/color-swatch.tsx` (its only consumer was the old registry); `useCreateAttributeValueMutation` kept — still used by Settings → Variation Library*
- [x] 7.2 Record any "Correction during implementation" notes in `design.md`
- [x] 7.3 Verify: `npm run typecheck && npm test` in `resources/app/`, and `openspec validate redesign-product-variations-card --strict` — *strict validation passes; typecheck clean; only the pre-existing `product-form.test.ts` failure remains*
