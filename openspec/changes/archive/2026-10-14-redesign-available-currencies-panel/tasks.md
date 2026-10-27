## 1. Footer state logic

- [x] 1.1 Confirm `automatic-exchange-rate-sync` is applied: the currency form has `is_automatic_update_enabled` (sent, not hard-coded), `last_sync_error` and `last_sync_error_at`. Stop and tell the user if it is not
- [x] 1.2 Add `getSyncStatus()` to `features/settings/multi-currency/lib/currency-list.tsx`, returning `{ tone, message }` for the five spec states in spec order, with each time-dependent sentence left out when its time is empty (correction: uses `formatDistanceStrict` against an injectable `now`, not `dateFormatter(..., 'relative')`; the non-strict form rounds 58 minutes to "about 1 hour", which does not match the spec)
- [x] 1.3 Add `features/settings/multi-currency/tests/lib/currency-list.test.ts` covering every spec scenario of "Sync status footer", with a fixed `now` (added to the existing test file; mocks `sprintf` in `@/wpi18n` because the test fallback only joins its arguments)
- [x] 1.4 In `use-available-currency-list.ts`, read the provider name with `useCurrencyExchangeProvidersQuery`, read the new form fields, and return `syncStatus`; remove `showApiProviderStatus` and any value this makes unused
- [x] 1.5 Verify: `npm run typecheck && npm test` from `resources/app/` (run together with group 2: the hook change breaks the page's types until 2.1 replaces its use of `showApiProviderStatus`)

## 2. Panel layout

- [x] 2.1 In `available-currency-list.tsx`, remove the `Card` / `CardContent` wrapper and use `StackedItems` as the container, with the settings-search attributes moved onto it
- [x] 2.2 Add the header `StackedItem` (`id="header"`): title on the left, "Sync now" (ghost, link color, refresh icon, auto width) on the right when there is more than one currency; no hover background, auto height
- [x] 2.3 Change currency rows: symbol, code (medium), name (secondary), "Base Currency" `info` badge, "Inactive" `destructive` badge; base row shows "1.00" with no actions; inactive row text subdued and no rate at rest, hover actions unchanged
- [x] 2.4 Add the footer `StackedItem` (`id="footer"`) only when there is more than one currency: info icon and `syncStatus.message`, warning color when `tone === 'warning'`, auto height, no hover background
- [x] 2.5 Remove imports, styles and helpers this change makes unused (`cardStyles`, `innerCardContent`, `InfoCircledIcon` if replaced)
- [x] 2.6 Verify: `npm run typecheck`, lint and `npm test` from `resources/app/`. Ask the user to check the panel visually with one currency, several currencies, an inactive currency, and each footer state (no browser verification) — typecheck, full lint, 1472 Vitest tests pass, settings search index still has `currency.available-currencies`; visual check handed to the user

## 3. Docs

- [x] 3.1 Update the quick start in `docs/currencies.md` for the new panel (rows, header "Sync now", the status footer and what each state means)
- [x] 3.2 Verify: `npm run typecheck && npm test` from `resources/app/` and `openspec validate redesign-available-currencies-panel --strict`
