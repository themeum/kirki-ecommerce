## Why

Checkout blocks customers who have nothing to enter. `validateAddress()` in
`resources/site/ts/components/checkout-address.ts:153` requires a state whenever the selected
country has any states in our dataset — which is 200 of 250 countries — and requires a postal
code unconditionally. So a French customer must pick one of 123 departments, a UK customer one
of 247 council areas, and a customer in the UAE or Hong Kong must invent a postcode for a
country that has none.

Neither reference implementation behaves this way, because both drive the address form from
per-country rules rather than from "do we happen to have subdivision data":

| | Kirki (today) | Shopify | WooCommerce |
|---|---|---|---|
| Countries | 250 | 237 | 250 |
| Countries with subdivisions | 200 | 38 | 69 |
| Subdivision entries | 4,991 | 1,209 | 2,030 |
| Countries showing a state field | **200, all required** | 36 | ~28 |
| Countries with no postcode field | **0** | 67 | ~30 |

The upstream both of them derive from is Google's **libaddressinput** (Apache 2.0), which
publishes exactly the metadata this needs, per country:

```
FR  require:"ACZ"  fmt:"%O%n%N%n%A%n%Z %C"            → no state field
JP  require:"ASZ"  state_name_type:"prefecture"       → state required, labelled Prefecture
AE  require:"AS"   fmt has no %Z                      → no postcode field
GB  require:"ACZ"  no subdivisions                    → no state field
```

This change adopts that metadata so the address form asks for what each country actually uses.

## What Changes

- **A new per-country address rules table**, `resources/data/address-rules.php`, generated from
  libaddressinput by `bin/import-address-rules.php`. Per country: whether the state field is
  hidden, optional or required; its label; and the same for postal code.
- **The storefront renders and validates against those rules.** No state field where the
  country has none; no postcode field where the country has none; the label reads "Prefecture"
  in Japan, "Emirate" in the UAE, "County" in Ireland.
- **State becomes optional rather than hidden** for countries where we hold subdivisions but
  upstream does not require one. This is deliberately more conservative than Shopify, which
  hides the field outright — merchants keep the ability to pick a region, customers stop being
  blocked by it. Tightening further is a later decision informed by real usage.
- **The rules are exposed to consumers** through the storefront inline config and the country
  API, so admin address forms and any future client apply the same rules rather than
  reimplementing them.
- **BREAKING (API): server-side address validation becomes country-aware.** Today both
  `AddressCreateRequest` and `AddressUpdateRequest` declare `'state' => 'nullable|string'`, so
  the server has never enforced a state at all and the client has been stricter than the server.
  Aligning them means an API client that previously omitted a state for the US will now be
  rejected. This is isolated in its own task group so it can be dropped if that risk is unwanted.

### Explicitly out of scope

- **Per-country field ordering.** libaddressinput's `fmt` also encodes layout — Japan puts
  postcode and prefecture above city and surname before given name. Honouring that is a
  checkout redesign, not a validation fix, and belongs in its own change. This change uses
  `fmt` only to detect whether `%S` and `%Z` are present at all.
- **Trimming the 4,991 subdivisions.** Once the field only renders where it belongs, surplus
  rows cost nothing and removing them would remove options merchants can currently choose.
- **ISO 3166-2 subdivision codes.** Now genuinely feasible: libaddressinput ships `sub_isoids`
  alongside `sub_keys` and `sub_names`, which corrects the earlier conclusion that no usable
  source existed — WooCommerce was the wrong place to look. It is deferred rather than dropped,
  because it is a separate data migration with its own id-stability question, and it wants the
  same importer this change introduces.
- The ~235KB inline checkout payload.

## Capabilities

### New Capabilities

- `address-field-rules`: which address fields a country uses, whether each is optional or
  required, and what each is called — and how the storefront and the API apply that.

### Modified Capabilities

<!-- None. country-reference-data still describes the dataset itself; this is a separate concern
     layered on top of it, and the two are independently useful. -->

## Impact

**Data / tooling**
- new `resources/data/address-rules.php` (generated, committed)
- new `bin/import-address-rules.php`. Unlike `generate-country-data.php`, which was deleted for
  being a one-time conversion, this one targets a live upstream that changes, so it is kept and
  documented as re-runnable.

**PHP**
- new `app/Supports/AddressRules.php` — lazy, memoized, mirroring `CountryData`
- `app/Hooks/Filters/PageInlineScript.php` — publish the rules alongside `countries`
- `app/Http/Requests/Account/Address{Create,Update}Request.php` — country-aware validation
- `app/Http/Controllers/Api/CountryController.php` / country resources — expose the rules

**TypeScript**
- `resources/site/ts/components/checkout-address.ts` — `validateAddress()` reads the rules
- `resources/site/ts/components/state-field.ts` — render nothing when the field is hidden
- `resources/views/site/checkout/parts/{shipping,billing}-form.php`,
  `resources/views/site/account/parts/address-form.php` — conditional fields and dynamic labels

**Sequencing**
- `country-data-php-arrays` should be archived first.
- `translate-country-dataset` now runs **after** this change, per the agreed ordering, and its
  decision to translate all 4,991 state names should be revisited once it is clear which
  subdivisions actually render.
