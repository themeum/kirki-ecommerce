## Why

The payment settings page shows two separate cards (manual methods and online gateways), each fed by its own list endpoint. The target design is a single "Payment methods" card with one "+ Add" button and one flat list. The backend already keeps offline and online providers in one registry, so a merged read is cheap and removes the duplicated UI and the double fetch.

## What Changes

- Add `GET /payment-methods`, returning every registered payment provider (offline and online) in one list with `id`, `name`, `icon`, `icon_media`, `is_enabled`, `is_offline`, `description`.
- Replace the `OfflinePayment` and `OnlinePaymentList` cards on the payment settings page with a single `PaymentMethods` card driven by the new endpoint.
- Rows match the new design: bordered rounded rows with icon and name; the enable switch and the ⋮ menu are revealed on hover or focus (always visible on touch devices).
- The single "+ Add" button opens a menu: "Manual payment" (existing offline dialog) or "Online gateway" (existing installable-gateway dialog).
- Enable, edit and delete keep using the existing per-type endpoints, chosen by `is_offline`.
- Existing mutations also invalidate the merged list so it refreshes.
- Existing `GET /online-payments` and `GET /offline-payments` stay unchanged.

## Capabilities

### New Capabilities

### Modified Capabilities
- `payment-providers`: adds a combined payment methods list REST surface served from the provider registry, alongside the existing online and offline surfaces.

## Impact

- Backend: `routes/api.php`, new `PaymentMethodController`, `PaymentMethodService`, `PaymentMethodListResource`; API docs under `docs/ecommerce/payment-methods/`; PHP tests.
- Frontend (`resources/app/`): `config/endpoints.ts`, `features/settings/services/query-keys.ts`, `features/settings/payment/` (schema, service, new `payment-methods.tsx`, `payment-settings.tsx`, skeleton, removal of `offline-payment.tsx` and `online-payment-list.tsx`), service tests.
- No breaking API changes; no new dependencies.
