## 1. Select: cancel the drift and adopt the width rule

- [x] 1.1 In `resources/app/components/ui/select.tsx`, add the four alignment
      constants (`ITEM_PADDING_LEFT`, `TRIGGER_VALUE_INSET`, `ITEM_TEXT_INSET`,
      `ITEM_ALIGNED_OFFSET`) above `styles`, with a comment naming the three
      geometry assumptions they depend on (trigger's 1px border and `spacing[3]`
      padding, `<SelectValue>` being the trigger's first child, content's 1px
      border plus viewport's `spacing[1]` side padding)
- [x] 1.2 Rewrite `styles.item`'s `paddingLeft` to consume `ITEM_PADDING_LEFT`
      instead of repeating the calc, so the constants cannot diverge
- [x] 1.3 Apply `marginLeft: ITEM_ALIGNED_OFFSET` to `SelectContent` in
      `item-aligned` mode only (not in the popper branch)
- [x] 1.4 Fix the popper branch: move `minWidth: var(--radix-select-trigger-width)`
      from `styles.viewportPopper` onto `styles.contentPopper`, where it governs
      the panel rather than the viewport. **Correction:** the `align="start"` half
      of this task was unnecessary — Radix's own `SelectPopperPosition` already
      defaults `align` to `"start"` (unlike `Popper.Content`, which defaults to
      `"center"`), so passing it would have been redundant code. With
      `viewportPopper` emptied of its only meaningful rule it duplicated
      `styles.viewport`, so it was removed rather than left as a no-op
- [x] 1.5 Change `styles.variants.secondary` from `border: none` to
      `1px solid transparent` so the 1px assumption holds for that variant
- [x] 1.6 Do the same for `styles.selectTrigger` and `styles.selectTriggerDivider`
      in `resources/app/components/ui/select-input.tsx`, keeping the divider's
      `borderLeft`
- [x] 1.7 Run `npm run typecheck && npm test` from `resources/app/`

## 2. Searchable select: the search box replaces the trigger

- [x] 2.1 In `resources/app/components/ui/command.tsx`, add an optional
      `wrapperCss` prop to `CommandInput` that merges into the bordered wrapper's
      styles, leaving `cssOverride`'s meaning (the `<input>`) unchanged
- [x] 2.2 In `resources/app/components/ui/combobox.tsx`, hold a ref on the trigger
      button and track its measured height, resetting the measurement when the
      popover opens
- [x] 2.3 Pass `align="start"` and `sideOffset={-triggerHeight}` to
      `PopoverContent` so the panel's top edge lands on the trigger's top edge,
      leaving Radix's collision handling at its default
- [x] 2.4 Size the search row from `var(--radix-popover-trigger-height)` via the
      new `wrapperCss`, so it covers the trigger with no sliver showing
- [x] 2.5 Replace the width lock in `styles.content` (`width`/`minWidth`/`maxWidth`
      all set to the trigger width) with `minWidth: var(--radix-popover-trigger-width)`,
      and switch the panel's radius to `theme.radius.lg` to match the trigger it
      replaces. **Note:** `maxWidth` also had to be reset to `none` — dropping the
      lock exposed `PopoverContent`'s own `maxWidth: 320px`, which would have
      capped the panel and broken the width rule
- [x] 2.6 Run `npm run typecheck && npm test` from `resources/app/`

## 3. Multi-select and dropdown menu

- [x] 3.1 In `resources/app/components/ui/multi-select.tsx`, replace the
      `styles.content` width lock with `minWidth: var(--radix-popover-trigger-width)`,
      keeping `align="start"` and `sideOffset={4}` so the list still drops below
- [x] 3.2 In `resources/app/components/ui/dropdown-menu.tsx`, default
      `DropdownMenuContent`'s `align` to `'start'` alongside the existing
      `sideOffset` default, leaving its `min-width` styles alone
- [x] 3.3 Confirm the three call sites that pass `align` explicitly still compile
      and are unaffected
- [x] 3.4 Run `npm run typecheck && npm test` from `resources/app/`

## 4. Verification

- [x] 4.1 Run `npm run typecheck && npm test && npm run lint` from `resources/app/`
- [ ] 4.2 (handed to the user; their pass is still outstanding and gates archiving)
      Visual acceptance list — `CLAUDE.md` §0 forbids
      browser verification here, so these need their eyes, not ours:
      (a) inventory Status filter: panel flush-left, exactly trigger width,
      selected option still over the trigger;
      (b) a select with labels wider than its trigger (tax condition rows):
      panel widens rather than truncating;
      (c) shipping box field with no boxes (the `popper` branch): still aligned;
      (d) `secondary` variant (customer groups table) and the unit select inside
      `SelectInput` (bulk-edit weight): no 1px offset;
      (e) product form Brand field: search box lands on the trigger with no
      sliver, and flips cleanly near the viewport bottom;
      (f) tags/collections fields: list still drops below, widening for long titles;
      (g) the seven `DropdownMenuContent` call sites without an explicit `align`:
      menus now left-align instead of centring
- [x] 4.3 Record any correction to this plan's premise in `design.md` under a
      "Correction during implementation" heading rather than diverging silently
