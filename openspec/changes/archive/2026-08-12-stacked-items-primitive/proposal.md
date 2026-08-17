## Why

`GroupOptionCard` renders the row list for 13 places across 8 settings sections, driven by a
`dataArr` plus a closed list of handler props (`handleToggleItem`, `handleDeleteItem`,
`handleEditItem`, `handleMoreOption`, `actionsArray`, `handleAction`). Every new row feature
means editing that shared prop list — it has already happened silently once: the currency list
caller sets `rightIcon`/`rightText` on its items, but `GroupOptionCard` never renders them, a
dead prop nobody noticed. The shape also breaks with this codebase's own compound-component
convention (`Card`/`CardContent`, `Item`/`ItemGroup`/`ItemMedia`/...): every other primitive in
`components/ui/` is composed by nesting flat components, none takes a data-array-plus-handler-map.

## What Changes

- New `resources/app/components/ui/stacked-items.tsx` primitive family: `StackedItems`
  (container), `StackedItem` (row, requires an `id` prop), `StackedItemMedia`,
  `StackedItemContent`, `StackedItemTitle`, `StackedItemActions` (thin wrappers over the existing
  `Item*` components). Callers compose rows directly as JSX children instead of passing a data
  array and handler map — extending a row means writing more JSX, not adding a prop to a shared
  component.
- `StackedItem` gives its first and last row an explicit corner radius via
  `:first-of-type`/`:last-of-type`, replacing today's reliance on the outer container's
  `overflow: hidden` to visually clip square-cornered rows into rounded ones. **Fixes a bug**: the
  clipping approach also cuts off the `:focus-visible` outline on the first/last row.
- A row's open-overflow-menu state is now tracked by the row's own `id` (via a
  `StackedItems`-internal context and a `useStackedItem()` hook), not by array index. **Fixes a
  bug**: index-based tracking points `data-actions-open` at the wrong row after a list mutates
  (e.g. an optimistic delete).
- **BREAKING (internal)**: `resources/app/components/group-option-card.tsx` is deleted. All 11
  call sites migrate from `<GroupOptionCard dataArr={...} handle...={...} />` to composing
  `<StackedItems>`/`<StackedItem>` directly. `resources/app/preview-pages/group-option-card-preview.tsx`
  is renamed to `stacked-items-preview.tsx`.
- No behavior change to hover-reveal, keyboard-focus reveal, open-menu-keeps-actions-visible,
  the bordered-group container, the at-rest "Inactive" badge, or per-section empty states — those
  requirements (specified separately, see Impact) are preserved, just implemented through the new
  primitive instead of `GroupOptionCard`'s internal state and CSS.

## Capabilities

### New Capabilities
- `stacked-items`: the composable row-stack UI primitive — how a caller builds a bordered,
  rounded list of rows by composition instead of configuration, how row identity is established,
  and how the first/last row's corners and focus outline behave.

### Modified Capabilities
_None._ The row-list interaction behavior (hover reveal, keyboard focus, open-menu persistence,
bordered-group presentation, disabled-row badge, per-section empty state) is already specified by
the in-flight `option-row-list` capability (`openspec/changes/option-row-hover-actions/`, not yet
archived/synced). This change re-implements that behavior through the new primitive without
altering any of its requirements, so no delta against it is needed here.

## Impact

- `resources/app/components/group-option-card.tsx` — deleted.
- `resources/app/components/ui/stacked-items.tsx` — new.
- `resources/app/preview-pages/group-option-card-preview.tsx` → renamed
  `resources/app/preview-pages/stacked-items-preview.tsx`.
- Call sites migrated: `resources/app/tryouts.tsx`,
  `resources/app/preview-pages/option-accordion-preview.tsx`,
  `resources/app/pages/settings/essential-settings/schema-profile/schema-profile.tsx`,
  `resources/app/pages/settings/essential-settings/variation-library/variation-library.tsx`,
  `resources/app/pages/settings/shipping-settings/shipping-profile/shipping-profile.tsx`,
  `resources/app/pages/settings/shipping-settings/shipping-method/shipping-method.tsx`,
  `resources/app/pages/settings/tax-settings/tax-profile/tax-profile.tsx`,
  `resources/app/pages/settings/shipping-settings/shipping-box/shipping-box.tsx`,
  `resources/app/pages/settings/shipping-settings/shipping-career/shipping-career.tsx`,
  `resources/app/pages/settings/email-settings/customer-email.tsx`,
  `resources/app/pages/settings/email-settings/admin-email.tsx`,
  `resources/app/pages/settings/multi-currency-settings/available-currency-list.tsx`.
- Not touched: `resources/app/pages/settings/payment-settings/manual-payment.tsx`,
  `resources/app/pages/settings/tax-settings/tax-region/tax-region.tsx` (don't use
  `GroupOptionCard`); `resources/app/components/ui/item.tsx` (unmodified, reused as-is);
  `resources/app/components/ui/empty-state.tsx` (unmodified, reused where already adopted).
- No API, schema, or PHP changes.
