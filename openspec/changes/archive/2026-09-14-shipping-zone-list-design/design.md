## Context

See `proposal.md` — Why. What shapes the approach here is what already exists:

- The zone list renders each zone as `OptionAccordion` (`components/option-accordion.tsx`),
  a wrapper over the Radix-backed `Accordion` primitive. Each zone mounts its *own*
  `Accordion` root with `type="multiple"`, so zones are already independent of one another.
- `OptionAccordion` already takes an `open` prop that feeds both `defaultValue` and the
  `AccordionItem`'s `value`. It is uncontrolled, and every current caller leaves it at its
  `false` default — which is the only reason nothing is expanded today.
- `components/ui/stacked-items.tsx` is the row-stack primitive. Its `row` style already
  reveals `[data-action-group="true"]` on hover/focus/menu-open and hides
  `[data-right-text="true"]` in the same conditions — exactly the price-gives-way-to-actions
  behavior the spec asks for.
- `features/settings/shipping/pages/shipping-method/shipping-method.tsx` is the in-feature
  reference for composing `StackedItems` around shipping methods.
- `use-shipping-settings.ts` already returns `handleToggleZoneItem`, `handleDeleteItem`,
  `handleToggleMethod`, `handleEditMethod`, and `handleDeleteMethod`.
- Derivation helpers already exist: `getSelectedRegionTags` (`utils/region.ts`),
  `getShippingZoneSummary`, `shippingMethodIconMap`, `getShippingMethodSubText`,
  `getShippingMethodRightText` (`features/settings/shipping/lib/utils.tsx`).

Constraint from `CLAUDE.md` §0: no browser/dev-server verification in this project. The
automated gate is `npm run typecheck`, `npm test`, and `npm run lint` from `resources/app/`.

## Goals / Non-Goals

**Goals:**

- Satisfy the new `shipping-settings` requirements by re-composing existing primitives,
  adding as little new UI code as possible.
- Leave `stacked-items` untouched, so the zone list and the zone detail screen keep rendering
  methods through one identical primitive.
- Keep every existing handler and derivation helper as the single source of behavior, so this
  stays a presentation change with no data-layer surface.

**Non-Goals:**

- Reworking the zone detail screen (`shipping-zone.tsx`) or the `ShippingMethod` list it
  renders. It already uses the primitive.
- Making `OptionAccordion` a general-purpose configurable accordion. One additive optional
  prop, used by one caller, is the whole extent of the change to it.
- Persisting collapse state anywhere.

## Decisions

**Expanded-by-default via the existing uncontrolled `open` prop, not new state.**
Passing `open` to `OptionAccordion` sets Radix's `defaultValue`, and `type="multiple"` lets
the merchant toggle the item shut afterwards. That is expanded-on-load plus on-demand
collapse plus reset-on-reload in one, with zero new state.
*Alternative rejected:* holding a `Set` of collapsed zone ids in the page and driving
`value`/`onValueChange`. It would be a controlled accordion with an id set to keep in sync as
zones are created and deleted, to buy behavior the uncontrolled default already gives.
*Alternative rejected:* `localStorage` persistence — explicitly declined; it would also make
"expanded by default" true only on a merchant's first visit, contradicting the spec.

**Country flags enter through a new `titleAdornment` prop on `OptionAccordion`, rendered as
a sibling of the title text.** `OptionAccordion` renders the title as
`Text variant="heading6"`, which is an `<h6>` — whose HTML content model is phrasing content.
Passing the flags inside the existing `header` prop would nest `Flex`'s `<div>` inside an
`<h6>`, which is invalid. Rendering them as a sibling inside the header `Flex`, next to where
the `Inactive` badge already sits, keeps the markup valid and puts the flags where the design
wants them.
*Alternative rejected:* reusing the existing `leftIcon` prop — it renders before the whole
title-and-subheader column, not after the title.
*Alternative rejected:* abandoning `OptionAccordion` and composing `Accordion` primitives
directly in the page — it duplicates the header layout, the inactive badge, and the content
card for one adornment.

**The three-flag cap and `+N` overflow are computed in the page, from `getSelectedRegionTags`.**
That helper already resolves a region to its country flag and name and is shared with the
zone detail screen; the cap is presentation and belongs at the call site.

**Method rows compose `StackedItems` in the page rather than behind a new row component.**
The `stacked-items` spec is explicit that a row's presentation is composed, not configured —
introducing a wrapper that takes a method and a handler map would reintroduce exactly the
data-array-plus-handler-map API that spec forbids. Alignment differences go through
`StackedItem`'s `cssOverride`, never through edits to the primitive.
*Consequence:* `shipping-method-row.tsx` has no remaining consumer and is deleted. It is dead
only because of this change, so removing it is in scope.

**Activate/Deactivate follows the established menu pattern.** `coupon-table/columns.tsx`
already renders this action as a label that flips with state (`Deactivate` when active,
`Activate` when not) with a `Ban` icon. Matching it keeps one vocabulary across settings.

**The exposed edit control calls the same code path the menu entry called.** The existing
`handleEditAndDelete('edit', item)` in `shipping-zone-actions.tsx` already routes through
`confirmAction` before navigating; moving the trigger from a menu item to a header button
changes nothing about what runs.

## Risks / Trade-offs

- **`OptionAccordion` is shared with three other settings pages** (admin email, customer
  email, multi-currency API config) → the new prop is optional and renders nothing when
  absent, so those callers produce identical markup. Typecheck covers the signature.
- **Every zone expanded means a long page for a store with many zones** → accepted; it is the
  requested design, and collapsing is one click per zone.
- **The `+N` overflow counts countries, while the subheader counts regions** → these can read
  as two different numbers for the same zone. Kept deliberately: `getShippingZoneSummary` is
  unchanged and already translated, and a region is a country-or-its-states, so a per-country
  flag row legitimately collapses several regions into one marker.
- **No component-level test can catch a regression here** → this repo's Vitest suite covers
  schemas and lib functions only, and this change adds no schema. Typecheck and lint are the
  real automated gate; the rendered result needs a human look in wp-admin. Stated plainly
  rather than papered over with a new test harness that this change alone doesn't justify.
- **Hover-revealed method actions are invisible on touch** → pre-existing behavior of
  `stacked-items`, unchanged here and not this change's to fix. Keyboard focus does reveal
  them.

## Correction during implementation

One premise in Decisions needed a fix once in the code: `stacked-items`' row style sets
`& button { width: 24px; height: 24px }`, which also matches the Radix `Switch` root (it
renders a `<button role="switch">`) and squashed the method toggle from 36×20 to 24×24.
Resolved the way the change's own constraint requires — a `StackedItem` `cssOverride`
restoring the switch's own dimensions via `button[role="switch"]`, which outranks the
primitive's `& button` on specificity. `components/ui/stacked-items.tsx` was not modified.

Also corrected: the `countryList` returned by `use-shipping-settings` is already typed
`CountryWithStates[]`, so the cast the old call site used (`countryList as
CountryWithStates[] | null`) was unnecessary and tripped
`@typescript-eslint/no-unnecessary-type-assertion`. Dropped the cast and the type import
with it.

## Correction after visual review

The first implementation passed typecheck, lint, and tests but did not match the mockup once
rendered. Two structural defects, both invisible to the automated gate:

**The zone body nested a card inside a card.** `OptionAccordion`'s `AccordionContent` wraps
its children in `cardStyles.darkCard` (a `surfaceSecondary` panel) plus
`cardStyles.innerCardContent` (16px padding). Composing `StackedItems variant="card"` inside
that produced a bordered white stack floating in a grey gutter, where the mockup shows the
method rows flush inside the zone card, edge to edge, separated only by hairlines. Fixed by
giving the `shipping` variant a transparent content card with zero padding, and no border of its
own; the page then drops
`variant="card"` and overrides the stack's own border and radius away, keeping a single
`borderTop` as the header/rows divider. That `borderTop` rides on `StackedItems`, which only
renders when the zone has methods, so a method-less zone gets no orphan rule.
`components/ui/stacked-items.tsx` was still not modified.

**The zone card's own border was invisible, so the box you saw was the body's.**
`styles.wrapper` draws the zone outline with `theme.colors.icon.inverse`, which resolves to
`gray1` — white on a white card. The only border actually visible was the one the `Card`
inside `AccordionContent` paints, which wraps the body alone; that is why the outline began
below the header and carried bottom-only rounding. The mockup shows one hairline enclosing
header and rows together, with the same radius on all four corners. Fixed by giving the
`shipping` variant a real `border.secondary` wrapper border plus `overflow: hidden`, and
stripping the body card's border and radius so the wrapper is the single enclosing edge. The
wrapper's white border is left alone for the other three callers rather than repaired
globally — that is their existing look and not this change's to alter.

**The chevron became permanent.** `accordion.tsx` keeps the chevron hidden until hover, with
one exception: `&[data-state="open"]` forces it visible. That exception was written for a
world where open meant the merchant had opened it. Now that every zone loads open, it made
the chevron a fixture the mockup does not have. Fixed with a `shipping`-only override on the
trigger that re-hides it while open and restores it on hover and focus — at rest it matches
the mockup, and collapse stays discoverable by pointer and reachable by keyboard. The shared
accordion primitive is unchanged, so the three other `OptionAccordion` callers keep today's
behavior.

## Known gap: the inactive zone has no visual treatment

The mockup renders a deactivated zone as a grey-filled, borderless card with its title,
subheader, and method rows all dimmed. `OptionAccordion` uses `enabled` for exactly one
thing — showing the `Inactive` badge — so a deactivated zone is otherwise pixel-identical to
an active one. This predates the change and is not a regression, and the mockup is ambiguous
about it: Zone 3 is drawn active yet carries the same grey fill as the inactive Zone 2, so
the fill may be a card hover state rather than an activation state. Left unimplemented rather
than guessed at.

## Correction: the header divider is drawn only while the zone is open

Carrying the header/rows divider on the trigger gave a collapsed zone a doubled hairline —
the trigger's `border-bottom` landing directly on the wrapper's own bottom border, cutting
flat across the 12px corner radius — and, being on the shared `trigger` style, it also put a
divider under the three other `OptionAccordion` callers' headers, which never had one. Moved
into `shippingTrigger` behind `&:has(button[data-state="open"])`, so it is drawn only for the
shipping variant and only while that zone is expanded. `:has()` is already used across this
codebase's primitives, so it needs no fallback.
