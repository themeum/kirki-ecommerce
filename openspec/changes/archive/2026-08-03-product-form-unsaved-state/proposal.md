## Why

The product form (`/products/create`, `/products/:id`) can be abandoned with unsaved edits through four in-app exits — the header back arrow, the header Cancel button, the browser back button, and the "Edit Variations" action — and none of them warn the merchant. The app already warns on reload/tab-close via a native `beforeunload` dialog, but nothing stops silent data loss from the in-app paths, which are the common ones. Merchants can lose product edits without any indication anything was wrong.

## What Changes

- Block the four in-app navigation exits (back arrow, header Cancel, browser back, Edit Variations) whenever the product form is dirty, using a `useBlocker` from react-router's data router.
- On block, show a new custom bottom-center slide-in toast ("Unsaved product") with `Cancel` (dismiss the toast, stay on the form) and `Save` (run the existing save flow) actions.
- **BREAKING (internal)**: change the header Cancel button from `window.history.back()` to `navigate('/products')`, so it is guarded identically to the back arrow and no longer risks exiting the SPA on a deep-linked create page.
- Fix a latent bug where `variants.0.available_quantity` is force-set to `0` on every mount of the Inventory section when tracking is off, which marks a freshly-loaded, untouched create form as dirty (`formState.isDirty === true`) before any user interaction — this would otherwise strand merchants behind the new guard with no way to save (empty required fields) or leave (no discard path). The zeroing moves into the tracking checkbox's own change handler.
- Remove `resources/app/components/toast.tsx`, a fully-built custom toast component with zero importers, superseded by both `sonner` (already in use) and the new purpose-built unsaved-toast component.
- No change required to the "Edit Variations" bulk-edit navigation itself — blocking navigation while dirty makes its existing `ids=undefined` bug (from unsaved, id-less variants) unreachable, since `/variants/bulk` is now only reachable from a clean, persisted form.

Explicitly out of scope:
- No "discard changes and leave anyway" affordance is added anywhere in this change — the only way to clear a dirty product form is to save it or reload the page (which still shows the native browser dialog).
- The existing global unsaved-changes mechanism (`libs/unsaved-store.ts`, `unsaved-tracker.tsx`, `ConfirmationDialog`) used by the 12 settings pages is untouched; this change does not migrate or generalize it.
- No frontend test framework is introduced; verification is `tsc --noEmit` plus a manual walkthrough.

## Capabilities

### New Capabilities

- `product-form-unsaved-toast`: the bottom-center slide-in toast that appears when in-app navigation is blocked on a dirty product form, including its visibility rule, actions, and animation behavior.

### Modified Capabilities

- `product-form`: the existing "Unsaved changes tracking" requirement currently states that navigating away from a dirty form shows "the unsaved-changes confirmation" (the shared dialog). This is now inaccurate for the product form specifically — in-app navigation is intercepted by a router blocker and resolved via the new toast, not the shared `ConfirmationDialog`; reload/tab-close and the WP admin sidebar continue to fall back to the native `beforeunload` dialog. This change also adds a requirement that inventory tracking must not dirty the form on mount.

## Impact

- `resources/app/pages/products/product-form/product-form.tsx` — wires the navigation guard, renders the toast, changes header Cancel's handler.
- `resources/app/pages/products/product-form/use-unsaved-navigation-guard.ts` (new) — wraps `useBlocker`.
- `resources/app/pages/products/product-form/unsaved-toast.tsx` (new) — the toast component.
- `resources/app/pages/products/product-form/sections/inventory/inventory.tsx` — moves the `available_quantity` zeroing from a mount-time effect into the tracking checkbox's change handler.
- `resources/app/components/form/checkbox-field.tsx` — adds an optional `onCheckedChange` passthrough prop needed by the inventory fix.
- `resources/app/components/toast.tsx` — deleted (dead code, zero importers).
- `openspec/specs/product-form/spec.md` — modified requirement (delta in this change).
- No backend/API changes. No new dependencies (`react-router` already provides `useBlocker`).
