## Why

The Payments settings page shifts its layout when it loads. The loading
placeholder is the generic settings form skeleton (label and input bars), but
the real page shows a card with a heading, a description, an "Add" button and a
bordered list of payment method rows. Also, the page shows the skeleton on every
background refetch, so a toggle, delete or reorder makes the whole card flash.

In the "Add a payment method" dialog, the busy state replaces the "Add" or
"Update" button with a bare spinner. The action cell aligns its content to the
right, so the spinner moves to the right edge of the row instead of staying
where the button was.

## What Changes

- Replace `PaymentSettingsSkeleton` with a skeleton that mirrors the Payment
  methods card: card heading bar, description bar, "Add" button bar, and a
  bordered stacked list of 3 rows. Each row has a 20px icon placeholder, a name
  bar, and a switch placeholder on the right, at the same row height as the real
  row.
- Show the Payments page skeleton only on the first load (`isLoading`), not on
  background refetches (`isFetching`). Refetches keep the real list on screen.
- In the dialog row, show the busy state with the `Button` `loading` prop
  instead of a separate `Spinner`. The button keeps its width and position, and
  the spinner shows at the center of the button. This applies to "Add" and
  "Update". The busy "Add" button stays visible without hover.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `settings-page-skeletons`: add a requirement that the Payments page skeleton
  mirrors the Payment methods card and shows only on the first load.
- `payment-method-picker`: "One add or update at a time" — the spinner shows
  inside the pressed button, centered, instead of in place of the button.
- `payment-gateway-updates`: "Payments settings show gateway updates" — the same
  change for the "Update" button.

## Impact

- `resources/app/features/settings/payment/skeletons/payment-settings-skeleton.tsx`
- `resources/app/features/settings/payment/pages/payment-settings.tsx`
- `resources/app/features/settings/payment/components/dialogs/payment-method-row.tsx`
- `resources/app/features/settings/payment/tests/components/dialogs/payment-method-row.test.tsx`
- New test for the Payments settings skeleton/page loading flag.
- No API, PHP, or dependency changes.
