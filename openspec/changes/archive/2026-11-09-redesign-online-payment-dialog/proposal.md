## Why

The available-gateways dialog shows each gateway as a large card with a
primary "Add" button. With 17 gateways and more to come, the admin must scroll
a lot and cannot find a gateway by name. Also, to add a manual method the admin
must open a blank form and write the name and the instructions. The new
dialog puts the common manual methods and the online gateways in one compact,
searchable list, and adds each one with one click.

## What Changes

- The header "Add" button in the Payments card opens the "Add a payment
  method" dialog directly. The dropdown with "Payment Gateways" and
  "Manual Payment" is removed. **Removes** the blank custom-method form for
  new methods. Existing custom manual methods stay, and the admin can still
  edit and delete them.
- The dialog title changes from "Available Payment Gateways" to
  "Add a payment method".
- Three manual presets show at the top of the dialog, in this fixed order:
  "Direct bank transfer", "Cheque payments", "Cash on delivery". They are
  hardcoded in the admin app, each with a fixed id (`bank_transfer`, `cheque`,
  `cod`), default instructions and a Lucide fallback icon (`Landmark`,
  `ReceiptText`, `Banknote`).
- "Add" on a manual preset creates the offline method at once through the
  existing create endpoint, with the preset id, name and instructions, enabled.
  A preset whose id exists shows "Added". After a delete, it shows "Add" again.
- The offline create endpoint accepts an optional `id` and rejects an id that
  already exists.
- In the Payments list, a manual method with a preset id and no uploaded icon
  shows the preset's Lucide icon. An uploaded icon always wins.
- The onboarding seeder adds only "Cash on delivery" (no longer "Direct bank
  transfer"), with the same name and instructions as its preset, so a new store
  shows it as "Added". The merchant adds the other presets from the dialog.
- A search bar shows at the top of the dialog. It stays in place while the list
  scrolls, gets focus when the dialog opens, and filters manual presets and
  gateways by name (case-insensitive) on the client. No new request is sent.
  When nothing matches, the dialog shows "No payment methods found".
- The list uses compact rows: icon, name and status badge on the left, one
  action on the right. A row changes its background on hover.
- Gateways show under the manual presets. Installed gateways show first; inside
  each group the API order stays. The order is set when the list first loads
  and does not change while the dialog stays open.
- Row states:
  - Not added: an "Add" button with no background. It shows only on row hover
    or keyboard focus.
  - Added, no update: an "Added" badge. Nothing on the right.
  - Gateway with an offered update: an "Update Available" badge (in place of
    "Added") and a small secondary "Update" button that always shows.
  - Gateway with a blocked update: an "Update Available" badge and an info icon
    on the right. The tooltip of the icon shows the blocked reason.
- During an add or an update, a spinner replaces the button of that row. All
  other "Add" and "Update" buttons are disabled until the request ends.
- **Changes the earlier rule** from `payment-gateway-updates`: the "Added"
  badge no longer shows next to the "Update" button, and the blocked reason
  moves from inline text into a tooltip.

## Capabilities

### New Capabilities

- `payment-method-picker`: The "Add a payment method" dialog: title, manual
  presets, search, empty states, row layout and hover, order, add actions and
  the one-operation-at-a-time rule.

### Modified Capabilities

- `payment-gateway-updates`: "Payments settings show gateway updates" changes
  how the dialog shows an offered and a blocked update. This capability is still
  in the unarchived change `payment-gateway-updates`, so that change must be
  archived first.
- `payment-methods-list`: The header "Add" opens the dialog directly; manual
  preset methods with no icon show the preset icon.
- `payment-providers`: Offline create accepts a client id and rejects a
  duplicate id.
- `onboarding-seed-data`: Only Cash on delivery is seeded, with the preset name,
  instructions and id.

## Impact

- Frontend (`resources/app/features/settings/payment/`):
  `components/dialogs/online-payment-dialog.tsx` (rewrite),
  `components/list/payment-methods.tsx` (header button, remove the blank-form
  entry), `components/list/sortable-payment-method.tsx` (preset icon fallback),
  new `utils/` helpers and `presets` module, tests in `tests/`.
  `services/payment.ts` lets `createOfflinePayment` take an optional `id`.
  The create mode of `offline-payment-dialog.tsx` becomes unused and is removed.
- Backend: `OfflinePaymentCreateRequest` (accept `id`), `OfflinePaymentService::create`
  (reject a duplicate id with 409), `SettingsSeeder` (names and texts),
  integration test in `tests/Integration/OfflinePaymentApiTest.php`.
- No new dependency. Lucide is already installed.
- Docs: `docs/payment-gateways.md`, `docs/payments.md` and the user guide.
