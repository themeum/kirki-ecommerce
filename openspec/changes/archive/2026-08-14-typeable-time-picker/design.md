## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The field's chrome already exists.** `components/ui/input-group.tsx` owns the border, focus ring, and error/disabled states and has an `inline-end` addon slot for a button — the idiom `features/products/.../price/base-unit-dialog.tsx` already uses. Nothing about the field needs new styling.
- **`PopoverAnchor` is already exported** from `components/ui/popover.tsx`, which is what lets the panel anchor to the field without the field being the trigger.
- **`TimePicker` renders inside `DateTimePicker`'s open popover.** Whatever overlay it opens is a nested one.
- **The value contract is fixed** by the spec: always a 24-hour `HH:mm` string. `libs/date.ts` owns the format vocabulary and the `parseDateValue` / `formatDateValue` bridge.
- **No visual verification is possible** (CLAUDE.md §0 forbids browser preview).

## Goals / Non-Goals

**Goals:**

- One control and one overlay for one value, typeable like the native input it replaced.
- Every hour and minute reachable, without a dropdown that has to be scrolled past 1440 rows.

**Non-Goals:**

- Theming the field's internals. Segment rendering and the 12-vs-24-hour format belong to the browser.
- Seconds, timezones, or min/max time bounds.
- Changing what any picker emits, or any form schema.

## Decisions

### The field is an `InputGroup`, the panel is an anchored `Popover`

`PopoverAnchor asChild` wraps the `InputGroup` so the panel is positioned against the field while the field itself stays an ordinary text input. The clock button in the `inline-end` addon toggles the panel; focusing or clicking the input opens it too.

`PopoverContent` gets `onOpenAutoFocus={(event) => event.preventDefault()}` — without it Radix moves focus into the panel on open and the user cannot keep typing, which would defeat the point of the field.

*Alternative considered:* making the input itself the `PopoverTrigger`. Rejected — `PopoverTrigger` toggles on click, so every click inside the input to reposition the caret would close the panel.

### The field is a native time control, not a text box

`InputGroupInput` is given `type="time"`, so the browser supplies `HH` / `MM` segments, digit-by-digit entry, arrow-key increments, and its own value sanitization. Its value is a 24-hour `HH:mm` string — precisely what we store — so the field maps 1:1 onto `value` with no formatting or parsing layer between them.

That deletes rather than relocates work: no regex, no commit-on-blur, no revert path. A time input cannot hold invalid text; `banana` and a half-typed `9:5` both read back as `''`, in jsdom exactly as in a browser.

The field does keep one piece of local state — `fieldValue`, a mirror of what the DOM control currently holds, synced from `value`. It is not a parsing or validation layer; it exists because the input is controlled and a time input reports `''` for every intermediate keystroke. Binding `value` straight to the prop means that the moment the user clears a segment, React sees a value it did not authorise and writes the old time back, so the field cannot be cleared or retyped at all. Mirroring the DOM value keeps React from fighting the user mid-entry while still letting us decide what reaches `onChange`.

*Alternative considered:* a text field with a strict parser and revert-on-invalid, which is what this change first shipped. Rejected — it reimplements, less well, what the platform control already does, and it still cannot mask input or move by segment.

### A complete entry emits at once, an empty one waits for blur

`onChange` fires only when the field reports a non-empty value; `null` is emitted on blur when the field is empty. A time input reports `''` for every intermediate keystroke — after `1`, after `4`, until the minutes are filled — so emitting on each change would write `null` into form state repeatedly while the user is still typing and flash a required-field error on the coupon form.

*Alternative considered:* emitting whatever the field reports on every change. Rejected for that reason.

### `hourCycle` describes the overlay, not the field

A time input's 12-or-24-hour rendering comes from the viewer's browser locale and cannot be overridden from script or CSS. `hourCycle` therefore governs only the overlay columns: `12` gives hours 1–12 plus a meridiem column. On a 24-hour locale that means a `14:30` field above `2 / 30 / PM` columns — accepted, and called out here so the prop's reach is not mistaken for the field.

The browser's own picker affordance is suppressed with `::-webkit-calendar-picker-indicator { display: none }`, so the field offers one picker — ours — rather than two.

### An anchor is not a trigger, so dismissal has to be guarded

Radix exempts a `PopoverTrigger` from its outside-interaction dismissal, but never a `PopoverAnchor`. With the field as an anchor, the focus that opens the overlay is itself an interaction *outside* the layer: `DismissableLayer`'s document `focusin` listener fires, `onFocusOutside` runs, and the overlay dismisses the instant it appears — a visible open-then-close flicker, and thereafter every click on an `HH` or `MM` segment closes it again.

`PopoverContent` therefore carries an `onInteractOutside` guard that calls `event.preventDefault()` when the interaction started inside the field. Radix dispatches that custom event **on the original target** and exposes it at `event.detail.originalEvent`, so the containment check against a ref on the `InputGroup` is exact. One handler covers both the pointer and focus paths.

The field also opens the overlay on click, not only on focus: once it has been dismissed with Escape, focus never leaves the field, so nothing else would bring the overlay back. The clock button still closes it — it sits inside the guarded field, so the guard suppresses the dismissal and leaves the button's own toggle as the single source of truth.

*Alternative considered:* making the field a `PopoverTrigger`, which Radix would exempt automatically. Rejected — a trigger toggles on every click, so each click between the `HH` and `MM` segments would flip the overlay shut.

### Disclosure ARIA lives on the clock button

`role="combobox"` on a native time input misdeclares the control, and `aria-expanded` is not supported on its implicit role — `jsx-a11y/role-supports-aria-props` rejects it. `aria-expanded`, `aria-controls`, and `aria-haspopup="dialog"` sit on the `InputGroupButton` instead, which is the ordinary disclosure pattern; the input carries only `id` and `aria-invalid`.

### The panel's lists are pointer affordances, not a second keyboard path

Each column is a `role="listbox"`; each option is a `<button role="option" aria-selected tabIndex={-1}>`. The negative tabindex keeps 84 buttons out of the tab order — a keyboard user tabs from the field straight to the next control and sets the time by typing, which is the faster path and satisfies the capability's keyboard requirement on its own.

*Alternative considered:* full roving-tabindex listbox navigation with arrow keys. Rejected as disproportionate: it is a meaningful amount of focus-management code for a control whose keyboard story is already covered by the text field.

### The nested panel is non-modal

`TimePicker`'s `Popover` is non-modal while `DatePicker`/`DateRangePicker`/`DateTimePicker` stay modal. Inside `DateTimePicker` the time panel is a layer above an already-open modal popover; a modal inner layer would fight the outer one's focus trap. Radix's dismissable-layer stack keeps a click inside the inner panel from dismissing the outer one, which is the same shape the previous `Select`-inside-`Popover` footer relied on.

## Risks / Trade-offs

- **Nested overlay inside `DateTimePicker`** → non-modal inner popover, plus a test that types into the footer field and asserts the combined `yyyy-MM-dd HH:mm` value, so a regression fails a test rather than only showing up in wp-admin.
- **The field's appearance is the browser's** → segment rendering and hour format differ across Chrome, Firefox, and Safari and cannot be themed. This is the trade for real time-input behaviour, and it is what the coupon form had before this work began.
- **Removing `minuteStep` is a breaking prop change** → contained: the only caller is the coupon form, updated in the same change, and the prop's purpose is fully absorbed by offering every minute.
- **Long scrolling columns** → the selected option is scrolled into view when the panel opens, so a value near `23:59` does not open at the top of the list.

## Migration Plan

Internal component change plus one call-site edit; no data, schema, or API shape moves. Rollback is reverting the commit.
