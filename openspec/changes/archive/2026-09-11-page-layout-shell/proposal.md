## Why

Every admin screen assembles its own page layout by hand: a standalone
`PageHeading`, followed by a bare `Container`, sometimes wrapped in `Page` and
sometimes not. Nothing ties the three together, so they have drifted — the
heading is sticky on 11 screens and not on 9, its height is an emergent
~65px that `settings-layout.tsx` had to reverse-engineer into a hardcoded
constant, and wide listing tables are squeezed into the same 1024px column as
a product form because the full-width container option has no padding and no
callers.

## What Changes

- Introduce a single page shell exported from `components/ui/page.tsx`:
  `Page`, `PageHeading`, and a new `PageContent`. **BREAKING** — these become
  named exports, replacing today's default `Page` export, and
  `components/ui/page-heading.tsx` is deleted.
- **BREAKING** — the page heading is always sticky and always exactly 64px
  tall (border-box). The `sticky` and `noMargin` props are removed along with
  the non-sticky margin variant. Nine screens that render a non-sticky heading
  today gain the sticky bordered treatment.
- **BREAKING** — `PageHeading`'s `size` prop is renamed `containerSize`, and
  its unused `type` prop is removed (it was declared but never read).
- **BREAKING** — the `Container` size `fullWidth` is renamed `fluid` and gains
  24px horizontal gutters. It had no call sites, so nothing regresses.
- A page's container size is declared once on `Page` and inherited by both the
  heading and the content, with a per-child override and a `none` value that
  suppresses the container entirely for full-bleed screens.
- All 20 page call sites migrate: listing pages become fluid, form and detail
  pages keep today's 1024px column, and `bulk-edit` and `settings-layout` opt
  out with `none`.
- `settings-layout.tsx` stops hardcoding the heading's dimensions and imports
  the exported constants instead.
- `page-heading-skeleton.tsx` is rebuilt on top of the real `PageHeading`
  rather than re-implementing its styles.

## Capabilities

### New Capabilities

- `page-layout-shell`: the composition contract for an admin screen — how a
  page declares its heading, its content region, and the width both are
  measured against; the heading's fixed height and sticky behaviour; and the
  available container widths including the full-width and no-container
  options.

### Modified Capabilities

<!-- None. No existing spec in openspec/specs/ states requirements about the
     page heading, the page container, or their composition.
     `settings-navigation-shell` constrains the settings sidebar's width and
     content floor but says nothing about its sticky offset, which is the only
     settings behaviour this change touches. -->

## Impact

- `resources/app/components/ui/page.tsx` — rewritten as the three-part shell.
- `resources/app/components/ui/page-heading.tsx` — deleted; its 20 importers
  move to the new named export.
- `resources/app/components/ui/container.tsx` and
  `resources/app/types/components/common.ts` — `ContainerSize` gains `fluid`
  and loses `fullWidth`; the unreachable `xxl` style entry is dropped.
- `resources/app/features/*/pages/*.tsx` — the 20 page-level call sites.
  Sub-page `Container` usages inside the settings content pane are untouched.
- `resources/app/features/settings/pages/settings-layout.tsx` — its sticky
  sidebar offset is now derived from the heading's exported height, correcting
  a pre-existing off-by-33px error.
- `resources/app/components/skeletons/page-heading-skeleton.tsx` and the five
  page skeletons that mirror a converted page.
- No backend, REST, schema, or data-fetching surface is affected.
