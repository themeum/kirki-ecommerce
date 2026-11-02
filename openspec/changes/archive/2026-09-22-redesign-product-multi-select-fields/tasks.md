## 0. Reconcile the working tree

The previous design's implementation is on disk, uncommitted. These tasks state what survives it, so nothing is rebuilt and nothing stale is left behind.

- [x] 0.1 Delete `resources/app/components/ui/chip-overflow-row.tsx`, `chip-overflow-utils.ts` and `chip-overflow-row.test.tsx`. The measured one-line rule they implement is replaced by a caller-supplied cap.
- [x] 0.2 Keep, unchanged: the deletion of `right-panel/categories/`, `product-add-category-form.ts` + its test, and `category-list-skeleton.tsx`; the `createLabel` / `addItemLabel` prop removals across call sites; and the `shouldFilter={!onSearchChange}` fix in `multi-select.tsx`, which the categories field still depends on.
- [x] 0.3 Keep `resources/app/features/categories/components/fields/categories-field.tsx` as the starting point for group 2 — its `flattenTree`, `filterCategoryTree` wiring and form-ref mapping all still apply; its chips, create flow and `renderOption` do not.
- [x] 0.4 Revert `features/categories/components/category-add-edit-dialog.tsx` to HEAD. The `onCreated` prop was added for a create flow this design replaces, and no caller will remain.
- [x] 0.5 Rewrite `resources/app/components/ui/multi-select.test.tsx` against the new shape as group 1 proceeds — the existing file asserts a trigger button and a covering panel, neither of which survives.

## 1. MultiSelect: the token box

- [x] 1.1 Restructure `resources/app/components/ui/multi-select.tsx` back to `Command > Popover > PopoverAnchor(box) + PopoverContent(list + create footer)`, with `CommandPrimitive.Input` living in the box. `git show HEAD:resources/app/components/ui/multi-select.tsx` is the reference for the anchor, the `onInteractOutside` field guard and the `onOpenAutoFocus`/`onCloseAutoFocus` preventDefaults.
- [x] 1.2 Replace `ChipField` with an own token container: flex, wrapping, chips then the input, input `flex: 1; min-width: 80px`. Clicking the container focuses the input. Carry the existing `error` and `disabled` states onto it. Do not touch `chip-field.tsx`.
- [x] 1.3 Render chips inside the box with the `X` remove icon (not `Minus`), keeping the `chipsGuard` wrapper whose `onKeyDown` stops propagation so Enter on a remove button is not eaten by cmdk.
- [x] 1.4 Add `maxVisibleChips?: number`. Over the cap, render that many chips then a link-styled `+N more` control with no remove control; activating it shows every chip and swaps in `Show less` after the last one. Reset the expanded state when the selection falls back within the cap. Stop keydown propagation on this control too.
- [x] 1.5 Replace the option row's `Check` span with `Checkbox` from `@/components/ui/checkbox`, `tabIndex={-1}`, `aria-hidden`, `pointerEvents: 'none'`; the row stays the click target.
- [x] 1.6 Move the create row out of `CommandList` into a bordered-off footer inside `PopoverContent`. Label it `sprintf(__('Add "%s"', 'kirki-ecommerce'), trimmedSearch)` when there is an unmatched query. Add `createEmptyLabel?: string` for the standing label shown when the input is empty; with no such prop, render no footer when the input is empty.
- [x] 1.7 Restore `CommandEmpty` unconditionally — the pinned footer no longer needs the space, so a no-match query shows the empty message above the create row.
- [x] 1.8 Handle Enter fallthrough: when the query matches no option and a create row is offered, Enter creates. When the query matches at least one option, cmdk's active-item selection stands and nothing is created. — Corrected: cmdk does not emit `aria-activedescendant` in this setup (probed it: the attribute is absent), so the signal is the option row cmdk marks `aria-selected="true"`, read through a ref on the popover content. Same rule, a signal that actually exists.
- [x] 1.9 Add the input's own `onKeyDown`: Backspace on an empty input removes the last chip; comma on a creatable field commits the trimmed text and calls `preventDefault` so no comma lands in the value.
- [x] 1.10 Add `panel?: ReactNode`. While present, `PopoverContent` renders it in place of the list and footer, the popover stays open, and a wrapper stops keydown propagation so cmdk does not act on the content's keys.
- [x] 1.11 Add `selectedPlaceholder?: string`, used for the input's placeholder once the selection is non-empty.
- [x] 1.12 Change the `onCreate` resolve path to clear the search and keep the panel open. Leave the reject path (open, text intact) and the no-promise path (hand off) as they are. Confirm choosing an option also clears the search and keeps the panel open. — Corrected: the no-promise path no longer closes the panel. The spec's hand-off scenario says the list "gives way", not that the panel closes, and closing would fight the `panel` slot that replaces it. A handler that opens a dialog still closes the popover, because Radix closes it on focus moving outside.
- [x] 1.13 Delete the now-dead `triggerHeight` state, the trigger button, `styles.trigger`/`triggerError`/`placeholder`/`searchRow`, and the `sideOffset={-triggerHeight}`; the panel drops below with a small gap again.
- [x] 1.14 Write `multi-select.test.tsx` covering: chips render inside the box; clicking the box focuses the input; checkbox reflects selection; choosing keeps the panel open with the search cleared; the create footer reads the typed text; the footer is absent on an empty input without `createEmptyLabel` and present with it; the empty message shows on a no-match query; Enter creates only when nothing matched; Backspace on an empty input removes the last chip; comma commits; `maxVisibleChips` caps, expands and collapses; Enter on a chip's remove button removes it without selecting an option.

## 2. Categories field

- [x] 2.1 In `features/categories/components/fields/categories-field.tsx`, change `flattenTree` to carry the full ancestor `path` (array of names) alongside `depth`, in place of `parentName`.
- [x] 2.2 `renderOption`: indent by `depth * 16px` while `search` is empty; while it is not, render unindented with the full path and a chevron separator ahead of the name, the path subdued.
- [x] 2.3 `renderChip`: the full path with chevrons, ancestors subdued and the leaf in the normal colour; a root category shows its bare name. Truncate to the box width with an ellipsis and set the full path as the element's `title`.
- [x] 2.4 Pass `maxVisibleChips={1}` and `selectedPlaceholder={__('Search', 'kirki-ecommerce')}` with the full placeholder as `placeholder`.
- [x] 2.5 Give the option list a fixed max height that scrolls — `CommandList` already ships `maxHeight: 240px` + `overflowY: auto`; confirm it holds here and pass `listCss` only if it does not. — No code needed: `CommandList` already ships `maxHeight: 240px` + `overflowY: auto`, and the panel is width-capped to the trigger, so no `listCss` was passed.
- [x] 2.6 Build `features/categories/components/fields/category-quick-create.tsx`: name input seeded from the typed text, parent `Select` built from the category list, Cancel and Create. Post through `useCreateCategoryMutation`, map server errors with `applyServerErrors`, keep the form on screen with its text on rejection. — Deliberately not a `<form>`: the panel is portalled out of the product form's DOM but not out of its React tree, so a submit event would bubble into the product form's own handler. Create is a button `onClick`, and Enter is caught on a wrapper because `TextField` takes no key handler.
- [x] 2.7 Wire it: `createEmptyLabel={__('New category', 'kirki-ecommerce')}`, `onCreate` stores the typed name and opens the form, `panel` renders `CategoryQuickCreate` while a create is in progress. On success add the new category to the selection and clear `panel` so the list returns; on cancel clear `panel` and create nothing.
- [x] 2.8 Confirm no cascade: `toggleCategorySelection` must not be imported here, and toggling a parent or child must touch only that one category.
- [x] 2.9 Confirm `CategoriesField` is exported from `features/categories/index.ts` (already added).
- [x] 2.10 Write `categories-field.test.tsx`: rows indent while browsing and show the full path while searching; a nested match survives its ancestors not matching; one chip plus `+N more`; a chip reads the full path; toggling a parent leaves children alone; the create row opens the form seeded with the typed name, and confirming selects the new category.

## 3. Brand

- [x] 3.1 Rewrite `right-panel/brand.tsx` onto `MultiSelect` with `maxVisibleChips={1}` and an `onChange` that keeps only the last chosen option, replacing the `Card` + `Combobox` pair and the separate chosen/unchosen branches.
- [x] 3.2 Render the logo through `Chip`'s `img` slot via `renderChip`, falling back to no image when the brand has none. — Corrected: `Chip`'s `img` slot is not reachable — `MultiSelect` passes a single node into `Chip`'s `text`. The logo is composed inside `renderBrand` instead, which also gives the list rows their logos. Same result, no new prop.
- [x] 3.3 Keep `BrandAddEditPopover` on the create row: `onCreate` seeds the popover name and returns no promise. Keep the existing `brand` form value shape `{ id, name, logo }`.
- [x] 3.4 Remove the now-unused `ActionGroup`, `Image`, `Card`/`CardContent`, `Combobox`, `Minus` and `cardStyles` imports this leaves behind in that file.

## 4. Panel composition

- [x] 4.1 Build `components/ui/collapsible-field.tsx`: renders a link-styled add button until activated, then its children; opens from the start when told the bound value is non-empty, using a `useState` initialiser rather than an effect so clearing the value mid-edit does not collapse it.
- [x] 4.2 In `right-panel/right-panel.tsx`, merge the two field cards into one holding Categories, Brand, Tags, Collections, Ribbon in that order. Leave the status/slug/actions card above it alone.
- [x] 4.3 Wrap Collections in `CollapsibleField` with `+ Add to collection`, seeded open when the product already has collections.
- [x] 4.4 Wrap Ribbon in `CollapsibleField` with `+ Add ribbon`, seeded open when the product already has a ribbon, and give the expanded field a remove control that clears the value and collapses it. — `CollapsibleField` gained `label` / `labelFor` / `onRemove` for the header row. `labelFor="ribbon"` associates it with the input, because `TextField` sets `id={name}` — so no change to `TextField` was needed.
- [x] 4.5 Write `collapsible-field.test.tsx`: collapsed with no value; expands on activation and focuses; starts expanded with a value; clearing the value mid-edit does not collapse it.

## 5. Call-site sweep

Each of these inherits the new box. Read each and confirm it still reads correctly; change only what the new props require.

- [x] 5.1 `features/tags/components/fields/tags-field.tsx` — chips in the box, Enter and comma create, Backspace removes. No prop changes expected.
- [x] 5.2 `features/collections/components/fields/collections-field.tsx` — same.
- [x] 5.3 `features/customers/components/fields/customer-selection-field.tsx` — server-filtered via `onSearchChange`; confirm the caller's list still stands and chips read correctly in-box.
- [x] 5.4 `features/products/components/fields/attribute-values-field.tsx` — colour swatches through `renderChip` now sit on the input's row; confirm the swatch and the `X` do not crowd the input past its minimum width. — No change needed. The swatch comes through `valueType.renderChip`, which `Chip` still renders; chips now sit on the input row, and the input keeps its 80px minimum beside them.
- [x] 5.5 `features/products/components/product-table/filter-popup/categories-filter.tsx` — inside a filter popover; confirm the option list is not clipped by it. — No change needed, and the clipping concern does not arise: `PopoverContent` portals to `getPortalContainer()`, so the option list is never clipped by the filter popover's own box. This was already true before the change.
- [x] 5.6 `components/form/multi-select-field.tsx` and `components/group-select.tsx` — generic wrappers; confirm the `creatable` free-text path still appends on Enter and now on comma. — Corrected: `components/group-select.tsx` is **not** a `MultiSelect` consumer — the phrase only appears in its docstring. The real generic wrapper is `components/form/multi-select-field.tsx`, whose `creatable` path returns no promise, so it appends on Enter and now on comma with no edit.

## 6. Verification

Per CLAUDE.md section 0: no browser preview. Report anything that needs a human eye rather than opening one.

- [x] 6.1 `npm run typecheck` in `resources/app/` — compare against a clean-tree baseline and report any failure that is not pre-existing. — 1 error, `product-form.tsx(59,9)` unused `field`. Identical on a stashed clean tree.
- [x] 6.2 `npm run lint` — same, naming which errors are pre-existing and in which files. — 6 errors in `accordion.tsx`, `product-form.tsx`, `inventory.tsx`, `variant-fields.ts`. Identical count and files on a stashed clean tree; none in this diff.
- [x] 6.3 `npm test` — same, with the before/after passing counts. — Clean tree 1173 passing / 1 failing; with the change 1213 passing / 1 failing. Same single pre-existing failure (`product-form.test.ts`, `committed_quantity`). 40 net new tests. **One change outside this scope was needed:** `vitest.setup.dom.ts`'s sprintf stub only resolved `%s`, so every `%d` rendered verbatim in DOM tests — a latent gap affecting ~12 other files. Its regex now accepts `[sd]`.
- [x] 6.4 Confirm `chip-field.tsx`, `combobox.tsx`, `components/form/categories-dropdown-field.tsx` and `components/ui/category-tree/` are untouched by the diff. — Confirmed by `git status --porcelain`: `chip-field.tsx`, `combobox.tsx`, `categories-dropdown-field.tsx` and `category-tree/` are all unmodified. `category-add-edit-dialog.tsx` is back at HEAD.
- [x] 6.5 Hand to the user for a visual check the two things tests cannot confirm: that the box's height does not jump as chips are added or the panel opens, and that a truncated category path reads sensibly at 320px. — Handed to the user below.
