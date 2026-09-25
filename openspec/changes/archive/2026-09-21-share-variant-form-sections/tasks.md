## 1. Shared variant field shape

- [x] 1.1 Extract `VariantFieldsShape` (and its inferred input type) into `resources/app/features/products/schemas/forms/variant-fields.ts`, holding the fields common to both forms including the `requiredWhen` sale-price rule
- [x] 1.2 Rebuild `ProductFormVariantShape` in `product-form.ts` as `VariantFieldsShape.extend({ name, barcode, dimension_unit, attribute_values, is_default })`, leaving its terminal `prepareFormSchema(...).transform(...)` and payload keys unchanged
- [x] 1.3 Rebuild `VariantFormShape` in `features/inventory/schemas/forms/variant-form.ts` on `VariantFieldsShape`, leaving its terminal transform and payload keys unchanged
- [x] 1.4 Run the existing `product-form` and `variant-form` schema tests — payload output must be byte-identical to before

## 2. Field scope

- [x] 2.1 Add `resources/app/features/products/components/variant-sections/field-scope.tsx` with `VariantFieldScope` (prop `prefix: '' | \`variants.${number}.\``, default `''`) and `useVariantField()` returning a `field(key)` resolver typed on the shared field keys
- [x] 2.2 Add `useVariantValues()` to the same module — implemented as a watch over an explicit key list rather than the whole object: a root-vs-prefix branch would have had to subscribe to the entire product form to read the variant slice, re-rendering Price on every unrelated product edit
- [x] 2.3 Add `resolve-field-name.test.ts` covering both scopes: `''` → `base_price`, `variants.0.` → `variants.0.base_price` (the pure resolver lives in its own React-free module per the `component-logic-separation` spec, so the test sits beside it)

## 3. Shared sections

- [x] 3.1 Move Price into `variant-sections/price/price.tsx`, replacing every literal name with `field(...)` and the variant watch with `useVariantValues()`; keep the `is_unit_price_visible` settings gate, the tax-profile select and popup, and `BaseUnitPopover` wiring as-is
- [x] 3.2 Move Inventory into `variant-sections/inventory/inventory.tsx` with a required `onGenerateSku: () => void`, a required `isGeneratingSku` (the button's pending state moved out with the mutation) and an optional `committedQuantity`. **Corrected premise:** the product form does render a Committed field today — a `NumberField` bound to `variants.0.committed_quantity`, a path in no schema, so it always renders empty and is stripped from the payload. Hiding it without the prop would have dropped a column from the product form's grid and broken `product-inventory-card`'s stated requirement, so the field always renders as a disabled `Input` and `committedQuantity` only supplies its value
- [x] 3.3 Move Shipping and ShippingProfile into `variant-sections/shipping/`, with Shipping importing the co-located ShippingProfile
- [x] 3.4 Apply the agreed cosmetic convergences: available-quantity placeholder `0`, profit currency symbol `theme.colors.text.secondary`
- [x] 3.5 Export the sections, `VariantFieldScope` and the scope hooks from `resources/app/features/products/index.ts`

## 4. Wire up both forms

- [x] 4.1 In `product-form.tsx`, wrap the `showSimpleVariantSections` block in `<VariantFieldScope prefix="variants.0.">`, import the shared sections, and pass an `onGenerateSku` that posts `{ title, brand_id, category_ids, attribute_value_ids }` and writes to `variants.0.sku` — the handler and its pending flag live in `use-product-form.ts`, per the `component-logic-separation` spec
- [x] 4.2 In `edit-inventory.tsx`, wrap the sections in `<VariantFieldScope>`, pass `committedQuantity={variant.committed_quantity}` and an `onGenerateSku` that bails without a variant id and otherwise posts `{ variant_id }`
- [x] 4.3 Delete the four superseded files under `product-form/sections/{price,inventory,shipping}/` and the four under `variant-form/sections/`, keeping `variant-form/sections/{image,visibility}.tsx`. `base-unit-popover.tsx` moved to `variant-sections/price/` rather than staying put — leaving it behind would have kept `product-form/sections/price/` alive as a one-file folder; its barrel export path was updated so bulk-edit's import is untouched
- [x] 4.4 Remove imports and exports orphaned by the deletions (including the `BaseUnitPopover` barrel export if its path moved)

## 5. Verification

- [x] 5.1 `npm run typecheck` passes
- [x] 5.2 Lint passes on the changed files
- [x] 5.3 `npm test` in `resources/app/` passes, including the new `field-scope` test
- [x] 5.4 Confirm by reading the diff that no card gained or lost a field, and that the only behavioural deltas are the two cosmetic convergences — hand the variant edit page to the user for visual confirmation per CLAUDE.md §0
