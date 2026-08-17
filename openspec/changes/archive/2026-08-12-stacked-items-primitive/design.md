## Context

`GroupOptionCard` (`resources/app/components/group-option-card.tsx`) currently renders
`Card(cardStyles.tableCardRounded) > CardContent(cardStyles.tableContent) > ItemGroup`, mapping a
`dataArr` of plain objects through a closed set of handler props onto `Item`/`ItemMedia`/
`ItemContent`/`ItemTitle`/`ItemActions`/`ActionGroup` rows, with `ItemSeparator` inserted between
rows by index and `activeIndex` state tracking which row's kebab menu is open. `Item`/`ItemGroup`/
`ItemMedia`/`ItemContent`/`ItemTitle`/`ItemActions`/`ItemSeparator` (`components/ui/item.tsx`) and
`Card`/`CardContent` (`components/ui/card.tsx`) are unmodified, generic primitives — every field
on them is already `cssOverride`-driven `forwardRef` components with no `GroupOptionCard`-specific
coupling. `cardStyles.tableCardRounded`/`tableContent` exist specifically to zero out `Card`'s
default `gap`/`paddingBlock` for this row-list use case. See `proposal.md` - Why for the
prop-list-growth problem this replaces.

## Goals / Non-Goals

**Goals:**
- A `components/ui/stacked-items.tsx` primitive family callers compose rows into directly, with
  no data-array/handler-map surface.
- Preserve every existing visual/interaction behavior at the 11 migrated call sites (hover reveal,
  keyboard-focus reveal, open-menu persistence, bordered-group presentation, disabled-row badge),
  which are unchanged requirements of the separate `option-row-list` capability.
- Fix the focus-outline-clipping and index-based-menu-identity issues identified while designing
  this (see Decisions).

**Non-Goals:**
- Changing `Item`/`ItemGroup`/`ItemMedia`/`ItemContent`/`ItemTitle`/`ItemActions`/`ItemSeparator`
  or `Card`/`CardContent` themselves — they're reused as-is.
- A shared row-content helper/builder across the 11 call sites. Each site composes its own JSX;
  duplication across sites is accepted (see Decisions).
- Any new capability for `manual-payment.tsx`/`tax-region.tsx` — they don't use `GroupOptionCard`
  today and aren't touched.

## Decisions

### `StackedItems` is a standalone container, not a `Card`/`ItemGroup` wrapper combo

`StackedItems` owns its own `defineStyles` (border, `theme.radius.md`, `overflow: hidden`,
`role="list"`) rather than rendering `Card`+`CardContent` internally. Alternative considered:
absorb `Card`/`CardContent` the way `GroupOptionCard` does today, removing one nesting level at
call sites. Rejected — `Card`'s default `gap`/`paddingBlock` don't fit a tightly-packed row list,
which is exactly why `cardStyles.tableCardRounded`/`tableContent` exist to override them; a
purpose-built container avoids needing to fight another component's defaults at all. It does
render on top of the existing `ItemGroup` (a plain `role="list"` flex column with no `Card`-style
opinions to override), consistent with reusing `Item`'s family as-is.

### `StackedItem` wraps `Item`, hardcodes `size="sm"`, requires an `id` prop

`StackedItem` renders `Item` internally with `size="sm"` fixed (every current caller uses `sm`,
none uses `default`) and forwards a required `id: string` prop used for both DOM identity
(`key`-equivalent data) and the open-menu context below. Alternative considered: expose `size` as
a pass-through prop. Rejected as speculative — no current or anticipated caller needs `default`
size in a stacked-row context; add it if a real use case appears.

### First/last-row radius is explicit CSS on `StackedItem`, not container clipping

`StackedItem` applies `&:first-of-type`/`&:last-of-type` corner radius and `&:not(:last-of-type)`
separator-border rules directly, rather than `StackedItems` relying on `overflow: hidden` to clip
square-cornered rows into the appearance of rounded ones (today's approach, inherited from
`cardStyles.tableCardRounded`). Alternative considered: keep the clipping approach, since it
already produces the correct visual result. Rejected — clipping also cuts off the row's
`:focus-visible` outline (`outlineOffset: 2px`) on the first/last row, a real accessibility
regression that explicit per-row radius avoids. `ItemSeparator` is no longer used inside
`StackedItems`; the separator border moves into this same CSS rule.

### Open-row-menu state is a context on `StackedItems`/`StackedItem`, keyed by `id`

`StackedItems` holds `openId` state internally and provides it via context; `StackedItem` (using
its required `id` prop) provides a nested per-row context and exposes `useStackedItem()` →
`{ isOpen, setOpen }` for any descendant to call without re-passing `id`. Only the 2 call sites
with a kebab `DropdownButton` (`shipping-box.tsx`, `available-currency-list.tsx`) use this hook;
the other 9 never call it. Alternative considered: keep `GroupOptionCard`'s original approach —
open state lifted to local `useState` in each of the 2 call sites, keyed by array index or a
locally-tracked id. Rejected in favor of the context approach (matches this codebase's existing
compound-component shape, e.g. how Radix-style primitives scope state to a subtree) — but either
way, tracking must be by `id`, not index: `GroupOptionCard`'s original `activeIndex: number | null`
pointed `data-actions-open` at the wrong row after a list mutation (e.g. an optimistic delete
shifting indices), which this design fixes regardless of where the state lives.

### `StackedItemMedia`/`Content`/`Title`/`Actions` are real components, not re-exports

Each wraps the corresponding `Item*` component internally as its own `forwardRef` definition,
rather than `export { ItemMedia as StackedItemMedia } from '@/components/ui/item'`. Alternative
considered: pure re-export, zero new code, zero drift risk. Rejected — a real component leaves a
seam to diverge later if stacked-row-specific styling is ever needed, at the cost of ~4 thin
pass-through definitions today with no behavioral difference from what they wrap. No
`StackedItemDescription`/`Header`/`Footer` — nothing uses `ItemDescription`/`ItemHeader`/
`ItemFooter` at any of the 11 call sites.

### Migration is fully inline per call site, no shared row-builder

Each of the 11 call sites writes its own `.map()` producing `StackedItem` JSX directly. Rejected:
a shared row-shape helper function to cut duplication across the ~8 "plain" sites — that's the
same shape that grew into `GroupOptionCard`'s closed prop list originally. Duplication across
sites (icon/title/badge/switch/edit/delete JSX repeating with small variations) is accepted as
the cost of keeping the primitive itself free of assumptions about row shape.

### `StackedItems` does not special-case empty children

No `if (!children) return null`. Each call site decides whether to render `<StackedItems>` or an
empty-state branch (several already use `components/ui/empty-state.tsx`'s `EmptyState`).
`StackedItems` can't distinguish "caller intentionally rendered nothing" from "caller forgot the
empty branch" from its own vantage point once it no longer owns the data array, so it makes no
attempt to.

### `shipping-career.tsx`'s dead branch is swapped, not fixed

`hasShippingCareers` is hardcoded `false` and `onAdd` is a `console.log('')` stub — the
`<GroupOptionCard />` branch is pre-existing unreachable code, not something this change
activates. Because `group-option-card.tsx` is deleted, the reference must change regardless; the
minimal fix is swapping it for `<StackedItems />` with no children in the same unreachable branch.
The surrounding stub logic is untouched — out of scope for this change per this repo's "don't fix
unrelated pre-existing issues" convention.

## Risks / Trade-offs

- **[Risk]** Per-call-site duplication (11 sites each writing their own row JSX) increases total
  line count versus one shared component. → **Mitigation**: accepted deliberately (see Decisions)
  — the alternative reproduces the exact prop-list-growth problem this change exists to remove.
  If a truly identical pattern recurs 4+ times with zero variation, extract it as a follow-up,
  not preemptively.
- **[Risk]** `useStackedItem()` context lookup will throw or return `undefined` if called outside
  a `StackedItem` subtree — a call site could misuse it. → **Mitigation**: the hook only matters
  to the 2 kebab-menu sites, both of which call it from inside `StackedItemActions`, itself always
  inside a `StackedItem`; no other call site needs to know the hook exists.
- **[Risk]** Behavior parity across 11 call sites during migration — a mis-ported row could
  silently drop a badge, a disabled state, or an action. → **Mitigation**: `tasks.md` verification
  step compares each migrated section against its current rendered state (badges, toggle/edit/
  delete/kebab availability, disabled states) before moving to the next site.

## Migration Plan

Single-PR migration, no feature flag or rollout — this is an internal component swap with no
externally observable API (no PHP/REST changes), verified by `npm run typecheck && npm test` plus
a manual pass over all 11 sections in the running app (per `tasks.md`). Rollback is a plain git
revert if a regression surfaces.
