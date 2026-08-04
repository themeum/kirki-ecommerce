## Context

See proposal.md for motivation. The Price card in `resources/app/pages/products/edit-product/price/price.tsx` currently uses `FieldDescription` with the same copy as the checkbox labels, which overflows fixed `44px` `innerDarkRowContent` rows. Right-side controls use `visibility: hidden`, which still reserves space unlike Figma’s checked/unchecked states. Form wrappers under `resources/app/components/form/` expose `description` but not label-adjacent info tooltips.

Constraints: React + Emotion design system, existing `Tooltip` and info icons, Price must keep `Controller` + `syncVariantField` into product form context, PHP/backend unchanged.

## Goals / Non-Goals

**Goals:**

- Shared `infoText` on `FieldLabel` with fixed icon + tooltip
- Plumb `infoText` through form wrappers that render a primary label
- Align Price card checkbox rows and spacing with Figma two-state rows
- Preserve tax profile select/create and currency prefixes

**Non-Goals:**

- Migrating Price fields to `CheckboxField` / `TextField`
- Fixing Inventory or other sibling cards with the same description pattern
- Changing UI widgets outside `form/` that treat `helpText` as `FieldDescription`
- Backend / `tax_profile_id` data-model changes

## Decisions

### 1. `infoText` lives on `FieldLabel` as the primitive

- **Choice:** Extend `FieldLabel` with optional `infoText`; when set, render fixed info icon (`InfoIcon` / `HelpTextIcon` matching Figma) inside existing `Tooltip`.
- **Why:** One implementation for both form wrappers and ad-hoc `Controller` usage in Price.
- **Alternatives:** Per-wrapper tooltip markup (duplication); customizable icon prop (rejected — icon is fixed).

### 2. Prop name is `infoText`, not `helpText`

- **Choice:** Use `infoText` for label tooltip copy; keep `description` for below-field helper text.
- **Why:** Avoid colliding with existing `helpText` on UI widgets that currently render as `FieldDescription`.
- **Alternatives:** Rename all `helpText` usages (out of scope).

### 3. Price keeps Controllers; wrappers still get `infoText`

- **Choice:** Price continues to call `FieldLabel` with `infoText` directly. Form wrappers gain `infoText` for reuse elsewhere.
- **Why:** Price needs `syncVariantField` on every change; wrappers do not expose that hook yet.
- **Alternatives:** Extend wrappers with custom change callbacks this pass (extra scope).

### 4. Conditional render for right-side controls

- **Choice:** Render base-unit / tax-profile controls only when the related checkbox is checked (not `visibility: hidden`).
- **Why:** Matches Figma; unchecked rows are checkbox + label + info only.
- **Alternatives:** Keep `visibility: hidden` (layout gap remains).

### 5. Unify checkbox row layout

- **Choice:** Both dark rows use the same Flex `align="center"` / `justify="space-between"` pattern and shared `innerDarkRowContent` height/padding (as shipping profile).
- **Why:** Unit price and tax rows currently disagree (Flex vs Grid), causing uneven alignment.
- **Alternatives:** Leave Grid on tax only (visual inconsistency).

## Risks / Trade-offs

- **[Risk]** Tooltip inside a label/checkbox hit area may steal clicks → **Mitigation:** Put tooltip trigger on the icon only (`asChild` span), not the whole label text.
- **[Risk]** Plumbing `infoText` through many form wrappers is a wide but shallow diff → **Mitigation:** Mechanical pass-through only; no consumer call-site rewrites except Price.
- **[Risk]** Figma MCP rate-limited → **Mitigation:** Use provided screenshots as the visual source of truth during implementation.

## Migration Plan

- Frontend-only change; no data migration.
- Roll forward with the admin app build; rollback by reverting the change branch.
- Existing products keep `tax_profile_id` / `charge_taxes` values; UI behavior when tax is checked remains available.
