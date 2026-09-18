## Why

The country and state names are permanently English. `wp i18n make-pot` finds translatable
strings by scanning source for gettext calls, and nothing in `resources/data/countries.php`
or `states.php` is wrapped in `__()`, so a German store's checkout says "Germany" and a
Japanese store's says "Japan" no matter how complete the translation is. WooCommerce 10.7
translates both — 250 countries and 2,030 states, all `__()`-wrapped — so this is table
stakes rather than a nicety.

Translating alone would make things worse, though. Nothing in this codebase sorts countries:
the storefront `<select>` and the admin combobox both render in dataset order, which happens
to be alphabetical *in English*. Translate the names and "Deutschland" stays wedged where
"Germany" was. And the admin combobox filters on the visible label, so a user typing
"Germany" — or the code "DE" — on a German-locale site would match nothing. Both fixes ship
with the translation or the translation is a regression.

Separately, the migration tooling from `country-data-php-arrays` has done its job. The
conversion was one-time, so `data-src/countries.json`, `bin/generate-country-data.php` and
the CI drift check are now dead weight guarding a pipeline nobody will run again.

## Sequencing

This change now runs **after** `address-field-rules`, by decision: that change fixes a checkout
bug (customers blocked on fields their country does not use) and determines which subdivisions
actually render. Its outcome should prompt a revisit of the decision here to translate all 4,991
state names — roughly 3,800 belong to countries neither Shopify nor WooCommerce shows a state
field for, so translating them may be work spent on strings that are never displayed. Country
names (250) are worth translating regardless.

## Prerequisite

`country-data-php-arrays` must be archived (or `opsx:sync`'d) **before** this change is
applied. Its `country-reference-data` delta has not landed in `openspec/specs/` yet, and the
requirements below modify that capability — without the sync there is no main spec for the
delta to modify.

## What Changes

- **All 5,241 names become translatable.** 250 country names and all 4,991 state names
  wrapped in `__('<name>', 'kirki-ecommerce')` inside the generated data files, matching
  WooCommerce's approach.
- **Countries and states are sorted by their translated name**, using the active locale.
  `Collator` where ext-intl is available, with an accent-folded fallback for the many wp.org
  hosts that lack it.
- **Admin country search matches the ISO code**, so "DE" finds Deutschland. The combobox
  gains an optional `keywords` passthrough to cmdk; `country-selector` supplies the code.
- **The migration tooling is deleted**: `data-src/countries.json`,
  `bin/generate-country-data.php`, and the `country-data-drift` CI job. The generated PHP
  files become the committed, hand-maintained source of truth. The generator runs one last
  time to emit the `__()`-wrapped output, then goes.
- **The duplicate EU country list is removed.** `resources/data/european_union_countries.json`
  holds 27 countries whose codes, names, numeric codes and flag emoji all match
  `resources/data/countries.php` exactly — and `group` there is a two-valued field (`eu` 27 /
  `general` 223) that exists only to mark EU membership. Rather than converting the duplicate
  to a PHP array, it is deleted and `EuropeanCountryChecker` derives its members from
  `CountryData`. This also makes `is_eu_by_name()` coherent under translation instead of
  merely documented as broken.
- **BREAKING: the country list order changes.** `Utils::get_countries()`, `GET /countries`
  and the storefront inline config now return countries ordered by translated name under the
  active locale, and each country's states likewise. Previously the order was the dataset's
  fixed English-alphabetical sequence. Any consumer that depended on positional order rather
  than looking up by `code` would be affected; none in this codebase does.
- **The byte-identity guarantee from the previous change is deliberately retired.** That
  change's defining property was that output was provably identical to the source JSON. This
  one intentionally changes both the language and the order, so the identity test is replaced
  by a structural contract test that asserts shape, counts and key order without a fixture.

### Explicitly out of scope

- The ~235KB inline checkout payload, still unchanged.
- Trimming the state dataset to WooCommerce-like coverage (69 countries / 2,030 states versus
  our 200 / 4,991). That would remove options merchants can currently select, so it needs its
  own decision.
- Re-importing the dataset to obtain ISO 3166-2 state codes. **Correction to an earlier note
  in this proposal:** WooCommerce is *not* a usable source of them. Measured across its whole
  `i18n/states.php`, only 567 of 2,030 keys (28%) are ISO 3166-2 shaped; the other 1,463 are
  WooCommerce's own historical codes across 46 countries — `AL`/`AK` for US states rather than
  `US-AL`, `CN1`/`CN2` for China rather than `CN-AH`. Name-matching our states to theirs
  resolves only 1,123 of 4,991 (22.5%) because of systematic naming differences. The original
  "no stable state key available" conclusion stands.
- Removing `is_eu_by_name()` outright. Consolidating the data source makes it correct enough
  to keep; deleting a public method is a separate call.
- Adding `load_plugin_textdomain()` or committing a `.pot`. Neither exists today. For a
  wp.org-hosted plugin WordPress loads language packs automatically and translate.wordpress.org
  builds its string list by scanning the source, so `__()` is what makes these translatable.

## Capabilities

### New Capabilities

<!-- None. This modifies the capability introduced by country-data-php-arrays. -->

### Modified Capabilities

- `country-reference-data`: names become translatable; list order becomes locale-dependent
  rather than fixed; the stored dataset is no longer derived from a separate authoring source,
  so the generation and drift-check requirements are removed.

## Impact

**Data**
- `resources/data/countries.php`, `resources/data/states.php` — names wrapped in `__()`
- deleted: `data-src/countries.json`, `bin/generate-country-data.php`,
  `resources/data/european_union_countries.json`
- kept: `bin/import-address-rules.php` — it targets a live upstream, so it is re-runnable
  tooling rather than one-time conversion
- `.github/workflows/tests.yml` — `country-data-drift` job removed

**PHP**
- `app/Supports/CountryData.php` — locale-aware sorting of countries and of each country's states
- `app/Supports/EuropeanCountryChecker.php` — loads its members from `CountryData::index()`
  filtered on `group === 'eu'` instead of the deleted JSON

**TypeScript** (unlike the previous change, this one does touch the frontend)
- `resources/app/components/ui/combobox.tsx` — optional `keywords` on `ComboboxOption`, passed to `CommandItem`
- `resources/app/components/country-selector.tsx` — supply `keywords: [country.code]`

**Tests**
- `tests/Unit/Supports/CountryDataIdentityTest.php` — rewritten as a structural contract test
- new sorting tests, including the no-`Collator` fallback path
- `tests/Unit/Services/CountryServiceTest.php` — re-check the group-filter assertions under sorting
- `tests/Unit/Supports/EuropeanCountryCheckerTest.php` — fixture path removed; gains a test
  asserting the 27 members by code, which is what now guards the `group` field
- `tests/Integration/CountryServiceBindingTest.php` — expected to pass untouched

**Verification**
- `composer test`, `composer phpcs:wporg`, `npm run typecheck:app`, `npm test` in `resources/app/`
