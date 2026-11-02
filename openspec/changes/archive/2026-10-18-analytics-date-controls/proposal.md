## Why

The first Analytics page uses simple option lists for the date range and the
comparison, and it shows a currency filter that merchants do not need. The
controls do not match the Analytics design: no white trigger background, no
two-month calendar with presets, no Cancel/Apply step, and no Customize button.
This change is the first step of the Analytics recap, so the controls are done
before the cards and charts.

## What Changes

- The date range control uses the shared `DateRangePicker` with the analytics
  presets on the left (Today, Yesterday, Last 7 days, Last 30 days, Last 90
  days, Last 12 months, Month to date, Year to date, Custom), read-only Start
  and End fields, a two-month calendar, and a footer with the day count and
  Cancel/Apply buttons. "Custom" is a status only: it is active when the
  selected dates match no preset.
- `DateRangePicker` gets opt-in props: a custom preset list, a confirm mode
  (pending selection, Start/End fields, footer with Cancel/Apply), and a custom
  trigger. Current users (the orders filter and `DateField`) keep the current
  behavior.
- The comparison control becomes a popover list (Previous period, Previous
  year, Custom, No comparison) with the resolved dates under each option and a
  footer that shows the pending comparison range with Cancel/Apply. "Custom"
  makes the panel wider and shows the Start/End fields and a two-month calendar.
  The trigger shows "Compare: <dates>" or "No comparison".
- The date and comparison triggers have the design-system white background.
- A "Customize" button shows on the right of the controls row. It has no
  function yet.
- **BREAKING** The currency filter is removed from the page, the URL query, the
  `GET /analytics/overview` request, the query service, and the response
  (`currencies`). Every money metric uses the base currency. The response keeps
  `base_currency_code`.
- The currency-filtered rounding note on the Total sales breakdown card is
  removed.
- Color rule: the analytics color tokens are for graphs only. All other parts
  of the Analytics page use design-system tokens. This change applies the rule
  to the controls. The next recap steps apply it to the other parts.
- `docs/analytics.md` is updated for the new controls and the removed currency
  filter.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-page`: the date and comparison controls change shape and behavior,
  the currency control and the rounding note are removed, a Customize button is
  added, and the analytics colors are limited to graphs.
- `analytics-metrics`: the currency filter is removed; the endpoint no longer
  accepts `currency` and no longer returns `currencies`.
- `date-pickers`: `DateRangePicker` gets a custom preset list, a confirm mode
  with read-only Start/End fields and a Cancel/Apply footer, and a custom
  trigger.

## Impact

- Frontend: `resources/app/features/analytics/components/analytics-controls.tsx`,
  `features/analytics/lib/date-range.ts`, `lib/url-state.ts`,
  `services/analytics.ts`, `schemas/catalog/analytics.ts`, `pages/analytics.tsx`,
  `lib/metric-definitions.ts`, the breakdown card, and the analytics tests.
- Shared UI: `resources/app/components/ui/calendar/date-range-picker.tsx`,
  `calendar-presets.ts`, `range-presets.tsx`, and their tests.
- Backend: `app/Http/Requests/Analytics/AnalyticsOverviewRequest.php`,
  `app/Services/AnalyticsQueryService.php`, and the analytics integration tests
  that use the currency filter.
- API: `GET /analytics/overview` ignores `currency` and its response has no
  `currencies` field.
- Docs: `docs/analytics.md`.
