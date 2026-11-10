## Context

The wizard already has the completion screen, `useStaggeredRows`, and an optional
`MigrationFlow` (scan, run, summary, revert) behind a "Migrate from WooCommerce" button
on the dashboard and a standalone migration page.
`SettingsGroup` already copies currency, address and tax switches. `VersionProbe`
tells if WooCommerce is installed and supported (minimum 7.0.0).

## Goals / Non-Goals

**Goals:** prefill from WooCommerce; automatic migration as last row; ring progress;
button rules from the proposal.
**Non-Goals:** keeping the standalone migration page or Revert; migrating the state of the
address; guessing industry from product categories.

## Decisions

1. **Defaults endpoint.** `GET /onboarding/defaults` (admin only) returns
   `{ source: 'woocommerce' | null, values: {...} }`. A new PHP class reads the options
   through the existing `SettingsReader` and `VersionProbe`. It returns `source: null`
   when WooCommerce is missing or unsupported. Reason: the wizard must not read WP options
   in JS, and the probe logic stays in one place.
2. **Option map (read):**

   | Wizard field                     | WooCommerce option                                      | Note                                                |
   | -------------------------------- | ------------------------------------------------------- | --------------------------------------------------- |
   | store_name                       | `blogname`                                              | WordPress site title, shared with Woo               |
   | industry                         | `woocommerce_onboarding_profile['industry']`            | first entry; mapped to Kirki list; no match = empty |
   | country                          | `woocommerce_default_country` (before `:`)              | else browser detection                              |
   | address lines, city, postal code | `woocommerce_store_address`, `_2`, `_city`, `_postcode` | only with a country; state skipped                  |
   | currency                         | `woocommerce_currency`                                  | else current behavior                               |
   | is_tax_enabled                   | `woocommerce_calc_taxes` = yes                          |                                                     |
   | is_tax_inclusive_price           | `woocommerce_prices_include_tax` = yes                  |                                                     |

3. **Merge order in the wizard.** `getDefaults(schema)` < prefill < session draft. The
   form waits for the defaults query (one short loading state) before it mounts, so
   `defaultValues` is right on first render. If the query fails, the wizard uses today's
   defaults.
4. **Auto-run.** `useAutoMigration` calls `runner.start(allGroupIds)` after the setup
   rows end and exposes progress only. If a latest unfinished run exists (reload), it
   resumes through `runner.restore`.
   4a. **Single entry point (revision 5).** Onboarding is the only place that runs a migration.
   Remove the `Migration` route in `route-config.ts`, `features/migration/routes.tsx`, the
   page, the dashboard button (and its sources query in `home.tsx`), `MigrationFlow`, the
   scan, summary, revert and layout step components, and the revert parts of
   `useMigrationRunner`, `services/migration.ts`, the schemas and `endpoints.ts`. Keep the
   sources, scan, start, chunk, show and latest requests: onboarding and Retry use them.
   On the backend, remove the revert routes and controller actions, `MigrationReverter`,
   the `revert_record()` method of the `GroupMigrator` contract and of every group, the
   revert states of `RunStatus`, and the settings snapshots (`snapshot()`, `pick()`,
   `email_roots()`, `previous_value`). Revert tests go with them. The `previous_value` and
   revert database columns stay in place, unused, to avoid a schema change. Group
   descriptions stay in the PHP groups, because a scan response still returns them.
5. **Progress bar and text.** N input steps (4 with tax, 3 without) plus the completion
   screen make N + 1 equal parts. An input step fills `(step - 1) / (N + 1)`. On the
   completion screen the wizard computes one bar percent: `N / (N + 1)` plus the last
   part times the work done. With WooCommerce the work done is `0.1 * setupRows done +
0.9 * migration percent`; without it, `setupRows done`. The shell `progressOverride`
   now applies on the whole completion screen, not only while migration runs. The left
   text is `Setting up · <row label>` for the row in progress, then
   `sprintf('Migrating · %s', message)`; the right title is "Setup Complete". A failure
   freezes the percent.
6. **Rings.** New `ProgressRing` UI component (SVG circle, `stroke-dashoffset`). Setup
   rows take a timed value from `useStaggeredRows`; the Migrate row takes the real percent.
   The Spinner stays elsewhere.
7. **Buttons.** `SetupCompleteStep` gets `hasMigration`, `isMigrationDone`, `isBusy` props.
   The footer renders: nothing while busy; failure = error + Retry + Go to Dashboard;
   migration done = Go to Dashboard; otherwise the current three controls.
8. **Settings group.** Remove `save_currency`, `save_address`, `save_tax_switches` and
   their snapshot/revert parts. Add `save_units` and `save_checkout`. Onboarding writes the same values, so a later run finds no change.

**Ledger cleanup (revision 6).** Revert is gone, so the ledger only serves resume inside one
run. `MigrationRunner::clear_ledger(source)` deletes the rows of a source. The run controller
calls it when the last chunk of a run reports done; the runner and the group classes do not,
so a full run in a test still leaves the ledger readable. A failed run keeps its rows. The
`migration_runs` row stays: a reload reads the done state from it. The row label is
`sprintf('%s Migration', source label)`.

## Settings mapping for review (write)

| WooCommerce option                                               | Kirki setting                        | Result                                   |
| ---------------------------------------------------------------- | ------------------------------------ | ---------------------------------------- |
| `woocommerce_weight_unit` (kg, g, lbs, oz)                       | `product.weight_unit`                | map if value is supported, else note     |
| `woocommerce_dimension_unit` (m, cm, mm, in, yd)                 | `product.dimension_unit`             | map if supported, else note              |
| `woocommerce_enable_guest_checkout`                              | `checkout.is_allowed_guest_checkout` | yes/no                                   |
| `woocommerce_enable_coupons`                                     | `checkout.has_apply_coupon_code`     | yes/no                                   |
| `woocommerce_enable_reviews`                                     | `product.is_enabled_reviews`         | yes/no                                   |
| `woocommerce_enable_review_rating`                               | `product.is_enabled_star_ratings`    | yes/no                                   |
| `woocommerce_enable_signup_and_login_from_checkout`              | none                                 | note: Kirki has no setting               |
| `woocommerce_notify_low_stock_amount`                            | `product.low_stock_threshold`        | copied when WooCommerce value is above 0 |
| `woocommerce_notify_no_stock_amount`, `woocommerce_manage_stock` | none                                 | not migrated                             |

**Correction during implementation:** Kirki does have a store-level `low_stock_threshold`
(product settings). It is mapped as shown above, so the earlier open point is closed.

**Replace rule (revised):** When WooCommerce is installed and supported, a WooCommerce
value ALWAYS replaces the Kirki value for every setting in the table above, even if the
merchant changed the Kirki value. When WooCommerce has no value for a setting, the Kirki
preconfigured value stays. The old rule ("fill only when the value is still the shipped
value, otherwise keep and note") is removed. A note is added only for a value that Kirki
cannot hold (unsupported unit, account creation at checkout).

**Tax rates and shipping zones:** If WooCommerce has tax rates, the Kirki `tax_regions`
list is cleared once, before the first WooCommerce rate is added. If WooCommerce has
shipping zones, the Kirki `shipping_zones` list is cleared once the same way. If
WooCommerce has none of a kind, that Kirki list stays. The clear happens in the first
(store) item of the group.

**Industry:** WooCommerce keeps the onboarding industry in
`woocommerce_onboarding_profile['industry']`. The reader accepts a slug or a `{slug}`
object, maps it with `INDUSTRY_MAP`, and the wizard preselects the result. No change.

## Shipping zone states and extra settings (revision 3)

**Zone states.** Checkout already treats a region with empty `states` as the whole
country, but the shipping screen shows no state selected. A zone region now stores every
state id of its country (strings, as in `ShippingZonePresets`) when it has a country and
no state. A country with no states keeps `[]`. This applies in two places: the preset
zones written at onboarding (`ShippingZonePresets::make_zone`, so it covers stores with
and without WooCommerce) and `ShippingZoneMapper::regions` for WooCommerce zones. A
WooCommerce zone that lists a state of the same country still leaves that location out,
as before. **Matching:** `ShippingService::matches_zone` treats a region that holds every
state of its country as the whole country, so a destination without a state still matches
(found during implementation: existing preset tests failed without this).

**Extra settings (read from WooCommerce, written to Kirki).** Same replace rule as above.

| WooCommerce option                                                                                              | Kirki setting                                                                                  | Result                                                               |
| --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `woocommerce_email_from_address`                                                                                | `general.store_email`                                                                          | copied when it is a valid email                                      |
| `woocommerce_allowed_countries` + `woocommerce_specific_allowed_countries` / `woocommerce_all_except_countries` | `general.selling_location_type` + `selling_countries`                                          | all, specific, all except; unknown codes dropped with a note         |
| `woocommerce_checkout_phone_field`, `woocommerce_checkout_company_field`                                        | `checkout.checkout_configuration.phone_number_validation`, `company_name_validation`           | required or optional; `hidden` has no Kirki value: kept, with a note |
| `woocommerce_tax_display_shop`                                                                                  | `tax.is_enabled_display_inclusive_taxed_price`                                                 | `incl` = true                                                        |
| `woocommerce_currency_pos`                                                                                      | `currency.currency_position`                                                                   | left, left_space = before; right, right_space = after                |
| `woocommerce_price_thousand_sep`, `woocommerce_price_decimal_sep`                                               | `currency.thousand_separator`, `decimal_separator`                                             | `.`, `,`, space; other values: kept, with a note                     |
| enabled flag of customer on-hold, processing, completed, note, reset-password, new-account emails               | `email.customer_emails.*.is_enabled`                                                           | yes/no                                                               |
| enabled flag of new-order, cancelled, failed emails                                                             | `email.admin_emails.order_notifications.{new_order,cancelled_order,payment_failed}.is_enabled` | yes/no                                                               |
| `woocommerce_notify_low_stock`, `woocommerce_notify_no_stock`                                                   | `email.admin_emails.inventory_notifications.{low_stock,out_of_stock}.is_enabled`               | yes/no                                                               |
| `woocommerce_email_footer_text`                                                                                 | `email.default_template.footer`                                                                | copied                                                               |
| `woocommerce_email_base_color`, `_background_color`, `_body_background_color`, `_text_color`                    | button background, outer area, email body, body text colors                                    | hex colors only                                                      |

**Order numbers.** `OrdersGroup::persist` builds `order_number` with `OrderNumberGenerator::generate_order_number()`,
the generator that checkout uses. The result is `prefix + WooCommerce order id padded to 6 + suffix`, with the prefix
and suffix from `general.order_number`. The WooCommerce id is kept so that customers keep the number they know.
Migrated orders get no invoice number.

**Not migrated (no safe match):** payment gateways and their secrets, legal consents,
`shop_page` (the WooCommerce page holds WooCommerce blocks), order notes toggle, address
line 2, price decimals, order and invoice numbering settings, address state. Email subjects and
headings are not copied because WooCommerce placeholders such as `{order_number}` differ
from Kirki shortcodes.

## Risks / Trade-offs

- `woocommerce_onboarding_profile` is private to WooCommerce and may change. A missing or
  odd value gives an empty industry, never an error.
- Site title is shared with WordPress; a merchant may not want it as store name. The field
  stays editable.
- Auto-run migrates everything with no choice, and there is no Revert any more. A migration
  cannot be undone from the product.
- After a successful run the ledger is empty, so a second migration of the same store cannot
  tell what was migrated: slugs and SKUs get a suffix, customers are reused by email, and
  orders are duplicated. Onboarding runs once, so this is accepted and documented.
- Replace rule: a merchant who edited tax regions, shipping zones or a setting in Kirki loses
  that edit when the migration runs, and nothing restores it. If every WooCommerce rate is
  skipped (for example non-standard tax classes), the cleared tax list stays empty.
- The email and option names above come from WooCommerce documentation and source; an
  option that is not saved is treated as "WooCommerce has no value" and changes nothing.
- Removing store fields from `SettingsGroup` changes older run notes. Dev data only.

## Migration Plan

No data migration. Ship PHP and React together. Drafts in session storage stay valid.
