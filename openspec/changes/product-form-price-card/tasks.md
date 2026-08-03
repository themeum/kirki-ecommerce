## 1. Shared FieldLabel infoText

- [x] 1.1 Extend `FieldLabel` in `resources/app/components/ui/field.tsx` with optional `infoText`
- [x] 1.2 When `infoText` is set, render fixed info icon beside the label wrapped in `Tooltip` (icon-only trigger)
- [x] 1.3 Ensure no info icon renders when `infoText` is omitted

## 2. Form wrapper plumbing

- [x] 2.1 Add optional `infoText` prop to form wrappers that render a primary `FieldLabel` and pass it through (`text-field`, `textarea-field`, `password-field`, `checkbox-field`, `switch-field`, `select-field`, `multi-select-field`, `radio-group-field` group label, `color-picker-field`, `rich-text-field`, `thumbnail-field`, `media-gallery-field`, `tag-manager-field`, `country-field` if applicable)
- [x] 2.2 Leave existing `description` → `FieldDescription` behavior unchanged

## 3. Price card layout

- [x] 3.1 Remove duplicate `FieldDescription` blocks from show-unit-price and charge-tax rows in `price.tsx`
- [x] 3.2 Add `infoText` on both checkbox `FieldLabel`s with the agreed tooltip copy
- [x] 3.3 Conditionally render base-price-per-unit controls only when show unit price is checked
- [x] 3.4 Conditionally render tax profile select only when charge tax is checked (keep select options + create popup)
- [x] 3.5 Unify both dark rows to Flex `align="center"` / `justify="space-between"` with shared `innerDarkRowContent` sizing
- [x] 3.6 Align CardContent vertical spacing between price grid, dark rows, separator, and cost/profit/margin grid to match Figma
- [x] 3.7 Keep currency `$` prefixes and Controllers + `syncVariantField` behavior

## 4. Verification

- [x] 4.1 Verify unchecked/checked states for unit price and tax rows against Figma screenshots
- [x] 4.2 Verify info tooltips appear and labels are not duplicated/overflowing
- [x] 4.3 Verify tax profile select and create-profile flow still work when charge tax is checked
