# Migrating from another store plugin

A guided migration that moves a store's data from WooCommerce into Kirki
eCommerce. It runs on its own at the end of the onboarding wizard when WooCommerce
is found on the site. It is the only way to start a migration. It reads WooCommerce data and adds records to Kirki. It
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
   and its version is supported, a **WooCommerce Migration** row shows. When the
   setup rows are done, it migrates every group with no choice screen. The wizard
   already used WooCommerce for the currency, the store address and the tax switches.
2. Rings show the progress of each row. The top bar says what is happening, for
   example "Migrating · Products 31-60 of 100".
3. If a request fails, the migration stops and shows **Retry** and **Go to Dashboard**.
   **Retry** continues from the last finished chunk. Closing the page is safe: the
   wizard resumes an unfinished run on the next visit.
4. The end state is the **Go to Dashboard** button.

WooCommerce does not have to be active. It has to be installed, with a version of
7.0 or higher.

There is no migration page and no dashboard button. A migration cannot be undone from
the product (see section 8).

---

## 2. What is migrated

| Group | What moves | Notes |
|---|---|---|
| Settings | Weight and dimension units, reviews and star ratings, low stock threshold, guest checkout, coupon codes, store email, selling countries, phone and company checkout fields, tax price display, price position and separators, which emails are on, email footer and colors, tax rates, shipping zones | Runs first. The currency, store address and tax switches are not migrated here: the onboarding wizard sets them. See section 4 for what replaces and what is skipped. |
| Categories | Name, slug, description, image, parent | Parents are created first. |
| Tags | Name, slug, description | |
| Brands | Name, slug, description, logo | |
| Attributes | Global attributes with their values | |
| Products | Simple and variable products with their variations | Price, sale price, SKU, stock, weight, images, categories, tags, brand and SEO fields. A variation becomes a variant. |
| Customers | Registered customers with billing and shipping addresses | Linked to the existing WordPress user. No password is read. |
| Coupons | Code, percentage or fixed discount, free shipping, expiry, limits, minimum spend, product, category and email limits | The usage count is kept. |
| Orders | Status, dates, number (the WooCommerce order id with the order number prefix and suffix of the general settings), amounts, addresses, payment method, lines, fees, shipping, tax, coupons, notes and refunds | Orders are read from the order tables or from posts, whichever WooCommerce uses. |

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
  and coupon, and why a retry creates nothing twice.
- Resume reads the saved position and continues after it.
- When the last chunk of a run reports done, the rows of that source are deleted from the
  ledger, because nothing is reverted. A failed or unfinished run keeps its rows. The run
  itself stays in `kirki_ecommerce_migration_runs`.

The REST endpoints, all for store administrators only:

| Method and path | Purpose |
|---|---|
| `GET /migration/sources` | Detected sources, their version state and add-ons |
| `POST /migration/scan` | Groups and counts of a source. Reads only. |
| `GET /migration/runs/latest?source=` | The latest run of a source |
| `POST /migration/runs` | Start a run for chosen groups, or return the unfinished run |
| `POST /migration/runs/{id}/chunk` | Run the next chunk and return the progress |
| `GET /migration/runs/{id}` | Saved state and skipped items of a run |

---

## 4. Safety rules

- **WooCommerce is never changed.** The migration only reads from it.
- **Records are added, not changed.** Settings are the exception (next rule). A slug, SKU or
  coupon code that is already used gets a suffix (`-2`) and a note. A customer with
  the same email is reused.
- **Nothing is sent or counted.** While data is imported there are no emails, no
  stock changes, no coupon usage counting and no order events. Orders keep their
  original dates, number, status and totals, and are not calculated again. This
  holds because the migration writes records directly through services and models.
  It does not use the order flow that sends mail, changes stock and counts coupons.
- **No secrets.** Passwords and payment gateway keys are not read or copied.
- **A rule is never made wider.** If a coupon limit, tax rate or shipping location
  cannot be kept exactly, it is skipped and reported. A coupon limited to products
  that are not in Kirki is skipped, not made unlimited.
- **WooCommerce settings win.** When a setting exists in WooCommerce, its value
  replaces the Kirki value, even one the merchant changed. When WooCommerce has no
  value, the Kirki value stays. If WooCommerce has tax rates or shipping zones, the
  Kirki list is cleared and replaced as a whole, and nothing restores the old values. The
  store currency is chosen in the onboarding wizard, because prices are stored in it.

---

## 5. Reports and notes

When an item cannot be migrated it is skipped, with its source id, group and reason,
and the run goes on. The skipped items are saved with the run and returned by
`GET /migration/runs/{id}`. The wizard does not list them.

A change that is not a failure produces a *note*, for example "The SKU "A" was
already used, so it was saved as "A-2"" or "Order 1234 is in EUR, which is not the
store currency". Notes are returned by the chunk request. The wizard does not show
them, and they are not saved with the run.

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

Add-ons are detected and reported by the scan. Subscriptions, Bookings,
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

The wizard does not change: it migrates whatever groups the source reports.

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
  classes are skipped. A rate that applies to some postcodes or cities only is also
  skipped, because it would apply to the whole country. Several rates of one country
  are added into one rate.
- **Shipping.** Flat rate, free shipping and local pickup are kept. A flat rate cost
  that is a formula is saved as 0 with a note. A free shipping method that needs a
  minimum amount or a coupon is left out with a note, because Kirki would make it free
  for everyone. The zone for locations that no other zone covers has no Kirki
  equivalent, so its methods are skipped. Shipping classes and other methods are not
  migrated.
- **Variations.** A variation that has no stock management, weight or tax status of
  its own follows its parent, as in WooCommerce. The tax status always comes from the
  parent product.
- **Order coupons.** An order keeps its link to the coupon that the migration made
  from the WooCommerce coupon, also when the code got a suffix.
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
- **No revert.** WooCommerce has no revert for its own importers, and Kirki has none
  either. A migration cannot be undone from the product.
- **A second migration is not guarded.** The ledger is empty after a successful run, so
  a second migration of the same store cannot tell what was migrated. Slugs and SKUs get
  a suffix, customers are reused by email, and orders are added again. The wizard runs
  the migration once.
- **Notes.** The notes of a session are not saved with the run.
- **Other plugins.** Data of WooCommerce add-ons is not migrated. They are reported by
  the scan.
- **Store facts come from the wizard.** WooCommerce migrates its currency, address and
  tax switches in one step. Here the onboarding wizard reads them first, so the
  Settings group no longer touches them.
- **Not migrated settings.** Payment gateways and their keys, legal consents, the shop page,
  price decimals, order and invoice numbering, and email subjects and headings are not
  migrated. A checkout field that WooCommerce hides, and a price separator that Kirki does
  not have, keep the Kirki value and add a note.
- **Zone states.** A shipping zone country is saved with every state of the country
  selected. WooCommerce has the same meaning for a country without a state, but shows it
  as a country only.
- **Settings are replaced.** Kirki replaces a setting with the WooCommerce value, and the
  tax and shipping lists as a whole, without a merge. If every WooCommerce tax rate is
  skipped, the cleared tax list stays empty.
- **No choice of groups.** The wizard migrates all groups. WooCommerce's importers let
  you pick. Here there is no pick.
- **Some options have no Kirki setting.** The "no stock" amount, stock management, and
  account creation at checkout are not migrated. The report says so for the last one.

