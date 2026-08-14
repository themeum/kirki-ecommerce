## Context

See `proposal.md` — Why. The constraints that actually shape the approach:

- **Styles are scoped, globally.** `@/theme/mixins`' `scoped()` wraps every rule in `#wpbody-content .kirki-ecommerce-root &&`. Anything rendered outside that root loses all styling, and any third-party stylesheet loaded globally would leak into wp-admin. This rules out importing a library's own CSS.
- **Overlays already have a solved recipe.** `components/ui/popover.tsx` passes `container={getPortalContainer()}` and picks up `theme.zIndex.dropdown` (100000, deliberately above `#wpadminbar`'s 99999) through `getOverlayMotionStyles`. The pickers must reuse it rather than re-solving portalling and stacking.
- **Form state holds date *strings*.** `features/coupons/schemas/forms/coupon-form.ts` keeps `start_date` (`yyyy-MM-dd`) and `start_time` (`HH:mm`) as separate `z.string()` fields and only collapses them to an ATOM string in the terminal `.transform()`. Every API date field is `z.string()`. No schema anywhere uses `z.date()`.
- **`date-fns@^4.1.0` is the only date library**, and `libs/date.ts` already owns the format vocabulary (`DATE_FORMATS`, `START_OF_DAY_TIME`, `END_OF_DAY_TIME`).
- **WordPress date settings are not reachable from the frontend.** `window.kirki_ecommerce` carries no `start_of_week` / `date_format` / `timezone`, and `@wordpress/date` is not enqueued.
- **No CVA, no Tailwind.** Variants are hand-rolled maps inside a single trailing `defineStyles({...})` per file, composed with `scopedMerge(base, cond && variant, cssOverride)`.

## Goals / Non-Goals

**Goals:**

- One `Calendar` primitive that serves all selection modes, so the four pickers are thin compositions rather than parallel implementations.
- A single string↔`Date` boundary, living in `libs/date.ts`, that every picker shares.
- Picker triggers that are visually interchangeable with `Input` and `Combobox` so they line up in a form row.

**Non-Goals:**

- Timezone handling. Values are wall-clock strings; the coupon form's existing `mergeDateTime` is what attaches an offset, and that stays where it is.
- Localisation of month/weekday names beyond what the date library gives by default.
- Reading WordPress' date settings (see proposal — Impact).

## Decisions

### Use `react-day-picker` rather than hand-rolling the month grid

The referenced shadcn Calendar is a styled wrapper over `react-day-picker`; Radix publishes no calendar primitive, so "Radix calendar" means RDP under shadcn's Radix-flavoured docs. Hand-rolling means owning roving-tabindex focus management, `role="grid"` semantics, range hover preview, and DST/week-start edge cases — realistically 400–600 lines of subtly-wrong-if-rushed code. RDP already depends on `date-fns@^4`, matching our direct dependency, so no second date library enters the tree.

**Pinned to `^9` (currently 9.14.0), not the newly-published 10.0.1.** v9 is the line whose API this design is written against and is still actively released. Moving to v10 is a deliberate follow-up once its migration surface is understood — not something to absorb inside a change that is already introducing four new components.

*Alternative considered:* hand-roll with `date-fns`. Rejected on accessibility risk and maintenance cost for zero dependency saving that matters at this bundle size.

### Style RDP through a scoped wrapper, never its stylesheet

`react-day-picker/style.css` is **not** imported. Instead `Calendar` renders `<DayPicker>` inside a wrapper `div` carrying `css={scopedMerge(styles.calendar, cssOverride)}`, and the style object addresses RDP's elements through nested selectors. Selectors are keyed off `getDefaultClassNames()` (e.g. ``[`.${defaultClassNames.day}`]``) rather than hardcoded `.rdp-*` strings, so a library-side rename surfaces as a visual diff against a known key instead of a silent no-op.

This is the same technique `popover.tsx` uses to style its nested `strong`/`p`, and it keeps the entire calendar inside one scoped rule — no global leakage, and `cssOverride` merges through the normal pipeline.

*Alternative considered:* RDP's `classNames` prop with Emotion-generated class strings. Rejected — `@emotion/css` (the string-returning API) is not a dependency; only `@emotion/react` is, and its `css` prop yields no usable class name at that call site.

*Alternative considered:* replacing every RDP slot via the `components` prop so each gets its own `css` prop. Rejected as far more code for the same result; `components` is used only for the nav chevrons, where a lucide icon swap is genuinely wanted.

### Strings at the boundary, `Date` only inside

Every picker's `value`/`onChange` is a string in an existing `DATE_FORMATS` shape (`DATE_INPUT`, `TIME_INPUT`, `DATE_TIME_INPUT`); `DateRangePicker` uses a `{ from, to }` pair of such strings. `Date` is constructed on the way into `DayPicker` and discarded on the way out.

The payoff is that the new `DateField` is a drop-in for today's `TextField type="date"` with **zero** form-schema changes — `coupon-form.ts` keeps working untouched. It also keeps `Date` objects, which serialise unpredictably and compare by reference, out of react-hook-form state.

The conversion lives in two helpers added to `libs/date.ts`, `parseDateValue` / `formatDateValue`, both guarded with date-fns `isValid` so a malformed string yields `null` rather than an `Invalid Date` that renders as `NaN` deep inside the grid.

*Alternative considered:* `Date`-valued props, converting in the field wrappers. Rejected — it would push `Date` into form state and force every consuming schema to grow a coercion step.

### Compose pickers from existing primitives

`DatePicker`, `DateRangePicker`, and `DateTimePicker` are `Popover` + a trigger button + `Calendar`. The trigger's anatomy is lifted from `combobox.tsx` (36px min-height, `theme.radius.lg`, `data-error` attribute, `&[data-state="open"]` focus ring) so pickers sit flush beside comboboxes and inputs. `modal` is passed to `Popover`, as `Combobox` does, so pickers behave correctly inside a dialog.

`TimePicker` has no calendar at all — it is hour/minute (plus meridiem in 12-hour mode) `Select`s from `select.tsx`. `DateTimePicker` reuses `TimePicker` wholesale in a `Separator`-divided footer rather than growing its own time UI.

Content width is set via `cssOverride`; the `var(--radix-popover-trigger-width)` trick `Combobox` uses is deliberately **not** applied, since a month grid is wider than its trigger.

### Defaults are props, not globals

`WEEK_STARTS_ON = 0` and the `DATE_FORMATS`-derived display formats are defaults on props (`weekStartsOn`, `displayFormat`), not values read from a config singleton. When WordPress' `start_of_week` / `date_format` are eventually exposed from `app/Supports/Assets.php`, threading them in is a change at the call site or a defaults provider — no component rewrite.

## Risks / Trade-offs

- **RDP's internal class names are load-bearing for our styling** → keyed off `getDefaultClassNames()` rather than string literals, and pinned to `^9` so a major bump is an explicit decision. A minor-version rename would show up as unstyled calendar chrome, which is immediately visible rather than silent.
- **Pinning `^9` while `10.0.1` is published** → we start one major behind. Accepted deliberately: v10 landed very recently, and absorbing an unfamiliar migration surface inside this change would put the whole component set at risk. Tracked as follow-up.
- **No visual verification is possible** (CLAUDE.md §0 forbids browser preview) → typecheck, lint, and unit tests can prove the value contract and the absence of hardcoded tokens, but the rendered appearance in wp-admin needs a human eye. Flagged explicitly at hand-off.
- **`knip` will flag the four field wrappers as unused**, since scope excludes rewiring the coupon page → added to `knip.json`'s ignore list with the follow-up named in the entry. The ignore is removed when `validity-period-section.tsx` is rewired.
- **12-hour mode must round-trip losslessly** → the meridiem lives only in presentation; the emitted value is always 24-hour `HH:mm`, covered by a spec scenario and a unit test.
- **`DateTimePicker` has an ordering hazard** (time chosen before a date, or a date chosen with no time) → both directions are pinned down by spec scenarios: time-first anchors to the displayed day, date-first defaults to `START_OF_DAY_TIME`.

## Migration Plan

Purely additive. Nothing imports these components on landing, so there is no rollout risk and rollback is deleting the new files plus the dependency entry. The follow-up — rewiring `validity-period-section.tsx`'s four `TextField type="date"/"time"` inputs — is a separate change, and because the value contract is identical it needs no schema or API work.
