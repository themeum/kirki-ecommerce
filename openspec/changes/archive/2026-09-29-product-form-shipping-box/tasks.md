## 1. InputGroup polish

- [x] 1.1 Add `minWidth: 0` to `InputGroup` group wrapper in `resources/app/components/ui/input-group.tsx`
- [x] 1.2 Add inline-end vertical separator styling for unit addon inside InputGroup

## 2. Shared shipping box preview

- [x] 2.1 Create `resources/app/components/shipping-box-preview/shipping-box-preview.tsx` by extracting logic from `box-generator.tsx`
- [x] 2.2 Update `shipping-box-dialog.tsx` to import `ShippingBoxPreview` instead of `BoxGenerator`
- [x] 2.3 Delete `resources/app/pages/settings/shipping-settings/shipping-box/box-generator.tsx` after all imports migrated

## 3. WeightField form component

- [x] 3.1 Create `resources/app/components/form/weight-field.tsx` with RHF Controller for weight and weight_unit
- [x] 3.2 Render unified InputGroup: `InputGroupInput` + inline-end unit Select with `variant="invisible"`
- [x] 3.3 Use `weightUnitList` options (g, kg, lb, oz) and default display from `useSettingsQuery('product')` when form unit is empty
- [x] 3.4 Support optional `onFieldChange` callback and combined error display for both fields

## 4. ShippingBoxField form component

- [x] 4.1 Create `resources/app/components/form/shipping-box-field.tsx` with RHF Controller for `shipping_box_id`
- [x] 4.2 Implement full fieldset UI: inner card legend, eye toggle (default visible), select with box list labels using × dimensions
- [x] 4.3 Add dropdown footer "Add new shipping box" (no Manage header); wire to existing `ShippingBoxPopup`
- [x] 4.4 Integrate `ShippingBoxPreview` below select inside same bordered card; drive dimensions from selected box query data
- [x] 4.5 Implement `compact` prop for bulk edit: select + dialog only, `SelectTrigger variant="invisible"`
- [x] 4.6 Support optional `onFieldChange` callback for product form sync

## 5. Create shipping box dialog polish

- [x] 5.1 Fix dimensions fieldset legend positioning (remove hardcoded `left: 240px`; use fieldset-on-border pattern)
- [x] 5.2 Normalize dialog spacing to theme tokens (`theme.spacing[*]`, consistent gap/padding)
- [x] 5.3 Verify live preview updates on length/width/height/unit change

## 6. Shipping card refactor

- [x] 6.1 Refactor `resources/app/pages/products/edit-product/shipping/shipping.tsx` to use `WeightField` and `ShippingBoxField`
- [x] 6.2 Remove manual weight Controllers, `boxGeneratorData`/`showShippingBox` state, detached preview card, and page-level shipping-box import
- [x] 6.3 Preserve `syncVariantField`, server error mapping, and `ShippingProfile` behavior

## 7. Bulk edit and cleanup

- [x] 7.1 Update `resources/app/pages/bulk-edit/bulk-edit-table/single-row.tsx` to use `ShippingBoxField` with `compact` prop
- [x] 7.2 Delete `resources/app/pages/products/edit-product/shipping/shipping-box.tsx`
- [x] 7.3 Grep for stale `BoxGenerator` / page-level `shipping-box` imports and fix any remaining references

## 8. Verification

- [x] 8.1 Verify weight InputGroup layout and unit options against Figma screenshot
- [x] 8.2 Verify shipping box select, eye toggle, integrated preview, and create-box flow
- [x] 8.3 Verify create dialog layout, dimension fieldset, and live preview against screenshot 2
- [x] 8.4 Verify bulk edit shipping_box_id column still works with compact field
- [x] 8.5 Verify settings shipping boxes page still works with shared preview

## 9. Bug fixes and preview enhancements

- [x] 9.1 Add controlled `open` state to shipping box Select in `shipping-box-field.tsx`; close select before opening create dialog
- [x] 9.2 Refactor dimensions row in `shipping-box-dialog.tsx` to flex layout; remove fixed unit field width; ensure fields stay inside card
- [x] 9.3 Add face labels to `ShippingBoxPreview` with scale-to-fit and L/W/H fallback
- [x] 9.4 Add pointer-drag 360° rotation to `ShippingBoxPreview` with grab/grabbing cursor; persist rotation across dimension changes

## 10. Verification (delta)

- [x] 10.1 Verify select dropdown closes and dialog is unobstructed when clicking "Add new shipping box"
- [x] 10.2 Verify dialog dimensions row: unit select stays inside card; L/W/H fields share space equally
- [x] 10.3 Verify preview face labels and L/W/H fallback on small dimensions
- [x] 10.4 Verify drag rotation in dialog, product form preview, and after dimension edits
