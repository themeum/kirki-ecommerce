# Home Page and Setup Checklist

The Home page is the plugin's dashboard root (`#/`). It opens after onboarding and
from the **eCommerce → Home** admin menu. It shows a setup checklist that leads a
new merchant through the tasks a store needs before it can sell, and a gallery of
storefront templates.

- [1. Quick start](#1-quick-start)
- [2. The page](#2-the-page)
- [3. The checklist steps](#3-the-checklist-steps)
- [4. When a step completes](#4-when-a-step-completes)
- [5. Preconfigured steps](#5-preconfigured-steps)
- [6. Loading sample data](#6-loading-sample-data)
- [7. Storage](#7-storage)
- [8. REST API](#8-rest-api)
- [9. Resetting the checklist in development](#9-resetting-the-checklist-in-development)
- [10. Requirements and limitations](#10-requirements-and-limitations)
- [11. Where this differs from WooCommerce's task list](#11-where-this-differs-from-woocommerces-task-list)

---

## 1. Quick start

Finish onboarding and press **Go to Dashboard**, or open **eCommerce → Home**. The
first incomplete step is open. Each step's button opens the admin page where the
task is done. When you come back to Home, the checklist checks the store again and
marks the steps that are now done.

## 2. The page

| Part | What it shows |
|---|---|
| Heading | "Let's get you started", and a **View Live Site** link that opens the site URL in a new tab. |
| Setup checklist | "X out of N complete", a percentage, a progress bar and the steps (section 3). |
| Template gallery | Three square template cards (194 × 194 px, with a 150 px cover image). Each card has a **Coming soon** badge at its top-right corner. The cards cannot be clicked. |

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

## 7. Storage

One option, `kirki_ecommerce_setup_checklist`:

```php
[
    'completed'     => ['products' => 1727850000, 'payments' => 1727853600], // step id => Unix timestamp
    'preconfigured' => ['shipping'],                                        // written once at store setup
]
```

The option is created the first time a step completes, or at store setup.

## 8. REST API

Both routes require a user who can manage the store (`manage_options`) and a valid
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

## 9. Resetting the checklist in development

Delete the option to clear every completion and the preconfigured snapshot:

```bash
wp option delete kirki_ecommerce_setup_checklist
```

The next Home load checks the rules again. Steps whose data still exists complete
again at once.

## 10. Requirements and limitations

- **No "all done" state.** The checklist cannot be dismissed or hidden.
- **Completion is not a health check.** A sticky step stays checked after its data
  is removed, for example after all payment methods are disabled.
- **Earlier completions stay.** A step that completed under an earlier, looser
  rule stays completed. Reset the checklist (section 9) to check it again.
- **The "Cash on delivery" button only opens Payment settings.** It does not enable
  Cash on Delivery.
- **No CSV import.** Step 1 has only **Add products** and **Load sample data**.
- **The sample download is simulated.** The "Downloading product sample..." phase
  is a timer. The products come from the plugin, not from a remote server.
- **Sample data needs an empty store.** The import does nothing when a product
  exists, so the button does not show then.
- **Template gallery is a placeholder.** There is no template catalog or API.

## 11. Where this differs from WooCommerce's task list

- **Sticky completion.** Most WooCommerce tasks check the store's data on each
  load. Here a completed step stays completed.
- **No skip or hide.** WooCommerce lets the merchant hide the task list. This
  checklist is always shown.
- **Preconfigured data needs a confirmation.** WooCommerce has no equivalent of
  section 5.
- **Fewer tasks, no extension API.** The four steps are fixed. There is no filter
  or hook that adds a step.
