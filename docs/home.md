# Home Page, Setup Checklist and Store Overview

The Home page is the plugin's dashboard root (`#/`). It opens after onboarding and
from the **eCommerce → Home** admin menu. Until setup is done, it shows a setup
checklist that leads a new merchant through the tasks a store needs before it can
sell. When every checklist step is complete, the checklist is replaced by a store
overview: sales metrics, recent orders and top selling products. While setup is
not done, a gallery of storefront templates shows below the checklist.

- [1. Quick start](#1-quick-start)
- [2. The page](#2-the-page)
- [3. The checklist steps](#3-the-checklist-steps)
- [4. When a step completes](#4-when-a-step-completes)
- [5. Preconfigured steps](#5-preconfigured-steps)
- [6. Loading sample data](#6-loading-sample-data)
- [7. Store overview](#7-store-overview)
- [8. Storage](#8-storage)
- [9. REST API](#9-rest-api)
- [10. Resetting the checklist in development](#10-resetting-the-checklist-in-development)
- [11. Requirements and limitations](#11-requirements-and-limitations)
- [12. Where this differs from WooCommerce](#12-where-this-differs-from-woocommerce)

---

## 1. Quick start

Finish onboarding and press **Go to Dashboard**, or open **eCommerce → Home**. The
first incomplete step is open. Each step's button opens the admin page where the
task is done. When you come back to Home, the checklist checks the store again and
marks the steps that are now done. When the last step is done, Home shows the
store overview (section 7) from then on.

## 2. The page

| Part | What it shows |
|---|---|
| Heading | While setup is not done: "Let's get you started". After: "Welcome, {name}" (section 7). Both have a **View Live Site** link that opens the site URL in a new tab, and a primary **Add Product** button that opens the create product page. |
| Setup checklist | Only while setup is not done. "X out of N complete", a percentage, a progress bar and the steps (section 3). |
| Store overview | Only after every checklist step is complete, in place of the checklist (section 7). |
| Template gallery | Only while setup is not done, below the checklist. Three square template cards (194 × 194 px, with a 150 px cover image). Each card has a **Coming soon** badge at its top-right corner. The cards cannot be clicked. |

The template gallery is a placeholder. The names, images and links come from
`resources/app/features/home/lib/templates.ts`. The images are in the plugin, in
`assets/images/templates/`. If an image does not load, the shared placeholder image
shows. The links are `#`.

## 3. The checklist steps

| # | Step | Time | Buttons | Opens |
|---|---|---|---|---|
| 1 | List your products | 3 min | Add products; Load sample data (only while the store has no products) | Create product page / none (section 6) |
| 2 | Set up payments | 2 min | Add payment *or* Update payment; Cash on delivery | Settings → Payments (both buttons) |
| 3 | Collect sales tax | 1 min | Add tax rate *or* Update tax rate | Settings → Tax |
| 4 | Add shipping method | 3 min | Add shipping *or* Update shipping rate | Settings → Shipping |

- **Visibility.** Step 3 is shown only while **tax calculation** is on in general
  settings. When it is hidden, it is not counted and the steps are numbered 1–3.
- **"Add" or "Update".** A button says "Update …" when the store already has the
  data that the step asks for (the data rules in section 4). Otherwise it says
  "Add …".
- **Accordion.** Only one step is open at a time. Each step can be opened and
  closed.
- **Indicator.** A step shows its number in a circle. The circle is tinted while
  the step is open. A completed step shows a green check mark.
- **Progress.** N is the number of visible steps and X is the number of completed
  visible steps. The percentage is X / N × 100, rounded.

## 4. When a step completes

| Step | Completes when |
|---|---|
| `products` | At least one product exists (any status). |
| `payments` | At least one payment method, online or offline, is **enabled** and **set up**. Set up means that every admin field the method marks as required has a value. For PayPal, these are Client ID, Client Secret and Webhook ID. Offline methods have no required fields, so for them "enabled" is enough. |
| `tax` | At least one **enabled** tax region has a **product tax rate above 0**. See the rate sources below. If the step is preconfigured, it completes only when the merchant clicks **Update tax rate**. |
| `shipping` | At least one **enabled** shipping zone has at least one **enabled shipping method**. Shipping carriers do not count. If the step is preconfigured, it completes only when the merchant clicks **Update shipping rate**. |

A tax region gets its product rate from one of these sources, as checkout does:

| Region | Rate source |
|---|---|
| EU (`code` is `EU`) | Any member country with `rate` above 0. |
| General, central tax on | `central_product_tax` above 0. |
| General, central tax off | Any state with `product_tax_rate` above 0. |

A rate of 0, an empty rate, or a shipping tax rate alone does not count.

The rules run on the server each time the checklist is read, only for visible
steps that are not completed yet.

Completion is **sticky**. When a step completes, it stays completed. For example,
if the merchant deletes all products, step 1 stays checked.

## 5. Preconfigured steps

Onboarding can set up tax regions or shipping zones for the merchant through the
industry and location presets (`StoreSetupService::apply_presets()`). The checklist
must not mark that data as the merchant's work. At the end of store setup,
`SetupChecklistService::record_preconfigured()` records which of `tax` and
`shipping` already meet their data rule from section 4. These steps are
*preconfigured*:

- they do not complete from data;
- their button says "Update …";
- a click on that button records the step as completed, then opens the settings
  page. If that request fails, an error toast is shown and the settings page
  still opens.

The presets do nothing today, so the snapshot is empty on a real store. A store
that completed onboarding before the snapshot existed has no preconfigured steps.

## 6. Loading sample data

Step 1 shows **Load sample data** next to **Add products** while the store has no
products. A click runs two phases. The button shows each phase inside itself:
its text changes to the phase message, and a bar runs along its bottom edge.

1. **"Downloading product sample..."** This phase is simulated. The bar fills to
   70% in about 2.5 seconds. No request is sent. The remote download is not built
   yet.
2. **"Creating products..."** The app calls `POST /onboarding/sample-data`. This
   is the endpoint that the onboarding wizard uses. It loads the demo products
   that come with the plugin and the inactive `WELCOME50` starter coupon (see
   [`docs/onboarding.md`](onboarding.md#5-loading-sample-data)). The bar moves slowly toward 95% while the request
   runs.

While the import runs, **Add products** is disabled and **Load sample data**
ignores clicks. If the import succeeds:

- the checklist reloads, and step 1 shows the green check;
- the **Load sample data** button goes away, because the store now has products;
- after about 1 second, step 1 closes and the next incomplete step opens.

No success toast shows. If the import fails, an error toast shows, the button
reads **Load sample data** again and both buttons work again.

The flow is in `resources/app/features/home/hooks/use-sample-data-import.ts`. The
phase durations are constants at the top of that file.

## 7. Store overview

Home shows the store overview when **every visible checklist step is completed**.
The visible steps are `products`, `payments`, `tax` (only while tax calculation
is on) and `shipping`. Because completion is sticky (section 4), the overview
stays after the data behind a step is removed. If the merchant completes the last
step on Home, the page changes to the overview without a reload.

The admin page also sends `is_setup_complete` in `window.kirki_ecommerce`. Home
uses it to pick the mode before the checklist response arrives, so a completed
store does not first show the narrow checklist skeleton. The flag reads only the
stored completions. A step whose data was added outside Home (for example a
product made from the products page) is recorded by the next checklist request,
so that store shows the checklist skeleton once more on its next Home visit.

In this mode the page is wider (the `xl` page container, 1024 px), and:

- the heading reads **"Welcome, {name}"**. The name is the current user's first
  name, or the display name when the first name is empty. With neither, the
  heading reads "Welcome";
- **View Live Site** and **Add Product** stay;
- the template gallery is not shown.

Each metric card and list card has an information icon next to its title. The
icon shows only while the pointer is over its card (always on a device without
hover). On hover, the icon's tooltip describes the card in plain language.

### Counted orders

Metrics and top products use only **counted orders**: orders whose
`payment_status` is `paid`, `refunding` or `refunded`. An unpaid cash on delivery
order is not counted until the merchant marks it paid. Pending, unpaid, failed,
processing and cancelled payments are never counted. All figures are **all time**.

### Metric cards

| Card | Value |
|---|---|
| Total sales | Sum of `base_total` of counted orders. |
| Net sales | Total sales − sum of `base_tax_total` − (sum of `base_shipping_total` − sum of `base_shipping_tax_amount`) − completed refunds of counted orders, in the base currency. `base_tax_total` and `base_shipping_total` both hold the shipping tax, so it is taken off once. |
| Orders | Number of counted orders. |
| Products sold | Sum of order item `quantity` of counted orders. |

Money is in the store's **base currency**, formatted with the store's currency
settings. Refunds are stored only in the order's currency, so each order's
completed refunds are converted with that order's own `base_total / invoiced_total`
ratio (the rate frozen when the order was placed). Pending and cancelled refunds
are ignored. The cards show no change percentage or trend.

On a store with no counted orders, every card shows 0.

### Recent orders

The 5 newest orders by creation date, **of any payment status**, so a new unpaid
order shows here even though it is not counted in the metrics. Each row shows the
order number with the fulfillment status in colored text, the customer name, the
number of products, the total in the order's own currency and the time since the
order was created in short form ("Just now", "45m ago", "3h ago", "2d ago",
"4mo ago", "2y ago"). A row opens the order. With no orders, the card
reads "No orders yet", centered in the card.

### Top selling products

Up to 5 products from counted orders. Variants are merged into their product.
Rows are sorted by units sold, then by base-currency revenue. Each row shows a
48 × 48 px image, the name with a stock badge, the revenue ("$3,134 generated")
and the units sold ("1200 units sold"). The revenue is the sum of `base_total` of
the product's order items in counted orders, for all of its variants. Name and
image come from the product's newest order item, so a deleted product still
shows. Items whose product was deleted have no product ID; they are grouped by
their recorded name. With no counted orders, the card reads "No sales yet",
centered in the card.

The stock badge shows the product's current stock across all of its variants,
with the same rules as the product list:

| Product state | Badge |
|---|---|
| A variant tracks inventory and the summed available quantity of the tracked variants is above 0 | "{N} left in stock": gray, or orange when the product is low on stock |
| Out of stock (every variant is out of stock) | "Out of stock" (red) |
| Any other state, for example inventory is not tracked | "In stock" (green) |
| Product was deleted | No badge |

### Card buttons

**View all orders** (Recent orders) opens the orders list. **View all products**
(Top selling products) opens the products list. Both are ghost buttons. A
button shows when the pointer is over its card or keyboard focus is inside it.
On a device without hover, both buttons always show.

### Layout

The metric cards are in 4 columns from 1024 px, 2 columns from 600 px and 1
column below. The two list cards are side by side, with the same height, from
782 px and stacked below.
While the data loads, skeletons show in their place. If the request fails, an
error message shows and the rest of the page still renders.

## 8. Storage

One option, `kirki_ecommerce_setup_checklist`:

```php
[
    'completed'     => ['products' => 1727850000, 'payments' => 1727853600], // step id => Unix timestamp
    'preconfigured' => ['shipping'],                                        // written once at store setup
]
```

The option is created the first time a step completes, or at store setup.

## 9. REST API

All routes require a user who can manage the store (`manage_options`) and a valid
REST nonce.

| Method | Route | Does |
|---|---|---|
| `GET` | `/wp-json/kirki/ecommerce/v1/setup-checklist` | Records the steps that are now met, then returns the visible steps. |
| `POST` | `/wp-json/kirki/ecommerce/v1/setup-checklist/{step}/complete` | Records `tax` or `shipping` as completed and keeps an earlier completion time. Any other step returns `422`. |

Both return the same shape:

```json
{
  "data": {
    "steps": [
      { "id": "products", "is_completed": true, "is_preconfigured": false, "has_data": true },
      { "id": "payments", "is_completed": false, "is_preconfigured": false, "has_data": false }
    ]
  },
  "message": "Setup checklist retrieved successfully."
}
```

The titles, descriptions, time estimates and button targets are not in the
response. They are in the admin app (`resources/app/features/home/lib/steps.ts`).

### Store overview

| Method | Route | Does |
|---|---|---|
| `GET` | `/wp-json/kirki/ecommerce/v1/dashboard/overview` | Returns the metrics, the 5 most recent orders and the top 5 products (section 7). |

```json
{
  "data": {
    "metrics": {
      "base_total_sales": 120,
      "base_total_sales_money_object": { "raw": 120, "display": "$120.00", "currency": { "code": "USD", "symbol": "$" } },
      "base_net_sales": 80,
      "base_net_sales_money_object": { "raw": 80, "display": "$80.00", "currency": { "code": "USD", "symbol": "$" } },
      "orders_count": 1,
      "products_sold": 2
    },
    "recent_orders": [ { "id": 12, "order_number": "#1012", "payment_status": "unpaid", "...": "same shape as GET /orders" } ],
    "top_products": [
      {
        "product_id": 7,
        "product_name": "T-shirt",
        "image": null,
        "units_sold": 5,
        "base_revenue": 50,
        "base_revenue_money_object": { "raw": 50, "display": "$50.00", "currency": { "code": "USD", "symbol": "$" } },
        "availability_status": "in_stock",
        "track_inventory": true,
        "inventory": 59
      }
    ]
  },
  "message": "Dashboard overview retrieved successfully."
}
```

`recent_orders` items use the same resource as the order list (`OrderListResource`).
`product_id` is `null` for a product that was deleted. The endpoint does not check
whether setup is complete; the admin app only calls it in overview mode. The
queries are in `app/Services/DashboardService.php`.

## 10. Resetting the checklist in development

Delete the option to clear every completion and the preconfigured snapshot:

```bash
wp option delete kirki_ecommerce_setup_checklist
```

The next Home load checks the rules again. Steps whose data still exists complete
again at once. This also brings back the checklist in place of the store overview
until every step completes again.

## 11. Requirements and limitations

- **The checklist cannot be dismissed.** It goes away only when every step is
  completed. Then the store overview replaces it for good.
- **Completion is not a health check.** A sticky step stays checked after its data
  is removed, for example after all payment methods are disabled.
- **Earlier completions stay.** A step that completed under an earlier, looser
  rule stays completed. Reset the checklist (section 10) to check it again.
- **The "Cash on delivery" button only opens Payment settings.** It does not enable
  Cash on Delivery.
- **No CSV import.** Step 1 has only **Add products** and **Load sample data**.
- **The sample download is simulated.** The "Downloading product sample..." phase
  is a timer. The products come from the plugin, not from a remote server.
- **Sample data needs an empty store.** The import does nothing when a product
  exists, so the button does not show then.
- **Template gallery is a placeholder.** There is no template catalog or API.
- **Overview is all time only.** There is no date range, comparison or chart.
- **Net sales subtracts the full refund.** Refunds do not record how much of them
  was tax or shipping, so the refunded tax and shipping are subtracted a second
  time.
- **Products sold is not reduced by refunds.** Refunds do not record items.
- **No caching.** The overview runs its queries on each Home visit.

## 12. Where this differs from WooCommerce

### Task list

- **Sticky completion.** Most WooCommerce tasks check the store's data on each
  load. Here a completed step stays completed.
- **No skip or hide.** WooCommerce lets the merchant hide the task list. This
  checklist is always shown.
- **Preconfigured data needs a confirmation.** WooCommerce has no equivalent of
  section 5.
- **Fewer tasks, no extension API.** The four steps are fixed. There is no filter
  or hook that adds a step.

### Store overview (compared with WooCommerce Analytics / Home)

- **Which orders count.** WooCommerce Analytics counts orders by their *order*
  status (by default processing, completed and on-hold). Here an order counts by
  its *payment* status (paid, refunding or refunded).
- **Net sales.** In WooCommerce, net sales is gross sales minus coupons and
  refunds, with tax and shipping never included. Here net sales starts from the
  order total, which is already after coupons, and subtracts tax, shipping and the
  **full** refund amounts. A refund that included tax or shipping makes net sales
  lower than WooCommerce would show.
- **Items sold and refunds.** WooCommerce subtracts refunded items. Here they
  stay counted.
- **No date range, no comparison, no charts, no reports pages.** WooCommerce's
  Home and Analytics have all of these. "View all products" opens the plain
  products list, not a sales report.
- **No extension API.** The cards are fixed. There is no filter or hook that adds
  a metric.
