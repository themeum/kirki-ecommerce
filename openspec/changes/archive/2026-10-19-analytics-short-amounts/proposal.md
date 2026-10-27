## Why

Large amounts such as $1,234,567.89 are long and hard to read in the key
metrics, the card headlines and the lists of the Analytics page. Merchants want
to see them in a short form such as $1.2M, and to switch back to the full
amount when they need the exact value.

## What Changes

- Every money object in the Analytics responses gets a new `short_display`
  string next to `display`, for example `$20.3K`. The backend makes it with the
  store's currency symbol, symbol position and separators.
- The Analytics `meta` gets an `amount_example` money object (20,345 in the
  base currency), so the Customize sheet can show the two formats.
- The Customize sheet gets an "Amounts" group below "Cards", with a radio
  group: "Short ($20.3K)" and "Long ($20,345.00)".
- The page shows `short_display` or `display` for each money amount, as
  selected. A change does not fetch the data again. In Short mode, a short
  amount shows the long amount on hover (native `title`).
- The choice is kept with the layout in local storage. The default is Short.
  "Reset to default" sets Short.
- Chart tooltips stay long, and chart axes stay short, as they are now.
- Other APIs do not change: only the Analytics responses use the new field.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: money objects get `short_display` with fixed rules, and
  `meta` gets `amount_example`.
- `analytics-customize`: the sheet gets the "Amounts" group, the page shows the
  selected format, and the saved and default layouts include the format.

## Impact

- Backend: `app/Managers/MoneyManager.php` (new `format_short`),
  `app/Facades/Money.php` (docblock), new `app/DTO/AnalyticsMoneyDTO.php`,
  `app/Services/AnalyticsQueryService.php` (`money()` and `meta`).
- Frontend: `resources/app/features/analytics/` schemas, `lib/format.ts`,
  `lib/layout.ts`, `hooks/use-analytics-layout.ts`, `customize-sheet.tsx`, the
  cards and the page that show money.
- Tests: `tests/Unit/Managers/MoneyManagerTest.php`, the Analytics integration
  tests, and the Analytics frontend tests.
- Docs: `docs/analytics.md`.
- Existing saved layouts have no format, so they show Short after the update.
