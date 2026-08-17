## Why

`TimePicker` asks the user to open two or three separate dropdowns — hour, minute, and in 12-hour mode AM/PM — to enter one value, and offers no way to type a time at all. The native `<input type="time">` it replaced on the coupon form did both: it accepted typed digits and exposed one control. The rebuilt picker should too.

The `minuteStep` prop is part of the same problem. It exists because a minute dropdown of 60 entries felt long, and the coupon form has to pass `minuteStep={1}` to get the parity it needs. With a typeable field and one scrolling panel, every minute can simply be offered and the prop has nothing left to say.

## What Changes

- Replace `TimePicker`'s side-by-side `Select`s with a single native time field (`<InputGroupInput type="time">`) plus one dropdown panel holding the hour and minute columns — and a third meridiem column in 12-hour mode.
- Offer every hour and every minute in the panel: `00`–`23` (or `1`–`12`) and `00`–`59`, step 1. Picking from a column leaves the panel open so both parts can be chosen in one visit.
- Let the browser own typed entry. A time input gives `HH` / `MM` segments, digit-by-digit entry, and arrow-key increments, and reports either a complete `HH:mm` or an empty string — never invalid text — so no parsing, masking, or revert-on-invalid logic is needed. A complete entry emits immediately; an emptied field emits `null` on blur.
- Scope `hourCycle` to the dropdown columns. A time field's 12-or-24-hour rendering is decided by the viewer's browser locale and cannot be overridden.
- **BREAKING (internal)**: remove the `minuteStep` prop from `TimePicker`, `DateTimePicker`, and `DateField`, and from the coupon form's two time fields. No consumer outside `resources/app/` is affected.

Unchanged: the emitted value is still always a 24-hour `HH:mm` string, so no form schema, service, or API changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `date-pickers`: the "Time picker selects an hour and minute" requirement mandates selection "from constrained lists" and carries a *Minute granularity* scenario tying the offered minutes to a step. It changes to mandate one typeable field plus one dropdown offering every hour and minute, with scenarios covering typed entry, reverting unparseable text, and clearing.

## Impact

- **Modified files**: `resources/app/components/ui/calendar.tsx` (`TimePicker` rewritten, `DateTimePicker` prop dropped), `resources/app/components/ui/calendar.test.tsx`, `resources/app/components/form/date-field.tsx`, `resources/app/features/coupons/pages/edit-coupon/components/contents/validity-period-section.tsx`. `resources/app/libs/date.ts` is **not** touched — the browser formats the field, so no new `DATE_FORMATS` entry is needed.
- **No new files, no new dependencies.** The field composes the existing `InputGroup` primitive and the existing `PopoverAnchor`.
- **No schema or API changes.** `coupon-form.ts` passing untouched is the proof.
- **No PHP changes.**
