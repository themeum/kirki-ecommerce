## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **Routing**: `routes.tsx` is a single `createHashRouter` with one layout route (`UnsavedChangesController`) and ~40 flat children. All 17 settings routes are flat siblings. react-router **v7** (`react-router`, not `react-router-dom`); `useBlocker` is available and already used once in `pages/products/product-form/use-unsaved-navigation-guard.ts`.
- **The only `Outlet` in the codebase** is in `components/animated-page/animated-page.tsx`, wrapped in `<div key={pathname}>`. It passes `{ confirmAction }` as outlet context to **16** existing `useOutletContext` call sites, each re-declaring its own local context type.
- **Unsaved state** lives in `libs/unsaved-store.ts` — a module-level boolean with `useSyncExternalStore`. It is never reset on unmount, so a stale `true` survives page changes. `floating-components/unsaved-tracker.tsx` reads it for `beforeunload` and for `confirmAction`'s dialog.
- **Every settings page** follows an identical shape: `useForm` + `zodResolver`, `form.reset(...)` on query data, `useEffect(() => setUnsavedDataStatus(isDirty), [isDirty])`, a sticky `PageHeading` whose `actions` are gated on the **global** `useUnsavedStatus()`, a `Container size="sm"`, and a `PageNavbar` with a `handleBackButton` that calls `confirmAction`.
- Two pages (`shipping-zone.tsx`, `shipping-delivery-method.tsx`) do **not** use RHF `isDirty` — they call `setUnsavedDataStatus(true)` manually on each edit.
- `Container` sizes are `sm 600 / md 752 / lg 900 / xl 1024 / fullWidth`. `theme.spacing[6]` is 24px.

## Goals / Non-Goals

**Goals:**

- One shell owns the settings chrome — header, Save/Discard, sidebar, width, unsaved guard — so a page contributes only its own content and a save handler.
- Make the unsaved signal per-page and self-clearing, without changing the shared `beforeunload` infrastructure the rest of the app depends on.
- Keep the 16 existing `useOutletContext` consumers working untouched.

**Non-Goals:**

- Refactoring the settings forms themselves, their schemas, or their services.
- Unifying the two unsaved mechanisms app-wide (the product form's toast-based `useBlocker` stays as it is).
- Replacing the global `unsaved-store` — it remains the source for `beforeunload`.

## Decisions

### 1. Nested route tree with an index redirect, not a rendered index page

`/settings` becomes a layout route whose children are the 10 top-level pages and the 7 drill-downs; the index child is `<Navigate to="/settings/general" replace />`.

*Why:* the hash URL already encodes the selected page, so reload-persistence is free and there is no second source of truth to desync. `replace` keeps `/settings` out of history so back doesn't bounce off the redirect.

*Alternatives:* persisting the last-visited route in `localStorage` (a second source of truth that can point at a deleted route and behaves oddly across tabs); rendering an empty state at `/settings` (an unspecified screen not present in the design).

`/settings/essential/color/:id` and `/settings/essential/list/:id` are renamed to `essentials/…`. The existing active-item check is a prefix match against the nav item's link (`/settings/essentials`), and the singular path silently fails it.

### 2. Children register save actions through a nested outlet context

The layout holds `{ isDirty, isSaving, onSave, onDiscard } | null` in state and exposes `registerActions` via `<Outlet context={...} />`. A `use-settings-page-actions.ts` hook registers in an effect and **clears on unmount**.

*Why:* the header spans both columns, so the buttons cannot live in the page's own JSX. Context is type-safe and needs no DOM coordination; unmount cleanup is exactly what fixes the stale-dirty leak. Pages with no save flow simply never call the hook.

The layout consumes the root context with `useOutletContext()` and re-exposes `confirmAction` alongside `registerActions`, so the 16 existing consumers keep working with no edit.

*Alternatives:* a React portal into a ref'd slot (couples to DOM/ref timing and each page re-implements the same two buttons); leaving each page's own `PageHeading` in place (the Save bar would sit inside the right column instead of spanning both, contradicting the design).

Registration is `useEffect`-based, so it lands one frame after paint. That is fine for buttons that only appear when dirty — but it is why the **page header does not use this mechanism** (decision 3).

### 3. The right-pane header is plain JSX in each page, not registered

A shared `settings-page-header.tsx` (icon + title + optional `onBack`) is rendered by each page as the first element of its content — a 1:1 replacement for the `PageNavbar` those pages already render.

*Why:* an effect-registered title paints empty for one frame on **every** navigation, a visible flicker on the most prominent element of the page. Plain JSX has no such window, and drill-downs can pass dynamic titles (a zone name) without extra plumbing.

*Alternative:* deriving icon/title in the layout by matching `pathname` against the nav config — zero per-page code, but the 7 drill-downs would inherit the parent's title unless overridden anyway.

### 4. One `useBlocker` in the layout replaces per-page `confirmAction` calls

Modelled on `use-unsaved-navigation-guard.ts`: block when `isDirty && !isSaving`, `blocker.proceed()` / `blocker.reset()`, auto-reset when the form goes clean. Surfaced through the existing `components/modal/confirmation-dialog.tsx` in its default "Unsaved changes / Leave anyway?" variant.

*Why:* a blocker catches *every* in-app navigation — sidebar clicks, browser back/forward, leaving settings — where the current `confirmAction` is opt-in and only wired to each page's own back arrow. Once the nav is a persistent sidebar, per-click guards would have to be added anyway, and would still miss browser back.

*Alternative:* wrapping each sidebar item's `onClick` in `confirmAction` — smallest diff, but browser back and leaving settings stay unguarded.

The dialog is used rather than the product form's toast so settings stays visually consistent with itself.

### 5. Two dirty signals, deliberately

The layout's **registered** `isDirty` drives the buttons and the blocker. Pages keep calling `setUnsavedDataStatus(isDirty)` so `unsaved-tracker.tsx`'s `beforeunload` keeps firing.

*Why:* the registered signal is correct and self-clearing; the global store is leaky but is what `beforeunload` reads. Keeping both means the leak is fixed where it is visible (buttons, blocker) with **zero** change to shared infrastructure used by the rest of the app.

*Alternative:* moving `beforeunload` into the settings layout and dropping the store for settings — cleaner in isolation, but diverges from the controller every other route still uses.

`shipping-zone.tsx` and `shipping-delivery-method.tsx` have no RHF `isDirty`; they register the manual flag they already track.

### 6. The shell fixes the sidebar; the page fixes its own content width

The layout renders **no outer `Container`**. The two-column row is centred and shrink-wraps: sidebar `276px` (`flexShrink: 0`) + `theme.spacing[6]` (24px) gap + a content column that takes whatever width the page's own `Container` resolves to. Pages **keep** their existing `<Container size="sm">` (600px), so the common case is 276 + 24 + 600 = **900px**, matching the design.

The sticky `PageHeading` is `size="lg"` (900px) — fixed, not following the page. That is what aligns Save with the content column's trailing edge for every page using the standard width.

*Why:* leaving width ownership with the page is what lets an outlier render wider without the shell clamping it — `email-settings/edit-template.tsx` is a `size="fullWidth"` two-pane editor that would be unusable at 600px. No new `ContainerSize` token and no magic `maxWidth` override in a page file either way.

*Alternative:* the layout wrapping the row in `Container size="lg"` with the content column flexing to fill. Simpler and guarantees a uniform 900px, but it clamps every page to 600px, so the wide outlier stays cramped.

*Alternative:* the page publishing a width through the same registration as its save actions, so the header follows it. Consistent at any width, but the header would visibly resize a frame after paint on every navigation — the same effect-timing objection as decision 3.

The sidebar is `position: sticky`, `alignSelf: 'flex-start'`, offset at 32px + the sticky header's height so the header (opaque, `zIndex: 100`) never covers the search box.

### 7. `AnimatedPage` is settings-scoped, not left untouched

**Superseded — see Correction during implementation below.** `components/animated-page/animated-page.tsx` now keys its wrapper on `pathname.startsWith('/settings') ? '/settings' : pathname` instead of the raw `pathname`. For any settings route the key stays constant, so the `<Outlet>` it wraps — which renders `SettingsLayout` itself — never unmounts across settings navigation. Every other route in the app keys on the full pathname exactly as before, so this changes nothing outside `/settings/*`.

`SettingsLayout` now wraps only its inner `<Outlet>` (not the `<aside>`) in a `<div key={pathname}>` carrying the same `pageEnterKeyframes` animation `AnimatedPage` uses elsewhere. That div's key *is* the full pathname, so it changes on every settings navigation and plays the enter transition — but only the content pane, never the sidebar or header.

*Consequence:* the sidebar is now a genuinely persistent component — same DOM node, same React state — across all settings navigation, drill-downs included. The search box no longer resets. Only the right-hand content animates.

*Why not the original global fix:* the first-considered alternative was keying `AnimatedPage` on the first path segment for *every* route, which would have the same settings benefit but also silently stop the enter animation for `/products/1` → `/products/2` and similar detail-to-detail navigation elsewhere. Scoping the check to `/settings` avoids that: the `startsWith('/settings')` line is a plain, visible conditional in the one component that needs it, not a blanket behavioral change to the rest of the app.

## Risks / Trade-offs

- ~~**The shell re-animates on every sidebar click** (decision 7)~~ — resolved; see Correction during implementation below. The sidebar is now a persistent, non-remounting component.
- **17 near-identical page edits** → mechanical but broad; a page missed halfway leaves a duplicate sticky "Settings" bar rendered inside the right column, which is visibly broken rather than subtly wrong. Mitigated by migrating all of them in this change and by `npm run typecheck` catching removed props.
- **Page-owned width can break the row** (decision 6) → with no outer `Container`, a page that renders no `Container` at all, or an over-wide one, will blow the two-column row past the header's 900px and misalign Save. Mitigated by leaving every page's existing `<Container size="sm">` in place rather than touching it, so the default is correct by inertia and only a deliberate override changes it.
- **Two dirty signals can desync** (decision 5) → a page that registers `isDirty` but forgets `setUnsavedDataStatus` loses only its reload warning, not its in-app guard. Mitigated by keeping the existing `useEffect(() => setUnsavedDataStatus(isDirty), [isDirty])` line in every page rather than removing it.
- **`useBlocker` and `confirmAction` both active in settings** → if a page keeps a `confirmAction`-wrapped back handler *and* the layout blocks, the merchant sees two prompts. Mitigated by deleting the per-page `handleBackButton`/`confirmAction` plumbing as part of each page's migration; the drill-down back affordance becomes a plain `navigate` and lets the blocker handle it.
- **Wide drill-downs beside a fixed-width header** → `email-settings/edit-template.tsx` keeps its `size="fullWidth"` Container under decision 6, so its content extends past the 900px sticky header and Save no longer aligns with its trailing edge. Accepted: a usable editor matters more than header alignment on one outlier route. Confirm it looks deliberate rather than broken during verification.
- **Placeholder Advanced/License pages** → making a previously-disabled row navigable sets an expectation the feature exists. Mitigated by making the placeholder content visibly a placeholder.

## Correction during implementation

Browser verification surfaced three pre-existing bugs, unrelated to this change, in files this change does not otherwise touch:

- `tax-settings/tax-region/tax-region.tsx` and `tax-settings/tax-region/vat-collection/vat-collection.tsx` both did `x?.states.length` / `x?.states.find(...)` — optional-chaining the parent but not `states` itself — and crashed the whole route (React Router's default `ErrorBoundary`) whenever a tax region lacked a `states` array. This blocked live verification of `/settings/tax` and `/settings/tax/region/eu` outright, so both were fixed with the obvious matching `?.` addition (see `tasks.md` §6 for the exact diffs). Low-risk, single-token fixes; not part of the original file list.
- `payment-settings/payment-gateway.tsx` crashes on `/settings/payments` with `paymentGatewayList?.map is not a function` — `usePaymentGatewaysQuery()` is returning something other than an array in this dev environment. This is a data-shape/service issue, not a one-token fix, so it was **not** touched. `/settings/payments` could not be visually verified this session as a result; the page's own code (no `PageHeading`, no registered actions, `SettingsPageHeader` with no `rightAction`) was verified by reading, matching every other no-save page's pattern.

**Post-verification correction (user-reported):** live testing surfaced a real layout-shift defect that the plan had knowingly accepted rather than actually resolved — clicking between settings pages was destroying and rebuilding the entire shell (sidebar included), not just the content pane, because `AnimatedPage`'s wrapper directly wraps `SettingsLayout` and was keyed on the full pathname. The user reported this directly ("only the right side contents will be animated and the layout will be intact"), which is decision 7 as originally planned in this change's first draft, before an earlier round of feedback asked to leave `AnimatedPage` untouched entirely. Decision 7 above is rewritten to reflect the corrected, settings-scoped approach: `AnimatedPage` now keys on `/settings` (constant) for any settings route instead of the full pathname, so `SettingsLayout` mounts once; `SettingsLayout` wraps only its content `<Outlet>` (not the sidebar) in its own per-navigation animated `key={pathname}` div. Verified live: marking the `<aside>` DOM node before navigating and re-checking after confirmed the identical node survives General → Shipping → Tax navigation. No other route's animation behavior changed. The `settings-navigation-shell` spec's "Sidebar search resets on navigation" scenario was replaced with "Sidebar search survives navigation" to match.

**Second post-verification correction (user-reported):** the user then reported a related but distinct shift — on first entering a settings page (or whenever a page's data query is still in flight), the content column visibly narrows to fit the bare "Loading ..." placeholder text, then pops out to its full width once the page's data resolves and its real content (Cards, form fields) renders. This falls directly out of decision 6: the content pane has no width of its own, only a `min-width: 0` flex-shrink allowance, so it sizes to whatever its child's *current* content demands — sparse loading text included. Fixed by giving `SettingsLayout`'s `.contentPane` a `min-width: 600px` (the standard settings content width). This is a floor, not a cap, so it does not conflict with decision 6: `email-settings/edit-template.tsx`'s wider `fullWidth` Container still grows past it exactly as before; only the *narrow* end of the range is now clamped. Verified live via computed style (`min-width: 600px` on the content pane) and a fresh navigation showing no visible narrowing.
