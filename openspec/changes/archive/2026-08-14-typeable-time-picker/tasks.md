All commands below run from `resources/app/`.

## 1. Date format vocabulary

- [x] 1.1 Revert the `TIME_INPUT_12: 'hh:mm a'` entry from `DATE_FORMATS` in `libs/date.ts`. The browser formats the field now, so nothing reads it. (Superseded: it was added in an earlier pass of this change.)
- [x] 1.2 Verify: `npm run typecheck && npm test`.

## 2. TimePicker field

- [x] 2.1 Rewrite `TimePicker` in `components/ui/calendar.tsx`: `PopoverAnchor asChild` wrapping an `InputGroup` (`error`, `disabled`) that holds an `InputGroupInput` and an `InputGroupAddon align="inline-end"` with an `InputGroupButton size="icon-xs"` and a lucide `Clock` icon. Opening happens on input focus/click and on the button.
- [x] 2.2 Make the field a native time control: `type="time"` with no formatting or parsing layer — a time input's value is already the 24-hour `HH:mm` string being stored. Bind `value` to a `fieldValue` state that mirrors the DOM control and is synced from the `value` prop; binding the prop directly makes React restore the old time the instant a segment is cleared, so the field cannot be cleared or retyped. Put the disclosure ARIA (`aria-expanded`, `aria-controls`, `aria-haspopup="dialog"`) on the `InputGroupButton`, leaving `id` and `aria-invalid` on the input; hide the browser's own affordance with `::-webkit-calendar-picker-indicator { display: none }`.
- [x] 2.3 Emit on `change` only when the field reports a non-empty value, and emit `null` on `blur` when it is empty — a time input reports `''` for every intermediate keystroke, so emitting on change would clobber form state mid-entry. Delete `commitDraft`, `parseTypedTime`, `TIME_PATTERN_24`, `TIME_PATTERN_12`, the Enter `onKeyDown` handler, and the `placeholder` (time inputs ignore it).
- [x] 2.4 Verify: `npm run typecheck`.

## 3. TimePicker panel

- [x] 3.1 Render one `PopoverContent` (`align="start"`, `onOpenAutoFocus` prevented) holding the hour and minute columns, plus a meridiem column when `hourCycle === 12`. Hours are `0`–`23` in 24-hour mode and `1`–`12` in 12-hour mode; minutes are `0`–`59`; every value is offered.
- [x] 3.2 Each column is a `role="listbox"` with an `aria-label` (`Hour` / `Minute` / `Meridiem`); each option is a `<button type="button" role="option" aria-selected tabIndex={-1}>`. Choosing an option recomposes the value and emits immediately, leaving the panel open.
- [x] 3.3 Give the columns a fixed height with `overflow-y: auto` and scroll the selected option into view when the panel opens. Replace the `timePicker` / `timeSelect` / `timeSeparator` keys in the trailing `defineStyles` block with the new ones; every value comes from a `theme` token.
- [x] 3.4 Make this `Popover` non-modal so it nests correctly inside `DateTimePicker`'s modal popover.
- [x] 3.5 Verify: `npm run typecheck`.

## 4. Remove the minuteStep prop

- [x] 4.1 Delete `minuteStep` from `TimePickerProps` and `DateTimePickerProps` in `components/ui/calendar.tsx`, stop forwarding it from `DateTimePicker`, and delete the now-unused `getMinuteOptions` helper.
- [x] 4.2 Delete `minuteStep` from `DateFieldProps` and both picker call sites in `components/form/date-field.tsx`.
- [x] 4.3 Delete `minuteStep={1}` from both time fields in `features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`.
- [x] 4.4 Verify: `npm run typecheck`.

## 5. Tests

- [x] 5.1 In `components/ui/calendar.test.tsx`, keep the three `DatePicker` cases and the column cases: choosing `14` then `30` from the columns emits `'14:30'`; in 12-hour mode choosing `2`, `30`, `PM` emits `'14:30'`.
- [x] 5.2 Rework the field cases against the native control, reaching it with `container.querySelector('input[type="time"]')` and opening the overlay via the `Choose time` button: entering `14:30` emits `'14:30'`; entering text the control rejects (jsdom sanitizes it to `''`, as browsers do) emits nothing; a cleared field stays empty rather than snapping back to the old value; blurring an emptied field emits `null`. Delete the revert-unparseable and single-digit-normalisation cases — both describe a parser that no longer exists.
- [x] 5.3 Add the nested-overlay case: inside `DateTimePicker`, typing a time into the footer field emits the combined `yyyy-MM-dd HH:mm` value. — covered by two cases: typing in the footer emits the combined value, and focusing the footer field opens the Hour list with the calendar still mounted.
- [x] 5.4 Verify: `npm test`.

## 6. Keep the overlay open while the field is used

- [x] 6.1 Add the two regression tests to `components/ui/calendar.test.tsx` first and confirm they fail against the unguarded code: with the overlay open, `fireEvent.focusIn(field)` must leave the `Hour` list mounted; after Escape, `fireEvent.click(field)` must bring it back. (`fireEvent.focus` is not enough — it does not bubble to the `focusin` listener Radix dismisses on, which is why the existing focus tests passed while the overlay was broken in the browser.)
- [x] 6.2 Hold a `fieldRef` on the `InputGroup` inside `PopoverAnchor asChild` and guard `PopoverContent` with `onInteractOutside`, calling `event.preventDefault()` when `event.detail.originalEvent.target` is inside that ref. A `PopoverAnchor` is not exempt from Radix's outside-interaction dismissal the way a `PopoverTrigger` is, so without this the overlay dismisses itself the moment focus lands in the field.
- [x] 6.3 Add `onClick={() => setOpen(true)}` to the `InputGroupInput` so a click reopens the overlay after Escape, when focus never left the field.
- [x] 6.4 Verify: the two tests from 6.1 now pass.

## 7. Final verification

- [x] 7.1 `npm run typecheck && npm test` — all suites pass, including `features/coupons/tests/schemas/forms/coupon-form.test.ts` unchanged.
- [x] 7.2 `npm run lint` — clean, exit 0, no new eslint-disable comments. (The pre-existing `object-shorthand` error in `features/products/.../categories/categories.tsx:23` is no longer reported — it was fixed outside this change.)
- [x] 7.3 `npx knip` — "Unused files" still 20.
- [x] 7.4 Report to the user that the column scrolling, the panel's placement under the field, and the nested case inside `DateTimePicker` still need their own eyes-on check in wp-admin (CLAUDE.md §0 forbids browser verification).
