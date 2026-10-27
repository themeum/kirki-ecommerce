## 1. Backend short text

- [x] 1.1 Add `MoneyManager::format_short(Money $money)` with the rules in the analytics-metrics delta, and the `@method` line in `app/Facades/Money.php`
- [x] 1.2 Add unit tests in `tests/Unit/Managers/MoneyManagerTest.php`: 850, 999.99, 1,000, 20,000, 20,345, 20,350, 999,949, 999,950, 1,234,567, 3e9, 1e12, 1.5e15, a negative amount, a 0-decimal currency, the symbol after the amount, and `,` as the decimal separator
- [x] 1.3 Add `app/DTO/AnalyticsMoneyDTO.php` (extends `MoneyDTO`, adds `short_display`)
- [x] 1.4 Make `AnalyticsQueryService::money()` return an `AnalyticsMoneyDTO`, and add `amount_example` (20,345 major units of the base currency) to `meta()`
- [x] 1.5 Update the Analytics integration tests: money objects have `short_display`, `meta.amount_example` is present, and a dashboard money object has no `short_display`
- [x] 1.6 Verify: phpcs on the changed PHP files, the PHP unit and integration tests, and `npm run typecheck && npm test` (from resources/app/)

## 2. Frontend data and layout

- [x] 2.1 Add the analytics money schema (`MoneyObjectSchema.extend({ short_display })`) and use it in the Analytics catalog schema; add `amount_example` to `AnalyticsMetaSchema`; update `tests/schemas/catalog/analytics.test.ts` and the test fixtures
- [x] 2.2 Add `amounts: 'short' | 'long'` to `AnalyticsLayout` with default `'short'`; read it as optional in `normalizeLayout` (missing or unknown gives `'short'`); add `setAmounts` to `useAnalyticsLayout`; update the layout tests (old layout without `amounts`, unknown value, reset)
- [x] 2.3 Change `formatMoney(money, format)` and add the amount format context and `useMoney()` hook that returns `{ text, title }`; update `tests/lib/format.test.ts`
- [x] 2.4 Verify: `npm run typecheck && npm test` (from resources/app/) and lint

## 3. Frontend display and sheet

- [x] 3.1 Provide the format from the page, and use it in the key metrics, the card headlines, Total sales breakdown, the ranked lists, Sales by category, Sales by product and Sales by location (rows and map tooltip); add the optional `title` to `HBarList` rows; pass the format to `lib/location.ts`
- [x] 3.2 Add the "Amounts" group below "Cards" in `customize-sheet.tsx`, with the radio group and the examples from `meta.amount_example` of the `kpis` query
- [x] 3.3 Add page and sheet tests: Short shows `short_display` with the long title, Long shows `display` with no title and sends no request, the sheet examples, the selection persists, and Reset sets Short; chart tooltips stay long
- [x] 3.4 Verify: `npm run typecheck && npm test` (from resources/app/) and lint

## 4. Docs

- [x] 4.1 Update `docs/analytics.md`: the Amounts group in the Customize section, the short rules and the title in "Key metrics" or "Cards", the stored format and the Short default, and a "Where this differs" item for the fixed English unit letters
- [x] 4.2 Verify: `npm run typecheck && npm test` (from resources/app/) and `openspec validate analytics-short-amounts --strict`
