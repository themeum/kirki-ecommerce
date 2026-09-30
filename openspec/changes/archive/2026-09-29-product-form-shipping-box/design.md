## Context

See proposal.md for motivation. The Shipping card in `resources/app/pages/products/edit-product/shipping/shipping.tsx` uses separate Input and Select for weight, a page-level `shipping-box.tsx` for box selection, and a detached preview card below the inner fieldset. Settings already has `BoxGenerator` (3D preview) and `shipping-box-dialog.tsx` (create flow). `InputGroup` exists and largely matches shadcn v4 structure but lacks `min-w-0` and inline-end separator styling.

Constraints: React + Emotion, RHF + zod, existing shipping box REST API, weight units limited to PHP `WeightUnit` constants (g, kg, lb, oz), product form `syncVariantField` pattern must be preserved.

## Goals / Non-Goals

**Goals:**

- Figma-aligned Shipping card: unified weight InputGroup, integrated shipping box fieldset + preview, eye toggle
- Reusable `WeightField` and `ShippingBoxField` form components under `resources/app/components/form/`
- Shared `ShippingBoxPreview` extracted from settings `BoxGenerator`
- Reuse and polish existing create-shipping-box dialog
- Bulk edit compatibility via `ShippingBoxField` compact mode

**Non-Goals:**

- Adding mg or other new weight units (backend unchanged)
- Migrating shipping profile to a new form field component
- Backend shipping box API or schema changes
- Replacing bulk-edit weight cells with `WeightField` (weight stays as inline Input in bulk edit)

## Decisions

### 1. InputGroup polish only — no API redesign

- **Choice:** Add `minWidth: 0` on group wrapper and optional inline-end vertical separator for unit addon; keep existing component API.
- **Why:** Already shadcn v4-compatible (`data-slot`, addon align, borderless controls). Matches Oct 2025 changelog gap only.
- **Alternatives:** Rewrite InputGroup from shadcn CLI (unnecessary churn).

### 2. WeightField uses InputGroup + invisible Select in inline-end addon

- **Choice:** `InputGroup` > `InputGroupInput` + `InputGroupAddon align="inline-end"` > `SelectTrigger variant="invisible"`.
- **Why:** Group owns border/focus; matches Figma single control. Unit options from shared `weightUnitList`.
- **Alternatives:** Separate Input + Select (current, rejected); custom WeightInputGroup one-off (not reusable).

### 3. ShippingBoxField owns full fieldset UI

- **Choice:** New `shipping-box-field.tsx` includes inner card legend, eye toggle, select, integrated preview, and opens existing `ShippingBoxPopup`. Accepts `onFieldChange` for product sync and `compact` for bulk edit.
- **Why:** Matches Figma section as one composable unit; grill-me confirmed full fieldset scope.
- **Alternatives:** Select-only field with layout in shipping.tsx (rejected).

### 4. Extract BoxGenerator → ShippingBoxPreview

- **Choice:** Move 3D CSS logic to `resources/app/components/shipping-box-preview/shipping-box-preview.tsx`; update dialog and field imports; delete `box-generator.tsx`.
- **Why:** Single source for preview behavior per spec; settings and product share component.
- **Alternatives:** Duplicate preview in product (rejected).

### 5. Reuse ShippingBoxPopup; polish spacing in place

- **Choice:** Keep dialog at settings path; replace `BoxGenerator` import, fix hardcoded dimensions legend `left: 240px`, normalize theme spacing tokens.
- **Why:** Dialog already matches screenshot 2 structure; avoid moving dialog unless reuse breaks.
- **Alternatives:** Extract dialog to shared components (deferred — can follow up if settings/product coupling becomes painful).

### 6. Remove Manage link; keep Add new shipping box footer

- **Choice:** Drop header with "Available shipping boxes" + Manage navigation; footer button only opens create dialog.
- **Why:** Figma alignment; grill-me confirmed.

### 7. Compact mode for bulk edit

- **Choice:** `ShippingBoxField compact` renders select + create dialog only (no fieldset, preview, eye). Uses `SelectTrigger variant="invisible"` like other bulk-edit cells.
- **Why:** Table cells cannot fit full fieldset; replaces legacy page `shipping-box.tsx` + broken `visibility: hidden` on trigger.

### 8. Default weight unit — display only until interaction

- **Choice:** When `weight_unit` form value is empty, show store `useSettingsQuery('product').weight_unit` in dropdown; do not auto-set form value on load.
- **Why:** Avoids dirty form state; grill-me confirmed store default.

### 9. Product shipping.tsx simplification

- **Choice:** Replace manual Controllers with `<WeightField>` and `<ShippingBoxField>`; remove `boxGeneratorData`, `showShippingBox` local state; keep `ShippingProfile` and sync helpers.
- **Alternatives:** Full migration to form wrappers with watch-based sync (extra complexity).

### 10. Controlled select close before create dialog

- **Choice:** Manage Radix Select `open` state in `ShippingBoxField`; set `open={false}` before opening `ShippingBoxPopup` when the footer "Add new shipping box" button is clicked. Keep the footer button (do not switch to SelectItem pattern).
- **Why:** Select content uses `zIndex: 100000` vs dialog `1000/1001`; an open select covers the dialog. Radix does not auto-close on a plain Button inside SelectContent.
- **Alternatives:** SelectItem sentinel like shipping profile (rejected — loses footer button styling); raise dialog z-index (rejected — masks root cause).

### 11. Dialog dimensions row uses flex, not fixed field widths

- **Choice:** Dimensions row: `flex: 1 1 0; minWidth: 0` on each L/W/H TextField; unit select `flex: 0 0 auto`. Dialog container keeps fixed max-width (~632px); inner fields have no fixed pixel widths.
- **Why:** Fixed `width: 70px` on unit field caused overflow outside the dimensions card; equal flex shares space compactly.
- **Alternatives:** Fixed proportions per field (rejected — not responsive within card).

### 12. Preview face labels with scale-to-fit fallback

- **Choice:** Render text labels on each box face: Width on front/back, Length on left/right, Height on top/bottom. Font size scales from face dimensions; below threshold use abbreviated L/W/H. Labels rotate with the box (children of face elements); `pointerEvents: none`.
- **Why:** Merchants need to distinguish axes; small boxes cannot fit full words.
- **Alternatives:** Static legend overlay (rejected — does not rotate with drag); dimension lines (deferred — higher complexity).

### 13. Preview mouse-drag rotation

- **Choice:** Pointer handlers on preview container; free rotation on both X and Y axes; rotation state persists when dimensions change; grab/grabbing cursor; enabled everywhere `ShippingBoxPreview` is used.
- **Why:** Grill-me confirmed full orbit, persistence across dimension edits, and universal scope.
- **Alternatives:** Y-axis-only turntable (rejected); reset on dimension change (rejected).

## Risks / Trade-offs

- **[Risk]** Select inside InputGroup addon may break focus ring or click targets → **Mitigation:** Use `variant="invisible"` SelectTrigger; test focus-within on group.
- **[Risk]** ShippingBoxField coupling to settings dialog path → **Mitigation:** Import dialog as shared module; document in tasks; optional future extraction.
- **[Risk]** Bulk edit regression when replacing page component → **Mitigation:** Explicit compact prop + manual QA on shipping_box_id column.
- **[Risk]** Dialog legend positioning fragile after removing magic numbers → **Mitigation:** Reuse same fieldset-on-border pattern as shipping card inner card (absolute label + background).
- **[Risk]** Select dropdown covers create dialog due to z-index mismatch → **Mitigation:** Close select programmatically before opening dialog (Decision 10).
- **[Risk]** Face labels illegible on very small preview boxes → **Mitigation:** Scale font to fit; fall back to L/W/H abbreviations (Decision 12).
- **[Risk]** Drag rotation conflicts with page scroll on touch → **Mitigation:** `touch-action: none` on preview container during drag.

## Migration Plan

- Frontend-only; no data migration.
- Delete `pages/.../shipping-box.tsx` and `box-generator.tsx` after import updates.
- Roll forward with admin app build; rollback by reverting branch.
- Existing product `shipping_box_id` / weight values unchanged.

## Open Questions

- None — grill-me resolved weight units, field scope, preview layout, dialog reuse, bulk edit approach, select-close behavior, dialog flex layout, preview labels, and drag rotation.
