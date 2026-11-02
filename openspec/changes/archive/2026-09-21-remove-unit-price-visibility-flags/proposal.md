## Why

Whether a shopper sees a unit price is currently decided by three things at
once: a store-wide `product.is_unit_price_visible` setting, a per-variant
`show_unit_price` boolean, and whether the variant's unit data actually
resolves. Two of those are merchant-facing switches that can each silently
cancel out data the merchant entered — fill in "500g, price per 100g", forget
the checkbox, and the storefront shows nothing with no indication why.

The unit data is already self-describing: a variant either has a complete,
resolvable `total_unit_amount` / `total_unit` / `base_unit_amount` /
`base_unit` set, or it does not. The two flags add a second and third source
of truth over the top of it, and the redesigned pricing card (the follow-up
change) has no room for a checkbox that only exists to re-state whether those
fields are filled in.

## What Changes

- **BREAKING** Remove the `show_unit_price` column from
  `kirki_ecommerce_variants`, along with its model cast and fillable entry, both
  variant DTOs, all four request validators that accept it, and its
  `VariantResource` output key. API clients reading or writing
  `show_unit_price` lose that field.
- **BREAKING** Remove the `product.is_unit_price_visible` setting, its
  validation and sanitizer entries, its seeded default, and the "Show unit
  price" switch on the Units and Stock Defaults settings page.
- A variant's unit price is displayed if and only if its unit data is complete
  and resolvable. `UnitPrice::make()` keeps every existing soft-failure path
  (missing fields, unknown unit code, incompatible measurement groups, zero
  base amount) and simply loses the two flag checks in front of them.
- The storefront's unit-price element keys off `display_unit_price` alone,
  as does the variant payload shipped by the page inline script.
- The bulk-edit grid's base-price-per-unit cell stops being a gated cell — it
  is always editable — and the `show_unit_price` gate column is removed.
- The shared Price card loses the "Show unit price" checkbox and the settings
  conditional; the base-price-per-unit row is now always present. No other
  change to that card — the layout redesign is a separate change.
- An alter migration drops the column on existing installs;
  `CreateVariantsTable` stops creating it for fresh installs.

**Accepted consequence — storefronts change on upgrade.** Existing unit data is
kept, so any variant that holds complete unit data but had `show_unit_price`
false, and every such variant on a store that had `is_unit_price_visible` off,
will begin showing a unit price on its product page after the upgrade. This was
raised and accepted deliberately in favour of not destroying merchant-entered
data. It warrants a release note.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `variant-unit-price-display`: the `show_unit_price` precondition is removed
  from the display rule, and the requirement that exists solely to describe the
  flag ("Unit price shown flag disables the field") is removed. Unit data
  completeness becomes the only condition.
- `bulk-edit-grid`: base price per unit is no longer one of the gated cells.

## Impact

Backend: `database/migrations/CreateVariantsTable.php`, a new drop migration
registered in `config/migrations.php`, `app/Models/Variant.php`,
`app/DTO/Variant/{Create,Update}VariantDTO.php`,
`app/Http/Requests/Product/Product{Create,Update}Request.php`,
`app/Http/Requests/Variant/{BulkUpdate,Update}VariantRequest.php`,
`app/Http/Requests/Settings/SettingsUpdateRequest.php`,
`app/Supports/UnitPrice.php`, `app/Resources/Variant/VariantResource.php`,
`app/Hooks/Filters/PageInlineScript.php`,
`database/seeders/{ProductSeeder,SettingsSeeder}.php`.

Storefront: `resources/views/site/shop/single.php`.

Admin SPA: the shared variant field shape and both form transforms, the
variant catalog schema, `create-product.tsx`'s default seeding, the shared
Price card, the bulk-edit column definitions and payload builder, the products
settings form schema and page, and the settings catalog schema — plus the
tests in `features/{products,inventory,bulk-edit,settings}` that reference
either flag.

Risk: the removal is mechanical, but it spans PHP, the storefront view and the
SPA, so a missed reference surfaces as a runtime error rather than a failed
build. The PHP suite plus `composer phpcs:wporg`, and `npm run typecheck` /
lint / `npm test`, cover everything except the Alpine template, which is
checked by reading it.
