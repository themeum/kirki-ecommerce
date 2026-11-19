## 1. Sheet API and layout

- [x] 1.1 In `components/ui/sheet.tsx`, replace `floatable?: { storageKey }` with `floating` plus `storageKey` (discriminated union type) on the Sheet root; call `useSheetFloat(floating ? storageKey : undefined)` and provide the context only when `floating` is true.
- [x] 1.2 Remove the dock and close buttons from SheetContent; give `styles.content` `padding: spacing[4]` and `gap: spacing[4]`.
- [x] 1.3 Rebuild SheetHeader as a flex row with `justify-content: space-between`: a title group (Move icon when float is enabled, then the children in a column) and an action group (dock button only while floating on a right sheet, then the Close button). Remove all absolute positions and the padding overrides (`closeButton`, `dockButton`, `moveIcon`, `draggableHeader` padding).
- [x] 1.4 Remove padding and border from `styles.header` and `styles.footer`.
- [x] 1.5 Add and export `SheetSeparator` (wraps `Separator` with `negativeMargin={16}`).
- [x] 1.6 Set the floating `maxHeight` to `min(720px, calc(100vh - FLOAT_MARGIN * 2))`, with `720` as a named constant.
- [x] 1.7 Update `components/ui/sheet.test.tsx`: use `floating storageKey`; wrap the controlled test's title in a SheetHeader; make `dragHeader` target `[data-draggable]`; add tests that the Close and dock buttons are in the header and that SheetSeparator renders.
- [x] 1.8 Run `npm run typecheck && npm test` in `resources/app/`. _(Ran after group 2: the callers used `floatable` until then, so the full typecheck could only pass after they moved to the new prop.)_

## 2. Callers

- [x] 2.1 `features/home/components/customize-home-sheet.tsx`: use `floating storageKey={SHEET_STORAGE_KEY}`, add `SheetSeparator` after the header and before the footer, and remove the body `padding`.
- [x] 2.2 `features/analytics/components/customize-sheet.tsx`: same changes as 2.1.
- [x] 2.3 Update the `customize-home-sheet` and `customize-sheet` tests if they break on the new layout. _(No change needed: both suites pass unchanged.)_
- [x] 2.4 Run `npm run typecheck && npm test` in `resources/app/`, and ESLint on the changed files. _(Typecheck and ESLint pass. 2340/2341 tests pass; the one failure, `first-sale-card.test.tsx`, also fails on `dev` without this change.)_

## 3. Hand-off

- [x] 3.1 Ask the user to check the docked and floating sheets visually (header alignment, separators, scrollbar position, 720px limit). Do not use a browser preview.
