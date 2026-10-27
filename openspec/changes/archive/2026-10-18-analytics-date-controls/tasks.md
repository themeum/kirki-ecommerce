## 1. Shared DateRangePicker: custom presets, confirm mode, custom trigger

- [x] 1.1 Tests (red first) in `components/ui/calendar/calendar.test.tsx`: custom preset list in order, active custom preset, optional "Custom" status item, confirm mode (pending range not committed, Start/End read-only fields, day count, Apply commits and closes, Apply disabled without an end, Cancel/Escape/click outside discards), custom trigger opens the overlay with `aria-expanded`; the existing picker tests stay unchanged
- [x] 1.2 Widen `presets` in `calendar-presets.ts` / `range-presets.tsx` to accept `DateRangePreset[]` and an optional status item (design D1, D5) _(the status item is a `customPresetLabel` prop on the picker, not an entry in the preset type; see design.md)_
- [x] 1.3 Add `RangeFields` (read-only Start/End) and `RangeFooter` (day count, Cancel, Apply) in `components/ui/calendar/` (design D2)
- [x] 1.4 Add the `confirm` and `trigger` props to `DateRangePicker`; keep the default-mode open/close logic as it is (design D1)
- [x] 1.5 Update the `date-pickers` doc section if `docs/` describes the picker props _(no doc in `docs/` describes the picker; nothing to update)_
- [x] 1.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Analytics date helpers

- [x] 2.1 Tests (red first) in `features/analytics/tests/lib/date-range.test.ts`: `resolveComparisonRange` for Previous period (Sep 15 – Oct 14, 2026 → Aug 16 – Sep 14, 2026; Oct 8 – 14, 2026 → Oct 1 – 7, 2026), Previous year (Oct 8 – 14, 2026 → Oct 8 – 14, 2025; Feb 29, 2028 → Feb 28, 2027), a preset lookup that maps a range back to its preset key, and the day count _(the day count lives in the shared picker footer and is tested in group 1; no analytics helper needed)_
- [x] 2.2 Add `resolveComparisonRange` and the preset lookup to `features/analytics/lib/date-range.ts`; change the "custom" label to "Custom" (design D4, D5)
- [x] 2.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Analytics controls

- [x] 3.1 Tests (red first) in `features/analytics/tests/pages/analytics.test.tsx` (or a controls test) _(new file `tests/components/analytics-controls.test.tsx`; `formatRangeDates` now shows a same-month range as "Oct 8 – 14, 2026", as the spec scenarios read)_: date trigger shows icon, preset name and dates; Apply a preset updates the URL; Cancel keeps the applied range; custom days set `range=custom&from&to`; Custom item active for a non-preset range; comparison options show their dates; footer shows "Compared with" the pending range; Custom comparison shows the calendar and starts at the previous period; trigger shows "Compare: <dates>" or "No comparison"; Customize button is present and does nothing; no currency control
- [x] 3.2 Build the shared analytics `ControlTrigger` with the design-system white background (design D6)
- [x] 3.3 Replace `DateRangeControl` with `DateRangePicker` in confirm mode with the analytics presets, the Custom status item, and the custom trigger; future days disabled
- [x] 3.4 Rebuild `CompareControl` as a Popover with pending option state, option dates, footer, and the Custom panel with `RangeFields` and a two-month `Calendar` (design D3)
- [x] 3.5 Add the Customize button on the right of the controls row (sliders icon, no handler)
- [x] 3.6 Remove the analytics-token `selectedOption` style; use the design-system active style (design D7)
- [x] 3.7 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Remove the currency filter (frontend)

- [x] 4.1 Tests (red first): update `url-state.test.ts` (no `currency` key; an old `currency=EUR` URL is ignored), `services/analytics.test.tsx` (no `currency` query), `schemas/catalog/analytics.test.ts` (no `currencies`), and remove the page tests for the currency control and the rounding note
- [x] 4.2 _(`CurrencyControl` and its props went out with the controls rewrite in group 3; `ReadyContent` no longer needs `params`)_ Remove `CurrencyControl`, the `currencies`/`baseCurrency` props, `currency` from `AnalyticsParams` and the URL parse/serialize, the service query, `currencies` from the response schema, `getCurrencyFilterInfo`, and the rounding note; format money with `base_currency_code` (design D8)
- [x] 4.3 Remove the fixtures' `currencies` field and any import the removal leaves unused
- [x] 4.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Remove the currency filter (backend)

- [x] 5.1 Tests (red first) in `tests/Integration/AnalyticsOverviewApiTest.php` and `AnalyticsMetricsTest.php`: remove the EUR filter, unknown currency, and known-currency-without-orders cases; add "currency parameter is ignored" (USD base, USD and EUR orders, `currency=EUR` → same values as without it) and "no currencies list"
- [x] 5.2 Remove `currency` from `AnalyticsOverviewRequest` (rules, sanitizer, `validate_currency`, the unused `Currency` import)
- [x] 5.3 In `AnalyticsQueryService` remove `$currency`, `get_currencies()`, the `currencies` response key, and the currency clause in `order_currency_sql()`; remove the `invoiced` branches that only the filter used (design D8)
- [x] 5.4 Run `composer test:docker` for the analytics integration tests (if it cannot run, say so) and `composer phpcs:wporg` on the changed files _(could not run: in the Docker `php` container and on the host, `vendor/bin/phpunit` and `vendor/bin/phpcs` exit 0 with no output, even for `--version` and `-i`, so the vendor binaries do not work in this environment; `php -l` passes on the four changed PHP files. The user must run the integration tests and phpcs.)_
- [x] 5.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Documentation

- [x] 6.1 Update `docs/analytics.md`: the controls section (presets, Apply/Cancel, comparison options and Custom, Customize button), remove the currency control, the rounding note, and the "Currency filter does not convert" bullet; state in "Where this differs" that Analytics shows the base currency only
- [x] 6.2 Verify: `npm run typecheck && npm test` in `resources/app/`

## 7. Final verification

- [x] 7.1 Run `npm run typecheck && npm test && npm run lint` in `resources/app/` _(typecheck clean, 185 files / 1811 tests pass; lint has only the existing `query-error-state.tsx` import-order error, not touched by this change)_
- [x] 7.2 Ask the user to check the controls visually against the four design screenshots (the browser preview is not used in this project)
- [x] 7.3 At archive time, update the Purpose of `openspec/specs/analytics-page/spec.md` so it does not mention the currency control
- [x] 7.4 Verify: `npm run typecheck && npm test` in `resources/app/`
