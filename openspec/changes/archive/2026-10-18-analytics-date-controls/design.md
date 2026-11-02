## Context

See proposal.md (Why). The current controls live in
`features/analytics/components/analytics-controls.tsx`: option lists in plain
popovers, a one-month calendar for custom ranges, and a currency popover. The
shared `DateRangePicker` (`components/ui/calendar/date-range-picker.tsx`) shows
a two-month calendar with optional built-in presets, commits the range on the
second click, and always renders `PickerTrigger`. Its other users are the orders
filter (`order-table-action.tsx`) and `DateField`; they must not change.

The analytics range keys (`last_7`, `last_90`, `last_12_months`,
`month_to_date`, `year_to_date`) live in `features/analytics/lib/date-range.ts`
and are also the URL values. The built-in picker preset keys differ
(`last-7-days`, `this-month`, ...).

The backend resolves the comparison range, but the comparison panel needs the
Previous period and Previous year dates before the user applies them, so the
frontend needs the same rules.

## Goals / Non-Goals

**Goals:**

- Reuse one set of range-panel parts (presets, Start/End fields, two-month
  calendar, footer) in the date control and the comparison Custom panel.
- Keep the shared picker's default behavior byte-for-byte for current users.
- Remove the currency filter end to end in one change.

**Non-Goals:**

- No function for the Customize button.
- No typeable Start/End fields.
- No color changes outside the controls; the cards and charts get the color
  rule in later recap steps.
- No change to the default range or comparison.

## Decisions

### D1. Extend `DateRangePicker` with opt-in props

Add three optional props:

- `presets` also accepts `DateRangePreset[]` (objects with `key`, `label`,
  `getRange`). `resolveRangePresets` returns the list as is when it gets
  objects. The preset `key` type widens to `string` for custom presets.
- `confirm?: boolean`. In confirm mode the picker keeps a `pendingRange` that
  starts from `value` on open, does not call `onChange` on the second click,
  renders `RangeFields` (read-only Start/End) above the calendar and
  `RangeFooter` (day count, Cancel, Apply) below. Close without Apply clears the
  pending range. The current "commit the start date on close" behavior stays
  only in default mode.
- `trigger?: ReactNode`. When set, the picker renders
  `<PopoverTrigger asChild>{trigger}</PopoverTrigger>` and sets
  `aria-haspopup`, `aria-controls`, and `aria-expanded` on it, in place of
  `PickerTrigger`.

Alternatives: an analytics-only picker built from `Calendar` and
`RangePresets` (two pickers to maintain); changing the shared default (changes
the orders filter and `DateField`). The user chose the opt-in props.

### D2. Extract the range panel parts for reuse

`RangeFields` and `RangeFooter` go into `components/ui/calendar/` as small
components. The comparison control needs the same fields and calendar inside
its own panel, so it imports them and `Calendar` directly instead of nesting a
second picker popover. The comparison control does not use `DateRangePicker`
because its panel has an option list that is not a preset list (Previous
period and Previous year depend on the main range, and No comparison has no
range).

### D3. Comparison control is a Popover with a pending option

Radix `DropdownMenu` closes on each item select and does not hold a footer or a
calendar well. The comparison control uses `Popover` with a list of option
buttons styled like the preset list, a pending `{ compare, from, to }` state
that starts from the applied params on open, and a footer. "Custom" makes the
panel wider and shows `RangeFields` and a two-month `Calendar`. On the first
select of Custom with no applied custom range, the pending range starts as the
previous period of the applied main range.

### D4. Resolve comparison dates on the client

Add `resolveComparisonRange(compare, range)` to
`features/analytics/lib/date-range.ts`: previous period = the same number of
days that ends the day before the range starts; previous year = the same dates
one year earlier, with Feb 29 moved to Feb 28. It must give the same result as
`AnalyticsRangeResolver` for the scenarios in the analytics-metrics spec.
Unit tests cover the spec scenarios (Sep 15 – Oct 14 → Aug 16 – Sep 14; Feb 29,
2028 → Feb 28, 2027).

### D5. Analytics presets and the "Custom" status item

The analytics control builds its preset list from `RANGE_PRESETS` and
`resolvePresetRange`, with the URL key as the preset key. "Custom" is not a
preset: the control shows it as a status item at the end of the list, active
when no preset matches the pending range. To render it inside the picker's
preset bar, the custom preset type gets an optional "status" item (label only,
no range, not clickable to change dates). On Apply, the control maps the range
back to a preset key if one matches, else to `range=custom&from&to`.

### D6. Shared trigger for both controls

One analytics `ControlTrigger` (outline button, white background
`theme.colors.background.fill`, leading icon, bold label, grey secondary text,
chevron) is used by both controls. The date control passes it through the
picker's `trigger` prop; the comparison control uses it with `PopoverTrigger`.

### D7. Design-system colors for selected items

Selected preset and comparison options use the same active style as
`RangePresets` (design-system tokens), not `theme.colors.analytics.status.*`.
The `selectedOption` style that uses analytics tokens is removed.

### D8. Remove the currency filter end to end

- Frontend: remove `CurrencyControl`, the `currencies`/`baseCurrency` props, the
  `currency` field of `AnalyticsParams` and its URL parse/serialize, the service
  query param, `currencies` in the response schema, `getCurrencyFilterInfo`, and
  the rounding note. The money formatter uses `base_currency_code`.
- Backend: remove `currency` from `AnalyticsOverviewRequest` rules, sanitizers
  and `validate_currency`; in `AnalyticsQueryService` remove `$currency`,
  `get_currencies()`, the `currencies` key, and the currency clause in
  `order_currency_sql()`; `$money_prefix` is always `base`, so the
  `invoiced` branches that exist only for the filter are removed where they are
  dead. A `currency` query value is then an unknown parameter and is ignored.
- Tests: remove the currency filter, unknown currency, and known-currency-
  without-orders cases; add the "currency parameter is ignored" and "no
  currencies list" cases.

## Risks / Trade-offs

- [Confirm mode changes the open/close logic of a shared component] →
  Keep the default branch unchanged and cover both modes in
  `calendar.test.tsx`; the existing picker tests must pass without edits.
- [Client and server comparison rules drift] → One unit test per spec scenario
  in `date-range.test.ts`, with the same dates as the PHP integration tests.
- [Removing `invoiced` branches in the query service can change base-currency
  numbers by mistake] → Remove only the code that runs when the filter is set;
  the existing base-currency metric tests must pass without edits.
- [Old shared links with `currency=EUR`] → The URL parser ignores the key and
  the API ignores the parameter, so the link opens with base-currency values.
- [The Custom status item is a new kind of preset entry] → Keep it optional in
  the shared type, so the orders filter and `DateField` are not affected.

## Migration Plan

No data migration. Ship frontend and backend together. Rollback is a revert of
the change; no stored data depends on it.

The main `analytics-page` spec Purpose mentions the currency control. Update it
by hand when this change is archived.

## Corrections during implementation

- **D5 status item.** The "Custom" status item is a `customPresetLabel` prop on
  `DateRangePicker` (passed to `RangePresets` as `statusLabel`), not an entry in
  the preset type. A separate prop keeps `DateRangePreset` a plain
  `{ key, label, getRange }` and needs no "has no range" branch in the preset
  logic. The item is pressed when no preset matches the pending range.
- **Confirm-mode month.** In confirm mode the calendar shows the month of the
  range end as the last visible month (Sep and Oct for Oct 8 – 14), and moves
  when a preset is selected. Default mode keeps `defaultMonth` as before.
