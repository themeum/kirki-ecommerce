## 1. Schemas

- [x] 1.1 In `features/orders/schemas/catalog/order.ts`, extract the shipping method object of `OrderCalculationSchema` into `OrderShippingMethodSchema` (+ `OrderShippingMethod` type) and use it in `OrderCalculationSchema`
- [x] 1.2 Add `OrderEditLineItemSchema` (extends `OrderLineItemSchema` with the seven keys picked from `OrderCalculationItemSchema`) and `OrderEditInfoSchema` (extends `OrderSchema` with `items` and `available_shipping_methods`), with `OrderEditLineItem` and `OrderEditInfo` types
- [x] 1.3 Extend `features/orders/tests/schemas/catalog/order.test.ts`: edit payload accepted, null stock keys accepted, missing `is_reachable` rejected, `available_shipping_methods` defaults to `[]`, plain `OrderSchema` payload still accepted
- [x] 1.4 Verify: `npm run typecheck && npm test` in `resources/app/` (typecheck and tests pass for the changed files; `order-form.test.ts` already failed before this change: 20 tests, 2 type errors on `consents`/`payment_provider`)

## 2. Service and query key

- [x] 2.1 Add `orderKeys.edit(id)` (`[...orderKeys.detail(id), 'edit']`) in `services/query-keys.ts`
- [x] 2.2 Add `getOrderEditInfo` (uses `endpoints.ORDER_EDIT`, parsed with `OrderEditInfoSchema`) and `useOrderEditInfoQuery(id, enabled)` with `retry: false` in `services/order.ts`
- [x] 2.3 Confirm the invalidation in `useUpdateOrderMutation` and `useOrderActionMutation` reaches the edit key by prefix; add a test if it does not (no test needed: the edit key sits under `orderKeys.detail(id)`, so the prefix match works)
- [x] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Stored line limits and reachability

- [x] 3.1 Add `isReachable` to `OrderRowDisplay` in `features/orders/types.ts`
- [x] 3.2 Change `toStoredRowDisplay` and `getStoredDisplayByVariantId` in `lib/order-items.ts` to take `OrderEditLineItem`, map the real stock keys and `is_reachable`, and keep the old permissive default per field only when the value is null
- [x] 3.3 In `components/order-form/order-item/order-item-row.tsx`, lock the line with `calculationItem?.is_reachable ?? display.isReachable`
- [x] 3.4 Extend `features/orders/tests/lib/order-items.test.ts`: real stock values mapped, null fallback for a deleted variant, ceiling floored at the stored quantity, unreachable stored line locked before a preview
- [x] 3.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Edit context and page

- [x] 4.1 In `contexts/order-edit-context.tsx`, replace `useOrderQuery` with `useOrderEditInfoQuery`, type `order` as `OrderEditInfo`, and add an `availableShippingMethods` local state (like `paymentSummary`) to the context value: set it from `order.available_shipping_methods` in the effect that fills the form, and from `calculation.available_shipping_methods` in the effect that handles a new calculation
- [x] 4.2 In `pages/order-form.tsx`, read the shipping list from the context value; map a 422 answer of the edit read to the blocked state with the server message; keep the error state with retry for 404 and other errors
- [x] 4.3 Add a context test for edit mode with a mocked edit read (pattern of `tests/hooks/use-order-create.test.tsx`): form filled, stock ceiling before a preview, shipping choices before a preview, 422 blocked state, 404 error state, create mode sends no edit read (the old `use-order-create.test.tsx` was broken by a rename; fixed and renamed to `use-order-edit.test.tsx`, and the new tests live there)
- [x] 4.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Docs and final checks

- [x] 5.1 Update `docs/order-editing.md` in the same change: the edit screen loads from `GET /orders/{id}/edit`; keep its structure, and its "Where this differs from" section stays honest
- [x] 5.2 Run lint on the changed files and `openspec validate use-order-edit-endpoint --strict`
- [x] 5.3 Verify: `npm run typecheck && npm test` in `resources/app/`; leave the visual check of a normal order, an order with a deleted variant and a non-editable order to the user
