## Why

The admin design system has no date-picker component. The only date input in the entire app is four native `<input type="date">` / `type="time"` fields on the coupon validity section, rendered through the generic `TextField` — native controls that render inconsistently across browsers, cannot be themed with our Emotion tokens, and cannot express a date *range*. Any feature that needs date entry today (coupon validity) or date filtering tomorrow (order and product tables) has nothing to reach for.

## What Changes

- Add `react-day-picker@^9` as a frontend dependency — the same library shadcn's Calendar wraps. Radix UI has no calendar primitive, and hand-rolling a month grid means owning roving-tabindex keyboard navigation, ARIA grid semantics, and range-hover logic ourselves.
- Add a `Calendar` primitive (`components/ui/calendar.tsx`) wrapping `DayPicker`, styled entirely through `defineStyles`/`scoped` with `theme` tokens. `react-day-picker/style.css` is deliberately **not** imported — the library's stylesheet is unscoped and would leak into wp-admin.
- Add four picker components composed from the existing `Popover` and `Select` primitives: `DatePicker`, `DateRangePicker`, `TimePicker`, `DateTimePicker`.
- Add four react-hook-form wrappers in `components/form/`: `DateField`, `DateRangeField`, `TimeField`, `DateTimeField`, following the existing `Controller` + `useFormContext` field-wrapper contract.
- Extend `libs/date.ts` with `parseDateValue` / `formatDateValue` / `WEEK_STARTS_ON` so every picker shares one string↔`Date` bridge.
- Delete the empty, untracked `components/ui/calender.tsx` stub (misspelled) in favour of `calendar.tsx`.

Not breaking: nothing currently imports any of this, and no existing form schema changes.

## Capabilities

### New Capabilities

- `date-pickers`: Calendar and date/time selection primitives for the admin UI — the `Calendar` month grid, the four picker components, their string-based value contract, and the react-hook-form field wrappers that bind them.

### Modified Capabilities

None. No existing spec's requirements change; this is purely additive to the design system.

## Impact

- **New dependency**: `react-day-picker@^9` in `resources/app/package.json`. It depends on `date-fns` internally, which is already a direct dependency at `^4.1.0`, so no second date library enters the tree.
- **New files**: 5 in `resources/app/components/ui/`, 4 in `resources/app/components/form/`, 2 test files.
- **Modified files**: `resources/app/libs/date.ts` (additive), `resources/app/package.json`, `resources/app/knip.json`.
- **Deleted**: `resources/app/components/ui/calender.tsx` (empty, untracked).
- **No PHP changes.** WordPress' `start_of_week`, `date_format`, and `timezone` options are not exposed to the frontend today; rather than widening `get_kirki_ecommerce_configs()`, the components take props with sensible defaults so WP settings can be threaded in later.
- **No feature-page changes.** Rewiring the coupon validity section to use `DateField`/`TimeField` is a deliberate follow-up, which means `knip` will report the new field wrappers as unused until then.
