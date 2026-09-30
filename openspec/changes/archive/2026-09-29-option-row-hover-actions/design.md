## Context

See proposal.md — Why. Current state that shapes the approach:

- `components/group-option-card.tsx` renders one bordered `Card` per row, stamps
  `data-box-card` on it, and hides `ActionGroup` with `display: none` unless
  `activeIndex === index`. `activeIndex` is set only by `DropdownButton`'s `onOptionToggle`.
- Four consumers wrap the component in a `<Flex data-box-wrapper>` carrying an identical
  `boxWrapper` style block that strips those per-row borders and re-rounds the first/last row.
  The block is duplicated verbatim in `shipping-profile`, `schema-profile`, `tax-profile` and
  `variation-library`.
- `pages/settings/shipping-settings/shipping-method-row.tsx` (added on this branch) already
  solves the same reveal problem for a different row type using an absolutely positioned
  `ActionGroup`. It is the reference implementation.
- `components/ui/dropdown-menu.tsx` portals menu content to `getPortalContainer()`, i.e.
  outside the row's DOM subtree.
- `components/ui/item.tsx` provides `ItemGroup` / `Item` / `ItemSeparator` / `ItemMedia` /
  `ItemContent` / `ItemTitle` / `ItemActions`, each stamping a `data-slot` attribute.
- `components/ui/action-group.tsx` already stamps `data-action-group="true"`.
- Vitest runs `**/*.test.ts` in the `node` environment — no DOM, so anything under test must be
  JSX-free.

## Goals / Non-Goals

**Goals:**

- One reveal mechanism for row actions, expressed in CSS, that provably cannot shift layout.
- `GroupOptionCard`'s public props stay byte-identical so no call site changes signature.
- The Shipping Profiles section's pure logic becomes testable without a DOM.

**Non-Goals:**

- Migrating the other 9 inline empty-state copies to the new primitive.
- Changing `CreateProfilePopup` — the product form consumes it through a cast, so its prop
  shape is load-bearing outside settings.
- Fixing profile references being stored by name rather than id (see Risks).
- Restyling the sections that merely inherit the new row rendering.

## Decisions

**Fix `GroupOptionCard` centrally rather than writing a local profile row.**
A section-local row would have matched the Figma with the smallest diff, but it would leave
the same dead-actions bug on 7 other screens and add a second row implementation next to
`shipping-method-row.tsx`. One shared component keeps a single definition of what an option
row is, and repairs 8 screens at once. Cost: a visual regression on any of those 8 screens is
now possible, which is why verification walks all of them.

**Absolute positioning, not reserved in-flow space.**
Two mechanisms produce zero shift: give the `ActionGroup` a permanent slot in the flex row and
fade it, or take it out of flow entirely. Reserved space would permanently indent every row —
including rows with no actions — and push trailing text left on screens nobody reviewed
against a design. Absolute positioning changes nothing at rest. Trailing text is hidden with
`visibility: hidden` rather than `display: none` for the same reason: `display` would collapse
the row's content box.

**`data-actions-open` attribute instead of deleting the `activeIndex` state.**
The requirement is that hover is CSS-driven, and it is: one rule, three selectors. But because
the menu is portaled, once the pointer moves into an open menu neither `:hover` nor
`:focus-within` still matches the row, so a purely CSS solution would fade the actions out from
under the open menu on Shipping Boxes and Available Currencies. Keeping `activeIndex` solely to
stamp `data-actions-open="true"` leaves styling entirely in CSS — state drives an attribute,
not a style object. `pages/settings/settings-layout/settings-nav-item.tsx` already uses this
`data-active` idiom.

**The list container owns the border.**
With `Item` rows there are no per-row card borders left for `boxWrapper` to undo, so those
blocks either get deleted or start fighting the new DOM. `GroupOptionCard` renders
`Card(cardStyles.tableCardRounded) > CardContent(cardStyles.tableContent) > ItemGroup` with
`ItemSeparator` between rows: one border, one radius, no first/last-child arithmetic, and four
copies of duplicated CSS removed. `data-box-card` is dropped since nothing will target it.
(`tax-services.tsx` uses `data-box-card` on its own unrelated `Card`; untouched.)

**The `Switch` reveals with the other actions.**
Considered keeping the toggle permanently visible on the grounds that it is state rather than
an action. Rejected for consistency: one rule — the whole `ActionGroup` reveals together —
matches `shipping-method-row.tsx`, and disabled rows already carry an `Inactive` badge that
communicates state at rest. Affects Admin Email, Customer Email and Available Currencies.

**Row height is pinned explicitly.**
Today's row is `12px` content padding plus a `36px` min-height inner `Flex` — 60px. `Item`
`size="sm"` alone yields ~44px, which would visibly tighten 8 screens. `styles.row` sets
`minHeight: 60px` to preserve the existing rhythm.

**Optimistic delete moves onto the query cache.**
The section currently mirrors query data into `useState` via `useEffect` purely so the delete
can filter it and undo can restore it. Deriving the list with `useMemo` removes the
state-sync effect, so the optimistic removal has to live where the data now lives: snapshot
with `getQueryData`, `cancelQueries` to stop an in-flight refetch resurrecting the row, then
`setQueryData`. Undo restores the snapshot; expiry sends the delete and invalidates. The raw
`deleteShippingProfile` service call is kept rather than `useDeleteShippingProfileMutation`,
because that hook fires its own success toast which would stack on the undo toast.

**Helpers are JSX-free.**
`getProfileUsage` and `buildShippingProfileList` move to `shipping-profile/utils.ts` returning
plain data (`badge1` / `badge2` strings). The `<BoxClosedIcon />` is attached in the component.
This keeps the helpers runnable under vitest's `node` environment.

## Risks / Trade-offs

- **A styling regression on one of the 7 inherited screens ships unnoticed.** → Verification
  walks all 8 screens in the browser; typecheck cannot see any of this.
- **The switch is now hidden at rest on Email settings and Available Currencies**, a real UX
  change to screens this change was not commissioned for. → The `Inactive` badge remains the
  at-rest state indicator; called out for review during the browser pass.
- **Absolutely positioned actions can overlap long row content** at narrow widths, where
  previously the flex row would have wrapped. → `Item` rows keep trailing text in the same slot
  and hide it during reveal; checked at the settings container width, which is fixed (`sm`).
- **The undo window still loses to a hard reload.** Deleting, then reloading before the notice
  closes, leaves the profile on the server. This is pre-existing behavior, unchanged.
- **Profile usage is matched by name**, so renaming a profile orphans the rules referencing it.
  Consistent with how rules are written (`shipping-rule-form-card.tsx` stores `value: item.name`),
  so changing it here would be a data-model change with a migration. Out of scope; recorded in
  the spec as intended behavior for now.

## Migration Plan

No data or API migration. The rollback unit is the commit — reverting restores the previous
`GroupOptionCard` and the four `boxWrapper` blocks together. The four wrapper deletions must
land in the same commit as the `GroupOptionCard` rewrite; splitting them would leave the four
sections with stale overrides targeting a `data-box-card` that no longer exists.
