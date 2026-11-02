## 1. Toggle value and footer copy

- [x] 1.1 In `multi-currency-settings-form.ts`, send `is_automatic_update_enabled` as `Boolean(values.is_automatic_update_enabled)`; update `multi-currency-settings-form.test.ts` (the "without a provider or API key" test now expects `true`)
- [x] 1.2 In `lib/currency-list.tsx`, change the "no provider" footer message to "Automatic updates are off. Exchange rates are updated manually. Turn on Automatic Updates below and select an API provider to keep rates current."; update its test in `tests/lib/currency-list.test.ts`
- [x] 1.3 Verify: `npm run typecheck && npm test` from `resources/app/` (also formatted one line of `currency-list.test.ts` that the previous change left unformatted)

## 2. Collapsible card

- [x] 2.1 In `components/option-accordion.tsx`, add an optional `onOpenChange(open: boolean)` prop; when it is set, control the accordion with `value` / `onValueChange` and give the item the fixed value `option-item`; without it, keep the current behavior
- [x] 2.2 In `api-config.tsx`, remove `canEnableAutomaticUpdates` and the `disabled` prop; the switch shows the form value; keep `isExpanded` local state (initial value from the saved toggle); the switch handler sets the form value and `isExpanded`; pass `expandable`, `open` and `onOpenChange` to `OptionAccordion` (correction: keeps `isCollapsed` instead, see design.md)
- [x] 2.3 In `api-config.tsx`, replace the color override: wrapper `background.surface`, body card `background.surfaceAlt` with only a top border; check that the provider select and the provider card stay white (also squared the body card's top corners, so the white header does not show at them; the select trigger and `Card` default to `background.surface`)
- [x] 2.4 Verify: `npm run typecheck`, lint and `npm test` from `resources/app/`. Ask the user to check visually: toggle off (collapsed, no chevron), toggle on (expanded, chevron works), reload with each saved state, and the colors (no browser verification) — typecheck, full lint and 1472 Vitest tests pass; visual check handed to the user

## 3. Docs

- [x] 3.1 In `docs/currencies.md`, update section 5 (the switch is always enabled, it shows the provider section, and syncs run only with a provider and an API key) and the "no provider" row of the footer message table
- [x] 3.2 Verify: `npm run typecheck && npm test` from `resources/app/` and `openspec validate collapsible-automatic-updates-card --strict`

## 4. Follow-up: remove the cache option

- [x] 4.1 Remove the "Cache exchange rates to reduce API calls" checkbox from `api-configuration-dialog.tsx` and `is_cache_enabled` from `api-configuration-form.ts`, `multi-currency-settings-form.ts` and `schemas/catalog/settings.ts`; update their tests (`api-configuration-form.test.ts`, `multi-currency-settings-form.test.ts`, `schemas/catalog/settings.test.ts`)
- [x] 4.2 Remove `is_cache_enabled` from `SettingResource::get_currency_settings()` and from the rules and sanitizers in `SettingsUpdateRequest` (also removed it from the `api_config()` fixture in `CurrencySyncScheduleTest`)
- [x] 4.3 Verify: `npm run typecheck && npm test` from `resources/app/`, phpcs on the changed PHP files, and the currency Integration tests (typecheck, 1472 Vitest tests, phpcs default/wporg/docblocks pass; `--filter Setting` 47 OK; `--filter Currenc` has 1 failure, `StorePresetsTest::test_matching_currency_enables_country_methods_with_amounts`, which also fails on HEAD with the same filter and passes alone: an existing test-order problem)

## 5. Follow-up: one-line footer messages

- [x] 5.1 In `lib/currency-list.tsx`, change the `getSyncStatus()` copy to the spec scenarios (keep the five states, their order and the empty-time rules); update `tests/lib/currency-list.test.ts`
- [x] 5.2 Verify: `npm run typecheck && npm test` from `resources/app/` (typecheck and 1472 Vitest tests pass)

## 6. Follow-up: provider logos

- [x] 6.1 In `api-config.tsx` and `api-configuration-card.tsx`, show the selected provider's `icon` from the providers query (`<img alt="">`, 16px) in place of the flag icon, and keep the flag icon when the provider has no icon. Use the existing PNG files (`exchangeratesapi.png`, replaced by the user, and `currencyapi.png`); no PHP change (added `provider-logo.tsx`, used by both cards; it renders the `Image` component at size `xs` with `fit="contain"`)
- [x] 6.2 Verify: `npm run typecheck`, lint and `npm test` from `resources/app/`. Ask the user to check the logos visually (typecheck, full lint, 1472 Vitest tests pass; visual check handed to the user)

## 7. Follow-up: docs

- [x] 7.1 In `docs/currencies.md`, update the footer message table and remove the "No rate caching" limit; in `docs/ecommerce/settings/currency.yml`, remove `is_cache_enabled` from the example (correction: kept the "No rate caching" limit, because each sync still calls the provider; removed only its mention of the dialog option)
- [x] 7.2 Verify: `npm run typecheck && npm test` from `resources/app/` and `openspec validate collapsible-automatic-updates-card --strict` (typecheck, 1472 Vitest tests and `--strict` validation pass; no old footer text or cache option is left in code, tests or docs)
