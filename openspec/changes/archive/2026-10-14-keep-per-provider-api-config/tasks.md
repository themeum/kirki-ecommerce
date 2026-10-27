## 1. Backend

- [x] 1.1 Add `resolve_provider_configs(array $settings)` to `CurrencyExchangeManager` (normalized stored `api_configs` plus the legacy `api_config` under the stored `api_provider` when missing), with a docblock, and add it to the `CurrencyExchange` facade `@method` list
- [x] 1.2 Add `api_configs` to `SettingsController::SERVER_OWNED_CURRENCY_KEYS`; in `update()`, for the currency key, build `api_configs` from the resolved stored map and the incoming `api_provider` + `api_config` (only when both the provider and the API key are not empty) and add it to `$data`
- [x] 1.3 Return `api_configs` from `SettingResource::get_currency_settings()` through `resolve_provider_configs()`, as an object when empty
- [x] 1.4 Integration tests (`tests/Integration/`): save stores the config under its provider; saving provider B keeps provider A's entry; a client-sent `api_configs` is ignored; a legacy `api_config` with no map is returned under its provider and persisted on the next save; clearing the provider keeps the map; a provider with no API key does not change the map

## 2. Frontend

- [x] 2.1 Add `api_configs: z.record(z.string(), CurrencyApiConfigSchema).nullish()` to `CurrencySettingsSchema` in `schemas/catalog/settings.ts`, and extend its test
- [x] 2.2 Add `getSavedProviderConfig(apiConfigs, providerId)` to `lib/currency-list.tsx` with Vitest tests (saved config, no entry, empty provider, empty map)
- [x] 2.3 In `api-config.tsx`, on provider select change set `api_config` to `getSavedProviderConfig(currencySettings?.api_configs, value)`; on clear set `api_config` to `null` (both `shouldDirty`)

## 3. Docs and verification

- [x] 3.1 Update `docs/currencies.md`: per-provider saved configurations, the `api_configs` settings key, provider-change behaviour, and the "Where this differs" section if it is affected
- [x] 3.2 Run `npm run typecheck`, `npm run lint` and `npm test` in `resources/app`
- [x] 3.3 Run phpcs (default, `phpcs-wporg.xml.dist`, docblock sniff) on the changed PHP files, and the Integration tests `--filter Setting` and `CurrencySyncScheduleTest`
- [x] 3.4 Ask the user to check the provider switch on Settings → Currency in the browser

## 4. Replace api_config with api_configs and remove fallback behaviour

- [x] 4.1 `CurrencyExchangeManager`: remove `resolve_provider_configs()`; add `get_active_provider_config()` (normalized `api_configs[api_provider]` or `[]`); make `is_automatic_update_active()`, `get_sync_interval()` and `get_schedule_fingerprint()` read it; remove `fallback_behaviour` from `normalize_provider_config()`; update the `CurrencyExchange` facade `@method` list
- [x] 4.2 `CurrencyServiceProvider`: pass the active provider entry from `api_configs` to the manager instead of `api_config`
- [x] 4.3 `SettingsController`: remove `api_configs` from `SERVER_OWNED_CURRENCY_KEYS`; merge the sent `api_configs` per provider into the stored map (sent entries replace, others are kept); update docblocks
- [x] 4.4 `SettingsUpdateRequest`: remove the `api_config` rules, sanitizers and the fallback rule; add `data.api_configs`, `data.api_configs.*.api_key`, `data.api_configs.*.update_frequency` rules and sanitizers; remove the `CurrencyUpdateFallback` import
- [x] 4.5 `SettingResource`: remove `api_config`; return `api_configs` (normalized, object when empty)
- [x] 4.6 Defaults and seed: `resources/data/settings/currency.json` and `database/seeders/SettingsSeeder.php` use `api_configs: {}` and have no `api_config`; delete `app/Constants/CurrencyUpdateFallback.php`
- [x] 4.7 Integration tests: rewrite `CurrencyProviderConfigsTest` for the map request (store per provider, keep unsent providers, replace a sent entry, clear provider keeps map, fallback not stored, response has no `api_config`; remove the legacy test); update `CurrencySyncScheduleTest` fixtures to `api_configs` and add a rate-unchanged assertion to the failed "Sync now" test
- [x] 4.8 Frontend schemas: remove `fallback_behaviour` from `api-configuration-form.ts`, `CurrencyApiConfigSchema` and their tests; in `multi-currency-settings-form.ts` replace `api_config` with `api_configs` (record of `ApiConfigSchema`) and send the normalized map; remove `api_config` from `CurrencySettingsSchema`; update the schema tests
- [x] 4.9 Replace `getSavedProviderConfig()` with `getProviderConfig(apiConfigs, providerId)` in `lib/currency-list.tsx`, with Vitest tests
- [x] 4.10 Components: `api-config.tsx` (provider change only sets `api_provider`; "Configured" from the selected entry; dialog save writes `api_configs.<provider>`), `api-configuration-dialog.tsx` (read the selected entry), `api-configuration-card.tsx` (read the selected entry), `use-available-currency-list.ts` (`hasApiKey` from the selected entry)
- [x] 4.11 Docs: `docs/currencies.md` (map request, unsaved values stay until save or discard, no fallback, no `api_config`); `docs/ecommerce/settings/currency.yml` example uses `api_configs` with a placeholder key
- [x] 4.12 Verify: `grep` finds no `api_config\b`/`fallback_behaviour`/`CurrencyUpdateFallback` outside `openspec/`; typecheck, lint, `npm test`; phpcs (default, wporg, docblock) on changed PHP files; Integration `CurrencyProviderConfigsTest`, `CurrencySyncScheduleTest`, `--filter Setting`
- [x] 4.13 Ask the user to check provider switching, the dialog and "Configured" on Settings → Currency in the browser
