## Context

See proposal.md for why. Current state:

- `app.tsx` mounts sonner 2.0.7 `<Toaster richColors closeButton position="bottom-right">`, with inline styles from the theme. `theme/shell-styles.ts` moves and styles sonner's close button (`TOAST_CLOSE_BUTTON_CLASS` and a `[data-sonner-toast] [data-close-button]` rule).
- Call sites: `services/helpers.ts` (`toastMutationError`, `toastMutationSuccess`, about 206 uses), `utils/common.ts` (`dispatchToastMessage`, which sends `duration = 2000` by default and maps `delete` → success, `default` → plain toast), `utils/index.ts` (copy to clipboard), and 6 feature files that import `toast` from `sonner`: `features/settings/shipping/{pages/shipping-zone.tsx, lib/utils.tsx, components/shipping-method/shipping-method-dialog.tsx}`, `features/bulk-edit/pages/bulk-edit.tsx`, `features/products/hooks/use-product-form.ts`, `features/orders/contexts/order-edit-context.tsx`.
- `services/error-toast.test.ts` mocks `sonner`.
- Sonner renders its `<section>` and `<ol data-sonner-toaster>` in place (no portal), so a wrapper element is a DOM ancestor of all toasts.
- Sonner's own timer cannot tell us the time left, and it pauses only when the stack is hovered or the document is hidden.
- The visual source is the simulator file, section "Toast (final Kirki design)". Only its card markup is used. Its stacking, queue, dedupe, and exit animations are not used.

## Goals / Non-Goals

**Goals:**

- One toast module that owns the UI, the timer, and the public API. Sonner is used only for the stack.
- A timer and a ring that cannot get out of sync, because one clock drives both.
- Timer logic that Vitest can test without a browser.

**Non-Goals:**

- Dedupe or "×2" counts, a queue cap, an offline toast, a progress bar in the toast, and the simulator's exit styles.
- A change to the storefront (it does not use this toast).
- New theme tokens (decision 8).

## Decisions

### 1. Sonner for the stack, our component for the card and timer

Each toast is `sonner.toast.custom(() => <ToastCard … />, { id, duration: Infinity })`. Our `ToastCard` runs the countdown and calls `sonner.toast.dismiss(id)` when it reaches 0. `<Toaster>` gets `toastOptions={{ unstyled: true }}` and a `--width: 330px` style, and loses `richColors`, `closeButton`, and the inline card styles. Stacking, expand on hover, swipe, and exit motion stay as sonner does them.

- Alternative: sonner's `duration` plus a CSS animation for the ring. Rejected: sonner does not pause for focus or press, and the two clocks can drift.
- Alternative: our own toaster. Rejected: the stacking must stay as it is today, so we would write it again for no gain.

### 2. Module layout

All new code is in `resources/app/components/ui/toast/` (a folder, like `calendar/` and `chip/`). There is no barrel file. Callers import from `@/components/ui/toast/toast`.

| File | Contents |
|---|---|
| `toast.tsx` | Public API: `toast.success/info/warning/error(title, options)`, `toast.update(id, patch)`, `toast.dismiss(id?)`, `toast.promise(promise, messages)`. Holds a `Map<id, ToastState>` and calls sonner. Types `ToastVariant`, `ToastOptions`, `ToastContent`. |
| `toast-card.tsx` | The card: icon or spinner, title, description, Undo/Retry buttons, close button with ring. Emotion `defineStyles`. |
| `toast-icon.tsx` | The 4 filled glyphs from the simulator as inline SVG, 24 px, `fill: currentColor`. |
| `toast-close-button.tsx` | 24 px close button and the ring `<svg>`. |
| `toaster.tsx` | Wraps sonner `<Toaster>` in a `display: contents` element that reports pointer, focus, and press to the pause store. Mounted in `app.tsx`. |
| `toast-duration.ts` | `getToastDuration({ variant, title, description, hasUndo, duration })`. Pure. |
| `toast-pause-store.ts` | Pause reasons (`pointer`, `focus`, `press`, `hidden`) in a `Set`, with `subscribe`/`getSnapshot` for `useSyncExternalStore`. It listens to `visibilitychange` once. |
| `toast-countdown.ts` | `createCountdown(durationMs, now)` with `pause(now)`, `resume(now)`, `remaining(now)`, `fraction(now)`. Pure, with an injected clock. |
| `use-toast-countdown.ts` | Hook: connects the countdown to the pause store and `requestAnimationFrame`, writes the ring's `stroke-dashoffset` through a ref (no React render per frame), and calls `onExpire`. |

Tests are next to the files: `toast-duration.test.ts`, `toast-countdown.test.ts`, `toast-pause-store.test.ts`, `toast.test.tsx` (API with sonner mocked).

### 3. Duration rule

`toast-duration.ts` holds the matrix (success 4000/6000, info 5000/8000, warning 7000/10000, undo 8000/10000). Words = `(title + ' ' + description).trim().split(/\s+/)`, with empty strings removed. Result = `min(max, max(default, 1500 + 250 × words))`. An explicit `duration` is returned unchanged. `error` with no explicit duration, and any loading toast, gives `null` (no timer). With Undo, the undo row replaces the variant row, but an error stays `null`.

### 4. Pause scope

One store for the whole app: if any reason is active, every countdown pauses. The `toaster.tsx` wrapper uses React's bubbling events on its `display: contents` element:

- `onPointerEnter` / `onPointerLeave` → `pointer`
- `onFocus` / `onBlur` (check `relatedTarget` is outside the wrapper) → `focus`
- `onPointerDown` → `press`, removed on a `pointerup`/`pointercancel` listener on `window` (the pointer can leave before the release)
- `document.visibilitychange` → `hidden`

`display: contents` creates no box, so sonner's fixed layout does not change.

### 5. Countdown and ring

`createCountdown` stores `remaining` and `startedAt`. `pause` subtracts the time that has gone. `resume` sets a new `startedAt`. The hook runs one `requestAnimationFrame` loop only while the toast is running, and stops it on pause, on expire, and on unmount. The ring is a 24 × 24 SVG with `r = 11.5`, `stroke-width = 1`, `pathLength = 100`, and `stroke-dasharray = 100`. Each frame sets `stroke-dashoffset = 100 × (1 − fraction)`. A `rotate(-90deg) scaleY(-1)` transform puts the start at the top and makes the arc get shorter anticlockwise (the direction is checked in the test of the card's transform style and by eye). `prefers-reduced-motion` does not change the ring: it is a value display, not motion for decoration.

### 6. State, update, and reset

`toast.tsx` keeps `ToastState` (variant, title, description, loading, undo, retry, explicit duration, and a `revision` number) by id. `show` makes an id (or uses `options.id`) and calls `sonner.toast.custom`. `update` merges the patch, adds 1 to `revision`, and calls `sonner.toast.custom` again with the same id, so sonner changes the toast in place. `ToastCard` gets `revision` and makes a new countdown when it changes, so a toast that leaves the loading state starts from its full duration. Sonner's `onDismiss` and `onAutoClose` remove the entry from the map.

### 7. Actions

- `undo: { onUndo: () => void, label?: string }`: the button runs `onUndo`, then `dismiss(id)`.
- `retry: { onRetry: () => void | Promise<unknown>, success?: ToastContent, label?: string }`: if `onRetry` gives back a thenable, `update(id, { loading: true })`. On resolve: `update` to success with `success` content, or `dismiss` if there is no `success`. On reject: `update` back to the saved content from before the click (Retry button stays). The shared module does not read the rejection, because it cannot depend on `services/` (`getErrorMessage`).
- `promise(p, { loading, success, error })`: `loading` is `ToastContent & { variant?: ToastVariant }` (default `info`). `success` and `error` are `ToastContent` or a function of the result or error. The call gives back the id at once.
- Labels default to `__('Undo', 'kirki-ecommerce')` and `__('Retry', 'kirki-ecommerce')`. The close button name is `__('Close notification', 'kirki-ecommerce')`.

### 8. Theme tokens

All values come from `theme`. The simulator values that have no token use the nearest token:

| Part | Token |
|---|---|
| Outer card | `background.surface`, `radius.xxl` (16 px), padding `spacing[1]`, `shadow.lg` |
| Inner surface | `background.solidSurfaceAlt` (#F5F5F5), `radius.xl` (12 px), padding `spacing[2]`, gap `spacing[2]`, `alignItems: center` |
| Title | `typography.small('medium')`, `text.primary`, 2-line clamp, `overflowWrap: anywhere` |
| Description | `typography.tiny()`, `text.subdued`, 3-line clamp |
| Icon colour | success `icon.success`, info `icon.brand`, warning `icon.warning`, error `icon.critical` |
| Ring | track `border.default`, progress = variant icon colour |
| Close button | `icon.secondary`, hover `background.fillHover`, `radius.full` |
| Undo / Retry | `typography.tiny('medium')`, `text.primary`, hover `background.fillHover`, `radius.lg` |
| Focus ring | `border.ring`-based outline, the same as other buttons in `components/ui` |

The spinner is a 24 px span with lucide `Loader2` in the variant colour (the `Spinner` component in `components/ui/spinner.tsx` is fixed at 12 px, so the card styles its own). With `prefers-reduced-motion: reduce`, it changes from a turn to an opacity pulse.

### 9. Accessibility

Sonner's `<section>` is a polite live region. The error card has `role="alert"`, and other cards have `role="status"`. The icon, spinner, and ring have `aria-hidden`.

### 10. Migration

- `services/helpers.ts`: `toastMutationError` → `toast.error(message)`; `toastMutationSuccess` → `toast.success(message, { description })`.
- `utils/common.ts` `dispatchToastMessage`: send `duration` only when the caller gave one; `error`/`warning`/`success` map 1:1, `delete` → `success`, `default` → `info`.
- `utils/index.ts` and the 6 feature files: change the import, and keep each call's variant and text.
- `app.tsx`: use our `Toaster`. `theme/shell-styles.ts`: remove `TOAST_CLOSE_BUTTON_CLASS` and the two sonner rules.
- `services/error-toast.test.ts`: mock `@/components/ui/toast/toast` instead of `sonner`.
- Lint: the `no-restricted-syntax` rule is one entry per config (flat config replaces it, see the comment in `eslint.config.js`). So add the selector `ImportDeclaration[source.value='sonner'] > ImportSpecifier[imported.name='toast']` to the same array as the `Controller` selector, and put it again in `controllerFieldAllowlistConfig` (which now turns the rule `off`), so that field folders keep the sonner ban. Add a last config for `components/ui/toast/**` that keeps only the `Controller` selector.

## Risks / Trade-offs

- [Sonner changes how `toast.custom` with the same id updates, or starts to portal the toaster] → `sonner` stays on `^2.0.7`. `toast.test.tsx` checks that `update` calls `toast.custom` with the same id. The wrapper approach depends on no portal; if that changes, attach the listeners to `[data-sonner-toaster]` instead.
- [Pausing all toasts when one is hovered keeps old toasts longer] → This is what the merchant asked for, and sonner did the same before.
- [Error toasts no longer close by themselves (before: sonner's 4 s)] → This is the matrix. Many errors on one page can stack, and sonner shows 3 and folds the rest, as today.
- [`dispatchToastMessage` toasts stay at least 4 s, not 2 s] → This is intended (decision from the grill).
- [Ring direction is hard to test in jsdom] → A unit test checks the transform value and the dashoffset maths. The user checks the direction by eye (no browser check in this project).
- [rAF per toast] → At most a few toasts are visible. The loop stops while paused.

## Migration Plan

Frontend only. It ships with the next plugin build. Rollback is a revert of the change. No stored data changes.

## Correction during implementation

- **Shared types and colours are in their own files.** If `ToastVariant` and the other types stay in `toast.tsx`, the imports make a cycle (`toast.tsx` → `toast-card.tsx` → `toast.tsx`). So they are in `toast-types.ts`. `toastVariantColor` is in `toast-colors.ts`, because fast refresh (`react-refresh/only-export-components`) does not let `toast-icon.tsx` export a constant next to its component.
- **Spinner glyph.** The loading state uses the simulator's arc glyph (`M21 12a9 9 0 1 1-6.2-8.56`) inside the same 24 px icon SVG, not lucide `Loader2`. It is closer to the design, and the icon and the spinner then have the same size and stroke.
- **Ring transform.** The ring uses only `rotate(-90deg)`, the same as the simulator in LTR. With `pathLength` 100 and an offset that grows, the end of the arc moves back anticlockwise towards 12 o'clock. The `scaleY(-1)` in decision 5 would turn the direction the other way; the simulator uses it only for RTL. The user checks the direction by eye.
- **Pause subscription.** `use-toast-countdown.ts` subscribes to the pause store in the countdown effect, not with `useSyncExternalStore`. The ring is painted through a ref, so a React render on each pause change is not necessary.
- **Variant colours through styles, not `style`.** The icon colour and the ring colour come from per-variant entries in `defineStyles`, because the variant is a fixed set (the project keeps `style` for values calculated at runtime).
- **No 2 px gap between title and description.** The theme has no 2 px spacing token. The title and description line heights give the space.

## Changes after the first manual check

The user tested the playground page and asked for these changes.

- **Pause on hover only (replaces decision 4 and the hidden-tab pause).** In the test, one hover sometimes paused all toasts for ever. The cause: React's `onPointerLeave` does not fire when the toast under the pointer is removed (for example, after a click on its close button). The `pointer` reason then stayed in the store. A focused close button that is removed can also keep `focus`. Now the store holds one boolean (`setPaused`). `toaster.tsx` listens to `pointerover` and `pointerout` on `document`. Each `pointerover` sets the paused state from `root.contains(event.target)`, so the next pointer move after a removal corrects the state. A `pointerout` with no `relatedTarget` (the pointer left the window) resumes. Touch pointers, focus, press, and a hidden tab do not pause.
- **Error closes after 20 s (replaces the error part of decision 3 and decision 7).** `getToastDuration` gives `20000` for an error with no explicit duration, also when it has Undo. The formula does not apply to errors. Because an error now has a timer, its close button shows the ring. A loading toast still has no timer and no close button.
- **Icon badge (replaces decision 10's "no badge").** The simulator puts each glyph on a round tinted badge. The icon is now a 36 px slot with a 31.5 px badge (`radius.full`) and a 22.5 px glyph, the same sizes as the simulator. The badge tints use existing tokens: success `background.fillSuccessSecondary`, info `background.fillSecondary`, warning `background.fillWarningSecondary`, error `background.fillCriticalSecondary`. The spinner shows on the same badge.
- **Same width for all toasts.** With `toastOptions.unstyled`, sonner does not give the toast `<li>` a width on desktop. The `<li>` is `position: absolute`, so it shrank to fit its text, and each toast had a different width. The card now has `width: var(--width)` (330 px, from the toaster) and `maxWidth: 100%`. On screens of 600 px or less, sonner gives the `<li>` its own width, and `maxWidth` keeps the card inside it.
- **Toast shadow token.** The user gave the simulator's front-card shadow (`0 -3px 8px -4px rgba(0,0,0,.10), 0 10px 15px -3px rgba(0,0,0,.10), 0 4px 22px -4px rgba(0,0,0,.03)`). `shadow.lg` has only the middle layer, so it is not near enough. The theme now has a new `shadow.toast` token, and the card uses it in place of `shadow.lg`.
- **Bottom centre on mobile.** On screens of 600 px or less, sonner puts the stack at the bottom across the full screen width (with its mobile side offset) and gives each toast `<li>` that width. The card now has `marginInline: auto`, so it is centred in that row and shows at the bottom centre. On desktop the `<li>` fits the card, so the margin has no effect and the stack stays at the bottom right.
