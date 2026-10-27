## 1. Route and entry points

- [x] 1.1 Register the `OrderEdit` route in `features/orders/routes.tsx` and render `OrderCreate` for it
- [x] 1.2 Enable the Edit action in `pages/order-details.tsx` (the `@todo`), link it to `OrderEdit`, and show it only when `order.is_editable` is true
- [x] 1.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Form schema and line identity

- [x] 2.1 Add an optional `id` to `items` in `schemas/forms/order-form.ts` and pass it through the save transform
- [x] 2.2 Add `order_id` and `items.*.id` to `OrderCalculationRequestSchema`
- [x] 2.3 Update or add the payload test in `features/orders/tests/schemas/forms/order-form.test.ts` for existing lines (with `id`), new lines (no `id`) and `order_id`
- [x] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Quantity ceiling and row mapping

- [x] 3.1 Add a mapper in `lib/order-items.ts` from `OrderLineItem` to `OrderRowDisplay` for stored lines
- [x] 3.2 Change `getQuantityLimit` to read the stock and limit fields of the calculation item, and apply `max(stored quantity, ceiling)` for stored lines
- [x] 3.3 Add a helper that pairs calculation items to form items by `id` for stored lines and by new-line order for new lines
- [x] 3.4 Add unit tests in `features/orders/tests/lib/` for: stock ceiling, back orders, untracked stock, per-order limit, smaller ceiling wins, stored quantity above limit, sold-out stored line, pairing after a middle line is removed
- [x] 3.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Provider and page

- [x] 4.1 Make `OrderCreateProvider` take an optional order id: load with `useOrderQuery`, fill the form once on first load with `pickFormValues` and `toOrderFormAddresses`, and build display data for stored lines
- [x] 4.2 Send `order_id` and item `id` in the calculation request in edit, and start previews only after the form is filled
- [x] 4.3 Submit with `useUpdateOrderMutation` in edit, show the order detail page on success, and apply server errors to the form
- [x] 4.4 Use the pairing helper in the reconciliation effect
- [x] 4.5 In `pages/order-create.tsx` read `:id`, set the heading and submit label for edit, pass `CustomerCard mode="edit"`, and show the loading, error and blocked states
- [x] 4.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Row behavior

- [x] 5.1 In `order-item-row.tsx` show the quantity as text with only the remove button when `is_reachable` is false
- [x] 5.2 Pass the ceiling and the reason from the calculation item to `QuantityStepper`, and keep the decrease button always enabled above the minimum
- [x] 5.3 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Documentation

- [x] 6.1 Update `docs/order-editing.md` with the edit screen, the gate, the line rules and the quantity ceiling, and update its "Where this differs from" section
- [x] 6.2 Verify: `openspec validate order-edit-frontend` passes
