## Why

Every trigger-anchored overlay in the admin — the plain `Select`, the searchable
`Combobox`, `MultiSelect`, and `DropdownMenu` — currently positions and sizes
itself by a different rule, so none of them line up with the control that opened
them. The plain `Select` is the worst case: its panel opens about 24px to the
left of its trigger and 24px wider than it, because Radix's `item-aligned`
positioning aligns the *option text* with the *trigger's value text*, and our
option rows carry a 32px check gutter that the trigger does not. The searchable
`Combobox` has a second, separate problem: its search box lives in a panel that
drops below the trigger, so the trigger and the search box read as two unrelated
controls instead of one that turned into the other.

## What Changes

- The plain `Select` panel opens flush with its trigger's left edge, at exactly
  the trigger's width when its content is narrower, while the selected option
  keeps sitting over the trigger as it does today.
- A shared width rule across `Select`, `Combobox` and `MultiSelect`: panel width
  is `max(trigger width, natural content width)`, so narrow lists snap to the
  trigger and long option labels widen the panel instead of truncating.
  **BREAKING** for `Combobox` and `MultiSelect`, which today hard-lock their
  panel to the trigger's width.
- The searchable `Combobox` anchors its panel so the search row lands on the
  trigger, making the trigger read as having been replaced by a search box.
- `DropdownMenu` menus left-align to their trigger instead of centring on it.
  **BREAKING** for the seven call sites that do not pass `align` explicitly.
- `CommandInput` gains an optional `wrapperCss` prop so a caller can size the
  search row; today it can only style the `<input>`, not its bordered wrapper.

## Capabilities

### New Capabilities

- `dropdown-alignment`: how every trigger-anchored overlay in the admin
  positions and sizes itself relative to the control that opened it — left-edge
  alignment, the width rule, the searchable select's trigger-replacing search
  row, and collision behaviour.

### Modified Capabilities

<!-- None. The existing `multi-select` spec describes that control's behaviour
     (selection, create row, keyboard) and states no positioning or width
     requirement, so its requirements are unchanged. -->

## Impact

- `resources/app/components/ui/select.tsx` — alignment constants, content offset,
  popper branch
- `resources/app/components/ui/combobox.tsx` — trigger measurement, panel anchoring,
  content styles
- `resources/app/components/ui/command.tsx` — new `wrapperCss` prop on `CommandInput`
- `resources/app/components/ui/multi-select.tsx` — panel width rule
- `resources/app/components/ui/dropdown-menu.tsx` — default `align`
- `resources/app/components/ui/select-input.tsx` — trigger border normalised so the
  alignment maths holds
- No API, data, or schema changes. No new dependencies. Presentation only, but it
  touches every select, searchable select and menu in the admin, so the risk is
  breadth rather than depth.
