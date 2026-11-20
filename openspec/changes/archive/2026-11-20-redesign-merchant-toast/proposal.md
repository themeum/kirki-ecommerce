## Why

The merchant app shows toasts with sonner's default "rich colors" UI. That UI does not match the Kirki eCommerce design system, and it has no visible countdown, no loading state, and no Undo or Retry action. The design team made a new toast design (`Kirki Toast Simulator.html`, section "Toast (final Kirki design)") with a timing matrix. We want all toasts in the merchant app to use it.

## What Changes

- Add a shared toast for the merchant app. It has 4 variants: success, info, warning, and error. Each variant has its own filled icon (24 px). The variant colour is used only on the icon, the spinner, and the countdown ring. The text and background colours are the same for all variants. The toast is 330 px wide, and its height is auto.
- Add a close button (24 px) with a circular countdown ring. The ring goes from 100% to 0% anticlockwise. A click on the close button closes the toast at once.
- Add a loading state to each variant. The spinner (in the variant colour) replaces the icon. A loading toast has no close button and does not close by itself.
- Add auto-dismiss timing from the matrix: success 4 s (max 6 s), info 5 s (max 8 s), warning 7 s (max 10 s), and a toast with Undo 8 s (max 10 s). For a longer message, the time is max(default, 1.5 s + 0.25 s per word), and it does not go above the max. An error toast stays until the merchant closes it. A duration that the caller gives is used exactly.
- Pause all visible toast timers only while the mouse pointer is on the toast stack. The timers continue with the time they have left.
- Add optional Undo and Retry actions on any variant. A Retry that gives back a Promise puts the same toast into its loading state until the Promise ends.
- Add an API to show, update, and close toasts, and a Promise form (loading → success or error).
- Keep today's stacking, position (bottom right), swipe, and exit motion.
- Move all current toast calls to the new API: `toastMutationError`, `toastMutationSuccess`, `dispatchToastMessage`, and the direct sonner calls. Lint stops new direct imports of `toast` from `sonner`.
- `dispatchToastMessage` stops sending 2000 ms when the caller gives no duration. Its toasts then use the matrix (this makes them stay longer).
- Remove the old sonner close-button styles from the shell styles.

## Capabilities

### New Capabilities

- `toast-notifications`: The merchant app toast: variants, layout, loading state, countdown and pause rules, Undo and Retry actions, and the API that features use to show, update, and close toasts.

### Modified Capabilities

None. The specs that say "shows the message in a toast" (`user-facing-error-status`, `store-setup-checklist`, `tax-region-strategies`, `order-selling-location-validation`) do not change. They continue to get a toast, now with the new design.

## Impact

- Code (all in `resources/app/`): a new shared toast module in `components/ui/toast/`, `app.tsx` (`<Toaster>` setup), `services/helpers.ts`, `utils/common.ts`, `utils/index.ts`, `theme/shell-styles.ts`, `eslint.config.js`, and 6 feature files that import `toast` from `sonner` (shipping, bulk edit, products, orders).
- Tests: new Vitest tests for the duration rule, the countdown and pause logic, and the toast API. `services/error-toast.test.ts` mocks the new module instead of `sonner`.
- Dependencies: no new package. `sonner` 2.0.7 stays for stacking.
- Backward compatibility: frontend only, in the merchant admin app. No PHP, REST, database, stored data, or JS global changes. The storefront does not use this toast.
