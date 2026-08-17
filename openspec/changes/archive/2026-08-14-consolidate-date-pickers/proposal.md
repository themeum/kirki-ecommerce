## Why

`add-calendar-date-pickers` landed nine files — five UI components and four react-hook-form wrappers — but deliberately rewired no feature page. The result is a design-system addition that nothing imports: `knip.json` carries a six-entry `ignore` list whose only job is to hide the resulting "unused file" reports, and the coupon validity section still uses the four native `<input type="date">` / `type="time"` controls the components were built to replace. Splitting one component per file also duplicated real code that only became visible once all five existed — the picker trigger's markup and styles are copy-pasted three times, the min/max bounds helper is inlined three times, and the four field wrappers differ only in which picker they render.

## What Changes

- Collapse `calendar.tsx`, `date-picker.tsx`, `date-range-picker.tsx`, `time-picker.tsx`, and `date-time-picker.tsx` into a single `components/ui/calendar.tsx`, following the `select.tsx` / `field.tsx` precedent of one module per component family with one trailing `defineStyles({...})`. A module-private `PickerTrigger` and `getDateBounds` replace the three copies of each.
- Collapse `DateField`, `DateRangeField`, `TimeField`, and `DateTimeField` into a single `DateField` selected by a `mode` prop (`'date' | 'date-range' | 'time' | 'date-time'`, default `'date'`).
- Merge `date-picker.test.tsx` and `time-picker.test.tsx` into `calendar.test.tsx`, keeping every existing case.
- Delete the `knip.json` `ignore` list entirely — with a real consumer, none of it is needed.
- Rewire `features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`'s four `TextField type="date"/"time"` inputs onto `DateField`, giving the coupon form themed, keyboard-accessible pickers instead of native browser controls.

Not breaking: every component keeps its behaviour and its string value contract, and `coupon-form.ts` is untouched — the pickers already emit exactly the `yyyy-MM-dd` / `HH:mm` shapes the schema holds.

## Capabilities

### New Capabilities

None. Every component in this change already exists.

### Modified Capabilities

- `date-pickers`: the "Form field wrappers bind pickers to form state" requirement currently mandates four separate wrapper components. It changes to mandate one wrapper whose mode selects the picker it binds, with the same label/description/error affordances and the same value normalisation.

## Impact

- **Modified files**: `resources/app/components/ui/calendar.tsx` (absorbs four components), `resources/app/components/form/date-field.tsx` (gains `mode`), `resources/app/knip.json`, `resources/app/features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`.
- **Deleted files**: `components/ui/{date-picker,date-range-picker,time-picker,date-time-picker}.tsx`, `components/ui/{date-picker,time-picker}.test.tsx`, `components/form/{date-range-field,time-field,date-time-field}.tsx`.
- **New files**: `components/ui/calendar.test.tsx` (the two deleted test files merged).
- **No schema, service, or API changes.** `coupon-form.ts` and `features/coupons/lib/coupon-datetime.ts` are untouched; `coupon-form.test.ts` passing unchanged is the proof the form contract did not move.
- **No new dependencies.**
- **No PHP changes.**
