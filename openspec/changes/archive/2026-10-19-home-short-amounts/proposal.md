## Why

Large store totals on the Home dashboard are long and hard to read at a glance
(for example `$1,234,567.00`). The Analytics page already shows short amounts
(`$1.2M`). The Home dashboard must show them the same way.

## What Changes

- The dashboard overview API adds `short_display` to the money objects of the
  Total sales and Net sales metrics and of each top product's revenue. The
  server makes the short text with the same rules as Analytics.
- The Total sales and Net sales cards show the short amount.
- Each Top selling products row shows the short revenue ("$20.3K generated").
- A short amount that is different from the long amount has a native hover
  tooltip with the long amount.
- There is no Short/Long option on Home. Home always shows short amounts.
- Recent orders do not change. They keep the exact order total.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `merchant-home-dashboard`: the metric cards, the top products card and the
  overview endpoint use short amounts.
- `analytics-metrics`: the "Short money display" requirement now lets the
  dashboard overview have `short_display`.

## Impact

- Backend: `app/Services/DashboardService.php`, the short money DTO and the
  shared helper that builds it (also used by `AnalyticsQueryService`).
- Frontend: `resources/app/features/home/` (overview schema, metric card, top
  products card, dashboard overview).
- API: three money objects of `GET /dashboard/overview` get one new key. This is
  additive. Other keys do not change.
- Docs: `docs/home.md` and `docs/analytics.md`.
- Tests: `tests/Integration/DashboardApiTest.php` and the Home schema tests.
