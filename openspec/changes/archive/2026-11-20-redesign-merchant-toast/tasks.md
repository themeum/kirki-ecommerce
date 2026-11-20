## 1. Timer logic (pure, test first)

- [x] 1.1 Write `components/ui/toast/toast-duration.test.ts` for the matrix rows: 3-word success → 4000, 20-word info → 6500, 60-word warning → 10000, Undo on success → 8000, error → null, loading → null, explicit 2000 on success → 2000, explicit duration on error → that value, empty description not counted as a word
- [x] 1.2 Implement `components/ui/toast/toast-duration.ts` (`getToastDuration`) until 1.1 passes
- [x] 1.3 Write `components/ui/toast/toast-countdown.test.ts`: remaining and fraction with an injected clock, pause stops time, resume continues with the time left, pause twice is safe, fraction is 0 at expire
- [x] 1.4 Implement `components/ui/toast/toast-countdown.ts` (`createCountdown`) until 1.3 passes
- [x] 1.5 Write `components/ui/toast/toast-pause-store.test.ts`: any active reason pauses, all reasons removed resumes, subscribers get notified, `visibilitychange` to hidden and back adds and removes `hidden`
- [x] 1.6 Implement `components/ui/toast/toast-pause-store.ts` until 1.5 passes
- [x] 1.7 Verify: `npm run typecheck && npm test` in `resources/app/` — typecheck passes; all toast tests pass. 2 failures in `features/orders/tests/components/order-details/add-tracking-dialog.test.tsx` existed before this change (from commit 6f0b8303) and do not touch toast code

## 2. Toast card UI

- [x] 2.1 Add `components/ui/toast/toast-icon.tsx` with the 4 filled glyphs from the simulator (success, info, warning, error), 24 px, `fill: currentColor`, `aria-hidden`
- [x] 2.2 Add `components/ui/toast/use-toast-countdown.ts`: connect `createCountdown` to the pause store with `useSyncExternalStore`, run a `requestAnimationFrame` loop only while running, write the ring `stroke-dashoffset` through a ref, call `onExpire` once, reset when `revision` changes, clean up on unmount
- [x] 2.3 Add `components/ui/toast/toast-close-button.tsx`: 24 px button, accessible name `__('Close notification', 'kirki-ecommerce')`, optional ring SVG (`r` 11.5, `pathLength` 100, track `border.default`, progress in variant colour, `rotate(-90deg) scaleY(-1)`)
- [x] 2.4 Add `components/ui/toast/toast-card.tsx` with theme tokens from design.md decision 8: 330 px layout, icon or 24 px variant-coloured spinner (pulse on `prefers-reduced-motion`), title 2-line clamp, description 3-line clamp, Undo/Retry buttons, close button with ring only when a timer runs, no close button while loading, `role="alert"` for error and `role="status"` for others
- [x] 2.5 Add a card test (`toast-card.test.tsx`): close button present with ring for timed success, with no ring for error, absent while loading; spinner replaces icon while loading; Undo and Retry buttons show only when given; error has `role="alert"`
- [x] 2.6 Verify: `npm run typecheck && npm test` in `resources/app/` — typecheck passes; toast tests pass; only the 2 earlier `add-tracking-dialog` failures remain

## 3. Toast API and Toaster

- [x] 3.1 Write `components/ui/toast/toast.test.tsx` with `sonner` mocked: `success/info/warning/error` call `toast.custom` with `duration: Infinity` and give back an id; `update` calls `toast.custom` with the same id and a new revision; `dismiss(id)` and `dismiss()` call sonner's dismiss; `promise` shows loading, then success on resolve and error on reject (static and function content); Undo runs `onUndo` once then dismisses; Retry with a resolving Promise goes loading → success content (or dismiss when none); Retry with a rejecting Promise goes back to the saved content; Retry with no Promise dismisses
- [x] 3.2 Implement `components/ui/toast/toast.tsx` (state map, `show`, `update`, `dismiss`, `promise`, action handling, `onDismiss`/`onAutoClose` cleanup) until 3.1 passes
- [x] 3.3 Add `components/ui/toast/toaster.tsx`: `display: contents` wrapper with pointer, focus (with `relatedTarget` check), and press handlers (`pointerup`/`pointercancel` on `window`) that feed the pause store; sonner `<Toaster position="bottom-right" toastOptions={{ unstyled: true }}>` with `--width: 330px`
- [x] 3.4 Add a test for the wrapper: pointer enter/leave, focus in/out, and press/release add and remove the matching pause reasons
- [x] 3.5 Verify: `npm run typecheck && npm test` in `resources/app/` — typecheck and lint pass; toast tests pass; only the 2 earlier `add-tracking-dialog` failures remain

## 4. Migration

- [x] 4.1 `app.tsx`: replace the sonner `<Toaster>` and its inline styles with the new `Toaster`; remove the `TOAST_CLOSE_BUTTON_CLASS` import
- [x] 4.2 `theme/shell-styles.ts`: remove `TOAST_CLOSE_BUTTON_CLASS`, its export, and the two sonner close-button rules
- [x] 4.3 `services/helpers.ts`: `toastMutationError` and `toastMutationSuccess` use the new API (keep `description`); update `services/error-toast.test.ts` to mock `@/components/ui/toast/toast`
- [x] 4.4 `utils/common.ts` `dispatchToastMessage`: use the new API, send `duration` only when the caller gave one, map `delete` → success and `default` → info; add a test that a call with no duration sends no duration
- [x] 4.5 `utils/index.ts` (copy to clipboard) and the 6 feature files (`shipping-zone.tsx`, `shipping/lib/utils.tsx`, `shipping-method-dialog.tsx`, `bulk-edit.tsx`, `use-product-form.ts`, `order-edit-context.tsx`): import `toast` from `@/components/ui/toast/toast`, keep each variant and text
- [x] 4.6 Confirm `grep -rn "from 'sonner'" resources/app --include='*.ts' --include='*.tsx'` finds only `components/ui/toast/` files (and the sonner mock in `toast.test.tsx`)
- [x] 4.7 Verify: `npm run typecheck && npm test` in `resources/app/` — typecheck and lint pass; only the 2 earlier `add-tracking-dialog` failures remain

## 5. Lint guard

- [x] 5.1 `eslint.config.js`: add the selector `ImportDeclaration[source.value='sonner'] > ImportSpecifier[imported.name='toast']` to the `no-restricted-syntax` array next to the `Controller` selector; in `controllerFieldAllowlistConfig`, change `'off'` to a rule that keeps only the sonner selector; add a config for `components/ui/toast/**` that keeps only the `Controller` selector
- [x] 5.2 Check the rule: a temporary `import { toast } from 'sonner'` in a feature file and in a `components/form/` file makes `npm run lint` fail; remove the temporary import; `npm run lint` passes
- [x] 5.3 Verify: `npm run typecheck && npm test` in `resources/app/` — typecheck and `npm run lint` pass; only the 2 earlier `add-tracking-dialog` failures remain

## 6. Hand-off

- [x] 6.1 Ask the user to check by eye in the browser (this project does not use browser checks): each variant, loading → success, ring direction (anticlockwise), pause on hover/focus/press/hidden tab, stacking and exit as before, toast over a dialog
- [x] 6.2 Write the "Backward compatibility" note: frontend only, no released public surface changed

## 7. Changes after the first manual check

- [x] 7.1 Change the pause store to one boolean, and make `toaster.tsx` pause only while the mouse pointer is on the stack (document `pointerover`/`pointerout`, no focus, press, touch, or hidden-tab pause). Update `toast-pause-store.test.ts` and `toaster.test.tsx`, with a test for a removed toast under the pointer
- [x] 7.2 Give an error toast a 20 s duration (also with Undo) and show the ring on its close button. Update `toast-duration.test.ts` and `toast-card.test.tsx`
- [x] 7.3 Put the icon on a 31.5 px round tinted badge in a 36 px slot, with a 22.5 px glyph
- [x] 7.4 Give every toast card the 330 px toaster width (`var(--width)`, `maxWidth: 100%`), so all toasts have the same width
- [x] 7.5 Add `shadow.toast` to `theme/index.ts` and use it on the toast card
- [x] 7.6 Centre the toast card in sonner's full-width mobile row (`marginInline: auto`), so toasts show at the bottom centre on screens of 600 px or less
- [x] 7.7 Run `npm run typecheck && npm test`
