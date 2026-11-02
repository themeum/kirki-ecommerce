## 1. Database and models

- [x] 1.1 `CreateOrdersTable`: replace `customer_notes` and `admin_notes` with one `order_notes` nullable text column
- [x] 1.2 `CreateCartsTable`: rename `customer_notes` to `order_notes`
- [x] 1.3 `OrderSeeder`: seed `order_notes`
- [x] 1.4 `Order` and `Cart` models: replace the old names in `$fillable` with `order_notes`

## 2. DTOs, actions, requests, resources

- [x] 2.1 `CreateOrderPayloadDTO`, `CreateOrderDTO`, `UpdateOrderPayloadDTO`, `UpdateOrderDTO`: one `order_notes` property each
- [x] 2.2 `CreateOrderAction` and `UpdateOrderAction`: copy `order_notes`
- [x] 2.3 `OrderCreateRequest`, `OrderUpdateRequest`, `OrderCalculationRequest`, `CartUpdateRequest`: `order_notes` rule (`nullable|string`) and `Sanitizer::TEXTAREA` entry
- [x] 2.4 `OrderResource`, site `OrderResource`, `CartResource`: output `order_notes` only
- [x] 2.5 Verify: `grep -rE 'customer_notes|admin_notes' app database` returns nothing

## 3. Email

- [x] 3.1 `CustomerOrderNoteMail`: remove the `admin_notes` fallback
- [x] 3.2 `resources/views/emails/parts/order/customer-note.php` and `resources/data/sample/email/order.json`: use `order_notes`

## 4. PHP tests

- [x] 4.1 Update `OrderApiTest`, `OrderActivityApiTest`, `CartApiTest` to `order_notes`
- [x] 4.2 Add tests: update accepts `order_notes`, clear with null, old keys ignored, mail has no fallback
- [x] 4.3 Verify: PHP integration tests for orders and carts pass; `composer phpcs:wporg` passes

## 5. Storefront

- [x] 5.1 `resources/site/ts/types.ts` and `components/checkout.ts`: use `order_notes`

## 6. Admin schemas and context

- [x] 6.1 `features/orders/schemas/catalog/order.ts`: one `order_notes` field
- [x] 6.2 `features/orders/schemas/forms/order-form.ts`: `order_notes` in the form shape and the calculation transform
- [x] 6.3 `features/orders/contexts/order-create-context.tsx`: skip recalculation for `order_notes`
- [x] 6.4 Update `order-form.test.ts` and `catalog/order.test.ts`
- [x] 6.5 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 7. Admin notes UI

- [x] 7.1 `components/order-create/notes-card.tsx`: "Notes" card with a textarea, placeholder "Write a note...", field `order_notes`
- [x] 7.2 Details notes view: user chose no new file, so `notes-card.tsx` takes `mode`, `onSave` and `isSaving` props. `mode="edit"` has a read view with a pencil icon and an edit view with the textarea and Cancel and Save in the card footer
- [x] 7.3 `pages/order-details.tsx`: always render the notes card in details mode, pass `onSave` and `isSaving`, remove the notes watch
- [x] 7.4 Verify (typecheck and eslint on changed files pass; user checks the visual design): `npm run typecheck` and lint pass; user checks the visual design

## 8. Checkout and customer profile notes UI

- [x] 8.1 Checkout: add the "Leave a Note (Optional)" textarea below Payment in `resources/views/site/checkout.php` (ask before creating a new part file); send its value as `order_notes` from `resources/site/ts/components/checkout.ts`
- [x] 8.2 Customer profile: show an "Order note" card in `resources/views/site/account/orders/details.php` from `order_notes`, escaped, hidden when empty
- [x] 8.3 Add tests for the checkout payload (`checkout.test.ts`)
- [x] 8.4 Verify: site TS typecheck and tests pass; user checks the visual design
- [x] 8.5 Show the checkout note only when `checkout_configuration.show_customer_note` is on (`resources/views/site/checkout.php`)

## 9. Docs

- [x] 9.1 Update `docs/ecommerce/orders/*.yml`, `docs/ecommerce/carts/*.yml`, `docs/ecommerce/Site/checkout.yml` and `research_notes/Order schema tax coupon fit/schema_inventory.md` to `order_notes`
- [x] 9.2 Verify: `grep -rE 'customer_notes|admin_notes'` returns nothing outside `openspec/changes/archive`
