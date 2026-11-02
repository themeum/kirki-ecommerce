# Migrating from another store plugin

A guided migration that moves a store's data from WooCommerce into Kirki
eCommerce. It is offered at the end of the onboarding wizard when WooCommerce
is found on the site. It reads WooCommerce data and adds records to Kirki. It
never changes or deletes anything in WooCommerce.

The engine does not know WooCommerce. WooCommerce is the first *source*; another
plugin is added as another source (section 7).

- [1. Quick start](#1-quick-start)
- [2. What is migrated](#2-what-is-migrated)
- [3. How a migration runs](#3-how-a-migration-runs)
- [4. Safety rules](#4-safety-rules)
- [5. Reports and notes](#5-reports-and-notes)
- [6. Versions and add-ons](#6-versions-and-add-ons)
- [7. Adding a new source](#7-adding-a-new-source)
- [8. Where this differs from WooCommerce](#8-where-this-differs-from-woocommerce)

---

## 1. Quick start

1. Finish the onboarding wizard. On the last screen, if WooCommerce is installed
   and its version is supported, the **Migrate from WooCommerce** button shows.
2. The next screen scans the WooCommerce data and lists what can be moved, for
   example `Products (100)` and `Orders (1000)`. Every group is checked. Uncheck
   a group to leave it out.
3. Press **Migrate**. The progress bar fills and the line under it says what is
   happening, for example "Migrating Products 31-60 of 100".
4. If a request fails, the migration stops and shows **Retry**. It continues from
   the last finished chunk. Closing the page is safe: the next visit shows **Retry**
   for an unfinished run.
5. At the end the summary shows one number for each migrated group. Skipped items and
   notes are folded under **N things to review**. **Go to dashboard** leaves the wizard.
   **Skip** on the scan screen leaves without migrating.
6. The finished state is saved with the run. After a reload the same summary shows
   again, with **Revert** and **Go to dashboard**.
7. **Revert** asks for confirmation, then deletes the Kirki records that the migration
   created and restores the settings it changed. It shows progress. When it ends, the
   scan screen shows again and the merchant can migrate again.

WooCommerce does not have to be active. It has to be installed, with a version of
7.0 or higher.

To migrate after the onboarding wizard is finished, open **Migrate from WooCommerce**
on the dashboard. It opens the same screens at `#/migration/woo-commerce`. The button
shows only when a supported WooCommerce is found. **Skip** and **Go to dashboard**
return to the dashboard.

---

## 2. What is migrated

| Group | What moves | Notes |
|---|---|---|
| Settings | Store currency, store address, tax calculation switch, tax rates, shipping zones | Runs first. See section 4 for what is kept and what is skipped. |
| Categories | Name, slug, description, image, parent | Parents are created first. |
| Tags | Name, slug, description | |
| Brands | Name, slug, description, logo | |
| Attributes | Global attributes with their values | |
| Products | Simple and variable products with their variations | Price, sale price, SKU, stock, weight, images, categories, tags, brand and SEO fields. A variation becomes a variant. |
| Customers | Registered customers with billing and shipping addresses | Linked to the existing WordPress user. No password is read. |
| Coupons | Code, percentage or fixed discount, free shipping, expiry, limits, minimum spend, product, category and email limits | The usage count is kept. |
| Orders | Status, dates, number, amounts, addresses, payment method, lines, fees, shipping, tax, coupons, notes and refunds | Orders are read from the order tables or from posts, whichever WooCommerce uses. |

Groups run in this order, because later groups point to earlier ones:
settings, then categories, tags, brands and attributes, then products, customers,
coupons, and last orders. If a group is unchecked, the groups after it still run;
what they cannot link is reported.

Product images are not copied. A product points to the same WordPress media that
WooCommerce used.

---

## 3. How a migration runs

A store can have thousands of orders, so no request does all the work.

- The browser sends one request for each **chunk** of one group: 30 items for
  products and orders, 50 for the other groups.
- After each chunk the server saves the run in the `kirki_ecommerce_migration_runs`
  table: the status of each group, the last source id that was processed, and the
  counts.
- Every migrated record is also saved in the record ledger,
  `kirki_ecommerce_migration_record_ledger`, as *source id → Kirki id*, with a mark for
  whether the migration created the record or reused an existing one. This is how an order finds its product, variant, customer
  and coupon, and why running the migration twice creates nothing twice.
- Resume reads the saved position and continues after it.

The REST endpoints, all for store administrators only:

| Method and path | Purpose |
|---|---|
| `GET /migration/sources` | Detected sources, their version state and add-ons |
| `POST /migration/scan` | Groups and counts of a source. Reads only. |
| `GET /migration/runs/latest?source=` | The latest run of a source that was not reverted |
| `POST /migration/runs` | Start a run for chosen groups, or return the unfinished run |
| `POST /migration/runs/{id}/chunk` | Run the next chunk and return the progress |
| `GET /migration/runs/{id}` | Saved state and skipped items of a run |
| `POST /migration/runs/{id}/revert` | Start reverting a finished or failed run |
| `POST /migration/runs/{id}/revert/chunk` | Revert the next chunk and return the progress |

---

## 4. Safety rules

- **WooCommerce is never changed.** The migration only reads from it.
- **Kirki data is never changed or deleted.** Records are added. A slug, SKU or
  coupon code that is already used gets a suffix (`-2`) and a note. A customer with
  the same email is reused.
- **Nothing is sent or counted.** While data is imported there are no emails, no
  stock changes, no coupon usage counting and no order events. Orders keep their
  original dates, number, status and totals, and are not calculated again. This
  holds because the migration writes records directly through services and models.
  It does not use the order flow that sends mail, changes stock and counts coupons.
- **Revert is limited.** It changes only Kirki data. It deletes only records that the
  migration created, never records it reused. A record that other Kirki data uses
  (for example a product in a new order) is kept, and the result says how many were
  kept. Settings are restored from a copy saved before the migration changed them.
- **No secrets.** Passwords and payment gateway keys are not read or copied.
- **A rule is never made wider.** If a coupon limit, tax rate or shipping location
  cannot be kept exactly, it is skipped and reported. A coupon limited to products
  that are not in Kirki is skipped, not made unlimited.
- **Settings are filled, not replaced.** An empty Kirki setting is filled. A setting
  the merchant already filled is kept, and the report says when it differs. The store
  currency follows WooCommerce only when Kirki has no products or orders, because
  prices are stored in it.

---

## 5. Reports and notes

When an item cannot be migrated it is skipped, with its source id, group and reason,
and the run goes on. The skipped items are saved with the run and listed in the
summary.

A change that is not a failure produces a *note*, for example "The SKU "A" was
already used, so it was saved as "A-2"" or "Order 1234 is in EUR, which is not the
store currency". Notes are shown in the summary of the session. They are not saved
with the run, so they are gone after the page is closed.

---

## 6. Versions and add-ons

The migration chooses how to read data from the tables that exist, not from the
version number. Orders are read from the order tables only when they exist and
WooCommerce uses them (the "High-performance order storage" setting); otherwise
from posts. A WooCommerce version below 7.0 is not offered.

The data structure comes from the published WooCommerce documentation and source.
Some details are not confirmed word for word and are handled defensively: the full
list of order statuses (an unknown `wc-*` status is saved as pending, with a note)
and the customer-note flag of an order note.

Add-ons are detected and listed on the scan screen. Subscriptions, Bookings,
Memberships, Product Bundles, Composite Products and Product Add-Ons are shown as
**not migrated**, and their data is ignored. Yoast SEO and Rank Math are supported:
the product SEO title and description are copied. A title that still has template
variables such as `%%title%%` is not copied.

---

## 7. Adding a new source

1. Create `app/Migration/Sources/<Plugin>/` with a class that implements
   `MigrationSource`: `id`, `label`, `detect`, `version_state`, `extensions` and
   `groups`.
2. For each group, extend `AbstractGroupMigrator` and write `count`, `fetch`, `map`
   and `persist`. The base class does the chunking, the record ledger and the skip report.
3. Add the source with the `kirki_ecommerce_migration_sources` filter. WooCommerce
   does this in `app/Migration/Hooks/Filters/RegisterWooCommerceMigrationSource.php`,
   and `MigrationServiceProvider` registers that class. Another plugin can add a
   source the same way.
4. Write records with the services and models, not with the order flow. A group
   that calls the order, coupon or stock flow (for example `CreateOrderAction`)
   would send mail and change stock. Section 4 depends on this.

The screens do not change: they show whatever groups the source reports.

**Where the code lives.** All PHP code is in `app/Migration/`: `Core`, `Contracts`,
`DTO`, `Sources`, `Http` (controller and requests), `Models`, `Database/Migrations`,
`Hooks`, `Constants` and `routes.php`. The rest of the plugin does not call it. The
plugin loads it through one line in `bootstrap/providers.php`:
`MigrationServiceProvider`. The provider adds the two tables, the source filter and
the REST routes. To remove the feature, delete that line and `app/Migration/`.

---

## 8. Where this differs from WooCommerce

What WooCommerce has and Kirki does not, or does differently, and what that means
for the migration:

- **States.** Kirki names states with its own ids and has no state codes, and
  WooCommerce names states by code. A tax rate for a state is skipped, a shipping
  location that is a state, continent or postcode is left out, and a zone with no
  whole-country location is skipped. The state of the store address is not copied.
- **Tax classes.** Only the standard tax class becomes a tax region. Rates of other
  classes are skipped. Several rates of one country are added into one rate.
- **Shipping.** Flat rate, free shipping and local pickup are kept. A flat rate cost
  that is a formula is saved as 0 with a note. Shipping classes and other methods
  are not migrated.
- **Coupons.** Kirki has no maximum spend, exclude sale items, individual use, item
  limit or excluded products and categories. They are listed in a note. Kirki limits
  a coupon to products or to categories, not both.
- **Products.** Grouped and external products are skipped. Display-only attributes,
  dimensions, upsells and cross-sells are not migrated. A variation that accepts any
  value of an attribute is saved without that attribute. A custom (non-global)
  attribute is matched by name to a Kirki attribute, which is created when it does
  not exist; new values may be added to a matched attribute.
- **Fees.** Kirki has no fee lines. A fee becomes a line item without a product.
- **Currency.** WooCommerce keeps no exchange rate. An order in a currency other than
  the store currency keeps its amounts as numbers, with a note.
- **Order status.** WooCommerce has seven statuses and Kirki has three status fields.
  Processing becomes paid and unfulfilled, completed becomes completed and delivered,
  on hold and cancelled depend on whether the order was paid, and refunded and failed
  keep their meaning.
- **Payment methods.** The WooCommerce gateway id is saved on the order as the payment
  provider, with its title. Gateways that Kirki does not have are shown as saved.
- **Customers.** Only registered customers (WordPress users with the customer role)
  are migrated as customers. A guest becomes a customer when an order is migrated,
  once for each billing email.
- **Revert.** WooCommerce has no revert for its own importers. Kirki's revert is not a full
  database rollback: data added after the migration stays, and tax regions and shipping
  zones are restored as a whole to their state before the migration.
- **Notes.** The notes of a session are not saved with the run.
- **Other plugins.** Data of WooCommerce add-ons is not migrated. They are listed on
  the scan screen.
