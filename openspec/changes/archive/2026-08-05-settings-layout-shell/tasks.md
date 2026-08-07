## 1. Shell primitives

- [x] 1.1 Create `pages/settings/settings-page-header.tsx` — shared icon + title header with optional `onBack`, built from `Card` + `cardStyles.navbarCard` + `Text weight="semibold"` so it matches the `PageNavbar` it replaces
- [x] 1.2 Create `pages/settings/settings-layout/settings-nav-item.tsx` — single-line row (icon + label, no `subHeader`), porting the active/hover CSS from `settings-item.tsx` (brand left-bar, chevron, blue label, first/middle/last radii)
- [x] 1.3 Create `pages/settings/settings-layout/settings-sidebar.tsx` — searchbox + the three sections, lifting `settingsSections`, `filterSettingsItems` and `isSettingsRouteActive` out of `settings.tsx`; keep the "No settings found" empty state
- [x] 1.4 Create `pages/settings/settings-layout/use-settings-page-actions.ts` — registers `{ isDirty, isSaving, onSave, onDiscard }` with the layout in an effect and clears the registration on unmount
- [x] 1.5 Run `npm run typecheck && npm test` from `resources/app/`

## 2. The layout route

- [x] 2.1 Create `pages/settings/settings-layout/settings-layout.tsx`: sticky `PageHeading` (`text="Settings"`, `size="lg"`, `sticky`) whose `actions` render Discard (ghost) + Save (primary, `loading={isSaving}`) only when the registered state reports `isDirty`
- [x] 2.2 Add the two-column body with **no outer `Container`** — a centred, shrink-wrapping flex row: sidebar 276px (`flexShrink: 0`, `position: sticky`, `alignSelf: 'flex-start'`, top offset = 32px + the sticky header height) + a content column that takes its width from the page's own `Container`, `gap={6}`
- [x] 2.3 Hold `registerActions` in layout state; consume the root outlet context with `useOutletContext()` and re-expose `confirmAction` alongside `registerActions` via `<Outlet context={...} />` so the 16 existing consumers keep working unchanged
- [x] 2.4 Add the `useBlocker` guard — block on `isDirty && !isSaving`, auto-reset when clean, surface `components/modal/confirmation-dialog.tsx` in its default variant; confirm calls `blocker.proceed()`, dismiss calls `blocker.reset()`
- [x] 2.5 Leave `components/animated-page/animated-page.tsx` **unchanged** — verify no edit crept into it, and that the shell still renders correctly given it remounts on every settings navigation
- [x] 2.6 Run `npm run typecheck && npm test` from `resources/app/`

## 3. Routing and nav config

- [x] 3.1 Restructure `routes.tsx`: `/settings` becomes a layout route with `withSuspense(SettingsLayout)`, an index child `<Navigate to="/settings/general" replace />`, and all 10 top-level pages plus all 7 drill-downs as children with relative paths
- [x] 3.2 Rename `/settings/essential/color/:id` and `/settings/essential/list/:id` to `essentials/...`, and update the `navigate()` call sites that build those URLs
- [x] 3.3 Create `pages/settings/advanced-settings/advanced-settings.tsx` and `pages/settings/license-settings/license-settings.tsx` — `SettingsPageHeader` + a single `Card` of visibly-placeholder content; register their routes
- [x] 3.4 Update `pages/settings/utils.tsx`: give Advanced and License real links and drop `disabled: true`; add a Checkout entry to `businessOperationSettings`
- [x] 3.5 Delete `pages/settings/settings.tsx` and `pages/settings/settings-item.tsx`
- [x] 3.6 Run `npm run typecheck && npm test` from `resources/app/`

## 4. Migrate the form-backed settings pages

For each: delete its `<PageHeading>` block, replace `<PageNavbar>` with `<SettingsPageHeader>`, delete the local `hasUnsavedData` / `handleBackButton` / `confirmAction` plumbing, and call `useSettingsPageActions({ isDirty, isSaving, onSave: form.handleSubmit(handleSaveData), onDiscard: handleDiscardData })`.

**Keep** the page's existing `<Container size="sm">` — the page owns its own width now (design decision 6). **Keep** the existing `useEffect(() => setUnsavedDataStatus(isDirty), [isDirty])` line so `beforeunload` still fires.

- [x] 4.1 `general-settings/general-settings.tsx` (its `handleDiscardData` also restores `savedLogoUrlRef` — keep that)
- [x] 4.2 `products-settings/products-settings.tsx`
- [x] 4.3 `shipping-settings/shipping-settings.tsx`
- [x] 4.4 `multi-currency-settings/multi-currency-settings.tsx`
- [x] 4.5 `tax-settings/tax-settings.tsx` (keep `handleSaveFromRegions` passed down to `<TaxRegions />`)
- [x] 4.6 `email-settings/email-settings.tsx`
- [x] 4.7 `checkout-settings/checkout-settings.tsx`
- [x] 4.8 Run `npm run typecheck && npm test` from `resources/app/`

## 5. Migrate the remaining settings pages

- [x] 5.1 `payment-settings/payment-settings.tsx` and `essential-settings/essential-settings.tsx` — no form, so no registration; header edits only
- [x] 5.2 `shipping-settings/shipping-zone/shipping-zone.tsx` and `shipping-settings/shipping-method/shipping-delivery-method.tsx` — these track dirty manually via `setUnsavedDataStatus(true)` rather than RHF `isDirty`; register that manual flag, and give `SettingsPageHeader` an `onBack` that plainly navigates to the parent (the blocker handles the guard)
- [x] 5.3 `tax-settings/tax-region/general-edit-region.tsx` and `tax-settings/tax-region/edit-region-eu.tsx` — standard RHF pages with a back affordance
- [x] 5.4 `essential-settings/variation-library/color-variation.tsx` and `list-variation.tsx` — no page-level save; header edits only, preserving their `rightAction` content
- [x] 5.5 `email-settings/edit-template.tsx` — delete its own `PageHeading` and keep its `<Container size="fullWidth">` so the two-pane editor stays wide inside the shell; confirm the result reads as deliberate next to the fixed-width header
- [x] 5.6 Run `npm run typecheck && npm test` from `resources/app/`

## 6. Verification

- [x] 6.1 Run `npm run typecheck && npm test` from `resources/app/` and confirm both pass clean
- [x] 6.2 In the browser: `/settings` redirects to `/settings/general`; reloading `/settings/tax` returns to Tax with Tax active in the sidebar. Verified live (hash confirmed `#/settings/general` after redirect; `/settings/tax` reload restored Tax with the sidebar item active).
- [x] 6.3 **Superseded by 6.11 below** — the shell's remount-on-every-click was reported by the user as a real layout-shift defect, not accepted behavior. Fixed; see 6.11.
- [x] 6.4 Confirm the sidebar stays in view under the sticky header. Verified via computed styles: `aside` is `position: sticky; top: 97px` (= 32px WP admin bar + 65px header), matching the design's calc exactly.
- [x] 6.5 Edit a field on General → Save/Discard appear in the top bar → click another sidebar item → the unsaved-changes dialog appears; dismiss keeps you put with changes intact, confirm ("Leave") navigates and discards. Repeated blocked attempt re-shows the dialog. All verified live in the browser. Browser back/forward and the native reload prompt were not separately exercised (same `useBlocker`/`beforeunload` mechanism already covers them structurally; not re-tested live due to automation tooling constraints).
- [x] 6.6 Saved-then-clean navigation verified: after discarding General's changes via "Leave" and landing on Shipping, no Save button shows (confirmed via `[data-active]` DOM check finding exactly one active item and no stale actions rendered) — the stale-flag leak is gone.
- [x] 6.7 Opened both an EU tax region (`/settings/tax/region/eu`) and a country tax region (`/settings/tax/region/BD`) — sidebar stays visible with Tax highlighted, back button (verified via ref-click) returns to `/settings/tax`.
- [x] 6.8 Essentials, Advanced, License and Checkout all verified live with no Save button and no console errors. **Payments could not be verified** — blocked by a pre-existing, unrelated bug (`paymentGatewayList?.map is not a function` in `payment-gateway.tsx`, a data-shape mismatch from the payment gateway service/API, not touched by this change). Flagged for separate follow-up, not fixed.
- [x] 6.9 Standard pages confirmed at the expected width with Save aligned to the content column (screenshot-verified on General with the sticky bar's Save button trailing edge aligned with the content card below it); `email-settings/edit-template.tsx` confirmed rendering wide (extending well past the sidebar's standard partner width) without being clamped by the shell.
- [x] 6.10 **Superseded** — `components/animated-page/` is no longer untouched; see 6.11. `git diff --stat` now shows a settings-scoped key change there, not zero changes.
- [x] 6.11 **Post-verification fix (user-reported layout shift)**: changed `animated-page.tsx` to key on `/settings` (constant) instead of full pathname when `pathname.startsWith('/settings')`, so `SettingsLayout` — sidebar included — mounts once instead of remounting on every settings navigation; every other route's key is untouched (still the full pathname). Added a per-navigation `key={pathname}` animated wrapper around `SettingsLayout`'s own content `<Outlet>` only (not the `<aside>`), reusing the same `pageEnterKeyframes`. Verified live: marked the `<aside>` DOM node before navigating, then confirmed `sameNode: true` across General → Shipping → Tax. `npm run typecheck && npm test` pass clean.
- [x] 6.12 **Post-verification fix (user-reported first-load shrink)**: the content pane had no width floor, so it sized to whatever content it currently held — on first load, the bare "Loading ..." text — then snapped wider once real content replaced it. Added `min-width: 600px` to `SettingsLayout`'s `.contentPane` style (a floor, not a cap — `edit-template.tsx`'s wider `fullWidth` Container still grows past it). Verified live via computed style (`getComputedStyle(pane).minWidth === '600px'`) and a fresh navigation with no visible narrowing. `npm run typecheck && npm test` pass clean.

**Incidental fixes made during verification** (pre-existing bugs unrelated to this change, blocking route verification, fixed with minimal one-token defensive patches):
- `tax-settings/tax-region/tax-region.tsx`: `item?.states.length` → `item?.states?.length ?? 0` (crashed `/settings/tax` on reload whenever a region lacked a `states` array).
- `tax-settings/tax-region/vat-collection/vat-collection.tsx`: `region?.states.find(...)` → `region?.states?.find(...)` (crashed `/settings/tax/region/eu` for the same reason).

**Known unresolved pre-existing bug** (not fixed, flagged only): `payment-settings/payment-gateway.tsx` crashes on `/settings/payments` because `paymentGatewayList` from `usePaymentGatewaysQuery()` is not an array in this dev environment's current data/API response shape. Unrelated to the settings layout shell; needs its own investigation into `services/payment.ts` / the backend endpoint.
