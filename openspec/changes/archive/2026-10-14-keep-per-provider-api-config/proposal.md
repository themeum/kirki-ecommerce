## Why

The currency settings store one `api_config` for whichever exchange-rate provider is
selected. When the administrator configures one provider and then selects another, the
page keeps the first provider's API key and frequency, shows the new provider as
"Configured", and saves the first provider's key under the new provider. A key that was
saved for a provider is also lost as soon as another provider is saved.

## What Changes

- **BREAKING** The currency settings store the API configuration of each provider in an
  `api_configs` map, keyed by provider id (`api_key`, `update_frequency`). `api_config`
  is removed: it is not stored, read, accepted or returned. The selected provider's
  configuration is `api_configs[api_provider]`, and sync and scheduling read it from
  there. There is no backward compatibility for settings saved with `api_config`.
- The page form holds the `api_configs` map and sends it on save. The server merges it
  per provider: each sent provider entry replaces that provider's stored entry, and
  providers that are not sent keep their stored entry.
- The settings API returns `api_configs`.
- When the administrator changes the provider select, the page shows that provider's
  configuration from the map. The card shows "Configured" only when that provider has an
  API key. Values entered for a provider stay on the page until save or discard.
- Clearing the provider and saving keeps `api_configs`.
- **BREAKING** The fallback behaviour is removed completely (`fallback_behaviour` field,
  request rule, defaults and constant class). A failed sync always keeps the previous
  exchange rates.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `multi-currency-settings`: "Exchange rate provider and automatic updates are
  configurable" gains per-provider configurations, the provider-change behaviour, and
  the removal of the stored fallback behaviour.

## Impact

- PHP: `SettingsController::update()` (per-provider merge),
  `SettingsUpdateRequest` (`api_configs` rules and sanitizers; `api_config` and
  fallback rules removed), `SettingResource::get_currency_settings()`,
  `CurrencyServiceProvider` (active provider config), `CurrencyExchangeManager`
  (active check, interval, fingerprint read the selected entry),
  `resources/data/settings/currency.json`, `database/seeders/SettingsSeeder.php`,
  `app/Constants/CurrencyUpdateFallback.php` (deleted).
- React: `schemas/catalog/settings.ts`, `schemas/forms/multi-currency-settings-form.ts`,
  `schemas/forms/api-configuration-form.ts`, `lib/currency-list.tsx`, `api-config.tsx`,
  `api-configuration-dialog.tsx`, `api-configuration-card.tsx`,
  `hooks/use-available-currency-list.ts`.
- Tests: integration tests for the save, read and sync paths; Vitest tests for the
  schemas and helpers.
- Docs: `docs/currencies.md`, `docs/ecommerce/settings/currency.yml`.
- No change to the providers or the sync job.
