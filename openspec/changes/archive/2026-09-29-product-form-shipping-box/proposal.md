## Why

The product edit Shipping card does not match the Figma design: weight is split into separate input and unit controls instead of a unified input group, the shipping box preview sits in a detached card rather than inside the fieldset, and shipping box selection lives in a page-level component instead of a reusable RHF form field. Merchants need a pixel-aligned shipping UI with inline box preview, create-box flow, and consistent form field patterns matching the Price and Inventory card refactors.

## What Changes

- Polish `InputGroup` for shadcn v4 compliance (`min-w-0`, inline-end separator for unit addon)
- Add `WeightField` form component: combined weight input + unit dropdown using `InputGroup`, defaulting to store `weight_unit` when unset; units remain backend-supported **g, kg, lb, oz**
- Add `ShippingBoxField` form component: full Shipping Box fieldset (legend, eye toggle, select, integrated preview, create dialog); `compact` mode for bulk edit
- Extract shared `ShippingBoxPreview` component from settings `BoxGenerator`; preview resizes proportionally with dimension changes
- Reuse existing create-shipping-box dialog; polish spacing/alignment per design system
- Refactor [`shipping.tsx`](resources/app/pages/products/edit-product/shipping/shipping.tsx) to use new form fields; remove page-level [`shipping-box.tsx`](resources/app/pages/products/edit-product/shipping/shipping-box.tsx)
- Remove "Manage" link from shipping box select dropdown; keep footer **Add new shipping box** only
- Update bulk edit to use `ShippingBoxField` compact mode
- Preserve existing `syncVariantField`, server error mapping, and shipping profile checkbox behavior
- Fix shipping box select dropdown staying open when "Add new shipping box" opens the create dialog (controlled select close)
- Fix create dialog dimensions row layout: flex-based equal-width L/W/H fields, auto-sized unit select (no fixed field widths)
- Enhance `ShippingBoxPreview` with dimension face labels (scale-to-fit; fall back to L/W/H when too small) and free mouse-drag 360° rotation on both axes

## Capabilities

### New Capabilities

- `product-shipping-card`: Product edit Shipping card layout, weight input group, shipping box fieldset with preview toggle, and shipping box create/select flow
- `shipping-box-preview`: Shared 3D isometric box preview driven by length, width, height, and unit
- `weight-field`: Reusable RHF form field combining numeric weight input and unit select via InputGroup

### Modified Capabilities

- (none — no existing specs under `openspec/specs/` for product shipping)

## Impact

- [`resources/app/components/ui/input-group.tsx`](resources/app/components/ui/input-group.tsx) — shadcn v4 polish
- New: [`resources/app/components/form/weight-field.tsx`](resources/app/components/form/weight-field.tsx), [`resources/app/components/form/shipping-box-field.tsx`](resources/app/components/form/shipping-box-field.tsx)
- New: [`resources/app/components/shipping-box-preview/shipping-box-preview.tsx`](resources/app/components/shipping-box-preview/shipping-box-preview.tsx)
- [`resources/app/pages/products/edit-product/shipping/shipping.tsx`](resources/app/pages/products/edit-product/shipping/shipping.tsx) — primary UI refactor
- [`resources/app/pages/settings/shipping-settings/shipping-box/shipping-box-dialog.tsx`](resources/app/pages/settings/shipping-settings/shipping-box/shipping-box-dialog.tsx) — spacing polish, shared preview
- [`resources/app/pages/bulk-edit/bulk-edit-table/single-row.tsx`](resources/app/pages/bulk-edit/bulk-edit-table/single-row.tsx) — compact shipping box field
- Delete: page-level `shipping-box.tsx`, settings `box-generator.tsx` after migration
- Reuses existing shipping box API and `ShippingBoxPopup` create/update mutations; no backend changes
