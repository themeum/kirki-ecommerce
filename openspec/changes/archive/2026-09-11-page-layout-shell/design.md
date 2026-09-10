## Context

See proposal.md — Why, for the motivation.

Current state that shapes the approach:

- `components/ui/page.tsx` is a 23-line `div` with a `minHeight` prop. Only 9
  of 20 screens bother to use it.
- `components/ui/page-heading.tsx` owns three wrapper variants — default,
  `sticky`, and `noMargin` — selected by props. 11 screens pass `sticky`, 9
  don't. Its `type?: HeadingType` prop is declared in `PageHeadingProps` but
  never destructured or read; `edit-coupon.tsx` passes `type="primary"` into
  nothing.
- `components/ui/container.tsx` defaults to `maxWidth: 1024px`. Its `sizes`
  map has an `xxl` entry that is unreachable because `ContainerSize` in
  `types/components/common.ts` never listed it, and a `fullWidth` entry
  (`maxWidth: 100%`, no padding) with zero call sites.
- `settings-layout.tsx` hardcodes `SETTINGS_HEADER_HEIGHT = '65px'` with a
  comment deriving it from `PageHeading`'s internals, plus
  `SETTINGS_HEADER_STICKY_TOP = '64px'` and a `style={{ height: '32px' }}`
  override on the heading itself.
- `components/skeletons/page-heading-skeleton.tsx` re-implements the heading's
  `wrapper`/`heading`/`headingHasBack`/`actions` styles by hand, with its own
  `top`, `marginBottom`, and a different background token.
- Roughly 60 files import `Container`, but most are settings sub-pages using
  `<Container size="sm">` *inside* the settings content pane. Those are not
  page-level containers.

## Goals / Non-Goals

**Goals:**

- One import site for the whole page shell, so the heading cannot be used
  without the page that defines its width.
- The heading's height is a published constant other layout derives from,
  rather than a number each consumer re-measures.
- Container width is declared once per screen and inherited, with an escape
  hatch for screens that manage their own layout.

**Non-Goals:**

- Touching the ~40 `<Container size="sm">` calls inside settings sub-pages.
  They live below the page level and keep working unchanged.
- Reworking `full-page-container.tsx`, which composes `Container` and is
  unaffected by the `fullWidth` → `fluid` rename (it sets `maxWidth` itself).
- Any responsive/breakpoint behaviour. The fluid gutter is a fixed 24px; this
  codebase has no breakpoint system to hang a responsive gutter on.
- Route-level layout. Pages stay responsible for rendering their own shell;
  this change does not move the shell into a router layout route.

## Decisions

### Named exports from one file, not dot notation or separate files

`page.tsx` exports `{ Page, PageHeading, PageContent }`; `page-heading.tsx` is
deleted.

*Why:* this codebase already establishes named multi-part exports from a single
file — `{ Tabs, TabsList, TabsTrigger }` in `ui/tabs.tsx`, `{ Card, CardContent }`
in `ui/card.tsx`. Following it costs nothing and keeps one obvious import line.

*Alternatives:* dot notation (`Page.Heading`) preserves the existing default
import but has no precedent anywhere in the codebase. Keeping the files
separate and merely nesting them at call sites leaves the relationship
unenforced — exactly the failure mode this change exists to fix.

*Cost:* the 9 files doing `import Page from '@/components/ui/page'` break. That
is deliberate: it makes the compiler enumerate the migration.

### Container size travels by context, with a per-child override

`Page` provides `containerSize` through a small context; `PageHeading` and
`PageContent` each resolve their own prop first, then the context value.

*Why:* in practice a screen wants one width for both regions, so making the
call site state it twice is pure repetition across 20 files. But
`settings-layout.tsx` is a real counter-example — its body manages its own
centring (`none`) while its heading stays at `lg` — so a page-only knob with no
override would not express every existing screen.

*Alternatives:* a prop on each child with no context (rejected: 20 sites × 2
props, and the two must be kept in sync by hand); a page-only prop with no
override (rejected: cannot express settings-layout).

*Cost:* ~10 lines of context. Accepted as the smallest thing that covers all
20 screens.

### `none` is a container size, not a separate boolean

The resolved size type is `ContainerSize | 'none'`, and `PageContent` renders
its children bare when the value is `none`.

*Why:* it keeps one knob rather than a `containerSize` prop plus a
`disableContainer` prop that can contradict each other, and it inherits through
the same context, so `<Page containerSize="none">` covers a whole screen.

### Fluid replaces `fullWidth` rather than joining it

`ContainerSize`'s `fullWidth` is renamed to `fluid` and gains
`padding: 0 24px`. The unreachable `xxl` style entry is deleted.

*Why:* `fullWidth` has zero call sites, so the rename is free, and two nearly
identical full-width sizes would only invite picking the wrong one. True
edge-to-edge is still reachable — that is what `none` is for.

*Alternatives:* keeping `fullWidth` alongside `fluid` (rejected: the only
difference would be padding, and `none` already covers zero-padding at the page
level).

### The heading's height is exported, and settings imports it

`page.tsx` exports `PAGE_HEADING_HEIGHT = '64px'` and
`PAGE_HEADING_STICKY_TOP = '32px'` (the WP admin bar). `settings-layout.tsx`
deletes both of its local constants and composes the two.

*Why:* the existing 65px constant was a hand-copy of the heading's internals
and is precisely the kind of drift a fixed height is meant to end.

*Consequence worth stating plainly:* the old settings math was
`64px + 65px = 129px`, but the heading actually pins at `32px`, so the sidebar
has been sitting ~33px too low. Deriving it gives `32px + 64px = 96px`. This is
a fix, but it is a visible one — see Risks.

### `text` widens to `ReactNode` so the skeleton can reuse the heading

`PageHeading` renders `typeof text === 'string' ? <Text variant="heading5">{text}</Text> : text`.

*Why:* the placeholder heading needs to put a `Skeleton` where the title goes.
`Text variant="heading5"` renders an `<h5>`, and `Skeleton` renders a `div` —
a `div` inside an `h5` is invalid HTML, so the placeholder cannot simply pass a
node through the existing `Text` wrapper.

*Alternatives:* a separate `title?: ReactNode` prop that replaces `text`
(rejected: two props meaning the same thing, and call sites must know which);
adding an `as` prop to `Text` (rejected: widens a shared primitive's API to
serve one caller).

*Cost:* a `typeof` branch. It is two lines and confined to one component.

### Removing the dead `type` prop

`PageHeadingProps.type` is deleted along with the `type="primary"` at
`edit-coupon.tsx`.

*Why:* the prop surface is being rewritten in this change, so leaving a prop
that provably does nothing would carry the confusion forward. Flagged here
rather than removed silently, per this repo's rule about not deleting
pre-existing dead code unnoticed.

## Risks / Trade-offs

- **Nine screens change appearance** — brands, categories, collections,
  coupons, customers, customer-groups, orders, tags, and coming-soon lose their
  32px heading margins and gain a pinned, bordered heading. → This is the
  intent of the change, not a side effect, but it is the largest visual delta.
  Named explicitly in tasks.md as a spot-check step.
- **The settings sidebar moves up ~33px** → Correcting a pre-existing bug, but
  a merchant-visible position change. Called out for manual confirmation; per
  CLAUDE.md §0 no browser verification is done as part of implementation.
- **A 64px border-box heading is tighter than today's ~65px content box** →
  Content that previously fit in 16px + content + 16px now has 63px of interior
  height. Action buttons are 32-36px tall, so there is headroom, but a heading
  with an unusually tall child (a badge stack, a two-line title) could clip.
  → No current screen does this; if one appears, the fix is a shorter child,
  not a variable-height heading.
- **The migration is compiler-driven, which is a strength and a trap** →
  Removing `sticky`/`noMargin`/`type`, renaming `size`, and deleting
  `page-heading.tsx` make every stale site a type or resolution error, so the
  compiler enumerates the work. But typecheck cannot see that a screen was
  given the *wrong* width. → The fluid/standard/none assignment per screen is
  enumerated explicitly in tasks.md rather than left to judgement during
  implementation.
- **Context adds a re-render path** → Negligible: the value is a single string
  set once per screen and never updated.

## Migration Plan

Single atomic change; there is no runtime flag and no partial state worth
shipping — deleting `page-heading.tsx` means the tree either compiles or does
not. Rollback is `git revert` of the change.

Ordering within the change matters for keeping typecheck useful:
`Container`/types first, then the new `page.tsx`, then call sites, then
settings, then skeletons. Running `npm run typecheck && npm test` after each
group turns the compiler into the migration checklist rather than saving one
large error dump for the end.

## Correction during implementation

**`fullWidth` is kept; `fluid` is added alongside it.**

The decision above ("Fluid replaces `fullWidth` rather than joining it") rested
on the claim that `fullWidth` had zero call sites. That was wrong. The grep
behind it only matched lines containing "Container" or "heading", but these are
multi-line JSX elements where `size="fullWidth"` sits on its own line. Task 1.5's
typecheck found four real consumers:

- `features/bulk-edit/pages/bulk-edit.tsx` — a `PageHeading` whose inner element
  already pads `16px 12px`; adding a 24px gutter would inset its contents 36px.
- `features/system/pages/not-found/not-found.tsx` — sits inside a wrapper that
  already pads `24px 32px`; a gutter would inset it 56px.
- `features/settings/email/pages/edit-template.tsx` and its skeleton — no-ops in
  practice, since their `cssOverride` sets `padding: 12px 103px`, which clobbers
  the size's padding shorthand entirely.

Two of the four genuinely want zero-gutter full width, and none of them is at
page level, so `PageContent`'s `none` is not available to them. The rejected
alternative — keep both sizes — is therefore the correct one: `fullWidth` stays
as full width with no padding, `fluid` is full width with a 24px gutter. This is
also closer to the original request, which asked for a fluid container to be
added, not for an existing one to be replaced.

The "two nearly identical sizes invite picking the wrong one" concern stands but
is outweighed: `fullWidth` has demonstrated consumers that need exactly what it
does.
