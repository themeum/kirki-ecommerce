## Context

See `proposal.md` — Why. What shapes the approach is one piece of Radix internals.

`SelectContent` defaults to `position="item-aligned"`, and `SelectItemAlignedPosition`
positions by text, not by edges (`@radix-ui/react-select`, LTR branch):

```
itemTextOffset = itemText.left − content.left
left           = triggerValueText.left − itemTextOffset
leftDelta      = trigger.left − left
wrapper.minWidth = trigger.width + leftDelta
```

With today's tokens: our option text sits `1px content border + 4px viewport
padding + 32px check gutter = 37px` in, the trigger's value sits `1px border +
12px padding = 13px` in, so `leftDelta = 24px`. That single number is both the
left drift and the excess width in screenshot 1 — they are the same defect.

Two other facts constrain the options:

- `--radix-select-trigger-width` / `-height` are only emitted in `popper` mode,
  never in `item-aligned` mode. Any fix that keeps `item-aligned` cannot read the
  trigger's size from CSS.
- Radix Popover **does** emit `--radix-popover-trigger-width` / `-height`, which is
  what makes the searchable select's trigger-covering panel cheap to build.

## Goals / Non-Goals

**Goals:**

- Satisfy the alignment, width and search-row requirements in
  `specs/dropdown-alignment/spec.md` while keeping the plain select's existing
  vertical behaviour (selected option over the trigger).
- Express the correction in terms of the tokens that cause it, so the relationship
  is stated once and is legible to the next reader.

**Non-Goals:**

- Unifying option-row geometry between `SelectItem` and `CommandItem` (they differ
  in check size, row height and hover token). Deliberately deferred.
- Changing `popover.tsx`'s `align="center"` default. It is a generic content
  surface, not a trigger-bound list.
- Any accessibility or keyboard change. Focus, roving tabindex and `aria-*` stay
  exactly as they are.

## Decisions

### Cancel the drift with a token-derived margin, rather than switching to popper

`SelectContent` gets `marginLeft` equal to the computed drift, applied in
`item-aligned` mode only. Radix places the wrapper 24px left of the trigger and
sizes it `triggerWidth + 24`; the content is a stretched flex child of that
wrapper, so the margin lands the content's left edge exactly on the trigger and
its width at `max(triggerWidth, naturalWidth)`. **The width requirement falls out
of the same margin** — no separate `min-width` is needed.

The offset is written as a `calc()` over the same tokens that produce it, not as
`24px`:

```
ITEM_PADDING_LEFT   = spacing[2] + spacing[4] + spacing[2]
TRIGGER_VALUE_INSET = 1px + spacing[3]
ITEM_TEXT_INSET     = 1px + spacing[1] + ITEM_PADDING_LEFT
ITEM_ALIGNED_OFFSET = ITEM_TEXT_INSET − TRIGGER_VALUE_INSET
```

`styles.item` must consume `ITEM_PADDING_LEFT` instead of repeating that calc, or
the two can silently diverge.

*Alternatives considered.* **Move the check to the trailing edge of the row**: then
`ITEM_TEXT_INSET == TRIGGER_VALUE_INSET`, Radix produces flush-left and exact
trigger width by itself with no override, and the selected label sits precisely
over the trigger label. Rejected because it moves the checkmark on every dropdown
in the admin, which is a bigger visual change than the defect being fixed.
**Switch to `popper` with a negative side offset**: simplest and fully
self-correcting, but it reverses the "selected option over the trigger" behaviour.
Both were put to the user; the margin was chosen.

### Measure the searchable select's trigger rather than hardcoding its height

`Combobox` holds a ref on its trigger button and passes `sideOffset={-height}`
with `align="start"`, so the panel's top edge lands on the trigger's top edge and
Radix's collision handling still applies. The search row's height comes from
`var(--radix-popover-trigger-height)` so it covers the trigger exactly — a
hardcoded `36px` would leave a visible sliver whenever the trigger is taller,
which it is in `multiple` mode where chips wrap.

*Alternative considered:* `marginTop: calc(-1 * var(--radix-popover-trigger-height))`
on the content. CSS-only and needs no ref, but Radix's collision detection would
not know about the shift and the panel could be positioned off-screen.

### `CommandInput` gains a `wrapperCss` prop

`CommandInput` renders a bordered wrapper around the input, and its existing
`cssOverride` reaches only the `<input>`. Sizing the search row to the trigger
needs the wrapper. A second optional prop is the smallest change that does it;
the alternative — reaching in with a descendant selector from `Combobox`'s content
styles — couples the two components through the DOM shape instead of an API.

### Normalise the two triggers that drop their border

The offset assumes the trigger has a `1px` border. `styles.variants.secondary`
in `select.tsx` and the two trigger overrides in `select-input.tsx` use
`border: none`, which puts them 1px out. They become `1px solid transparent`,
preserving their look and the geometry.

## Risks / Trade-offs

- **The offset is coupled to four paddings across two components.** Change the
  trigger's padding, the content's border, the viewport's padding or the item's
  left padding, and the drift returns. → Derive it from the shared token
  constants, keep `styles.item` consuming `ITEM_PADDING_LEFT`, and comment the
  three assumptions on the constants themselves.
- **A trigger with content before `<SelectValue>` would shift the value's inset
  and re-introduce drift.** → Verified across all 24 `SelectContent` call sites
  that `<SelectValue>` is the first child today; the comment on the constants
  records the assumption for future callers.
- **Near the left edge of the viewport Radix clamps the wrapper**, and the margin
  then pushes the content right of the trigger. → Pre-existing clamping behaviour,
  affects only panels within 10px of the viewport edge; accepted.
- **`DropdownMenu` changing from centred to left-aligned touches seven call sites
  at once.** → Presentation only; the three sites that pass `align` explicitly are
  unaffected. Listed for visual review.
- **In `multiple` mode a multi-row chip trigger yields a correspondingly tall
  search row.** → Self-consistent by construction (the row always matches the
  trigger), but it may look odd; flagged for the user's visual pass rather than
  special-cased up front.
- **No automated proof.** Vitest here is scoped to form schemas and these are
  geometry changes; `CLAUDE.md` §0 forbids browser verification in this project.
  → Typecheck, lint and the existing suite are regression guards only; the
  acceptance list in `tasks.md` is a human visual pass.

## Correction during implementation

Two details of the plan were wrong once in the code. Neither changed the
approach or the specs.

**`align="start"` on the select's popper branch was already the default.**
The plan had it as half of task 1.4. Radix's `SelectPopperPosition` destructures
`align = "start"` itself — unlike `Popper.Content`, which defaults to `"center"`,
and unlike `DropdownMenu`, which inherits that centred default and genuinely
needed the change. Passing it would have been redundant code, so only the
`min-width` move was made. With its `min-width` moved to `contentPopper`,
`styles.viewportPopper` held nothing but a duplicate of `styles.viewport`'s
`width: '100%'`, so it was deleted rather than left as a no-op.

**Dropping the width lock exposed a cap the design had not accounted for.**
The plan said to replace `Combobox`'s and `MultiSelect`'s
`width`/`minWidth`/`maxWidth` lock with `minWidth: var(--radix-popover-trigger-width)`.
That alone would have left `PopoverContent`'s own `maxWidth: 320px` in force —
the lock had been masking it — capping every panel at 320px and breaking the
"long labels widen the panel" requirement. Both panels therefore also set
`maxWidth: 'none'`, letting the base's `width: 'max-content'` combine with the
trigger-width floor to produce `max(trigger width, content width)` as specified.
