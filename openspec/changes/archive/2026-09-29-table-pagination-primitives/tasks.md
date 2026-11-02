## 1. Types

- [x] 1.1 In `resources/app/types/components/common.ts`, replace `TableType` with `TableDensity = 'default' | 'compact' | 'wide'`. Leave `TableAlignment` as `'right' | 'center'` — start-aligned stays the absence of a value
- [x] 1.2 Verify: `npm run typecheck && npm test` in `resources/app/` — expect errors only at the `<Table type=…>` call sites, which task group 4 fixes

## 2. Extract the feature-owned `editMode` styles

- [x] 2.1 Create a bulk-edit-local style module (e.g. `features/bulk-edit/pages/bulk-edit-table/bulk-edit-table-styles.ts`) exporting the former `editModes.multiCell` block from `components/ui/table.tsx` verbatim as a plain `CSSObject` — the `data-bulk-cell` selected/fill states, `data-bulk-edge` min/max borders, `data-grabber` drag handle, `data-sticky-cell` sticky column, and the `borderCollapse: 'separate'` / per-cell `minWidth` rules
- [x] 2.2 Create an inventory-local style module exporting the former `editModes.singleCell` block (suppress `tbody tr:hover`, add `tbody td:hover`) as a `CSSObject`
- [x] 2.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Rewrite the table primitives

- [x] 3.1 Rewrite `resources/app/components/ui/table.tsx` with the full part list: `Table`, `TableHeader`, `TableBody`, `TableFooter` (new), `TableRow`, `TableHead`, `TableCell`, `TableCaption` (new). Match the house pattern — `forwardRef`, explicit `displayName`, named exports, module-scope `defineStyles` block at the bottom of the file
- [x] 3.2 Wrap `Table` in a container element with `overflowX: 'auto'` carrying `data-slot="table-container"`. Forward the ref to the `<table>` itself, not the container, so existing ref consumers keep working
- [x] 3.3 Replace the `type` prop with `density`, keying `styles.densities[density]` (`variation`'s padding becomes `compact`)
- [x] 3.4 Remove the `editMode` prop, the `TableEditMode` type and the `styles.editModes` block. Remove the `scrollable` prop — the container from 3.2 supersedes it
- [x] 3.5 Keep `fixed`, `onlyCheckbox`, `alignment`, `active`, `disabled` and their `data-*` attributes (`data-only-checkbox`, `data-disabled`, `data-active`) — these are a public contract that feature styles and `data-sticky-cell` consumers target
- [x] 3.6 Keep the row-actions reveal contract in the base styles: `[data-action-group="true"]` is `visibility: hidden` in cells and becomes visible on `tbody tr:hover` and `tbody tr[data-active="true"]`
- [x] 3.7 Route `cssOverride` through `scopedMerge` on **every** part, including `TableHeader`, `TableBody` and `TableRow` which currently pass a bare `css={cssOverride}` and lose to wp-admin CSS
- [x] 3.8 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Update the 6 affected `<Table>` call sites

- [x] 4.1 `features/brands/components/brand-table/brand-table.tsx:117` and `features/categories/components/category-table/category-table.tsx:117` — `type="variation"` → `density="compact"`
- [x] 4.2 `features/products/components/product-form/sections/variants/variation-table/variation-table.tsx:152` — `type="variation"` → `density="compact"`
- [x] 4.3 `features/customers/pages/customer-groups/customer-group-table.tsx:19` — `type="wide"` → `density="wide"`
- [x] 4.4 `features/bulk-edit/pages/bulk-edit-table/bulk-edit-table.tsx:29` — drop `scrollable editMode="multiCell"`, pass the module from 2.1 as `cssOverride`. Keep the existing `style={{ minWidth: '100vw' }}`
- [x] 4.5 `features/inventory/pages/inventory-table/inventory-table.tsx:67` — drop `editMode="singleCell"`, pass the module from 2.2 as `cssOverride`
- [x] 4.6 Grep feature styles for child/descendant selectors and flex/grid rules that assumed `<table>` is a direct child of its parent — the new container element sits between them. Fix any that break — none found; `Table` consumers use `Card`/`CardContent`/`Flex` wrappers with no `& > table` or similar child selectors
- [x] 4.7 Verify: `npm run typecheck && npm test` in `resources/app/` — a clean typecheck is the proof that no call site still passes a removed prop

## 5. Page-window math

- [x] 5.1 Create `resources/app/utils/pagination.ts` and move `getPageItems(current_page, last_page, siblingCount = 1)` from `components/pagination.tsx:23` into it **verbatim**, along with the `ELLIPSIS` sentinel. Do not rewrite the algorithm — the spec's window scenarios are written against its current behaviour
- [x] 5.2 Have `components/pagination.tsx` import `getPageItems` from the new util instead of declaring it, so the old component keeps working for its 7 remaining consumers
- [x] 5.3 Write `resources/app/utils/pagination.test.ts` covering the spec's window scenarios: all pages shown when they fit; current page near the start (trailing ellipsis only); near the end (leading ellipsis only); in the middle (both ellipses); and a page count in the thousands staying bounded
- [x] 5.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Pagination primitives

- [x] 6.1 Create `resources/app/components/ui/pagination.tsx` with the shadcn v4 part list: `Pagination` (`<nav>` with an `aria-label`), `PaginationContent` (`<ul>`), `PaginationItem` (`<li>`), `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`. Named exports, `displayName` on each part, `defineStyles` at the bottom
- [x] 6.2 Render `PaginationLink` / `PaginationPrevious` / `PaginationNext` as `<button type="button">`, never `<a href>`. `isActive` sets `aria-current="page"` and the active visual treatment
- [x] 6.3 Give every target a `disabled` prop, and mark `PaginationEllipsis` `aria-hidden` with no activatable role
- [x] 6.4 Add `PaginationPageSelect` — the "Page ⌄ of N" jump control — built on the existing `ui/select` primitives plus `ui/text`, reporting the chosen page through the same callback shape as a page target. Keep its page options enumerated inline; Radix only mounts `SelectContent` children when open, so the cost is per-open
- [x] 6.5 Take `cssOverride?: CSSObject` on each part and merge via `scopedMerge` — not the `css?: SerializedStyles` prop the old pagination component used
- [x] 6.6 Write `resources/app/components/ui/pagination.test.tsx`: exactly one target carries `aria-current="page"`; previous is disabled on the first page and next on the last; a `disabled` bar renders all targets inert while staying in the DOM; activating a page target reports that page number; the page-select reports a chosen page
- [x] 6.7 Verify: `npm run typecheck && npm test` in `resources/app/`

## 7. Final verification

- [x] 7.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/`. `simple-import-sort`, `consistent-type-definitions: type`, `curly: all` and `react/jsx-curly-brace-presence` are all `error` and the new files are large enough to trip them
- [x] 7.2 Run `npm run build` in `resources/app/`
- [x] 7.3 **Premise correction:** `npx knip` does *not* flag `components/ui/pagination.tsx` as unused — knip's vitest plugin treats the colocated `pagination.test.tsx` as reachable from its entry set, so every part stays "used" via the test. It instead flags `TableFooter` and `TableCaption` (`components/ui/table.tsx`) as unused, the two brand-new table parts nothing calls yet — the direct analogue of the situation this task anticipated for pagination. No other new unused exports appeared; `bulkEditTableStyles`, `inventoryTableStyles`, `TableDensity`, and the `utils/pagination.ts` exports are all consumed. Did not wire anything in early to "fix" this.
- [x] 7.4 Skipped per project policy (`CLAUDE.md` §0: no browser-based verification in this project). Manual visual check needed by the user in wp-admin: the 3 compact tables and 1 wide table still have their previous padding; the bulk-edit grid's drag-fill selection, grabber handle and sticky first column are intact; the inventory table's per-cell hover still works; row action buttons still appear on row hover; and `product-form/.../variation-table/single-group.tsx`'s hover row — the one call site whose `TableRow cssOverride` now wins where it previously lost — looks correct
