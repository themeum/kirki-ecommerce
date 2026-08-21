All commands below run from `resources/app/`.

## 1. Dependency and date helpers

- [x] 1.1 Add `"react-day-picker": "^9"` to `dependencies` in `package.json` and run `npm install`. Confirm the resolved version is 9.x and that no second date library was pulled in (`npm ls date-fns`). — resolved 9.14.0; `date-fns@4.2.1` deduped, no second date library.
- [x] 1.2 Delete the empty untracked stub `components/ui/calender.tsx`.
- [x] 1.3 Extend `libs/date.ts` (additive only — do not restructure `DATE_FORMATS`) with `WEEK_STARTS_ON = 0`, `parseDateValue(value, pattern = DATE_FORMATS.DATE_INPUT): Date | null`, and `formatDateValue(date, pattern = DATE_FORMATS.DATE_INPUT): string | null`. Both guard with date-fns `isValid` and return `null` for nullish or unparseable input — never `Invalid Date`.
- [x] 1.4 Write `libs/date.test.ts` (`.test.ts` → node vitest project): valid parse, round-trip through both helpers, unparseable string → `null`, `null`/`undefined` input → `null`, non-default pattern (`TIME_INPUT`, `DATE_TIME_INPUT`).
- [x] 1.5 Verify: `npm run typecheck && npm test`. — 79 files / 543 tests pass.

## 2. Calendar primitive

- [x] 2.1 Create `components/ui/calendar.tsx`: `Calendar` wrapping `DayPicker`, props `Omit<DayPickerProps, 'className' | 'classNames' | 'styles' | 'css'> & { cssOverride?: CSSObject }` so `mode` and its dependent `selected`/`onSelect` union pass straight through. Defaults `showOutsideDays = true`, `weekStartsOn = WEEK_STARTS_ON`. Set `displayName`, default-export above the trailing `const styles = defineStyles({...})`.
- [x] 2.2 Style it via a wrapper `div` with `css={scopedMerge(styles.calendar, cssOverride)}`, addressing RDP elements through nested selectors keyed off `getDefaultClassNames()` — **not** hardcoded `.rdp-*` strings, and **without** importing `react-day-picker/style.css`. Cover: month caption, nav buttons, weekday header, day cell, today, selected, range start/middle/end, outside days, disabled days, and `:focus-visible` via `uiFocusRing(theme)`. Every colour/space/radius/type value must come from a `theme` token.
- [x] 2.3 Swap the nav chevrons for `lucide-react` icons through RDP's `components={{ Chevron }}` override.
- [x] 2.4 Verify: `npm run typecheck && npm test`, and grep the new file for hex colours / raw `px` spacing to confirm no hardcoded values slipped in.

## 3. Date and date-range pickers

- [x] 3.1 Create `components/ui/date-picker.tsx`: `Popover` + `PopoverTrigger asChild` button + `PopoverContent align="start"` wrapping `<Calendar mode="single">`. Props `value: string | null` (`DATE_FORMATS.DATE_INPUT`), `onChange(value: string | null)`, `placeholder`, `displayFormat` (default `DATE_FORMATS.HUMAN_READABLE`), `minDate`, `maxDate`, `clearable`, `disabled`, `error`, `id`, `cssOverride`. Trigger anatomy copied from `combobox.tsx` (36px min-height, `theme.radius.lg`, `data-error`, `&[data-state="open"]` ring), `aria-expanded` on the trigger, `CalendarIcon` on the right. Pass `modal` to `Popover`. Closes on select; unparseable `value` renders the placeholder.
- [x] 3.2 Wire bounds and clearing: map `minDate`/`maxDate` to RDP's `startMonth`/`endMonth` + `disabled` matcher, and render a clear affordance that emits `null` when `clearable` and a value is present.
- [x] 3.3 Create `components/ui/date-range-picker.tsx`: same shell, `mode="range"`, `numberOfMonths = 2`, value `{ from: string | null; to: string | null } | null`, trigger renders `from – to`. Overlay stays open until both endpoints are chosen; a second pick earlier than the start re-anchors the range.
- [x] 3.4 Write `components/ui/date-picker.test.tsx` (`.test.tsx` → jsdom project): renders with a placeholder, opens the overlay, clicks a day, asserts `onChange` receives exactly a `yyyy-MM-dd` string; asserts an unparseable `value` renders the placeholder. Follow the conventions in `features/bulk-edit/tests/hooks/use-bulk-edit-row.test.tsx` — explicit named imports from `vitest`, a local `renderX()` helper, `@/` alias paths.
- [x] 3.5 Verify: `npm run typecheck && npm test`. — 80 files / 546 tests pass.

## 4. Time and date-time pickers

- [x] 4.1 Create `components/ui/time-picker.tsx` composed from `select.tsx` — hour + minute selects, plus a meridiem select when `hourCycle = 12`. Props `value: string | null` (`DATE_FORMATS.TIME_INPUT`), `onChange`, `minuteStep` (default 5), `hourCycle` (`12 | 24`, default 24), `disabled`, `error`, `id`, `cssOverride`. The emitted value is **always** 24-hour `HH:mm` regardless of `hourCycle`.
- [x] 4.2 Create `components/ui/date-time-picker.tsx`: `Popover` containing `<Calendar mode="single">` plus a `Separator`-divided footer holding `<TimePicker>`. Value is a single `yyyy-MM-dd HH:mm` string. Changing the date preserves the existing time; selecting a date with no time set defaults to `START_OF_DAY_TIME`; changing the time before any date is chosen anchors to the currently displayed day.
- [x] 4.3 Extend `date-picker.test.tsx` (or add `time-picker.test.tsx`) with the 12-hour round-trip case: selecting `2` / `30` / PM emits `'14:30'`.  — added `components/ui/time-picker.test.tsx`.
- [x] 4.4 Verify: `npm run typecheck && npm test`. — 81 files / 547 tests pass.

## 5. Form field wrappers

- [x] 5.1 Create `components/form/date-field.tsx` modelled on `components/form/combobox-field.tsx`: generic over `<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>`, `useFormContext` for `control`, `fieldId = String(name)`, `<Controller>` → `<Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>` → `<FieldLabel htmlFor={fieldId} infoText={infoText}>` → picker with `id`, `error={Boolean(fieldState.error)}`, `aria-invalid` → `<FieldDescription>` → `{fieldState.invalid && <FieldError errors={[fieldState.error]} />}`. Props named `description` / `infoText` (not `helpText`). Normalise nullish both ways: `null`/`undefined` → `''` on read, empty → `null` on write.
- [x] 5.2 Create `components/form/date-range-field.tsx`, `components/form/time-field.tsx`, and `components/form/date-time-field.tsx` to the same contract.
- [x] 5.3 Add the four new `components/form/*-field.tsx` files to an `"ignore"` entry in `knip.json`, with the entry naming the follow-up that removes it (rewiring `features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`). — ignoring the four wrappers left `components/ui/date-range-picker.tsx` and `components/ui/date-time-picker.tsx` unreachable, so knip reported them as new unused files; both are in the same ignore entry and the comment covers them. knip's unused-file count is back to its pre-change baseline of 20.
- [x] 5.4 Verify: `npm run typecheck && npm test`. — 81 files / 547 tests pass.

## 6. Final verification

- [x] 6.1 Run `npm run lint` and resolve every finding **without adding any new eslint-disable comment** (import ordering, brace-wrapped `if` bodies, jsx-a11y). — all findings in the new files fixed, no disables added: dropped RDP's `autoFocus` (`jsx-a11y/no-autofocus`; Radix still moves focus into the popover), gave the three popover triggers `role="combobox"` + `aria-haspopup` + `aria-controls` as `combobox.tsx` does so `aria-invalid` is a supported attribute, and inlined the shared `getDateBounds` helper into each picker rather than exporting a function from a component file (`react-refresh/only-export-components`). One pre-existing, unrelated error remains in `features/products/.../categories/categories.tsx:23` (`object-shorthand`) — left untouched.
- [x] 6.2 Confirm no `react-day-picker/style.css` import exists anywhere, and that all user-facing strings go through `__(text, 'kirki-ecommerce')`.
- [x] 6.3 Verify: `npm run typecheck && npm test` one final time, then report to the user that the rendered calendar's appearance still needs their own eyes-on check in wp-admin (CLAUDE.md §0 forbids browser verification).
