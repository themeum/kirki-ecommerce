## Context

- The currency settings option holds one `api_config` (`api_key`, `update_frequency`,
  `fallback_behaviour`) next to `api_provider`. `CurrencyExchangeManager` reads
  `api_config.*` for the active check, the sync interval and the schedule fingerprint.
- `SettingsController::update()` removes `SERVER_OWNED_CURRENCY_KEYS` from a currency
  save, then calls `AppSettings::set()`, which does a top-level `array_merge` with the
  stored option. So a key the client does not send keeps its stored value.
- `SettingResource::get_currency_settings()` returns a whitelist of keys.
- On the page, `ApiConfig` (`api-config.tsx`) shows the "Configured" card when the form's
  `api_config.api_key` is set. The provider select only sets `api_provider`, so the old
  `api_config` stays. `ApiConfigurationPopup` resets its own form from the page form's
  `api_config` each time it opens, so a new `api_config` in the page form is enough to
  reset the dialog.
- The form schema transform sends `api_config: null` when no provider is selected.

## Goals / Non-Goals

**Goals:**

- Keep one saved configuration per provider and load it when that provider is selected.
- Keep sync, scheduling and provider code unchanged.
- Keep the configuration that is already saved on existing sites.

**Non-Goals:**

- Keeping unsaved dialog values per provider across provider changes.
- A control to delete a provider's saved configuration.
- Masking the API key in the settings response (it is returned in plain text today, too).
- Request validation of `api_configs` (the server ignores a client value for it).

## Decisions

1. **`api_configs` map next to `api_config`.** Stored shape:
   `api_configs: { <provider_id>: { api_key, update_frequency, fallback_behaviour } }`.
   `api_config` stays the active provider's configuration. Alternative: replace
   `api_config` with the map and read `api_configs[api_provider]` everywhere. Rejected:
   it changes the manager, the fingerprint and the request rules for no user-visible gain.

2. **The server writes the map.** `api_configs` is added to `SERVER_OWNED_CURRENCY_KEYS`,
   so a client value is removed before the save. After that, the controller builds the map
   from the stored settings and the incoming data, and adds it to `$data`:
   - start from the resolved stored map (decision 3);
   - when the incoming `api_provider` is not empty and the incoming `api_config.api_key`
     is not empty, set `api_configs[api_provider] = api_config` (the three known fields
     only).
   A save with no provider, or with a provider and no key, does not change the map.
   Alternative: the client sends the whole map. Rejected: a stale or partial form can
   overwrite other providers.

3. **Legacy fallback in one place.** A new public method on `CurrencyExchangeManager`,
   `resolve_provider_configs(array $settings)`, returns the stored `api_configs`
   (normalized to the three fields, non-array entries dropped) plus, when the map has no
   entry for the stored `api_provider` and the stored `api_config.api_key` is not empty,
   the stored `api_config` under that provider id. The controller (write) and
   `SettingResource` (read) both call it through the `CurrencyExchange` facade, so the
   first save after the upgrade also persists the legacy entry.

4. **Response.** `SettingResource::get_currency_settings()` adds
   `'api_configs' => <resolved map>`. An empty map is returned as an empty object
   (`(object) []`), so the client always gets a record, not a list.

5. **Frontend loads the saved config on provider change.** A pure helper in
   `lib/currency-list.tsx`, `getSavedProviderConfig(apiConfigs, providerId)`, returns the
   saved config for the provider or `null`. In `api-config.tsx`, the provider select's
   change handler sets `api_provider` and sets `api_config` to that helper's result
   (both `shouldDirty`). The clear handler sets both to `null`. The source of
   `api_configs` is the `currencySettings` prop (the loaded settings), so only saved
   values are loaded. `CurrencySettingsSchema` gains
   `api_configs: z.record(z.string(), CurrencyApiConfigSchema).nullish()`. The page form
   schema does not get `api_configs`, so it is never sent.

6. **Discard** resets the whole page form to the loaded settings, so it restores the saved
   provider and its `api_config`. No extra work.

## Risks / Trade-offs

- [Selecting the saved provider again shows its saved config, not the unsaved one] →
  This is the agreed behaviour (only saved configs reload).
- [Provider ids are map keys; a provider that is removed from the code leaves a stale
  entry] → Harmless: the entry is only read when that id is selected. Not cleaned up.
- [The API key of every configured provider is now in the settings response] → Same
  exposure as today's `api_config.api_key`; the endpoint needs the admin capability.
- [A save where the client sends `api_config` without `api_provider`] → The map does not
  change; `api_config` is stored as sent, as today.

## Correction during implementation (2026-10-14)

After groups 1–3 were implemented, the user decided against backward compatibility and
against keeping `api_config`. These decisions replace decisions 1, 2, 3 and 5 above.
Decisions 4 and 6 stay, adapted to the new shape.

1. **Only `api_configs` is stored** (replaces decision 1). Shape:
   `api_configs: { <provider_id>: { api_key, update_frequency } }`. `api_config` is not
   stored, read, accepted or returned. A new public
   `CurrencyExchangeManager::get_active_provider_config()` returns
   `api_configs[api_provider]` (normalized) or `[]`. `is_automatic_update_active()`,
   `get_sync_interval()` and `get_schedule_fingerprint()` read it.
   `CurrencyServiceProvider` passes the same entry to the manager as the provider config.
   The defaults (`resources/data/settings/currency.json`) and `SettingsSeeder` use
   `api_configs: {}`.

2. **The client sends the map; the server merges it per provider** (replaces decision 2).
   `api_configs` is removed from `SERVER_OWNED_CURRENCY_KEYS`. The request accepts
   `data.api_configs` (`nullable|array`), `data.api_configs.*.api_key`
   (`nullable|string`) and `data.api_configs.*.update_frequency`
   (`nullable|string|in:UpdateFrequency`), sanitized as ARRAY/TEXT. The old closure rule
   that required `api_config` while automatic updates are on is removed; the
   `api_provider` rule stays. `SettingsController::update()` starts from the stored map
   and replaces the entry of each sent provider with its normalized value. A provider
   that is not sent keeps its stored entry, so a client cannot delete another provider's
   entry by leaving it out. This accepts the risk that decision 2 avoided (a client can
   overwrite another provider's entry by sending it), because the page form holds the
   whole map that it loaded from the server.

3. **No legacy seeding** (replaces decision 3). `resolve_provider_configs()` is removed.
   An `api_config` key that an existing site still has in its stored option is not read,
   migrated or returned. `AppSettings::set()` merges, so a save does not delete it. This
   is acceptable: the plugin is not released, and the user asked for no backward
   compatibility.

4. **The page form holds the map** (replaces decision 5). The page form schema gets
   `api_configs: z.record(z.string(), ApiConfigSchema)`, filled from the settings and
   sent on save. A pure helper `getProviderConfig(apiConfigs, providerId)` in
   `lib/currency-list.tsx` returns the selected entry or `null`; it replaces
   `getSavedProviderConfig()`. The provider select only sets `api_provider`. The dialog
   reads and writes `api_configs.<api_provider>`. The card and
   `use-available-currency-list` use the selected entry's `api_key`. Because entries live
   in the page form, unsaved values for a provider stay until save or discard (this
   replaces the agreed "only saved configs reload" behaviour).

5. **Fallback behaviour is removed.** `fallback_behaviour` is removed from both form
   schemas, the catalog schema, the resource, the request, `normalize_provider_config()`,
   the defaults and the tests. `app/Constants/CurrencyUpdateFallback.php` is deleted (its
   only user is the removed request rule). A failed sync keeps the rates because
   `CurrencyExchangeManager::sync()` gets all rates before it updates any currency;
   `test_failed_run_keeps_rates_and_continues` covers the automatic sync, and the failed
   "Sync now" test gets the same rate assertion.
