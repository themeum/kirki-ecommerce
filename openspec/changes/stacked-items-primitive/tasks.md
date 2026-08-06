## 1. `StackedItems` primitive

- [x] 1.1 Create `resources/app/components/ui/stacked-items.tsx`. `StackedItems`: standalone
  container (`forwardRef`, `cssOverride`, own `defineStyles` for border/`theme.radius.md`/
  `overflow: hidden`, `role="list"`), rendering `ItemGroup` (from `@/components/ui/item`)
  internally — no `Card`/`CardContent`. Holds `openId: string | null` state, provides it via a
  React context.
- [x] 1.2 `StackedItem`: `forwardRef`, required `id: string` prop, `cssOverride`, renders `Item`
  internally with `size="sm"` hardcoded and `role="listitem"`. Own CSS: `&:not(:last-of-type)`
  separator border, `&:first-of-type`/`&:last-of-type` explicit corner radius, and the
  hover-reveal rules ported from `group-option-card.tsx`'s current `styles.row` (absolutely
  positioned `[data-action-group="true"]` at `opacity:0`/`pointer-events:none`, revealed by
  `:hover`, `:focus-within`, `&[data-actions-open="true"]`; `[data-right-text="true"]` set to
  `visibility:hidden` on the same three triggers). Provides a nested per-row context scoped to its
  `id`; reads its own open state from that context to stamp `data-actions-open`.
- [x] 1.3 Export `useStackedItem()` returning `{ isOpen, setOpen }` for the calling row's `id`, for
  use by a nested `DropdownButton`'s `onOptionToggle`.
- [x] 1.4 `StackedItemMedia`, `StackedItemContent`, `StackedItemTitle`, `StackedItemActions`: real
  `forwardRef` components (not re-exports) rendering `ItemMedia`/`ItemContent`/`ItemTitle`/
  `ItemActions` internally. No `Description`/`Header`/`Footer` variants.
- [x] 1.5 Run `npm run typecheck && npm test` from `resources/app/`.

## 2. Migrate the 5 plain call sites (no kebab menu)

- [x] 2.1 `schema-profile.tsx`: replace `<GroupOptionCard dataArr={schemaProfileList}
  handleDeleteItem=... handleEditItem=... />` with `<StackedItems>` wrapping a `.map()` over
  `schemaProfileList` producing `<StackedItem id={...}>` rows — icon → `StackedItemMedia`,
  name/subText/badge1/Default badge/Inactive badge → `StackedItemContent`/`StackedItemTitle` +
  `Badge`, edit/delete `Button`s in `ActionGroup` inside `StackedItemActions`. Preserve the
  existing empty-state branch (`schemaProfileList.length` check → `EmptyState`, unchanged).
  **Correction:** `badge1`/`subText` were never actually rendered by the pre-refactor
  `GroupOptionCard` at any of these 5 sites (only `is_default`/`is_base`/`is_enabled===false`
  badges and `subText` where a site sets it were live) — matched that exact prior behavior
  instead of the task wording's broader "badge1" mention; `schema-profile.tsx` only needed the
  `is_default` → "Default" badge.
- [x] 2.2 `variation-library.tsx`: same pattern for `attributeListArr`, delete + edit handlers.
- [x] 2.3 `shipping-profile.tsx`: same pattern for `shippingProfileList`, delete + edit handlers;
  keep its existing `EmptyState` usage, `useMemo`, and optimistic-delete logic untouched — only
  the `GroupOptionCard` → `StackedItems`/`StackedItem` row markup changes.
- [x] 2.4 `shipping-method.tsx`: same pattern for `shippingMethodListWithIcon`, delete + edit
  handlers. Preserved `is_enabled === false` → "Inactive" badge (this type does carry
  `is_enabled`, unlike the other 4 plain sites). Left `rightText` unrendered, matching current
  `GroupOptionCard` behavior — out of scope here, same as `badge1` above.
- [x] 2.5 `tax-profile.tsx`: same pattern for `taxProfileList`, delete + edit handlers.
- [x] 2.6 Run `npm run typecheck && npm test` from `resources/app/`. 218/218 tests pass, clean
  typecheck.

## 3. Migrate the 2 kebab-menu call sites

- [x] 3.1 `shipping-box.tsx`: replace `<GroupOptionCard dataArr={shippingBoxList}
  handleEditItem=... handleMoreOption handleAction=... />` with `<StackedItems>` +
  `.map()` → `<StackedItem id={...}>` rows; edit button plus `DropdownButton` (using
  `getActionArray`) inside `StackedItemActions`, wired to `useStackedItem()`'s `setOpen` via
  `onOptionToggle`, `onOptionSelect` calling the existing `handleAction`.
  **Correction:** `useStackedItem()` can't be called inline inside the page component's own
  `.map()` — the hook count per component instance would change whenever the list length changes
  (e.g. a delete), violating Rules of Hooks. Extracted a small local `ShippingBoxRowActions`
  component (own module-scope function, not exported) that calls the hook, matching the same
  need in 3.2. Also added a `shippingBoxList.length > 0` guard around `<StackedItems>` — the old
  `GroupOptionCard` returned `null` internally for an empty `dataArr`, and this call site has no
  empty-state branch of its own, so without the guard an empty list would now render an empty
  bordered shell instead of nothing.
- [x] 3.2 `available-currency-list.tsx`: same pattern for `currencyList`, toggle + `DropdownButton`
  (`getActionArray`) wired the same way, via a local `CurrencyRowActions` component for the same
  Rules-of-Hooks reason as 3.1. **Correction:** left `rightIcon`/`rightText` unrendered — kept
  strict behavior parity with the pre-refactor `GroupOptionCard` instead of guessing new visual
  placement; flagged to the user as a pre-existing dead field they may want to wire up separately.
- [x] 3.3 Run `npm run typecheck && npm test` from `resources/app/`. 218/218 tests pass, clean
  typecheck.

## 4. Migrate the multi-instance email sections

- [x] 4.1 `customer-email.tsx`: migrate both `GroupOptionCard` instances (order emails, user
  emails) to `StackedItems`/`StackedItem`, toggle + edit handlers, preserving each section's
  existing surrounding `HeaderActionsCard`/`Card` structure untouched. Added a file-local
  `EmailRow` component (both accordions render the identical name/Inactive-badge/toggle/edit
  shape) — scoped to this one file, not a cross-site helper, so it doesn't reopen the
  shared-row-builder question settled for the 11 call sites overall. Guarded each
  `<StackedItems>` with an `.length > 0` check (neither `orderEmails` nor `userEmails` had an
  empty-state branch of their own; `GroupOptionCard` used to no-op on an empty `dataArr`).
- [x] 4.2 `admin-email.tsx`: migrate all three `GroupOptionCard` instances (order, inventory, user
  emails) the same way, same file-local `EmailRow` pattern.
- [x] 4.3 Run `npm run typecheck && npm test` from `resources/app/`. 218/218 tests pass, clean
  typecheck.

## 5. `shipping-career.tsx` dead-branch swap

- [x] 5.1 Replace `<GroupOptionCard />` with `<StackedItems />` (no children) in the unreachable
  `hasShippingCareers` branch. Do not change `hasShippingCareers`, the `onAdd` stub, or any other
  logic in this file.
- [x] 5.2 Run `npm run typecheck && npm test` from `resources/app/`. 218/218 tests pass, clean
  typecheck.

## 6. Preview page rename and cleanup

- [x] 6.1 Rename `resources/app/preview-pages/group-option-card-preview.tsx` to
  `resources/app/preview-pages/stacked-items-preview.tsx`, rename the exported component to
  `StackedItemsPreview`, and rewrite its body to compose `StackedItems`/`StackedItem` directly
  (same 3-row sample data, toggle/delete/edit handlers logged to console as today).
- [x] 6.2 Update the two importers: `resources/app/tryouts.tsx` (also renamed the Tryouts card
  title "Group Option Card" → "Stacked Items") and
  `resources/app/preview-pages/option-accordion-preview.tsx` — new import path and component
  name.
- [x] 6.3 Delete `resources/app/components/group-option-card.tsx`.
- [x] 6.4 Grep the repo for any remaining `group-option-card` or `GroupOptionCard` reference and
  resolve each hit. Zero hits.
- [x] 6.5 Run `npm run typecheck && npm test` from `resources/app/`. 218/218 tests pass, clean
  typecheck.

## 7. Verification

- [ ] 7.1 Start the dev server, open each of the 11 migrated sections in the browser: Schema
  Profile, Variation Library, Shipping Profiles, Shipping Methods, Tax Profiles, Shipping Boxes,
  Admin Email (3 lists), Customer Email (2 lists), Available Currencies.
- [ ] 7.2 For each, confirm parity with pre-change behavior: rows render with correct icon/name/
  subText/badges, actions stay hidden until hover/focus and reveal with zero layout shift, an open
  kebab menu (Shipping Boxes, Available Currencies) keeps its row's actions visible, a disabled
  row shows its "Inactive" badge at rest, and the first/last row corners are rounded with a full
  (uncut) focus outline when tabbed to.
- [ ] 7.3 Confirm `stacked-items-preview.tsx` renders correctly via `tryouts.tsx`.
- [ ] 7.4 Confirm `shipping-career.tsx` still renders its empty-state placeholder (the
  `hasShippingCareers` branch stays unreachable, so this is the only branch to check).
- [ ] 7.5 Final `npm run typecheck && npm test` from `resources/app/`.
