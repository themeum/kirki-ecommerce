## Why

After the merchant completes every setup checklist step, the Home page still
shows a checklist that is all green and has nothing more to do. The merchant has
no quick view of how the store performs. A store overview in place of the
finished checklist makes Home useful every day after setup.

## What Changes

- **Dashboard mode on Home**: when every visible server checklist step
  (`products`, `payments`, `tax` when tax calculation is on, `shipping`) is
  completed, the Home page replaces the setup checklist with a store overview.
  Completion is already sticky, so the page does not go back to the checklist.
  The template gallery shows only in checklist mode.
- **Header in dashboard mode**: the heading is "Welcome, {name}". The name is the
  current user's first name, or the display name when the first name is empty.
  "View Live Site" stays, and a primary "Add Product" button opens the create
  product page (in both modes).
- **Four metric cards** (all time, base currency, no up/down percent):
  - **Total sales**: sum of `base_total` of counted orders.
  - **Net sales**: Total sales − tax − shipping − completed refunds (in base
    currency).
  - **Orders**: number of counted orders.
  - **Products sold**: sum of item quantities of counted orders.
  - A *counted order* has `payment_status` `paid`, `refunding` or `refunded`.
- **Recent orders card**: the latest 5 orders by creation date, any status. Each
  row shows the order number, the fulfillment status as colored text, customer
  name, number of products, total in the order currency and time since creation. A row opens the order detail page.
- **Top selling products card**: the top 5 products from counted orders, with
  variants merged into their product. Ranked by units sold, then by base revenue.
  Each row shows a 48 px image, the name, a stock badge ("59 left in stock",
  "In stock" or "Out of stock"), the base revenue ("generated") and units sold.
- **Card actions**: "View all orders" (orders list) and "View all products"
  (products list) are ghost buttons. They show on hover, on keyboard focus inside
  the card, and always on touch devices.
- **Information tooltips**: each metric and list card title has an information
  icon. Its tooltip describes the card in plain, translatable language.
- **Empty state**: metrics show 0. The list cards show "No orders yet" and
  "No sales yet", centered in their card.
- **Layout**: dashboard mode uses a wider page container. The checklist mode keeps
  the current small container.
- **New REST endpoint**: `GET /kirki/ecommerce/v1/dashboard/overview` returns the
  metrics, recent orders and top products in one response.

## Capabilities

### New Capabilities
- `merchant-home-dashboard`: the store overview on the Home page. Covers the
  gate on checklist completion, the dashboard header, the metric definitions, the
  recent orders and top products cards, the card actions, empty states, layout and
  the overview endpoint.

### Modified Capabilities
<!-- None. The Home page spec (`merchant-home-page`) is still in the unarchived
     change `merchant-home-setup-checklist`, so it is not in openspec/specs/ yet.
     The dashboard-mode header and the checklist replacement are specified in
     `merchant-home-dashboard` as additions on top of that page. -->

## Impact

- **PHP**
  - New `DashboardService` (aggregate queries) and `DashboardController`.
  - New route in `routes/api.php`, admin-only like the other admin routes.
- **React**
  - `resources/app/features/home/`: new overview components, schema, service and
    a payload/response schema test. `pages/home.tsx` switches between checklist
    mode and dashboard mode.
  - Reuses `Card`, `Badge`, `Image`, `Skeleton`, `useCurrentUser`, the order
    payment badge helper (`features/orders/lib/order-badge`) and
    `MoneyObjectSchema`.
- **REST API**: new `GET /kirki/ecommerce/v1/dashboard/overview`.
- **Docs**: update `docs/home.md` with the dashboard and its metric definitions.
- **Dependency**: builds on the unarchived change `merchant-home-setup-checklist`
  (its code is already in the repo).
- **No new packages.**
