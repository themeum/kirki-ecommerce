## Context

See proposal.md (Why). Current state:

- `components/dialogs/online-payment-dialog.tsx` renders each gateway as a
  `Card` with a primary "Add" button, or an "Added" success badge plus an
  optional secondary "Update" button and inline `update_blocked_reason` text. It
  reads `useInstallableOnlinePaymentsQuery`, `useInstallOnlinePaymentMutation`
  and `useUpdateOnlinePaymentPluginMutation`.
- `components/list/payment-methods.tsx` has a header `DropdownMenu` with
  "Payment Gateways" (opens the online dialog) and "Manual Payment" (opens
  `OfflinePaymentPopup` with `editingMethod = null`, a blank create form). It
  mounts the online dialog only while it is open, so its state resets on each open.
- Manual (offline) methods live in the `offline_payments` array of the payment
  settings option. `OfflinePaymentService::create` uses `$data->id` when set,
  else `Str::uuid()`, and does not check for a duplicate. But
  `OfflinePaymentCreateRequest` has no `id` rule, so a client id does not reach
  the DTO today.
- `SettingsSeeder::get_offline_payments()` seeds `cod` ("Cash on Delivery") and
  `bank_transfer` ("Direct bank transfer"), both disabled, with no icon. This
  change keeps only `cod`; the merchant adds the other presets from the dialog.
- `sortable-payment-method.tsx` `renderMethodIcon` shows the uploaded icon URL,
  else `LandmarkIcon` for every offline method and `CardSimIcon` for online.
- `useOfflinePaymentsQuery` (`GET /offline-payments`) and
  `useCreateOfflinePaymentMutation` exist; the mutation invalidates the offline
  and methods lists and toasts on success and error.
- `DialogBody` scrolls; `Searchbox` forwards its ref and has a `delay` prop;
  `InfoTooltip`, `Badge` (`default`, `warning`), `Button` (`link`, `secondary`,
  `sm`) and `Spinner` exist.

## Goals / Non-Goals

**Goals:**

- Implement `payment-method-picker` and the deltas for `payment-gateway-updates`,
  `payment-methods-list`, `payment-providers` and `onboarding-seed-data`.
- Keep the row-state, order and filter logic in pure functions with unit tests.

**Non-Goals:**

- No change to the online gateway API or the remote catalog.
- No change to the offline edit dialog fields (name, icon, instructions).
- No migration of existing stores: their stored names and texts stay as they are.
- No virtualisation of the list.
- No change to the shared `Searchbox`, `Badge`, `Button` or `Dialog` components.

## Decisions

### 1. Manual presets module

`features/settings/payment/presets/manual-payment-presets.ts` exports an ordered
array of `{ id, name, instructions, icon }`, where `name` and `instructions`
use `__()` and `icon` is a Lucide component (`Landmark`, `ReceiptText`,
`Banknote`), plus `getManualPresetIcon(id)`. Instructions:

- Direct bank transfer: "Pay directly into our bank account, using your order number as the reference."
- Cheque payments: "Send a cheque payable to our store, with your order number on the back."
- Cash on delivery: "Pay with cash when your order is delivered."

Because the module calls `__()`, the array is built in a function
(`getManualPaymentPresets()`), not at import time, so the strings use the loaded
locale. Alternative: presets from a PHP endpoint, one source for seeder and UI.
Rejected by the user: the presets are hardcoded in the app; the seeder copies
the texts. The risk of drift is in Risks.

### 2. Preset add path

"Add" on a preset calls `useCreateOfflinePaymentMutation` with
`{ id, name, instructions, icon: null, is_offline: true, is_enabled: true }`.
The service type of `createOfflinePayment` widens to
`OfflinePaymentFormPayload & { id?: string }`. The form schema does not change,
because the preset path does not use the form. The added state comes from
`useOfflinePaymentsQuery`: a preset is added when its id is in that list.

Backend: `OfflinePaymentCreateRequest` adds `'id' => 'nullable|string'` with
`Sanitizer::KEY` (lowercase letters, digits, `_` and `-`; preset ids and UUIDs
pass unchanged); the service
checks the existing ids before insert and throws the framework `HttpException`
with `Response::CONFLICT` (409) on a duplicate. Framework-first rule: no native
WordPress call is needed.

### 3. Pure helpers in `features/settings/payment/utils/payment-method-rows.ts`

- `getGatewayRowStatus(item)` → `'not-added' | 'added' | 'update-available' | 'update-blocked'`.
  `update_blocked_reason` wins over `update_available`.
- `orderInstalledFirst(items)` → stable partition of gateway ids: installed
  first, then the rest, each in API order.
- `filterRowsByName(rows, query)` → case-insensitive substring on `name`,
  trimmed query; empty query returns all rows. Works on both row kinds.

Tests go in `features/settings/payment/tests/utils/payment-method-rows.test.ts`
and `tests/presets/manual-payment-presets.test.ts`. This adds new `utils/` and
`presets/` folders to the feature; no feature has them yet. Alternative: logic
inline, tested through a jsdom render. Rejected: slower, and cannot test CSS hover.

### 4. One row model

The dialog maps both sources to one view row:
`{ key, kind: 'manual' | 'gateway', name, icon, status, onAdd, onUpdate?, blockedReason? }`.
Rows = manual presets (fixed order) + gateways (snapshot order). Then the name
filter applies. One `PaymentMethodRow` component renders both kinds.

### 5. Stable gateway order: snapshot the ids once

The component keeps `orderedGatewayIds` in `useState`, set once from the first
successful gateway data. Rows map the ids to the latest data; an id not in the
snapshot is appended. The dialog unmounts on close, so the next open takes a
new snapshot. Manual presets have a fixed order and need no snapshot.

### 6. Search above `DialogBody`, autofocus via `onOpenAutoFocus`

The `Searchbox` (`delay={0}`) sits between `DialogHeader` and `DialogBody`, so it
never scrolls. `DialogContent` gets `onOpenAutoFocus` that calls
`event.preventDefault()` and focuses the search ref (Radix would focus the close
button).

### 7. Hover reveal with `opacity`

The row style sets the background on `&:hover` and `&:focus-within`, and the
"Add" button has `opacity: 0`, set to `1` by the same rule. The button keeps its
box, so nothing moves. Alternative: `visibility: hidden`. Rejected: a hidden
button cannot get focus, so the Tab key could never reach "Add". The spinner,
"Update" and the info icon always show.

### 8. One busy key for three mutations

`busyKey` comes from the pending one of: offline create (`variables.id`),
gateway install, gateway update. Keys are prefixed by kind (`manual:cod`,
`gateway:paypal`) so an offline id and a gateway id cannot collide. The busy row
shows `<Spinner />`; all other buttons get `disabled={busyKey !== undefined}`.

### 9. Header button and dead create mode

The `DropdownMenu` in `payment-methods.tsx` is replaced by one `Button` that
opens the dialog. `OfflinePaymentPopup` is now only opened for edit, so its
create-only branches (create mutation, "Add" title, `editingMethod === null`
paths) become unused and are removed. Edit keeps the method id, so a preset
stays "Added" after a rename.

### 10. Components per state

| Status             | Left badge                                    | Right slot                                       |
| ------------------ | --------------------------------------------- | ------------------------------------------------ |
| `not-added`        | none                                          | `Button variant="link"` "Add" (hover reveal)     |
| `added`            | `Badge variant="default"` "Added"             | empty                                            |
| `update-available` | `Badge variant="warning"` "Update Available"  | `Button variant="secondary" size="sm"` "Update"  |
| `update-blocked`   | `Badge variant="warning"` "Update Available"  | `Tooltip` around an inline info icon, with the reason |

The "Added" badge uses the neutral variant to match the grey badge in the design.

### 11. Icon fallback in the Payments list

`renderMethodIcon` in `sortable-payment-method.tsx`: uploaded URL first; then,
for an offline method, `getManualPresetIcon(method.id)`; then the current
`LandmarkIcon` / `CardSimIcon`. The drag overlay uses the same function if it
shows the icon.

## Risks / Trade-offs

- [Preset texts live in React and in the PHP seeder, so they can drift] → The
  PHP test asserts the seeder values and the presets test asserts the React
  values, with the same strings. A text change must update both tests.
- [Existing stores keep "Cash on Delivery" (capital D) as the stored name] →
  The dialog shows the preset name "Cash on delivery" with "Added"; the Payments
  list shows the stored name. Accepted: no data migration (Non-Goal).
- [Seeder methods are disabled, preset add is enabled] → Accepted by the user.
  The onboarding spec already said "enabled" while the code seeds disabled; this
  change makes the spec match the code (disabled), which the seeder comment
  explains (the Home checklist).
- [`opacity: 0` button is still clickable by a pointer on the row] → The
  pointer on the row already reveals it.
- [New `utils/` and `presets/` folders in a feature] → Small; move next to the
  dialog if the reviewer prefers.
- [Archive order: the `payment-gateway-updates` delta MODIFIES a requirement that
  exists only in the unarchived `payment-gateway-updates` change] → Archive that
  change before this one.

## Correction during implementation

- The blocked-update icon first used `InfoTooltip`. That component places its
  icon with `position: absolute` over the content it wraps (it is made for
  icons inside fields). With no content, the icon had no box in the layout,
  and the tooltip did not show in the browser. The row now uses `Tooltip`
  around an inline `InfoCircledIcon`, the same pattern as
  `currency-support-badge.tsx`. A DOM test checks that the icon is not
  absolutely placed and that the tooltip opens with the reason.
