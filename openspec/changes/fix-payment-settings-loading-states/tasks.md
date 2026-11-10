## 1. Payments page skeleton

- [x] 1.1 Write a failing test `features/settings/payment/tests/skeletons/payment-settings-skeleton.test.tsx`: the skeleton renders the "Payments" header, a `[data-slot="stacked-items"]` list with exactly 3 `[data-slot="stacked-item"]` rows, and each row has 3 `[data-slot="skeleton"]` blocks (icon, name, switch); the card has heading, description and "Add" button placeholders.
- [x] 1.2 Rewrite `skeletons/payment-settings-skeleton.tsx` to mirror the Payment methods card with `Card`/`CardContent` (`cardStyles.formCard`), the same heading `Flex` + `ActionGroup` layout, and `StackedItems`/`StackedItem` rows (16px icon, name bar with per-row width, 32×16 `radius="full"` switch bar). Keep `SettingsPageHeader`. Remove the `SettingsPageSkeleton` import if it is no longer used.
- [x] 1.3 In `pages/payment-settings.tsx`, read `isLoading` (not `isFetching`) from `usePaymentMethodsQuery()`.
- [x] 1.4 Add a test that the page shows the real list, not the skeleton, while a refetch is in flight with cached data.
- [x] 1.5 Verify: run `npm run typecheck && npm test` in `resources/app/`.

## 2. Centered busy spinner in the dialog row

- [x] 2.1 Add failing tests in `tests/components/dialogs/payment-method-row.test.tsx`: with `isBusy` and `status="not-added"`, the "Add" button is rendered with `aria-busy="true"` / `data-loading="true"` and there is no separate spinner outside the button; the same for `status="update-available"` and the "Update" button.
- [x] 2.2 In `components/dialogs/payment-method-row.tsx`, remove the `Spinner` branch and pass `loading={isBusy}` to the "Add" and "Update" buttons.
- [x] 2.3 In the row styles, keep `[data-slot="payment-method-add"][data-loading="true"]` at `opacity: 1` without hover.
- [x] 2.4 Remove the `Spinner` import and the `spinner` style if they are now unused.
- [x] 2.5 Run `npm run lint` on the changed files.
- [x] 2.6 Verify: run `npm run typecheck && npm test` in `resources/app/`. Ask the user to check the skeleton and the busy button visually (no browser preview in this project).
