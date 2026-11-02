## Why

The product form and the variant edit page render the same four cards — Price,
Inventory, Shipping, Shipping profile — from two copies of the same code that
differ only in the `variants.0.` field-name prefix. Once that prefix is
normalized the pairs are line-for-line equivalent apart from three deliberate
differences and two accidental ones. The duplication reaches into the form
schemas too: `VariantFormShape` is a hand-copied subset of
`ProductFormVariantShape`, including a second copy of the
"sale price cannot be greater than the regular price" validator.

Every variant-level change now costs two edits and silently permits drift —
the placeholder and symbol-colour differences below are drift that already
happened. The next change redesigns the Price card, so the duplication should
go before that work lands rather than being copied a third time.

## What Changes

- Add a field-name scope (`VariantFieldScope` provider + typed `field()` hook)
  so a section can address `variants.0.base_price` or `base_price` without
  knowing which form hosts it.
- Move Price, Inventory, Shipping and Shipping profile into
  `resources/app/features/products/components/variant-sections/`, re-exported
  through the `@/features/products` barrel, and delete both former copies.
- Extract a shared `VariantFieldsShape` zod shape.
  `ProductFormVariantShape` extends it with the product-only fields (`name`,
  `barcode`, `dimension_unit`, `attribute_values`, `is_default`);
  `VariantFormShape` uses it as-is. The duplicated sale-price validator
  collapses to one definition.
- Inventory's two real differences become props: a required `onGenerateSku`
  callback (the product form posts `{title, brand_id, category_ids,
  attribute_value_ids}`, the variant form posts `{variant_id}`) and an optional
  `committedQuantity` that renders the read-only Committed field only when
  supplied.
- Resolve two accidental differences in favour of the product form's values:
  the available-quantity placeholder becomes `0` (was `600` on the variant
  page) and the profit currency symbol becomes `theme.colors.text.secondary`
  (was `text.primary`). These are the only user-visible changes in this
  proposal, both on the variant edit page.
- `image.tsx` and `visibility.tsx` stay in `features/inventory` — the product
  form's counterparts live in `right-panel` with different copy and structure,
  so there is nothing to de-duplicate there.

## Capabilities

### New Capabilities

None. This change introduces no new behaviour.

### Modified Capabilities

None. Both surfaces keep the behaviour their existing specs describe —
`product-price-card`, `product-inventory-card` and `variant-unit-price-display`
continue to hold, with the same `variants.0.` bindings on the product form.
The change declares `skip_specs: true` in `.openspec.yaml`.

## Impact

Affected code:

- `resources/app/features/products/components/product-form/sections/price/price.tsx`,
  `.../sections/inventory/inventory.tsx`, `.../sections/shipping/shipping.tsx`,
  `.../sections/shipping/shipping-profile.tsx` — removed, replaced by the shared set
- `resources/app/features/inventory/components/variant-form/sections/{price,inventory,shipping,shipping-profile}.tsx` — removed
- `resources/app/features/products/components/product-form/product-form.tsx` and
  `resources/app/features/inventory/pages/edit-inventory.tsx` — wrap their
  sections in the scope provider and pass `onGenerateSku`
- `resources/app/features/products/schemas/forms/product-form.ts` and
  `resources/app/features/inventory/schemas/forms/variant-form.ts` — build on
  the shared shape
- `resources/app/features/products/index.ts` — exports the shared sections and scope

Risk: the `field()` resolver is the one place a wrong name can slip through
silently. It is typed against the shared field keys and covered by a unit test;
everything else is guarded by `npm run typecheck`, lint, and the existing
product-form / variant-form schema tests. Per CLAUDE.md §0 there is no
browser verification — the two cosmetic changes on the variant edit page are
for the user to eyeball.

Out of scope (pre-existing, noted not fixed): `product-inventory-card`'s spec
describes a Committed field and a `min_stock_threshold` binding on the *product*
form that the code does not implement (it renders no Committed field and binds
`low_stock_threshold`). This change preserves that behaviour rather than
reconciling it.
