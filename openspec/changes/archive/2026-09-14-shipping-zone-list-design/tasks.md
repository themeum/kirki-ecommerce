All commands below run from `resources/app/`.

## 1. Header adornment slot

- [x] 1.1 Add an optional `titleAdornment?: ReactNode` prop to `components/option-accordion.tsx`, destructured with a `null` default alongside the existing props.
- [x] 1.2 Render `titleAdornment` inside the header `Flex` that already holds the title `Text` and the `Inactive` `Badge` — as a sibling of the `Text`, placed between it and the badge. Do not nest it inside the `Text`; that element is an `<h6>` and cannot legally contain a `<div>`.
- [x] 1.3 Confirm the three existing callers (`features/settings/email/pages/admin-email.tsx`, `features/settings/email/pages/customer-email.tsx`, `features/settings/multi-currency/pages/api-config/api-config.tsx`) still compile untouched and render nothing extra.
- [x] 1.4 Verify: `npm run typecheck && npm test`.

## 2. Zone header — flags, expansion, and actions

- [x] 2.1 In `features/settings/shipping/pages/shipping-settings.tsx`, pass `open` to each zone's `OptionAccordion` and remove the `leftIcon={<LocationIcon />}` prop. Keep `subHeader={getShippingZoneSummary(item)}` exactly as it is.
- [x] 2.2 Build the flag adornment from the existing `getSelectedRegionTags(item.regions, countryList)`: render `tag.tagIcon` for at most the first three tags, then a `+N` `Text` when more tags remain. Render nothing when the zone has no regions. Pass it as `titleAdornment`. Use `defineStyles` + `theme` tokens for the flag sizing, matching the existing inline `fontSize: 20` the region badges used.
- [x] 2.3 In `features/settings/shipping/pages/shipping-zone-actions.tsx`, remove the `Switch` and its import, and put an icon `Button` with `EditPenIcon` in its place that calls the existing `handleEditAndDelete('edit', item)` — leaving that function's `confirmAction`-then-navigate body untouched. Give it an `aria-label` of `__('Edit', 'kirki-ecommerce')`.
- [x] 2.4 Reshape the dropdown to exactly two items: an activation entry labelled `item.is_enabled ? __('Deactivate', 'kirki-ecommerce') : __('Activate', 'kirki-ecommerce')` with a `<Ban size={16} />` icon calling `onToggle(item)`, followed by the existing Delete entry. Remove the `Edit` menu item and the now-unused `EditIcon` import.
- [x] 2.5 Confirm both the edit button and the menu trigger render regardless of `item.is_enabled` — a disabled zone stays editable.
- [x] 2.6 Verify: `npm run typecheck && npm test`.

## 3. Zone body — methods through the row-stack primitive

- [x] 3.1 Remove the destination-badge inner `Card` from the expanded zone body in `shipping-settings.tsx`, along with the imports it alone used (`getSelectedRegionTags` stays — it now feeds the header flags; `Badge` stays only if the method rows still need it).
  - Correction: `Badge` stays (the method rows' `Inactive` badge). Additionally removed the
    `CountryWithStates` type import — `countryList` from the hook is already typed
    `CountryWithStates[]`, so the old call site's cast was unnecessary and tripped
    `@typescript-eslint/no-unnecessary-type-assertion`.
- [x] 3.2 Derive each zone's method display data with a helper that maps `shippingMethodIconMap[method.type]`, `getShippingMethodSubText(method)`, and `getShippingMethodRightText(method)` onto the methods from `getShippingMethodData(item.id)` — the same mapping `features/settings/shipping/pages/shipping-method/shipping-method.tsx` performs.
- [x] 3.3 Replace the `ItemGroup` + `Fragment`/`ItemSeparator` + `ShippingMethodRow` block with `StackedItems`/`StackedItem`, composed as in `shipping-method.tsx`: `StackedItemMedia` for the icon, `StackedItemTitle` for name + `subText` + the `Inactive` `Badge`, and `StackedItemActions` containing the price `Text` marked `data-right-text="true"` plus an `ActionGroup` of delete, edit, and the enable/disable `Switch`.
- [x] 3.4 Wire the row controls to the handlers the hook already returns — `handleDeleteMethod`, `handleEditMethod`, `handleToggleMethod` — with no change to `use-shipping-settings.ts`.
- [x] 3.5 Handle any alignment difference through `StackedItem`'s `cssOverride` only. `components/ui/stacked-items.tsx` must not be modified.
  - Correction: one override was not optional as the task's "any alignment difference"
    wording implied — it was required. The primitive's row style sets
    `& button { width: 24px; height: 24px }`, which also matches the Radix `Switch` (a
    `<button role="switch">`) and squashed the method toggle from 36×20 to a square. Fixed
    with a `button[role="switch"]` rule in the `StackedItem` `cssOverride`, which outranks
    `& button` on specificity. `stacked-items.tsx` was not modified.
- [x] 3.6 Verify: `npm run typecheck && npm test`.

## 4. Cleanup and final verification

- [x] 4.1 Delete `features/settings/shipping/pages/shipping-method-row.tsx` and confirm no import of it remains anywhere.
- [x] 4.2 Remove any import in `shipping-settings.tsx` left unused by tasks 2 and 3 (`LocationIcon` is still needed by the empty state — check before removing it).
- [x] 4.3 Verify: `npm run typecheck && npm test && npm run lint`.
- [x] 4.4 Report honestly that no automated test covers the rendered result — this repo's Vitest suite is scoped to schemas and lib functions — and ask the user to confirm the visuals in wp-admin against the mockup.
