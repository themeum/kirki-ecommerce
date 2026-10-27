## Context

See proposal.md — Why. The design-relevant facts:

- `UnitPrice::make()` is the single place that decides whether a unit price
  exists. It opens with the two flag checks and then runs five soft-failure
  checks on the unit data itself. Removing the flags means deleting the first
  guard; nothing else in that method changes.
- `display_unit_price` already reaches the storefront through
  `VariantResource`, and the Alpine template guards on both
  `selectedVariant?.show_unit_price` and `selectedVariant?.display_unit_price`.
  The second guard alone is already sufficient — `display_unit_price` is null
  whenever a unit price should not show.
- Migrations are an ordered list in `config/migrations.php`, applied once per
  installation. `DropIsBillingSameAsShippingFromCustomersTable` is the pattern
  for a column drop, with `down()` recreating the column.
- The setting lives in the seeded `product` settings blob, is validated in
  `SettingsUpdateRequest`, and is read in exactly one place in PHP and one in
  the SPA.
- In the SPA, `show_unit_price` is a field on the shared `VariantFieldsShape`,
  so it reaches the product form, the variant edit form, their payload
  transforms and their tests through one definition.

## Goals / Non-Goals

**Goals:**

- One condition decides unit-price display, checked in one place.
- No reference to either flag survives in PHP, the storefront view, or the SPA.
- Existing installs converge without manual database work.

**Non-Goals:**

- Any pricing-card layout change — that is the follow-up change. This one
  deletes a checkbox and an `if`, and leaves the card's structure alone.
- Preserving what a given storefront displayed before the upgrade (see the
  accepted consequence in the proposal).
- Reworking how the bulk-edit grid expresses gating generally; only the
  unit-price gate is removed.

## Decisions

### Delete the guard, keep the soft-failure ladder

`UnitPrice::make()` loses its first `if` and nothing else. The five existing
null-returning checks already encode "unit data that cannot produce a price",
which is exactly the new display rule.

*Why:* the new rule is not new logic — it is the old logic with two
merchant-facing overrides taken off the front.

### Drop the column rather than leaving it unused

A new `DropShowUnitPriceFromVariantsTable` migration, appended to
`config/migrations.php`, plus removing the column from `CreateVariantsTable` so
fresh installs never create it. `down()` restores the column with its original
default.

*Why:* `schema-upgrade-migrations` requires existing installations to converge
on the current table definitions. A column left in place but written by nothing
is the drift that spec exists to prevent.

*Alternative considered:* keep the column, stop reading it. Rejected — it
leaves a boolean in the schema whose value means nothing, which is worse than
either having it or not.

### No data migration

Unit fields are left exactly as they are. The consequence — previously hidden
unit prices appearing — is accepted and documented rather than mitigated.

*Alternative considered:* null the unit fields wherever the flag was false, so
storefront output is unchanged across the upgrade. Rejected by the user in
favour of keeping merchant-entered data; recorded here because it is the
reason the upgrade is observable at all.

### The bulk-edit gate goes away rather than moving

`show_unit_price` is one of four values in the grid's `BulkEditGate` union. The
union and the other three gates stay; the unit-price cell simply stops
declaring `gatedBy`, and the gate column is removed from the column set.

*Why:* there is no replacement condition that makes sense for a cell whose own
value is the thing being edited — gating "base price per unit" on whether unit
data exists would make the cell uneditable exactly when a merchant wants to
fill it in.

### The SPA change is a field deletion, not a rewrite

Removing `show_unit_price` from `VariantFieldsShape` propagates to both form
schemas, both payload transforms and `getDefaultVariantValues` by construction.
`create-product.tsx` stops seeding it from the setting. The Price card drops
the `CheckboxField` and unwraps the `productSettingsData?.is_unit_price_visible`
conditional, leaving the base-price-per-unit row rendered unconditionally.

## Risks / Trade-offs

- **A missed reference fails at runtime, not at build time** — the Alpine
  template and the PHP request/DTO layer are not type-checked. → Grep for both
  identifiers across `app/`, `database/`, `resources/views/` and
  `resources/app/` as the final task; the expected result is zero hits.
- **Upgraded storefronts start publishing unit prices that were switched off.**
  → Accepted; called out in the proposal for a release note. A merchant opts
  out by clearing the variant's unit fields.
- **API consumers reading `show_unit_price` from `VariantResource` break.** →
  Marked BREAKING in the proposal. The plugin has not shipped to
  wordpress.org, so there is no published contract to honour.
- **The settings page loses a control, leaving two adjacent separators.** →
  Reconciled as part of the same edit; the card keeps three settings and reads
  normally.

## Migration Plan

Forward: the new drop migration runs once per installation on upgrade. Fresh
installs never create the column. No data is transformed.

Rollback: revert the code and the migration's `down()` restores the column with
its original `default(0)`. Every variant then reads `show_unit_price = 0`, so
unit prices disappear until merchants re-enable them — a rollback is not
transparent, which is an argument for shipping this with a release note rather
than quietly.
