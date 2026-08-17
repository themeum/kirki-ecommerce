## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The codebase already has a one-module-per-family precedent.** `select.tsx` exports eight components, `field.tsx` ten, `popover.tsx` four — each with a single trailing `const styles = defineStyles({...})`. The one-file-per-component layout the pickers currently use is the outlier, not the convention.
- **`react-refresh/only-export-components` polices component files.** It is why `getDateBounds` was inlined three times instead of exported from `date-picker.tsx`. Inside one module the helper is private and the rule is satisfied without duplication.
- **The value contract is already correct and must not move.** Every picker exchanges strings in `DATE_FORMATS` shapes. `features/coupons/schemas/forms/coupon-form.ts` holds `start_date` (`yyyy-MM-dd`) and `start_time` (`HH:mm`) as separate `z.string()` fields, and `splitIsoDateTime()` hydrates them in exactly that shape — so the coupon rewiring is a control swap with no schema work.
- **`required()` in `libs/zod.ts` is `schema.nullish().refine(!isEmptyValue)`.** A field wrapper writing `null` on an empty selection therefore still produces the friendly "Start date is required" message rather than a zod type error, even for `start_date`, whose base type is `z.string()`.
- **No visual verification is possible** (CLAUDE.md §0 forbids browser preview).

## Goals / Non-Goals

**Goals:**

- One import site for the whole picker family, and one place where the trigger's anatomy is defined.
- A field wrapper whose call sites read the same as every other field in the design system, differing only by `mode`.
- `knip.json` with no `ignore` list — the components are reachable from `main.tsx` because a real page uses them.

**Non-Goals:**

- Changing any picker's behaviour, styling, or value contract. Every requirement in `specs/date-pickers` except the wrapper one is untouched by design.
- Changing the coupon form's schema, validation, or payload. Ordering validation between start and end date is explicitly out of scope — the end date stays unbounded, exactly as the native inputs left it.
- Collapsing the five UI components into one mode-driven component. Only the four *field wrappers* merge behind a mode; the pickers stay distinct components that happen to share a module.

## Decisions

### One module, `calendar.tsx`, named after the primitive

`Calendar` is what the other four compose, so it names the module the way `select.tsx` is named for `Select`. All five are **named** exports and the module has no default export, matching `select.tsx`, `field.tsx`, and `popover.tsx` — the family modules this one now resembles. (A default export was the initial intent, but with the pickers imported by name it would have left an unused `default` binding, which is exactly the kind of noise this change removes.) Every export is a component or a type, so `react-refresh/only-export-components` stays quiet.

*Alternative considered:* keeping `date-picker.tsx` as the module name, since `DatePicker` is the most-used export and the path already exists. Rejected — the file's first-class citizen is the calendar grid, and naming a module after its most popular consumer ages badly.

### A module-private `PickerTrigger`

`DatePicker`, `DateRangePicker`, and `DateTimePicker` currently repeat the same trigger three times: `PopoverTrigger asChild` around a button with `role="combobox"`, `aria-haspopup`, `aria-controls`, `aria-expanded`, `aria-invalid`, `data-error`, the optional clear button, and the `CalendarDays` icon — plus five duplicated style keys. One internal component takes the parts that actually differ (the formatted label, the clear handler and its `aria-label`, `aria-haspopup`) and owns the rest.

It stays unexported: it is an implementation detail of three sibling components in the same file, not design-system surface.

*Alternative considered:* exporting it so future pickers can reuse it. Rejected as speculative — nothing outside this module needs it, and exporting it would freeze its prop shape.

### `mode` as a flat prop, not a discriminated union

`DateField` takes `mode?: 'date' | 'date-range' | 'time' | 'date-time'` (default `'date'`) alongside one flat props type holding the union of the mode-specific props (`displayFormat`, `minDate`, `maxDate`, `clearable`, `numberOfMonths`, `minuteStep`, `hourCycle`), all optional. A `switch` inside the `Controller` render picks the picker.

The trade-off is accepted deliberately: `<DateField mode="date" minuteStep={5} />` type-checks and silently ignores `minuteStep`. A discriminated union would catch that, but the component is already generic over `<TFieldValues, TName>`, and intersecting a generic props type with a four-arm union makes both inference and the call-site error messages markedly worse for a mistake that is easy to spot in review.

*Alternative considered:* keeping four wrappers. Rejected — that is the duplication this change exists to remove, and four call-site names for one behaviour is exactly what the modified requirement now forbids.

### Value normalisation stays per-mode, in the wrapper

The three string modes keep today's normalisation (`null`/`undefined` → `''` on read, `''` → `null` on write); `date-range` reads and writes `value ?? null` because its value is an object. Keeping this in the wrapper — rather than pushing it into the pickers — preserves the pickers' current contract, where an unparseable or empty string legitimately means "no selection".

### Coupon times use `minuteStep={1}`

The native `<input type="time">` being replaced accepts any minute, and stored coupon times come from real ISO datetimes, so arbitrary minutes are already in the data. Passing `minuteStep={1}` at the call site keeps exact parity rather than relying on the picker's out-of-step fallback. The component default stays `5` for new callers.

## Risks / Trade-offs

- **One large module** (~700 lines once merged) → mitigated by the file's shape being the codebase norm: components top to bottom, one `defineStyles` block at the end, and the trigger/bounds duplication that inflated the old files removed rather than moved.
- **Mode-specific props are not compile-time restricted** → accepted above; the ignored-prop failure mode is inert, not incorrect.
- **The coupon form is the first real consumer, and its appearance cannot be verified here** → typecheck, lint, and the untouched `coupon-form.test.ts` prove the contract; the rendered result needs a human eye in wp-admin, flagged at hand-off.
- **Deleting the `knip.json` ignore list makes knip a live signal again** → intended. `Calendar`, `DateRangePicker`, and `DateTimePicker` will still surface under "Unused exports", a list already 223 entries long repo-wide; the meaningful check is that "Unused files" returns to its baseline of 20 without any ignore entry propping it up.

## Migration Plan

Internal refactor plus one call-site swap; nothing outside `resources/app/` is affected and no data or API shape changes. Rollback is reverting the commit — the deleted files have no consumers other than the ones this change rewrites, and the coupon form's schema is untouched, so a revert cannot strand saved data.
