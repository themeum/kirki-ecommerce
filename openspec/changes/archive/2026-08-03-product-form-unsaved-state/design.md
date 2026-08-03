## Context

See proposal.md - Why. Relevant existing pieces:

- The product form ([resources/app/pages/products/product-form/product-form.tsx](../../../resources/app/pages/products/product-form/product-form.tsx)) already computes `form.formState.isDirty` and feeds it into `libs/unsaved-store.ts`, which `floating-components/unsaved-tracker.tsx` uses to register a `beforeunload` handler. That handler already covers reload/tab-close and the WP admin sidebar (`window.location.href` navigations) correctly.
- The same tracker also exposes a `confirmAction()` helper (via Outlet context) backed by `ConfirmationDialog`, used by 12 settings pages for their own back buttons. It only fires when a page voluntarily calls it — it cannot intercept `navigate()` calls, browser back, or any other in-app exit it isn't wired into.
- Routing is `react-router` v7's data router (`createHashRouter`, [routes.tsx](../../../resources/app/routes.tsx)), which supports `useBlocker` for intercepting all in-app navigation attempts (PUSH and POP) from a component rendered under a route.
- `formState.isDirty` is not currently trustworthy: [inventory.tsx](../../../resources/app/pages/products/product-form/sections/inventory/inventory.tsx) has a mount-time effect that force-writes `available_quantity` whenever tracking is off, which differs from the default value and marks a freshly-loaded, untouched form dirty.

## Goals / Non-Goals

**Goals:**
- Intercept all four in-app exits from the product form while it is dirty, and surface a single consistent toast instead of letting navigation proceed silently.
- Make `isDirty` an accurate signal before building anything on top of it.
- Keep the blast radius to the product form; do not change behavior for any other form in the app.

**Non-Goals:**
- No "discard and leave" affordance. Reload remains the only way to abandon changes without saving, and it already shows the native browser prompt.
- No attempt to intercept the WP admin sidebar or `beforeunload` with a custom UI — those are structurally native-only and are explicitly left as-is.
- No generalization of this pattern to the settings pages' `confirmAction`/`ConfirmationDialog` flow. That mechanism is untouched.
- No new test framework. This repo has no frontend test runner; adding one is a separate decision.

## Decisions

**1. `useBlocker`, scoped inside `product-form.tsx`, not the shared `unsaved-tracker.tsx` layout.**
The blocker needs router-level access to intercept POP (browser back) as well as PUSH, which `confirmAction()` structurally cannot do. It could live in the shared layout to cover every route, but that would silently change behavior for the 12 settings pages that currently use the dialog-based flow — and the toast this change specs has no discard path, which would strand settings users who currently rely on `confirmAction`'s "leave anyway" behavior. Keeping the hook local to the product form (as a small `useUnsavedNavigationGuard` wrapper) confines the change to what was asked for; promoting it to the shared layout later is a small, deliberate follow-up, not a byproduct of this change.

**2. `blocker.reset()` is called immediately when a block occurs.**
`useBlocker`'s `blocked` state must be explicitly cleared with `reset()` or the blocker stops intercepting further attempts, and for POP navigations `reset()` is also what restores the history entry so the URL doesn't drift out of sync with the rendered page. Resetting immediately turns the blocker into a one-shot detector: the toast's visibility is then derived purely from local UI state (`isBlocked && isDirty`), not from holding the router in a blocked state while the toast is open. This keeps the component tree simple — no `blocker.proceed()`/`blocker.state` branching to reason about in the render path — at the cost of not being able to "resume" the original navigation automatically after a save (see Decision 4).

**3. A new purpose-built toast component, not `sonner`.**
`sonner` (already used for transient success/error toasts via `toast.success/error`) is an imperative, queue-based, auto-dismissing notification system. What this design calls for is a persistent, state-driven action bar with two buttons that must never auto-dismiss and must reflect submission state. Driving that through an imperative `toast.custom()` call from an effect, keyed off boolean state, is a worse fit than a plain `{visible && ...}`-style component — it invites duplicate/stale toast instances and fights the library's dismissal model. The existing dead `components/toast.tsx` was considered and rejected for revival: its API (Undo + Close) and animation direction (slide down from top) don't match this toast's actions or placement, and reusing half of it while rewriting the rest isn't meaningfully cheaper than a new ~small component. It is deleted as dead code in this change instead.

**4. Save does not auto-resume the original navigation.**
Because the blocker is reset immediately (Decision 2), there is no pending-navigation reference to resume even if we wanted to. The alternative — remembering "the merchant tried to go to `/products`" and firing that navigation after a successful save — was rejected because create mode's `onSubmit` already performs its own post-save `navigate('/products/' + id)` ([create-product.tsx](../../../resources/app/pages/products/create-product/create-product.tsx)); auto-resuming a second, different navigation would race it. Requiring the merchant to repeat their action after a successful save is a minor extra click, not a race condition.

**5. Inventory dirty-on-mount fix: move the zeroing into the checkbox's `onChange`.**
The alternative of switching the guard's dirty check from `formState.isDirty` to a manual deep-comparison against `initialValues` was considered and rejected: it would need to run on every keystroke across a large nested form, and it would mask the underlying defect (a real product's stored `available_quantity` is currently zeroed out from under it whenever tracking is off, independent of this feature) instead of fixing it. Moving the `setValue` call out of the mount effect and into `CheckboxField`'s change handler (via a new optional `onCheckedChange` passthrough) makes the zeroing a response to an actual user action, which is also the more correct place for it regardless of this change.

## Risks / Trade-offs

- **No discard path** → a merchant who opens the form, makes one unwanted edit, and wants out has no button for that; their only recourse is a reload (native prompt). Accepted for this iteration; a "Discard" action is a natural, additive follow-up if it's requested later.
- **Header Cancel and the back arrow become behaviorally identical** once Cancel switches from `history.back()` to `navigate('/products')` and both go through the same blocker. Two controls with the same effect is mildly redundant but low-risk, and it removes a latent bug where `history.back()` on a deep-linked `/products/create` could exit the SPA entirely.
- **`useBlocker` only guards navigation initiated through the router.** Any future in-app exit added to the product form that bypasses `navigate()`/history (e.g. a raw `window.location` assignment) would silently skip this guard. Mitigation: this is already true of the codebase's WP-sidebar handler and is called out explicitly as a non-goal rather than hidden.
- **Fixing the inventory mount effect changes existing edit-page behavior**: an existing product with a stored `available_quantity` and tracking off will no longer have it silently zeroed on load. This is a bug fix, not a regression, but it's worth flagging as an observable behavior change outside the immediate feature.

## Migration Plan

No data migration. Deploys as a normal frontend change; `npm run typecheck` gates the build. No feature flag — the guard is unconditional for the product form once merged, consistent with it being a straightforward safety fix rather than a risky UX experiment.
