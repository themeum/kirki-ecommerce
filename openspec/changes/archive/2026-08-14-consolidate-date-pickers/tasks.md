All commands below run from `resources/app/`.

## 1. Consolidate the UI module

- [x] 1.1 Move `DatePicker`, `DateRangePicker`, `TimePicker`, and `DateTimePicker` into `components/ui/calendar.tsx` verbatim (logic unchanged), exporting all five by name with no default export (see design.md — a default `Calendar` would be an unused binding, since consumers import the pickers by name). Merge the five `defineStyles({...})` blocks into the single trailing one, deduplicating the identical `trigger`/`triggerError`/`value`/`placeholder`/`clear`/`icon`/`content` keys.
- [x] 1.2 Extract the module-private `PickerTrigger` used by `DatePicker`, `DateRangePicker`, and `DateTimePicker`: `PopoverTrigger asChild` + button carrying `id`, `role="combobox"`, `aria-haspopup`, `aria-controls`, `aria-expanded`, `aria-invalid`, `data-error`, the optional clear button, and the `CalendarDays` icon. Props are only what differs — label node, placeholder, `onClear` + its `aria-label`, `ariaHasPopup`, `controlsId`, `open`, `error`, `disabled`, `cssOverride`. Do not export it.
- [x] 1.3 Extract the module-private `getDateBounds(minDate, maxDate)` returning `{ startDate, endDate, disabledDays }`, replacing the three inlined copies.
- [x] 1.4 Delete `components/ui/date-picker.tsx`, `date-range-picker.tsx`, `time-picker.tsx`, and `date-time-picker.tsx`.
- [x] 1.5 Verify: `npm run typecheck`.

## 2. Consolidate the form wrapper

- [x] 2.1 Rewrite `components/form/date-field.tsx` as a single `DateField` generic over `<TFieldValues, TName>` with `mode?: 'date' | 'date-range' | 'time' | 'date-time'` (default `'date'`) and one flat props type holding the union of mode-specific props (`placeholder`, `displayFormat`, `minDate`, `maxDate`, `clearable`, `numberOfMonths`, `minuteStep`, `hourCycle`), all optional. A `switch (mode)` inside the `Controller` render picks the picker; the `Field` → `FieldLabel` → picker → `FieldDescription` → `FieldError` shell is unchanged.
- [x] 2.2 Keep the per-mode value normalisation: `null`/`undefined` → `''` on read and `''` → `null` on write for `date`/`time`/`date-time`; `value ?? null` both ways for `date-range`.
- [x] 2.3 Delete `components/form/date-range-field.tsx`, `time-field.tsx`, and `date-time-field.tsx`.
- [x] 2.4 Verify: `npm run typecheck`.

## 3. Tests

- [x] 3.1 Create `components/ui/calendar.test.tsx` merging `date-picker.test.tsx` and `time-picker.test.tsx`: placeholder with no value, placeholder for an unparseable value, day click emits exactly `'2026-06-03'`, and the 12-hour `2` / `30` / PM → `'14:30'` round trip. Keep the `afterEach(cleanup)` and the jsdom `hasPointerCapture` / `scrollIntoView` stubs the Radix `Select` needs.
- [x] 3.2 Delete `components/ui/date-picker.test.tsx` and `components/ui/time-picker.test.tsx`.
- [x] 3.3 Verify: `npm test`.

## 4. Wire up the coupon form and drop the knip ignore

- [x] 4.1 In `features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`, replace the four `TextField type="date"/"time"` inputs with `DateField` — `mode="date"` for `start_date`/`end_date`, `mode="time" minuteStep={1}` for `start_time`/`end_time` — keeping every existing label string and the surrounding `Card`/`Grid`/`CheckboxField`/info-box layout untouched. Remove the now-unused `TextField` import. Do not add a `minDate` bound to the end date.
- [x] 4.2 Delete the `ignore` array and its comment from `knip.json`, restoring it to `$schema` / `entry` / `project`.
- [x] 4.3 Confirm `features/coupons/schemas/forms/coupon-form.ts` and `features/coupons/lib/coupon-datetime.ts` are untouched.

## 5. Final verification

- [x] 5.1 `npm run typecheck && npm test` — all suites pass, including `features/coupons/tests/schemas/forms/coupon-form.test.ts` unchanged.
- [x] 5.2 `npm run lint` — no new findings, no new eslint-disable comments. (One pre-existing unrelated `object-shorthand` error in `features/products/.../categories/categories.tsx:23` stays.)
- [x] 5.3 `npx knip` — "Unused files" back to the baseline of 20 with no `ignore` list; none of the new or rewritten files appear there.
- [x] 5.4 Report to the user that the coupon validity section's rendered appearance still needs their own eyes-on check in wp-admin (CLAUDE.md §0 forbids browser verification).
