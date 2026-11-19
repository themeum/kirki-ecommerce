# Home Page, Setup Checklist and Store Overview

The Home page is the plugin's dashboard root (`#/`). It opens after onboarding and
from the **eCommerce → Home** admin menu. Until setup is done, it shows a setup
checklist that leads a new merchant through the tasks a store needs before it can
sell. When every checklist step is complete, the checklist is replaced by a store
overview that the merchant can customize: key numbers for a period, recent
orders, top selling products, the work that needs them and the variants to
restock. While setup is not done, a gallery of storefront templates shows below
the checklist. When the store has an order, a one-time "first sale" card and
confetti celebration show at the top of the page in both modes.

- [1. Quick start](#1-quick-start)
- [2. The page](#2-the-page)
- [3. The checklist steps](#3-the-checklist-steps)
- [4. When a step completes](#4-when-a-step-completes)
- [5. Preconfigured steps](#5-preconfigured-steps)
- [6. Loading sample data](#6-loading-sample-data)
- [7. Store overview](#7-store-overview)
- [8. First sale](#8-first-sale)
- [9. Storage](#9-storage)
- [10. REST API](#10-rest-api)
- [11. Resetting in development](#11-resetting-in-development)
- [12. Requirements and limitations](#12-requirements-and-limitations)
- [13. Where this differs from WooCommerce](#13-where-this-differs-from-woocommerce)

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
| Heading | While setup is not done: "Let's get you started", with a **View Live Site** link that opens the site URL in a new tab and a primary **Add Product** button that opens the create product page. After: "Welcome, {name}", the period subtitle, the merchant's quick actions and the **Customize home** button (section 7). |
| First sale card | Only while the store has a first order that this admin did not close, and nobody clicked **Fulfill order** (section 8). At the top, in both modes. |
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
products. A click sends `POST /onboarding/sample-data` at once. This is the
endpoint that the onboarding wizard uses. It downloads the sample products of the
store's industry, with their categories, tags and images, and creates them with the
inactive `WELCOME50` starter coupon (see
[`docs/onboarding.md`](onboarding.md#5-loading-sample-data)).

While the request runs, the button text is "Downloading sample data...", and a bar
runs along the bottom edge of the button. The bar covers the whole import. It is
time-based, because the server reports no progress:

- The bar moves from 0% to 95% in 10 seconds, fast at the start and slower near 95%.
- After 10 seconds, the bar moves slowly toward 99%. It does not reach 100% before
  the request succeeds.
- When the request succeeds, the bar goes to 100%, also before 10 seconds.

While the import runs, **Add products** is disabled and **Load sample data**
ignores clicks. If the import succeeds:

- the checklist reloads in the background, and step 1 shows the green check when
  the reload ends;
- the **Load sample data** button goes away, because the store now has products;
- after about 1 second, step 1 closes and the next incomplete step opens. If the
  reload takes longer than this pause, step 1 stays open with its green check.

No success toast shows. If the import fails, an error toast shows, the button
reads **Load sample data** again and both buttons work again.

The flow is in `resources/app/features/home/hooks/use-sample-data-import.ts`. The
progress durations and the default pause are constants at the top of that file.

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

In this mode the page is wider (the `xl` page container, 1024 px), and the
template gallery is not shown.

### Header

- **Heading.** "Welcome, {name}". The name is the current user's first name, or
  the display name when the first name is empty. With neither, the heading reads
  "Welcome".
- **Period subtitle.** "Your store at a glance: **This month ▾**". The menu has
  This month (default), This week, Today and All time. The period changes the
  key numbers and the top selling products at once. It does not change Recent
  orders, Needs your attention or Restock soon, because they show the store as it
  is now.

  | Period | Days | Analytics range sent |
  |---|---|---|
  | This month | The 1st of this month to today | `month_to_date` |
  | This week | The first day of this week (WordPress **Settings → General → Week Starts On**) to today | `week_to_date` |
  | Today | Today | `today` |
  | All time | The day of the store's first order, of any status, to today | `all_time` |

  Days are in the browser's time zone, the same as the Analytics page. Home never
  compares with an earlier period: no change percentage, arrow or "vs" text.
- **Quick actions.** Up to 3 buttons, chosen in the Customize home sheet, from
  Create order, View live site, Add product, Create coupon and Add customer. The
  first action that is on is the primary **main button**, at the right. The
  others are secondary, in list order, to its left. View live site opens the site
  in a new tab; the others open the create page of that item. Default: Create
  order (main) and View live site.
- **Customize home.** An icon button (sliders) at the right of the quick actions.
  It opens the Customize home sheet.

### Customize home sheet

The sheet opens from the right. It has three groups of items and an Amounts
option. Each item has a drag handle
(pointer or keyboard: focus the handle, press Space, use the arrow keys, press
Space) and a checkbox. Each group has an info icon that explains it.

| Group | Items | Limit | Default on |
|---|---|---|---|
| Quick actions | The 5 actions above. The first one that is on shows "Main button". | 3, shown as "N/3" | Create order, View live site |
| Key numbers | The 11 Analytics key metrics | 4, shown as "N/4" | Total sales, Net sales, Orders, Items ordered |
| Sections | Key numbers, Recent orders, Top selling products, Restock soon, Needs your attention | None | All except Restock soon |

**Amounts** sets how money shows on Home: **Short** (`$20.3K`, the default) or
**Long** (`$20,345.00`). When the key numbers are loaded, each option shows an
example in parentheses, for example "Short ($20.3K)". This option is Home's own.
It does not change, and does not follow, the Amounts option of the Customize
analytics sheet.

When a group is at its limit, the checkboxes of the items that are off are
disabled and muted. A section group has no minimum: every section can be off.
**Reset to default** puts back the default layout and Short amounts, and keeps
the selected period.
**Done** closes the sheet. Every change shows on the page at once.

The sheet can **float**. Drag its header (the move icon) to put it anywhere on
the screen. A floating sheet has no dark overlay, so the merchant can see and
scroll the page behind it, and a click on the page does not close it. The **Dock
to the right** button, left of Close, puts it back at the right edge. The
browser remembers whether the sheet floats and where. On screens narrower than
640 px, the sheet does not float. The Customize analytics sheet floats in the
same way, and remembers its own position.

Each key number card and each section card also has a **More actions** menu
(three dots, shown on hover or focus) with **Hide from page**. It does the same as
clearing the checkbox in the sheet.

### Sections and layout

Sections show in the merchant's order. Key numbers takes the full width. The other
sections share rows of two from 782 px. A section that is alone in its row takes
the full width. Below 782 px, every section takes the full width. Each section
loads its own data: it shows its own skeleton while loading, and its own error
with a retry button when its request fails. A section that is off sends no
request. When every section is off, the page reads "Every section is hidden.
Customize Home to add some back."

Each card has an information icon next to its title. The icon shows only while
the pointer is over its card (always on a device without hover). Its tooltip
describes the card in plain language.

### Key numbers

One card for each key number that is on, in the order of the sheet: 4 columns
from 1024 px, 2 columns from 600 px and 1 column below. The values, titles and
info texts come from the Analytics page (`GET /analytics/metrics/kpis` with the
period and `compare=none`), so a number on Home is the same as that metric on
Analytics for the same days. See [Analytics](analytics.md) for each definition.
Money shows in the Amounts format of the Customize home sheet (**Short** `$20.3K`
or **Long** `$20,345.00`). In Short format, the full amount is the hover title.
A card is not a link. When no key number is on, the section reads "No key numbers
chosen." with a **Customize** button.

### Recent orders

The 5 newest orders by creation date, **of any payment status**. Each row shows
the order number, a fulfillment status badge and a payment status badge (the
same badge colors as the orders list), the customer name,
the number of products, the total in the order's own currency and the time since
the order was created in short form ("Just now", "45m ago", "3h ago", "2d ago",
"4mo ago", "2y ago"). A row opens the order. With no orders, the card reads "No
orders yet", centered in the card. **View all orders** opens the orders list.

### Top selling products

The Analytics **Sales by product** data for the period
(`GET /analytics/metrics/sales_by_product`): up to 5 products from paid orders
(payment status paid, refunding or refunded) paid in the period, in the base
currency. Variants are merged into their product. Rows are sorted by **net
sales** (item totals after discounts, without tax), then by units sold. Each row
shows a 42 × 42 px image, then the name with a stock line below it. At the right,
it shows the net sales in bold ("$3.1K", with the full amount as the hover title
in Short format) and the units sold below it. A deleted product shows with its
recorded name and image, and no stock line. With no sales in the period, the
card reads "No sales yet". **View all products** opens the products list.

The stock line is text, not a badge. It shows the product's current stock across
all of its variants, with the same rules as the product list:

| Product state | Stock line |
|---|---|
| A variant tracks inventory and the summed available quantity of the tracked variants is above 0 | "{N} left in stock": gray, or red when the product is low on stock |
| Out of stock (every variant is out of stock) | "Out of stock" (red) |
| Any other state, for example inventory is not tracked | "In stock" (gray) |
| Product was deleted | No stock line |

### Needs your attention

Three checks of the store as it is now. Archived orders never count. An order
uses an **offline** payment method when the payment snapshot saved on the order
marks it offline (`payment_metadata.payment_provider.is_offline`).

| Check | Counts | Line under the label | Opens |
|---|---|---|---|
| Orders to ship | Orders whose fulfillment status is `unfulfilled` or `processing`, and whose payment status is `paid`, or `unpaid` with an offline method | "N waiting over 2 days": orders paid, or created when not paid, more than 2 days ago | Orders with the **To ship** filter |
| Payments to collect | Orders whose payment status is `unpaid` with an offline method and whose fulfillment status is not `cancelled`, plus orders whose payment status is `failed` that were created in the last 7 days | The sum of their base-currency totals | Orders with the **To collect** filter |
| Out of stock | Variants in the Inventory list's **Out of stock** filter: tracked with 0 or less available, or not tracked and marked out of stock | — | Inventory with the **Out of stock** filter |

Checks with a count above 0 are listed first; the others show a check mark and
"Clear". The card header reads "N of 3 need you", or "All caught up". The count of
a check and the list it opens use the same query condition, so they always
match.

### Restock soon

Off by default. Up to 5 tracked variants with more than 0 available and at or
under their low-stock threshold (the store default threshold when the variant has
none), fewest available first. Each row shows the product image, the product
name, the variant name and "N left", and opens that variant's inventory page.
**View inventory** opens the Inventory list with the **Low stock** filter. With no
such variant, the card reads "Nothing is low on stock."

## 8. First sale

When the store has its first order, Home celebrates it once for each admin and
shows a card that leads the team to fulfil that order.

### The first order

The store's oldest order by creation time (the lower id first when two orders
have the same time) that is **not archived**. Every payment status and
fulfillment status counts, and so do orders that an admin created and orders
that were imported. If that order is deleted, the next oldest order is the
first order.

### The card

A full-width card at the top of the page content: above the setup checklist
while setup is not done, and above the first overview section after. It is not
a section of the Customize home sheet.

- A blue bag icon in a light-blue squircle. A small red dot pops onto the bag
  when the card appears, and again when the pointer moves over the card.
- **You made your first sale!**
- "**{customer}** ordered **{total}** ({order number}). Every store starts with
  one order. This one is yours." The total is in the order's own currency. The
  order number is shown as stored, with the store's order prefix (`#` by
  default), and opens the order. An order without a customer name reads "A
  customer".
- **Fulfill order** and **Close** (X).

The card shows for an admin while all of these are true:

| Rule | Ends when |
|---|---|
| A first order exists | Every order is deleted or archived |
| The store is not done | Any admin clicks **Fulfill order** |
| This admin did not close the card | This admin clicks **Close** |

- **Close** hides the card for the admin who clicks it. Other admins still see
  it. If the request fails, an error toast shows and the card stays hidden
  until the page reloads.
- **Fulfill order** marks the store as done, removes every admin's close
  record, and opens the order detail page. After that, no admin sees the card.
  If the request fails, an error toast shows and the order still opens.
  Fulfilling the order on the order page, without this button, does not hide
  the card.

Stores that already had orders before this feature also show the card, once
for each admin, with their oldest order.

### The celebration

When the card shows for an admin who was not celebrated yet, a confetti burst
plays over the page: about 150 pieces fire from the two bottom corners, arc up
and flutter down. A few pieces land on the top edge of the card and of one
other card, rest there for a few seconds, then tip off and fall. The canvas
does not take clicks, is hidden from screen readers, and removes itself when
the last piece leaves the screen or when the admin leaves Home.

The admin is recorded as celebrated when the confetti starts, so a reload does
not play it again. If that request fails, it plays again on the next visit. The
confetti plays only together with the card: an admin who closed the card, or
who first opens Home after **Fulfill order**, never sees it. It plays also when
the operating system's "Reduce motion" setting is on.

## 9. Storage

One option, `kirki_ecommerce_setup_checklist`:

```php
[
    'completed'     => ['products' => 1727850000, 'payments' => 1727853600], // step id => Unix timestamp
    'preconfigured' => ['shipping'],                                        // written once at store setup
]
```

The option is created the first time a step completes, or at store setup.

The first-sale state (section 8) is one more option, `kirki_ecommerce_first_sale`,
that is not autoloaded:

```php
[
    'done_at'    => null,               // Unix time of the first "Fulfill order" click
    'celebrated' => [1 => 1794900000],  // user id => Unix time of the first celebration
    'dismissed'  => [5 => 1794903700],  // user id => Unix time of the close; emptied by "Fulfill order"
]
```

The option is created by the first celebration, close or fulfill. A missing or
unreadable value counts as empty.

The Home layout is **not** stored on the server. The browser keeps it in local
storage, per browser:

| Key | Holds |
|---|---|
| `kirki-ecommerce:home:layout` | The period, the amount format, and the order and on/off state of each quick action, key number and section. |
| `kirki-ecommerce:home:customize-sheet` | Whether the Customize home sheet floats, and where. |
| `kirki-ecommerce:analytics:customize-sheet` | The same for the Customize analytics sheet. |

A saved layout ignores keys that Home does not know, adds new keys at the end of
their group with their default state, keeps only the first 3 quick actions and
the first 4 key numbers that are on, uses This month for an unknown period, and
uses Short for a missing or unknown amount format.
A value that cannot be read gives the default layout. When local storage is
blocked, Home works and keeps the layout until the page closes.

## 10. REST API

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
| `GET` | `/wp-json/kirki/ecommerce/v1/dashboard/overview` | Returns all-time metrics, the 5 most recent orders and the all-time top 5 products by units. Home reads only `recent_orders` from it; the other fields stay for compatibility. |
| `GET` | `/wp-json/kirki/ecommerce/v1/dashboard/attention` | Returns the Needs your attention counts and the Restock soon rows (section 7). |

```json
{
  "data": {
    "metrics": {
      "base_total_sales": 120,
      "base_total_sales_money_object": { "raw": 120, "display": "$120.00", "short_display": "$120.00", "currency": { "code": "USD", "symbol": "$" } },
      "base_net_sales": 80,
      "base_net_sales_money_object": { "raw": 80, "display": "$80.00", "short_display": "$80.00", "currency": { "code": "USD", "symbol": "$" } },
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
        "base_revenue_money_object": { "raw": 50, "display": "$50.00", "short_display": "$50.00", "currency": { "code": "USD", "symbol": "$" } },
        "availability_status": "in_stock",
        "track_inventory": true,
        "inventory": 59
      }
    ]
  },
  "message": "Dashboard overview retrieved successfully."
}
```

In this response, `metrics` counts orders whose payment status is paid,
refunding or refunded, for all time. Net sales is the order total minus tax,
shipping without its tax and completed refunds. Top products are sorted by units
sold, then by revenue (`base_total`). These rules are kept for clients of the
endpoint; Home itself now shows Analytics numbers.

The metric and top product money objects have `short_display`.
`recent_orders` items use the same resource as the order list (`OrderListResource`),
so their money objects have no `short_display`.
`product_id` is `null` for a product that was deleted. The endpoint does not check
whether setup is complete; the admin app only calls it in overview mode. The
queries are in `app/Services/DashboardService.php`.

```json
{
  "data": {
    "to_ship": { "count": 3, "late_count": 1 },
    "to_collect": {
      "count": 2,
      "base_total_money_object": { "raw": 100, "display": "$100.00", "short_display": "$100.00", "currency": { "code": "USD", "symbol": "$" } }
    },
    "out_of_stock": { "count": 4 },
    "low_stock": {
      "total": 6,
      "items": [
        { "variant_id": 9, "product_id": 3, "product_name": "Mug", "variant_name": "Blue / Large", "image": null, "available_quantity": 2 }
      ]
    }
  },
  "message": "Dashboard attention items retrieved successfully."
}
```

The attention endpoint takes no date range. The queries are in
`DashboardService::get_attention()`; the order conditions are
`Order::scope_only_needing_attention()` and the stock conditions are
`Variant::scope_only_out_of_stock()` and `Variant::scope_only_low_stock()`.

### First sale

| Method | Route | Does |
|---|---|---|
| `GET` | `/wp-json/kirki/ecommerce/v1/home/first-sale` | Returns the state for the current user. |
| `POST` | `/wp-json/kirki/ecommerce/v1/home/first-sale/celebrated` | Records the current user as celebrated. Keeps an earlier time. |
| `POST` | `/wp-json/kirki/ecommerce/v1/home/first-sale/dismiss` | Records the current user's close. Keeps an earlier time. |
| `POST` | `/wp-json/kirki/ecommerce/v1/home/first-sale/fulfill` | Marks the store as done (keeps an earlier time) and removes every close record. |

All four return the state for the current user:

```json
{
  "data": {
    "is_visible": true,
    "should_celebrate": true,
    "order": {
      "id": 12,
      "order_number": "#2026-2236",
      "customer_name": "Ibrahim Fischer",
      "base_total_money_object": { "raw": 43.88, "display": "£43.88", "currency": { "code": "GBP", "symbol": "£" } }
    }
  },
  "message": "First sale retrieved successfully."
}
```

`is_visible` is true when a first order exists, the store is not done and the
current user did not close the card. `should_celebrate` is true when the card
is visible and the current user was not celebrated. `order` is `null` when the
store has no first order. The order fields use the same resource as the order
list. The rules are in `app/Services/FirstSaleService.php`.

### Other API additions used by Home

| Route | Addition |
|---|---|
| `GET /analytics/metrics/{key}`, `GET /analytics/regions` | `range=week_to_date` and `range=all_time`. All time has no comparison, whatever `compare` asks. The Analytics page date control does not offer them. |
| `GET /orders` | `attention=to_ship` or `attention=to_collect`. The order list reads it from its address and shows it as a removable chip. Another value returns `422`. |
| `GET /variants` | `inventory_type=low_stock`. The Inventory list offers it as **Low stock**. |

## 11. Resetting in development

Delete the option to clear every completion and the preconfigured snapshot:

```bash
wp option delete kirki_ecommerce_setup_checklist
```

The next Home load checks the rules again. Steps whose data still exists complete
again at once. This also brings back the checklist in place of the store overview
until every step completes again.

Delete the first-sale option to show the card and play the celebration again
for every admin:

```bash
wp option delete kirki_ecommerce_first_sale
```

## 12. Requirements and limitations

- **The checklist cannot be dismissed.** It goes away only when every step is
  completed. Then the store overview replaces it for good.
- **Completion is not a health check.** A sticky step stays checked after its data
  is removed, for example after all payment methods are disabled.
- **Earlier completions stay.** A step that completed under an earlier, looser
  rule stays completed. Reset the checklist (section 11) to check it again.
- **The "Cash on delivery" button only opens Payment settings.** It does not enable
  Cash on Delivery.
- **No CSV import.** Step 1 has only **Add products** and **Load sample data**.
- **The sample data progress is time-based.** The import is one request, and the
  bar follows a fixed 10 second curve, not the real work. The text "Downloading
  sample data..." also covers the time in which the server creates the records.
- **The button needs an empty store.** The button shows only while the store has no
  products. The import itself skips only the sample products that exist (matched
  by SKU), so a load that was cut off can be run again.
- **Template gallery is a placeholder.** There is no template catalog or API.
- **No comparison on Home.** The period has no earlier period to compare with,
  and there are no charts. Use the Analytics page for that.
- **The layout is per browser.** It is in local storage, so it does not follow
  the merchant to another browser or computer.
- **No cash on delivery type.** Offline payment methods are names that the
  merchant makes, so Home cannot tell cash on delivery from bank transfer. An
  unpaid offline order counts both in Orders to ship and in Payments to collect,
  also before it is delivered.
- **No failed refunds or returns.** Refunds have no failed status and there are
  no return requests, so Needs your attention has no check for them.
- **No Goal section and no import.** The Goal section and an Import products
  quick action are not built yet.
- **No caching.** Each section runs its queries on each Home visit.
- **The first-sale card ends only on its button.** Fulfilling the order
  elsewhere does not hide it. Each admin can close it.
- **First sale on an existing store.** A store that already had orders when it
  updated celebrates its oldest order, which can be old or imported.
- **The confetti ignores "Reduce motion".** It plays also when the operating
  system asks for less motion.
- **Two admins at the same moment.** The first-sale state is one option. If two
  admins write it at the same moment, one write can be lost, so one admin can
  see the card or the celebration once more.

## 13. Where this differs from WooCommerce

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

- **Numbers come from this plugin's Analytics.** The key numbers and top
  products use the Analytics definitions (see
  [Analytics: Where this differs from WooCommerce](analytics.md)), not
  WooCommerce Analytics.
- **Four fixed periods, no comparison.** WooCommerce Home's performance block has
  a date range picker and compares with the previous period. Here the merchant
  picks This month, This week, Today or All time, and there is no comparison.
- **Per-browser layout.** WooCommerce saves the Home layout per user on the
  server. Here it is in the browser's local storage.
- **Fewer to-do items.** WooCommerce's "Things to do next" and activity panels
  cover reviews, stock, orders and more, and extensions can add to them. Here
  Needs your attention has three fixed checks and Restock soon uses only the
  low-stock threshold, not sales pace.
- **Short amounts.** WooCommerce Home shows full amounts. Here money is Short
  (`$20.3K`) by default, and the merchant can select Long in the Customize home
  sheet. The unit letters (K, M,
  B, T) are English in every language. Recent orders show the full order total.
- **No extension API.** The sections, checks and quick actions are fixed. There
  is no filter or hook that adds one.

### First sale

- **WooCommerce has no first-sale card or celebration.** Its Home shows the
  first order only in its activity panels and order lists.
