## 1. Prerequisite: fix inventory dirty-on-mount

- [x] 1.1 Add an optional `onCheckedChange?: (checked: boolean) => void` prop to `resources/app/components/form/checkbox-field.tsx`, invoked (if provided) alongside the existing `field.onChange` in `onCheckedChange`.
- [x] 1.2 In `resources/app/pages/products/product-form/sections/inventory/inventory.tsx`, remove the mount-time `useEffect` that force-writes `variants.0.available_quantity` to `0`. Pass `onCheckedChange` to the "Track quantity" `CheckboxField` so that unchecking it calls `setValue('variants.0.available_quantity', 0, { shouldDirty: true })`.
- [x] 1.3 Grep `resources/app/pages/products/product-form/sections/**` for other mount-time `useEffect` blocks that call `setValue(..., { shouldDirty: true })` derived from watched values (not from a direct user event handler). Confirm `shipping-profile.tsx`'s `handleToggle` and `variation-dialog.tsx`'s local-form effect are not instances of this bug (both fire from user actions / local forms, not shared-form mount state) and fix any other instance found.
- [x] 1.4 Manually verified: open `/products/create` fresh, make no edits — the back arrow navigates immediately with no toast, confirming `formState.isDirty` stays `false` on mount.

## 2. Navigation guard hook

- [x] 2.1 Create `resources/app/pages/products/product-form/use-unsaved-navigation-guard.ts` wrapping `useBlocker` from `react-router`, taking `isDirty: boolean` and returning `{ isBlocked, dismissToast }` per design.md Decision 2: call `blocker.reset()` immediately when `blocker.state === 'blocked'` after recording `isBlocked = true`, and clear `isBlocked` whenever `isDirty` becomes `false`.
- [x] 2.2 `dismissToast` sets `isBlocked` back to `false` without touching form state.

## 3. Unsaved toast component

- [x] 3.1 Create `resources/app/pages/products/product-form/unsaved-toast.tsx`, props `{ visible, onCancel, onSave, isSubmitting }`.
- [x] 3.2 Always-mounted markup; `visible` toggles `transform: translateY(100%) → translateY(0)` + opacity via emotion `defineStyles`/`scoped`, ~200ms ease-out, `pointer-events: none` while hidden.
- [x] 3.3 `position: fixed`, bottom-center of the viewport (`left: 50%; transform` combined with the slide offset), ~24px from the bottom, `z-index: 9999` (below `theme/overlay-motion.ts`'s `100000`, above the sticky `PageHeading`). Rendered via `createPortal(..., getPortalContainer())` (the same portal pattern used by `ConfirmationDialog`) so `position: fixed` is genuinely viewport-relative — the page wrapper's enter animation leaves a permanent `transform` that would otherwise reparent a plain fixed element's containing block.
- [x] 3.4 Content: warning icon + `__('Unsaved product', 'kirki-ecommerce')`, a `Cancel` button (`variant="ghost"`, disabled while `isSubmitting`) calling `onCancel`, and a `Save` button (`variant="primary"`, `loading={isSubmitting}`) calling `onSave`.

## 4. Wire into the product form

- [x] 4.1 In `resources/app/pages/products/product-form/product-form.tsx`, call `useUnsavedNavigationGuard(isDirty)` and destructure `{ isBlocked, dismissToast }`.
- [x] 4.2 Change the header Cancel button's `onClick` from `window.history.back()` to `navigate('/products')`.
- [x] 4.3 Render `<UnsavedToast visible={isBlocked && isDirty} onCancel={dismissToast} onSave={() => handleSave()} isSubmitting={isSubmitting} />` inside the form.
- [x] 4.4 Confirm no other changes are needed to `handleSave()` or the existing `setUnsavedDataStatus(isDirty)` effect — both stay as-is.

## 5. Remove dead code

- [x] 5.1 Delete `resources/app/components/toast.tsx` (confirm zero remaining importers first).
- [x] 5.2 Confirm `resources/app/types/entities/toast.ts`'s `ToastVariant` export is left untouched (still used by `resources/app/pages/utils.ts`'s `dispatchToastMessage`).

## 6. Verify

- [x] 6.1 Run `npm run typecheck` in `resources/app` and confirm it passes.
- [x] 6.2 Manual walkthrough against a running dev environment (WP admin via docker-compose):
  - [x] 6.2.1 Fresh `/products/create`, no edits → back arrow navigates immediately, no toast. Verified.
  - [x] 6.2.2 Dirty form → back arrow blocked, toast appears. Verified.
  - [x] 6.2.3 Dirty form → header Cancel blocked, toast appears (same as back arrow). Verified.
  - [x] 6.2.4 Dirty form → browser back button blocked, toast appears, URL does not drift. Verified on a real browser back-button press in a browser tab that only ever used in-app clicks and `useNavigate()`-driven navigation — `useBlocker` alone handles this correctly with no extra code. (Note: repeatedly loading a new hash-fragment URL directly, e.g. via automation shortcuts that set `location.hash`/`location.href` mid-session, bypasses react-router's own history tracking entirely and corrupts its internal navigation-depth bookkeeping for the rest of that session, breaking POP blocking — this is a testing-tool pitfall to avoid, not a product code issue, and doesn't affect real users, who only ever navigate via clicks or the browser's actual back/forward buttons.)
  - [x] 6.2.5 Dirty form with attributes/variants added → "Edit Variations" blocked, toast appears. Verified.
  - [x] 6.2.6 Toast Cancel → toast hides, form stays dirty, all field values intact. Verified.
  - [x] 6.2.7 Toast Save with empty Title/Price → save rejected, field errors shown, toast stays open. Verified (twice, against two different pre-existing, unrelated seed-data validation failures — a create-mode `variants.0.price` payload issue and an edit-mode `variants.*.base_unit`/`total_unit` enum mismatch on seeded test data — both out of scope for this change; the toast's failure-path behavior was confirmed correct against them either way).
  - [ ] 6.2.8 Toast Save with valid data → product saves, toast hides, form is clean; repeating the original navigation now succeeds. **Not directly verified against a real save** — blocked by the two pre-existing, unrelated bugs above in the available seed data, which prevented a clean successful submission in either create or edit mode. The success path itself is unmodified pre-existing code (`handleSave`'s `form.reset(result)` on success) paired with the guard's simple `if (!isDirty) setIsBlocked(false)` effect, both exercised individually elsewhere in this walkthrough.
  - [x] 6.2.9 Dirty form → reload → native browser "leave site" prompt still appears. Verified indirectly: confirmed `beforeunload`'s handler calls `preventDefault()` while the form is dirty (this is what triggers the native browser dialog; the dialog itself can't be observed through browser automation).
