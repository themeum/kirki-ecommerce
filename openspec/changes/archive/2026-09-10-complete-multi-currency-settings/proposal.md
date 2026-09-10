## Why

The Currency settings page ships with the "Available Currencies" panel gated behind
a "Coming Soon" badge even though every backend endpoint it needs already exists and
the storefront already converts prices against the currency table. The API-provider
panel is a fully built but permanently disabled "Work in progress", and the backend
exchange infrastructure (`CurrencyExchangeManager::sync()`, two providers) has no
endpoint that can trigger it. This change finishes the manual half of the feature and
adds an on-demand rate sync, while deliberately leaving scheduled/automatic updates
off.

## What Changes

- Un-gate the "Available Currencies" panel (badge + disabled "Add Currency" button —
  already removed in the working tree).
- Replace the standalone "Edit exchange rate" dialog with an **inline numeric input**
  on each currency row. **BREAKING** (internal): `edit-currency-dialog.tsx` and
  `edit-currency-form.ts` are deleted.
- Replace the row's dropdown with a **three-dot menu** offering "Set as default" and
  "Delete", each routed through the shared settings confirmation dialog.
- Simplify delete: drop the toast-with-undo in favour of the explicit confirm dialog.
- Payload hygiene: currency create/update request bodies carry only currency fields
  (no serialized React elements from the enriched list items).
- Add-currency flow rejects blank / non-positive exchange rates client-side.
- New endpoint `POST /currency-exchange/sync` runs `CurrencyExchange::sync()` on
  demand, guarded against a missing provider and provider errors.
- `CurrencyController::update` no longer returns a success status when every item
  failed.
- Enable the API-provider **configuration** UI (select provider, save API key) and add
  a **"Sync now"** button; the `is_automatic_update_enabled` switch stays disabled and
  no scheduler is added.
- The currency list shows a "Last synced" line whenever a provider and a last-sync
  timestamp exist (no longer gated on the automatic-update flag).

Out of scope: recurring rate scheduler, the `update_frequency` default-constant bug in
`resources/data/settings/currency.json`, and API-key encryption at rest.

## Capabilities

### New Capabilities

- `multi-currency-settings`: managing the store's currencies from the Currency
  settings page — adding currencies, editing exchange rates inline, activating /
  deactivating, choosing the base currency and deleting (both behind confirmation),
  and pulling fresh exchange rates on demand from a configured provider.

### Modified Capabilities

<!-- none: no existing spec covers currency management -->

## Impact

- **Frontend** (`resources/app/features/settings/multi-currency/`):
  `available-currency-list.tsx`, `use-available-currency-list.ts`, `lib/currency-list.tsx`,
  `exchange-rate-dialog.tsx`, `api-config/api-config.tsx`, `services/currency.ts`,
  `schemas/forms/exchange-rate-form.ts`; deletes `edit-currency-dialog.tsx` +
  `schemas/forms/edit-currency-form.ts`; `resources/app/config/endpoints.ts`.
- **Backend**: `app/Http/Controllers/Api/CurrencyExchangeController.php` (new `sync`
  action), `app/Http/Controllers/Api/CurrencyController.php` (`update` status),
  `routes/api.php` (new route).
- **Tests**: `tests/lib/currency-list.test.ts`,
  `tests/schemas/forms/exchange-rate-form.test.ts` (updated), delete
  `edit-currency-form.test.ts`; `tests/Integration/CurrencyApiTest.php` +
  new `tests/Integration/CurrencyExchangeApiTest.php`.
- **API consumers**: new `POST /currency-exchange/sync`; `PUT /currencies` may now
  return `422` instead of `201` when all items fail.
