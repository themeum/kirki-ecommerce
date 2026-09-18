## Context

See proposal.md — Why. The constraints that shape the approach:

- **`make-pot` only sees literal `__()` calls in source.** The strings must sit inside the
  data files as `__('Alabama', 'kirki-ecommerce')`; applying translation in the loader instead
  would keep the files clean but make the names invisible to extraction. WooCommerce puts them
  in the data files for exactly this reason, and so must we.
- **`CountryData` already loads lazily and memoizes in a static.** That was built in
  `country-data-php-arrays` specifically so `__()` could be added without an early-translation
  bug. No loader restructuring is needed.
- **The storefront needs no changes.** It reads `Utils::get_countries()` and the inline
  `config.countries`, both of which flow through `CountryData::nested()`. Sorting there means
  the server-rendered `<select>` and the Alpine `state-field` get correct ordering for free.
- **ext-intl cannot be assumed.** wp.org plugins run on hosts without it, and on hosts where
  it is present but ICU data is broken.
- PHP 7.4. cmdk 1.1.1 on the frontend.

## Goals / Non-Goals

**Goals:**

- Every country and state name extractable by `make-pot` and translated at display time.
- Lists ordered correctly in every locale, degrading sanely without ext-intl.
- ISO code remains a usable search key in the admin once names are translated.
- Remove the migration tooling without weakening the remaining guarantees.

**Non-Goals:**

- Preserving the byte-identity property from the previous change. It is intentionally retired;
  see Decisions.
- Translating anything outside the country/state dataset.
- Making `index()` ordering meaningful. It stays keyed by code and is consumed only by
  `CurrencySwitcherService` for flag lookup, which does not care about order.

## Decisions

### `__()` lives in the data files, and we accept the runtime cost

Wrapping names means the arrays are built by executing ~5,241 function calls, which OPcache
cannot constant-fold — it caches the opcodes, not the result. This partially offsets the
OPcache win from the previous change. Memoization keeps it to once per request rather than
once per call, which is what makes it acceptable. This is the honest price of the
full-coverage choice; the countries-only alternative would have cost 250 calls instead of
5,241, and was declined deliberately.

### Sorting mirrors `wc_asort_by_locale()`

WooCommerce solved this exact problem; copying its shape is better than inventing one:

1. If `class_exists('Collator')`, sort with `new Collator(get_locale())` inside a
   `try`/`catch (IntlException)` — a broken ICU install throws rather than returning nonsense.
2. Otherwise (or on throw), fold accents with `remove_accents(html_entity_decode($name))` and
   sort on the folded value. Folding matters: without it "Åland" sorts after "Zimbabwe" in a
   byte comparison.

Sorting happens in `nested()`, after names are resolved, for the country list and for each
country's state list. Because `nested()` is memoized, the sort runs once per request.

### The identity test is replaced, not repaired

The previous change's `assertSame()` against the source JSON was its central proof. Both the
fixture and the property are gone: the JSON is deleted, and translation plus sorting change
the output by design. Trying to preserve a weakened version of it would be theatre. The
replacement asserts what still must hold — 250 countries, 4,991 states, the exact ten-key
order with `states` in position 8, sequential indexing, state entries carrying exactly
`['id','name']`, and `has_states` never leaking into public output — none of which needs a
fixture. Sorting gets its own tests, including the no-`Collator` fallback path.

### Admin search uses cmdk's `keywords`, not a custom filter

`combobox.tsx` delegates filtering to cmdk via `<CommandItem value={option.label}>`; there is
no local filter function to extend. cmdk 1.1.1's `Item` accepts `keywords?: string[]`
("Optional keywords to match against when filtering"), and the local `CommandItem` wrapper
already spreads `...rest` into `CommandPrimitive.Item` with props derived from cmdk's own type
— so the wrapper needs no change at all. Adding an optional `keywords` to `ComboboxOption` and
passing it through is the whole fix, and it stays generic rather than hard-coding country
knowledge into a shared UI primitive.

### The EU country list is consolidated into the dataset, not converted

`resources/data/european_union_countries.json` was to be converted to a PHP array for
consistency with the other data files. Comparing it against `countries.php` first showed
there is nothing to convert: all 27 codes match, and so do every name, numeric code and flag
emoji. The `group` field in `countries.php` is two-valued — `eu` (27) and `general` (223) —
so it exists for no purpose other than marking EU membership. The JSON is a verbatim
duplicate.

Converting it would have preserved a duplicate in a nicer file format and left EU membership
defined in two places that can silently disagree. Instead the file is deleted and
`EuropeanCountryChecker` derives its members from `CountryData::index()` by filtering on
`group === 'eu'`.

This also resolves the `is_eu_by_name()` problem rather than documenting it. The method was
going to compare a translated name against an untranslated JSON; reading from the same
dataset the names come from makes both sides translated and the comparison coherent. It stays
documented as code-first, since a localized display name is still a poor lookup key, but it is
no longer actively wrong.

## Risks / Trade-offs

- **Translation resolved before `init`** → would cache English for the whole request and trip
  WordPress 6.7's early-translation notice. Mitigated by construction rather than by defensive
  code: `CountryData` resolves on first call, the `CountryService` singleton binding is a lazy
  factory that is never eagerly instantiated, `PageInlineScript` runs on the `CONFIG_DATA`
  filter fired during script enqueue, and nothing in `bootstrap/`, the providers, or hook
  registration touches the dataset.
- **Memoized output is locale-snapshotted per request** → a locale switch mid-request would
  serve stale names. WooCommerce has the same characteristic; not worth guarding.
- **Order is now locale-dependent** → any consumer relying on positional order breaks. None
  does; every lookup in this codebase is by `code`. Called out as BREAKING in the proposal.
- **Losing the drift check** → nothing now proves the two data files stay mutually consistent.
  Accepted: they are committed artifacts edited by hand from here on, and the structural
  contract test still catches shape and count regressions.
- **An EU check now loads the full country index** → `is_eu_by_code()` reads `countries.php`
  (85KB) where it previously read a 3.2KB JSON. `index()` does not pull `states.php` (436KB),
  the file is OPcache-resident after the first request, and the checker keeps its own memoized
  static, so this costs one extra require on requests that do tax work but never touch the
  country list. Accepted in exchange for removing the duplicate.
- **`group` becomes load-bearing for tax routing** → `TaxStrategyFactory` maps EU countries to
  the `EU` strategy, so an accidental edit to a `group` value in the now hand-maintained
  `countries.php` changes tax behaviour. Covered by a test asserting the 27 members by code.
- **`remove_accents()` is a WordPress function** → the sorting fallback cannot be exercised in
  the Unit suite without a stub. Either stub it or cover the fallback in the Integration suite;
  decide when writing the test rather than leaving the path untested.

## Migration Plan

No database migration, no schema change. Stored country codes and numeric state ids are
untouched, so existing addresses and orders are unaffected.

1. Regenerate both data files with `__()`-wrapped names using the existing generator.
2. Delete `data-src/countries.json`, `bin/generate-country-data.php`, and the CI drift job.
3. Add sorting to `CountryData`.
4. Add `keywords` to the combobox and wire up `country-selector`.
5. Point `EuropeanCountryChecker` at `CountryData` and delete `european_union_countries.json`.
6. Replace the identity test; add sorting and EU-membership tests.

Rollback is a plain revert.
