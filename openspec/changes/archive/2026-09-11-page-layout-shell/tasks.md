All paths are relative to `resources/app/`. Run every verification step from
that directory. Per CLAUDE.md §0, no browser or dev-server preview is used —
typecheck, tests and lint are the verification, and the visual spot-checks in
group 7 are handed to the user.

## 1. Container widths

- [x] 1.1 In `types/components/common.ts`, add `'fluid'` to `ContainerSize`.
      **Corrected:** the task said to rename `fullWidth` away, but `fullWidth`
      has 4 real call sites (see design.md — Correction during implementation),
      so it is kept and `fluid` is added alongside it.
- [x] 1.2 In `components/ui/container.tsx`, add a `styles.sizes.fluid` entry
      with `maxWidth: '100%'` and
      `padding: ${theme.spacing[0]} ${theme.spacing[6]}`, leaving the existing
      `fullWidth` entry in place. **Corrected** as in 1.1.
- [x] 1.3 Delete the `styles.sizes.xxl` entry — it was never reachable from
      `ContainerSize`. Leave `root`, `scrollable` and `cssOverride` untouched.
- [x] 1.4 Confirm `components/ui/full-page-container.tsx` still compiles
      unchanged (it sets its own `maxWidth` and never names a size).
- [x] 1.5 Verify: `npm run typecheck && npm test`. This is what exposed the
      4 `fullWidth` call sites the planning grep missed. Note the baseline:
      `components/ui/skeleton.tsx(38,37)` already fails typecheck on a clean
      tree (`theme.radius` has an `xxl` that `styles.radii` lacks) — it is
      pre-existing and out of scope, so "typecheck clean" means "no errors
      beyond that one".

## 2. The page shell

- [x] 2.1 In `components/ui/page.tsx`, export
      `PAGE_HEADING_HEIGHT = '64px'` and `PAGE_HEADING_STICKY_TOP = '32px'`
      (the WP admin bar), and declare
      `type PageContainerSize = ContainerSize | 'none'`.
- [x] 2.2 Add a context carrying `containerSize?: PageContainerSize`, plus an
      internal hook that resolves an own-prop value first and falls back to the
      context value.
- [x] 2.3 Rewrite `Page` as a named export keeping its current `minHeight` prop
      and `forwardRef`, adding `containerSize` and providing it through the
      context.
- [x] 2.4 Move `PageHeading` into `page.tsx` as a named export, carrying over
      `hasBack`, `backIcon`, `onBack`, `leftIcon`, `actions`, `children`,
      `buttonProps`, `cssOverride` and `style` behaviour verbatim.
- [x] 2.5 Collapse the heading's wrapper to a single always-sticky variant:
      `height: PAGE_HEADING_HEIGHT`, `boxSizing: 'border-box'`, `padding: 0`,
      `position: 'sticky'`, `top: PAGE_HEADING_STICKY_TOP`, the existing bottom
      border, background and `zIndex: theme.zIndex.sticky`. Delete the `sticky`
      and `noMargin` props and the `wrapperSticky` / `wrapperNoMargin` /
      non-sticky margin styles.
- [x] 2.6 Rename the heading's `size` prop to `containerSize` and resolve it
      through the hook from 2.2.
- [x] 2.7 Widen `text` from `string` to `ReactNode` and render
      `typeof text === 'string' ? <Text variant="heading5">{text}</Text> : text`
      — see design.md for why a node cannot go through the `Text` wrapper.
- [x] 2.8 Remove the dead `type?: HeadingType` prop (declared, never read) and
      drop the now-unused `HeadingType` import if nothing else in the file uses
      it.
- [x] 2.9 Add `PageContent` as a named export taking `containerSize` and
      `cssOverride`: render children bare when the resolved size is `'none'`,
      otherwise wrap them in `<Container size={...}>`.
- [x] 2.10 Delete `components/ui/page-heading.tsx`.
- [x] 2.11 Verify: `npm run typecheck && npm test`. Produced 30 expected
      errors across 20 files — every un-migrated call site.
      **Note:** `components/ui/page-heading.tsx` carried one uncommitted local
      change on this branch (back button `variant="ghost"` → `"tertiary"`);
      it is preserved in the new `page.tsx` before the file was deleted. That list is the checklist
      for groups 3–6; do not proceed past it, work through it.

## 3. Listing screens — fluid width

For each: wrap in `<Page containerSize="fluid">`, drop the `sticky` prop, and
replace the page-level `<Container>` with `<PageContent>`. Import
`{ Page, PageHeading, PageContent }` from `@/components/ui/page`.

- [x] 3.1 `features/brands/pages/brands.tsx`
- [x] 3.2 `features/categories/pages/categories.tsx`
- [x] 3.3 `features/collections/pages/collections.tsx`
- [x] 3.4 `features/coupons/pages/coupons.tsx`
- [x] 3.5 `features/customers/pages/customers.tsx`
- [x] 3.6 `features/customers/pages/customer-groups/customer-groups.tsx`
- [x] 3.7 `features/inventory/pages/inventory.tsx`
- [x] 3.8 `features/orders/pages/orders.tsx`
- [x] 3.9 `features/products/pages/products.tsx`
- [x] 3.10 `features/tags/pages/tags.tsx`
- [x] 3.11 Verify: `npm run typecheck && npm test` — all 10 clean.
      `customer-groups.tsx` also carried a `type="primary"` removed per 2.8.
      One test suite (`features/bulk-edit/tests/pages/bulk-edit-table.test.tsx`)
      fails to resolve `page-heading` until group 5 migrates `bulk-edit.tsx`

## 4. Form and detail screens — standard width

Same conversion, but declare no `containerSize` so both regions keep today's
1024px column.

- [x] 4.1 `features/products/components/product-form/product-form.tsx`.
      **Corrected:** the task said to put the shell inside `<Form>`, but `Form`
      is a pure context provider that renders no DOM, and five already-converted
      files use `<Page><Form>…</Form></Page>`. Followed that instead, for
      consistency. `PageHeading` still sits inside `Form`, which is what its
      submit buttons need.
- [x] 4.2 `features/coupons/pages/edit-coupon/edit-coupon.tsx` — also remove
      the `type="primary"` prop deleted in 2.8.
- [x] 4.3 `features/inventory/pages/edit-inventory.tsx`
- [x] 4.4 `features/orders/pages/order-create.tsx`
- [x] 4.5 `features/orders/pages/order-details.tsx`
- [x] 4.6 `features/collections/pages/collection-details.tsx` — **note:** this
      page uses `<Container size="md">`, not the default, so it declares
      `containerSize="md"` rather than nothing. It was the only group-4 page
      with a non-default page-level width.
- [x] 4.7 `features/customers/pages/customer-details/customer-details.tsx`
- [x] 4.8 `features/system/pages/coming-soon/coming-soon.tsx`
- [x] 4.9 Verify: `npm run typecheck && npm test`

## 5. Full-bleed screens and the settings shell

- [x] 5.1 `features/bulk-edit/pages/bulk-edit.tsx`: wrap in `<Page>`, put the
      existing `FullPageContainer` and its background inside
      `<PageContent containerSize="none">` unchanged.
- [x] 5.2 `features/settings/pages/settings-layout.tsx`: wrap in
      `<Page containerSize="none">` with `<PageHeading containerSize="lg">`
      overriding it, and move the existing `centerRow`/`row` markup inside
      `<PageContent>` unchanged.
- [x] 5.3 In the same file, delete `SETTINGS_HEADER_HEIGHT` and
      `SETTINGS_HEADER_STICKY_TOP` (and the comment deriving 65px from
      `PageHeading`'s internals); import `PAGE_HEADING_HEIGHT` and
      `PAGE_HEADING_STICKY_TOP` instead and set `styles.sidebar.top` to
      `calc(${PAGE_HEADING_STICKY_TOP} + ${PAGE_HEADING_HEIGHT})`.
- [x] 5.4 Delete the `style={{ height: '32px' }}` override on the settings
      heading.
- [x] 5.5 Leave every `<Container size="sm">` inside `features/settings/*/pages/`
      and their skeletons alone — those sit below the page level. Confirm none
      were touched.
- [x] 5.6 Verify: `npm run typecheck && npm test`

## 6. Loading placeholders

- [x] 6.1 Rewrite `components/skeletons/page-heading-skeleton.tsx` to render a
      real `<PageHeading>` — the title `Skeleton` passed as `text`, the back
      `Skeleton` via `buttonProps.children`, `children` forwarded as `actions`
      — and accept a `containerSize` prop it passes straight through.
- [x] 6.2 Move its `[data-slot="skeleton"]` background rule onto the heading's
      `cssOverride`, and delete the duplicated `wrapper`, `heading`,
      `headingHasBack`, `title` and `actions` styles.
- [x] 6.3 **Corrected:** the task assumed all five mirror standard-width screens
      and that a size had to be passed down. In fact
      `collection-details-skeleton` already hardcoded `size="md"` to match its
      page. Rather than passing a size through, all five now use
      `PageContent`, so three of them inherit their parent `Page`'s width and
      the two standalone ones inherit their own — the width is stated once per
      screen instead of twice. Files:
      that mirror a converted screen: `features/orders/skeletons/order-details-skeleton.tsx`,
      `features/products/skeletons/product-form-skeleton.tsx`,
      `features/collections/skeletons/collection-details-skeleton.tsx`,
      `features/customers/skeletons/customer-details-skeleton.tsx`,
      `features/inventory/skeletons/edit-inventory-skeleton.tsx` — all five
      mirror standard-width screens, so none declares a size.
- [x] 6.4 Verify: `npm run typecheck && npm test`

## 7. Final verification

- [x] 7.1 `npm run typecheck && npm test` — 848/848 tests pass; typecheck clean
      apart from the pre-existing `components/ui/skeleton.tsx(38,37)` error that
      also fails on a clean tree.
- [x] 7.2 `npm run lint` — the new `@/components/ui/page` imports did cause
      `simple-import-sort` violations in the three skeletons where the import
      replaced `@/components/ui/container` in place; autofixed those three only.
      Four errors remain in files this change never touched
      (`creatable-select-field.tsx`, `media-gallery.tsx`, `skeleton.tsx`,
      `right-panel/brand.tsx`) — pre-existing, left alone.
- [x] 7.3 knip: no file or export is orphaned by removing `page-heading.tsx`.
      One new entry, verified by diffing knip against a stashed clean tree:
      `HeadingType` is now reported as an unused export. It still has a real
      importer (`components/ui/heading.tsx`), but knip already counted that
      file as unused before this change, so dropping the dead `type` prop in
      2.8 left `HeadingType` reachable only from dead code. Left in place —
      removing it would mean deleting a pre-existing unused file that is
      outside this change's scope.
- [x] 7.4 Confirm no `import PageHeading from '@/components/ui/page-heading'`
      remains: `grep -rn "ui/page-heading" resources/app/` returns nothing.
- [x] 7.5 Hand the user these visual checks, which cannot be done here:
      (a) the settings sidebar's sticky offset, the one intentional position
      change (~33px higher than before); (b) any listing screen, confirming
      full width with 24px gutters; (c) any of the nine previously non-sticky
      screens — brands, categories, collections, coupons, customers,
      customer-groups, orders, tags, coming-soon — confirming the new pinned
      bordered heading reads correctly now that its 32px top margin is gone.
