All paths are relative to `resources/app/`. Ordering keeps the tree typechecking at every step: generic props → generic fields → feature fields → call sites → lint rule last.

Reference shapes: `components/form/text-field.tsx` for the standard field template, `components/form/weight-field.tsx` for the two-name (nested `Controller`) case.

## 1. Extend generic field props

- [x] 1.1 In `components/form/select-field.tsx`, add `icon?: ReactNode` to `SelectFieldOption` and render it inside `SelectItem` before the label. Widen option `value` to `string | number` (match `CreatableSelectFieldOption`), coercing with `String(option.value)` at the `SelectItem`. Do NOT add `valueAsNumber` — no call site in this change needs it.
- [x] 1.2 In `components/form/text-field.tsx`, add `readOnly?: boolean` and `onClick?: () => void`, passing both to `Input`. Mirror how `components/form/number-field.tsx:22` declares and forwards `readOnly`.
- [x] 1.3 Run `npm run typecheck` — existing callers must be unaffected, since both additions are optional.

## 2. New generic field components

Each: generic over `<TFieldValues, TName>`, `control` from `useFormContext()`, `Field` / `FieldLabel` / `FieldDescription` / `FieldError` envelope, `data-invalid` and `aria-invalid` wired, explicit `displayName`, default export at the bottom, `cssOverride?: CSSObject` prop.

- [x] 2.1 `components/form/radio-card-field.tsx` — `RadioGroup` rendered as selectable cards, options `{ value, label, icon }`. Port the card, icon-badge, check-badge and visually-hidden-radio styles from `features/coupons/pages/edit-coupon/components/contents/discount-type-selector.tsx`.
- [x] 2.2 `components/form/chips-input-field.tsx` — `ChipField` + `Input`; Enter adds the trimmed draft to a `string[]` value, ignoring blanks and duplicates; each chip removable. Expose `onCommit?: (next: string[]) => void`, fired after every add and remove. Port from `features/orders/pages/order-details/flag-card.tsx`, reusing `chipFieldControlCss`.
- [x] 2.3 `components/form/unit-amount-field.tsx` — `InputGroup` with a numeric `InputGroupInput` and a unit `Select` in an `inline-end` addon. Props: `name`, `unitName`, `unitOptions: { value, label }[]`, `unitShortText?: (value) => ReactNode`, `onUnitChange?`. Nest two `Controller`s per `weight-field.tsx`; surface both fields' errors in one `FieldError` and clear both on amount change.
- [x] 2.4 `components/form/tabs-field.tsx` — `Tabs` / `TabsList` / `TabsTrigger`, options `{ value, icon }`. Props `toTabValue` / `fromTabValue` map between the tab index and the stored value (see `positionToTabIndex` / `tabIndexToPosition` in `features/settings/email/pages/edit-template.tsx`).
- [x] 2.5 `components/form/progress-bar-field.tsx` — wraps `components/ui/progressbar.tsx`. Coerce with `Number(field.value) || 0`; accept `label` and `rightText`.
- [x] 2.6 `components/form/group-tag-table-field.tsx` — wraps `components/group-tag-table.tsx`, passing through `groupDetails`, `optionsArray`, `requiredFields`, `hasSelect`, `isEditable`; binds `selectedValues` / `onChange`.
- [x] 2.7 Run `npm run typecheck`.

## 3. Tests for the new generic fields

Co-located `*.test.tsx` (jsdom project, `vitest.config.ts:28`), `@testing-library/react` per `components/ui/pagination.test.tsx`, wrapped in `FormProvider` + a local `useForm` following the wrapper in `features/bulk-edit/tests/hooks/use-bulk-edit-row.test.tsx:17`.

- [x] 3.1 Write a shared local render helper (per test file — no new shared test util) mounting a field inside `FormProvider` with configurable `defaultValues`.
- [x] 3.2 `radio-card-field.test.tsx` — renders each option's label; selecting an option writes its value; injected error renders and marks invalid.
- [x] 3.3 `chips-input-field.test.tsx` — Enter appends the trimmed draft; blank and duplicate entries are ignored; removing a chip drops it; `onCommit` fires with the new array on add and remove.
- [x] 3.4 `unit-amount-field.test.tsx` — typing writes the amount; choosing a unit writes `unitName`; an error on either name renders in the single error row.
- [x] 3.5 `tabs-field.test.tsx` — the active tab reflects the mapped value; selecting a tab writes the mapped-back value.
- [x] 3.6 `progress-bar-field.test.tsx` — renders the current value; a change writes a number; error renders.
- [x] 3.7 `group-tag-table-field.test.tsx` — renders from `selectedValues`; a change writes the grouped shape; error renders.
- [x] 3.8 Run `npm test` — all six pass.

## 4. Feature-scoped field components

- [x] 4.1 Move `features/products/components/attribute-values-field.tsx` to `features/products/components/fields/attribute-values-field.tsx`; update importers. No content change.
- [x] 4.2 `features/coupons/components/fields/coupon-code-field.tsx` — move from `features/coupons/pages/edit-coupon/components/tabs/details-tab.tsx:26-61` and `:113-136`: `isManualCodeEditRef`, `useDebounce`, `useValidateQuery`, `useGenerateNewCodeQuery`, the `setError`/`clearErrors` effect, `handleGenerateCode`, the label row with the Generate Code button, the `Input` with spinner overlay, and the `codeInputWrapper` / `codeInput` / `codeSpinner` styles. Preserve exactly: typing sets `isManualCodeEditRef.current = true`; generating clears it and calls `setValue` with `shouldDirty` + `shouldValidate`.
- [x] 4.3 `features/settings/tax/components/fields/vat-process-field.tsx` — move `VatCollectionProcessRadios` from `features/settings/tax/pages/tax-region/edit-region-eu.tsx:40-118`, keeping `handleProcessChange` and its `resolveVatProcessChange` effect on `product_tax`. **Collapse the two single-item `RadioGroup`s into one** wrapping both Cards, each Card keeping its `RadioGroupItem`, label and `VatProcessDescription`. Card styling and visual output must not change.
- [x] 4.4 `features/settings/tax/components/fields/tax-collection-field.tsx` — move `TaxCollectionRadio` from `features/settings/tax/pages/tax-settings.tsx:67-117`, keeping the `boolean` ↔ `'inclusive' | 'not_inclusive'` mapping and the permanently disabled second option.
- [x] 4.5 `features/products/components/fields/schema-select-field.tsx` — move the Select from `features/products/components/product-form/sections/seo-settings/schema.tsx:49-94`. **Preserve the display-vs-value divergence**: the control shows `resolvedSchemaId` (falling back to the default profile) while `schema_id` stays null until explicitly selected — required by `openspec/specs/product-seo-card/spec.md` scenario "Default profile display without persisting". Keep `Number()` coercion on change, the `disabled={!hasProfiles || isLoading}` gate, and the conditional "No schema profiles" helper text.
- [x] 4.6 Run `npm run typecheck`.

## 5. Migrate call sites

Each removes the `Controller` import from the file. All are behavior-preserving.

- [x] 5.1 `features/customers/pages/customer-details/billing-address.tsx:39` → `CheckboxField` with `onCheckedChange` running the `setValue('billing_address', {})` side effect. Wrap the bare `"Same as shipping address"` label in `__()`.
- [x] 5.2 `features/products/components/product-form/sections/inventory/inventory.tsx:89` → `SelectField` with In Stock / Out of Stock options bound to `variants.0.in_stock`. Values stay the strings `'true'` / `'false'` — the schema is `booleanish(false)` defaulting to `true`, which is what the current code already writes.
- [x] 5.3 `features/settings/tax/pages/tax-region/vat-collection/vat-collection-dialog.tsx:103` → `SelectField`, mapping `statesOption` to `{ value, label: title, icon: leftIcon }`. **The country flags must still render** — that is what the new `icon` prop is for.
- [x] 5.4 `features/settings/shipping/pages/shipping-method/shipping-rules/shipping-rule-form-card.tsx:266` → `TextField` with `readOnly` and `onClick={() => setOpenDestinationPopup(true)}`. Popup state stays in the parent.
- [x] 5.5 `features/coupons/pages/edit-coupon/components/tabs/details-tab.tsx:113` → `<CouponCodeField />`; delete the now-unused code state, queries, effect and styles from the tab.
- [x] 5.6 `features/coupons/pages/edit-coupon/components/contents/discount-type-selector.tsx:37` → `RadioCardField` bound to `discount_type`, still filtering out `hidden` options and still `disabled`.
- [x] 5.7 `features/orders/pages/order-details/flag-card.tsx:26` → `ChipsInputField` bound to `flags`, with `onCommit={onSave}`; drop the local `draft` state.
- [x] 5.8 `features/products/components/product-form/sections/price/base-unit-dialog.tsx:65` → `UnitAmountField`, converting the `SelectContent` children into `unitOptions` data and passing `getUnitShortText` as `unitShortText`.
- [x] 5.9 `features/settings/email/pages/edit-template.tsx:66` → `ProgressBarField` (`height`), and `:83` → `TabsField` (`position`) using the existing index↔position mappers.
- [x] 5.10 `features/settings/essentials/pages/schema-profile/add-schema-dialog.tsx:124` → `GroupTagTableField` bound to `schema`.
- [x] 5.11 `features/settings/tax/pages/tax-region/edit-region-eu.tsx` → render `<VatProcessField />`; delete the local `VatCollectionProcessRadios`.
- [x] 5.12 `features/settings/tax/pages/tax-settings.tsx` → render `<TaxCollectionField />`; delete the local `TaxCollectionRadio`.
- [x] 5.13 `features/products/components/product-form/sections/seo-settings/schema.tsx` → render `<SchemaSelectField />`; keep the `GroupTagTable` read-only display and `SchemaPreview` in place.
- [x] 5.14 `features/products/components/product-form/sections/variants/attribute-list/add-or-edit-attribute.tsx:237` → replace the `Controller` with `useFormState({ control, name: 'name' })` plus a plain `Field` + `Combobox`. **Do not convert to `ComboboxField`** — the control does not own the `name` value. Preserve the composite error check across `fieldState.error`, `errors.id` and `errors.name`.
- [x] 5.15 Run `npm run typecheck`, then `grep -rn "Controller" resources/app --include='*.tsx'` and confirm the only hits are `components/form/**` and `features/*/components/fields/**`.

## 6. Enforce with lint

- [x] 6.1 Add to `eslint.config.js` a `no-restricted-syntax` config over `**/*.{ts,tsx}` with selector `ImportDeclaration[source.value='react-hook-form'] > ImportSpecifier[imported.name='Controller']` and a message pointing at `components/form/` and `features/*/components/fields/`. Use `no-restricted-syntax`, **not** `no-restricted-imports` — flat-config rule entries replace rather than merge and would clobber the feature-boundary blocks at `eslint.config.js:52` and `:70`.
- [x] 6.2 Add the allowlist override block setting `no-restricted-syntax: 'off'` for `components/form/**/*.{ts,tsx}` and `features/*/components/fields/**/*.{ts,tsx}`.
- [x] 6.3 Run `npm run lint` — must be clean at severity `error` with no inline `eslint-disable`. Any violation means a call site was missed.

## 7. Verify

- [x] 7.1 `cd resources/app && npm run typecheck && npm run lint && npm test` — all green.
- [x] 7.2 Hand the manual pass to the user (CLAUDE.md §0 forbids browser preview here), in risk order: (1) Product → SEO → Schema — default profile still displays while `schema_id` stays null; (2) Settings → Tax → EU region — arrow keys now move between the two VAT options, and selection still drives `product_tax`; (3) Coupons → edit → Details — generate, debounced validation, spinner, and typing still marking the code manually edited; (4) Settings → Tax → VAT collection dialog — flags render; (5) Settings → Email → template — height slider and position tabs; (6) Order details — flag chips add on Enter and save on change; (7) Product → Price → base unit dialog — amount + unit and the shared error row.

## Notes from implementation

Deviations from the plan above, all forced by what the code or tooling turned out to require:

- **1.1** `valueAsNumber` was dropped from `SelectField` as planned once `seo-settings/schema.tsx` moved to a feature-scoped field. `icon` and the widened `value` shipped.
- **2.3** `UnitAmountField.unitOptions` accepts a **flat list or a grouped list** (`{ heading, icon, items }[]`), not a flat list only: `base-unit-dialog`'s "Total unit" select renders `SelectGroup`/`SelectLabel`/`SelectSeparator` over four measurement groups. Both shapes are data, so no rendering escape hatch was needed. Its `onUnitChange` now runs *after* the field's own `onChange`, so the callers dropped their redundant self-`setValue` and kept only the cross-field work (`handleTotalUnitChange` resetting `base_unit`, both clearing errors).
- **3.1** The plan called for a per-file harness and no shared test util. `react-hooks/globals` rejects capturing `useForm()` into an outer variable during render, so the harness became `tests/form-field-harness.tsx` — `FormHarness`, `ValueProbe`, `ErrorButton`, `ClearErrorButton`. State is observed through a probe component and errors injected via a click, so no `act()` is needed. It lives in `tests/` rather than `components/form/` to keep shipped code free of test infrastructure.
- **6.2** The allowlist glob is `features/**/components/fields/**`, not `features/*/components/fields/**`: settings nests sub-features, so its field components sit at `features/settings/<area>/components/fields/`. With a single `*` the rule fired on the four settings/tax and settings/shipping field components.
- **Environment**: `react-day-picker` was declared in `package.json` but absent from `node_modules`, so `tsc` failed on three calendar files before any edit. `npm install` fixed it; unrelated to this change.

### Pre-existing issue preserved, not fixed

`coupon-code-field.tsx` carries over `{isValidatingCode || isGeneratingCode && <Spinner />}` verbatim from `details-tab.tsx`. `&&` binds tighter than `||`, so this evaluates to `isValidatingCode || (isGeneratingCode && <Spinner/>)` — when `isValidatingCode` is true it renders `true`, which React renders as nothing. The validation spinner therefore never appears. Left as-is to keep the move behavior-preserving; worth its own fix.

### Verification result

`npm run typecheck` clean, `npm run lint` clean at severity `error`, `npm test` 641 passed across 91 files (85 before, +6 new field suites). The lint rule was confirmed to fire by adding a throwaway `Controller` import outside the allowlisted directories.
