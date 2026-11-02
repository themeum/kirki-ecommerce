## 1. Backend: provider order

- [x] 1.1 Add a protected `ordered_providers()` to `app/Payment/PaymentManager.php` that reads `methods_order` from the `payment` settings and sorts the registry (stored position first, then registration order; unknown IDs ignored). Make `get_all_providers`, `get_online_providers`, `get_offline_providers`, `get_available_providers`, `get_available_online_providers` and `get_available_offline_providers` filter its result. _(Also exposed as public `order_providers()` on the manager and facade: `GET /offline-payments` reads the settings directly through `OfflinePaymentService::get()`, not the registry, so it now sorts through `Payment::order_providers()` too. Found by the per-kind listing test.)_
- [x] 1.2 Add `app/Http/Requests/PaymentMethod/PaymentMethodOrderRequest.php`: `ids` required array of distinct strings, each a registered provider ID; sanitize items as text.
- [x] 1.3 Add `PaymentMethodService::reorder(array $ids)` that writes `methods_order` through `AppSettings::set()` and returns the ordered provider collection.
- [x] 1.4 Add `PaymentMethodController::reorder()` returning `PaymentMethodListResource::collection(...)` with a success message, and register `Route::put('/payment-methods/order', ...)` in the admin group of `routes/api.php`.
- [x] 1.5 Extend `tests/Integration/PaymentMethodApiTest.php`: save order, response order, unknown ID, duplicate ID, missing `ids`, non-admin refused, new provider goes last, deleted ID ignored, order survives an offline toggle/create, no key → registration order, and `PUT /payment-methods` still has no route.
- [x] 1.6 Extend `tests/Integration/CheckoutPaymentProviderTest.php` (or the nearest checkout provider test) to assert that checkout providers follow the stored order. _(Added to `PaymentMethodApiTest` instead: checkout renders a view, so the test asserts `Payment::get_available_providers()`, which the checkout page reads.)_
- [x] 1.7 Add the Bruno request `docs/ecommerce/payment-methods/reorder.yml` with a 200 and a 422 example.

## 2. Frontend: service

- [x] 2.1 Add `PAYMENT_METHODS_ORDER: '/payment-methods/order'` to `resources/app/config/endpoints.ts`.
- [x] 2.2 Add `reorderPaymentMethods(ids)` and `useReorderPaymentMethodsMutation` to `features/settings/payment/services/payment.ts`: optimistic sort of `paymentKeys.methods.all`, rollback + error toast on failure, no success toast, invalidate the online and offline lists (not `methods.all`).
- [x] 2.3 Add tests in `features/settings/payment/tests/services/payment.test.ts` for the request body, the optimistic cache order, and the rollback on error. _(The hook tests need jsdom, so they live in `use-reorder-payment-methods-mutation.test.tsx` next to it.)_

## 3. Frontend: sortable row

- [x] 3.1 Create `features/settings/payment/components/list/sortable-payment-method.tsx`: `StackedItem` + `useSortable`; a fixed-size media slot that holds the provider icon and the grip button (`DragHandleDots2Icon`, accessible name, `setActivatorNodeRef`, `attributes`, `listeners`); reduced opacity when `isDragging`.
- [x] 3.2 In the same row, render `StackedItemActions` with `data-action-group="true"`: delete icon button (omitted when `id === 'paypal'`), edit icon button, `Switch`. Give each button a translated accessible name.
- [x] 3.3 Add a light overlay row (grip + name) for the `DragOverlay`, with `radius.lg`, `border.secondary`, surface background and a small shadow.

## 4. Frontend: list rewrite

- [x] 4.1 Rewrite the list in `features/settings/payment/components/list/payment-methods.tsx`: `DndContext` (PointerSensor distance 4, KeyboardSensor with `sortableKeyboardCoordinates`, `restrictToVerticalAxis`, `restrictToParentElement`) → `StackedItems` → `SortableContext` with `verticalListSortingStrategy`; portal the `DragOverlay` to `document.body`.
- [x] 4.2 On drag end, compute the new order with `arrayMove` and call the reorder mutation only when the position changed; clear the active ID on end and on cancel.
- [x] 4.3 Keep the existing edit, delete, toggle handlers and dialogs; remove the `DropdownButton`, `handleAction` and any imports and styles the rewrite makes unused.
- [x] 4.4 Add the local `cssOverride` styles: no row dividers, transparent 1px top/bottom row border that becomes `border.secondary` with `background.surfaceAlt` on hover/focus-within, icon/grip swap on the same conditions as the actions, and always-visible actions and grip under `@media (hover: none)`.
- [x] 4.5 Update `features/settings/payment/skeletons/payment-settings-skeleton.tsx` if its row shape no longer matches the stacked list. _(No change: it is the generic form-card skeleton (`SettingsPageSkeleton cards={[3]}`), which did not mirror the old card rows either, so the rewrite does not make it less accurate.)_

## 5. Docs and verification

- [x] 5.1 Add `docs/payments.md` in the structure of `docs/emails.md`: table of contents, quick start, the list and its actions, reordering and the order API, how the order applies to checkout and to providers from the hook, and a "Where this differs from WooCommerce" section.
- [x] 5.2 Run `npm run typecheck`, lint and `npm test` in `resources/app/`, and the PHP integration tests for payment methods and checkout; fix any failure. _(typecheck, eslint, 1455 Vitest tests, 805 PHP integration + 402 unit tests, `phpcs:wporg` and the docblock sniff on the changed PHP files: all pass.)_
- [x] 5.3 Ask the user to check the visuals (hover border, icon/grip swap, overlay, touch view) in the browser, per CLAUDE.md §0.
