## Context

See proposal.md for the problem. Current state in code:

- `PaymentSettingsSkeleton` renders `SettingsPageSkeleton cards={[3]}`: 3 label
  bars and 3 36px input bars in a form card. The loaded card (`PaymentMethods`)
  is a `Card` with `cardStyles.formCard`, a heading/description column with an
  `ActionGroup` "Add" `Button` (`variant="secondary" size="sm"`), and a
  `StackedItems` list of `SortablePaymentMethod` rows. Each row is a
  `StackedItem` (an `Item` with `size="sm"`) with a 16px media slot, a title
  `Text`, and an `ActionGroup` with icon buttons and a `Switch` (32×16).
- `payment-settings.tsx` reads `isFetching: isLoading` from
  `usePaymentMethodsQuery()`. Every refetch returns the skeleton.
- `PaymentMethodRow` returns `<Spinner>` instead of the button when `isBusy`.
  Its `action` cell uses `justifyContent: 'flex-end'` and `minWidth: spacing[12]`,
  so the 16px spinner moves to the right edge. The "Add" button has
  `data-slot="payment-method-add"` and is `opacity: 0` until row hover.
- `Button` has a `loading` prop: it keeps the label in the layout with
  `visibility: hidden` and shows a `Loader2` icon in an absolutely placed,
  centered layer. `loading` also sets `disabled`, which applies the
  `opacity: 0.5` disabled style.

## Goals / Non-Goals

**Goals:**

- Zero layout shift between the Payments skeleton and a loaded list of 3
  methods.
- The busy spinner shows at the center of the pressed button, at the button's
  position.

**Non-Goals:**

- No change to `SettingsPageSkeleton` or other settings pages.
- No change to the `Button` loading style (opacity, icon, animation).
- No remembered row count. The row count is fixed at 3.
- No change to the dialog list skeleton (`PaymentMethodListSkeleton`).

## Decisions

### Build the skeleton from the same primitives as the loaded card

The skeleton uses `Card` + `CardContent` with `cardStyles.formCard`, the same
`Flex` heading layout, and `StackedItems` / `StackedItem` / `StackedItemMedia` /
`StackedItemContent` / `StackedItemActions` with `Skeleton` blocks inside. The
"Add" placeholder is a `Skeleton` with the size of a `sm` button.

- Why: the border, padding, gaps and row height come from the same styles as
  the real card, so they cannot drift.
- Alternative: hand-written divs with copied pixel values. Rejected — any
  change to `Item` padding or `StackedItems` borders would bring the shift back.

The skeleton stays in `features/settings/payment/skeletons/payment-settings-skeleton.tsx`
and keeps its `SettingsPageHeader`.

Row content: a 16px (media slot size) icon `Skeleton`, a name `Skeleton` with a
different width per row, and a 32×16 `Skeleton` with `radius="full"` in the
actions slot for the switch. The name bar height matches the title text line
height so the row height is the same as a loaded row.

### Use `isLoading`, not `isFetching`, for the page placeholder

`isLoading` is true only when there is no cached data and a fetch is in flight.
This matches the other settings pages (`general`, `products`, `advanced`, `tax`)
and the existing `settings-page-skeletons` requirement "Placeholders are
reserved for fetching, not for submitting".

### Use the `Button` `loading` prop for the busy row

`PaymentMethodRow` renders the "Add" or "Update" `Button` with
`loading={isBusy}` and removes the `Spinner` branch. The button keeps its label
width, and the `Button` component centers the spinner.

- Alternative: keep `Spinner` in a centered box with the button width. Rejected
  — it duplicates what `Button` already does, and the width must be guessed.

The row style that hides `[data-slot="payment-method-add"]` until hover gets an
exception for `[data-loading="true"]`, so the busy "Add" button stays visible.
`Spinner` and the `spinner` style are removed if no other code in the file uses
them.

## Risks / Trade-offs

- [The `StackedItems` action group is `opacity: 0` until hover, so the real
  switch is not visible at rest. A visible switch placeholder in the skeleton
  is a small visual difference, but it does not change layout.] → Keep the
  switch placeholder as the user asked. If it looks wrong, the placeholder can
  inherit the same hover-only opacity without a spec change.
- [A store with more or fewer than 3 methods still has a small height change
  when the list arrives.] → Accepted. 3 matches a fresh install.
- [The loading `Button` uses the disabled style (`opacity: 0.5`), so the busy
  button is lighter than before.] → Accepted. It is the design-system loading
  state.

## Correction during implementation

- The real row height comes from the 28px `icon-sm` buttons in the actions
  slot, not from the title text. The skeleton's actions slot is set to
  `theme.spacing[7]` (28px) height so its rows match. The name bar is 14px high,
  centered in the row.
- A `StackedItem` row has `data-slot="stacked-item"`, not `item`. Task 1.1 and
  its test use `stacked-item`.
- The busy "Add" button shows at full opacity: the row rule that keeps it
  visible (`[data-loading="true"]`, `opacity: 1`) is more specific than the
  `Button` disabled style. The busy "Update" button keeps the `Button` disabled
  opacity (0.5).
