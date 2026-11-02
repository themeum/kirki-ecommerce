## Why

Orders keep two note columns, `customer_notes` and `admin_notes`. Only the admin note can be edited after an order exists, and the order details page hides the notes card when no note exists, so a merchant cannot add a note there. One shared `order_notes` field, used by the merchant and the customer, is simpler and lets the details page show and edit it.

## What Changes

- **BREAKING**: Replace `customer_notes` and `admin_notes` on `kirki_ecommerce_orders` with one nullable text column `order_notes` (migration edited in place).
- **BREAKING**: Rename `kirki_ecommerce_carts.customer_notes` to `order_notes` (migration edited in place). Cart and checkout use one name for the note.
- **BREAKING**: API requests, responses, DTOs and models use `order_notes` only. The order update request now accepts `order_notes`.
- `CustomerOrderNoteMail` no longer falls back to the order note. It uses only the note passed to it.
- Admin order create page: Notes card with a textarea (placeholder "Write a note...").
- Admin order details page: Notes card is always shown with a pencil icon. It shows the saved note read-only. The pencil switches to an edit view with a textarea and Cancel and Save in the footer. Save updates the order. This also adds a note to an order that has none.
- Storefront checkout: add an optional "Leave a Note" textarea below Payment, sent as `order_notes`. It shows only when the checkout setting `show_customer_note` is on.
- Storefront customer order details: show an "Order note" section when the order has a note.
- Update seeders, tests, API docs and sample email data to the new name.

## Capabilities

### New Capabilities
- `order-notes`: One `order_notes` field on orders and carts, its API contract, the email behaviour, and the admin create and details note UI.

### Modified Capabilities

None. No existing spec mentions the note fields.

## Impact

- Database: `CreateOrdersTable`, `CreateCartsTable`, `OrderSeeder`. Existing dev databases must be re-migrated.
- PHP: `Order` and `Cart` models, four order DTOs, `CreateOrderAction`, `UpdateOrderAction`, order create, update and calculation requests, `CartUpdateRequest`, `OrderResource`, site `OrderResource`, `CartResource`, `CustomerOrderNoteMail`, `customer-note.php` email part, sample email JSON.
- Admin app (`resources/app/features/orders/`): order catalog and form schemas, order create context, notes card, order details page.
- Storefront: `resources/site/ts/` types and checkout payload, `resources/views/site/checkout.php`, `resources/views/site/account/orders/details.php`.
- Tests: PHP integration tests for orders and carts, Vitest schema tests.
- Docs: `docs/ecommerce/orders`, `carts` and `Site/checkout` API examples.
