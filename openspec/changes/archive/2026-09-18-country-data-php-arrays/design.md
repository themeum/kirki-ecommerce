## Context

See proposal.md — Why. The constraints that shape the approach:

- **Byte-identity is the success criterion.** PHP's `===` on arrays requires the same
  key/value pairs *in the same order* with the same types, so a single `assertSame()`
  against the preserved source JSON proves the refactor changed nothing observable. Every
  decision below is subordinate to keeping that assertion passing.
- **Source key order is load-bearing.** Each country in the source JSON is emitted in the
  order `name, code, phone_code, currency, currency_name, currency_symbol, flag, states,
  numeric_code, group` — note `states` sits in the *middle*, between `flag` and
  `numeric_code`, not at the end. `json_encode` preserves insertion order, so reassembly
  must restore this exact order or both `assertSame()` and the wire format break.
- **The country list order is the source order** (alphabetical by name), and the public
  shape is a sequentially indexed list.
- PHP 7.4. No union types, no constructor promotion, no enums.

## Goals / Non-Goals

**Goals:**

- Zero observable change to `Utils::get_countries()`, `GET /countries`, `GET /countries/{code}`,
  the storefront inline config, and every server-rendered address form.
- Eliminate per-call file I/O and JSON decoding; rely on OPcache holding a parsed array.
- O(1) country lookup by ISO code.
- A loading path that is safe to wrap in `__()` later without an early-translation bug.
- Ship only the form the runtime consumes. Net package saving is modest (42,877 bytes, 7%)
  because the generated PHP is nearly as large as the JSON it replaces - the win here is
  runtime, not size.

**Non-Goals:**

- Any change to the inline payload size (see proposal.md — Explicitly out of scope).
- Making `has_states` visible in any public output. It exists in the generated index for
  future consumers; this change must keep it internal, and the `assertSame()` test is what
  enforces that.
- Reconciling `european_union_countries.json` with the `group => 'eu'` field, which now
  duplicates it. Noted as pre-existing redundancy; out of scope.

## Decisions

### Generated PHP arrays over JSON + a cache layer

`require` of a PHP array file is served from OPcache's shared memory after the first
request: no file read, no parse, no decode. The alternative — keeping JSON and wrapping
reads in a transient or the WP object cache — adds an invalidation story for data that by
definition never changes at runtime, and the object cache is not guaranteed persistent on
shared hosting, so the cold path would still decode 552KB.

### One `states.php`, not 250 per-country files

With OPcache the whole file is parsed once and `$states['US']` is a hash lookup, so
splitting per country would buy nothing while adding 250 zip entries and 250 OPcache slots.
This trade-off is specific to the PHP format — had we stayed on JSON, per-country files
would have been the right call, since decoding 183KB to read 2KB of US states is waste.

### A dedicated loader, consumed by both entry points

A new `App\Supports\CountryData` owns loading and memoization:

- `CountryData::index()` — the keyed index, lazily `require`d, cached in a protected static.
- `CountryData::states_for($code)` — states for one country.
- `CountryData::nested()` — the reassembled public list, memoized separately.

`CountryService` and `Utils::get_countries()` both delegate here rather than reading files
themselves. This gives one place for the future `__()` wrapping and one place where the
key-order contract is expressed.

Loading happens on first *call*, never at file scope. A `require` at bootstrap that later
contains `__()` would emit WordPress 6.7+'s `_doing_it_wrong` for translating before `init`
and silently return English; building lazily now means that trap never gets set.

### Reassembly restores key order explicitly

`nested()` builds each entry by writing the ten keys in source order and splicing `states`
into position 8, rather than appending states to the index entry (which would put `states`
last and break byte-identity). `has_states` is dropped during reassembly. The final
`array_values()` restores sequential indexing; since PHP preserves insertion order for
string-keyed arrays and the generator emits the index in source order, this reproduces the
original list exactly.

### `CountryService::all()` mutation and key preservation fixed together

Today `all()` reassigns `$this->data` when filtering by group, and filters with a
key-preserving `array_filter`, so `?group=eu` serializes as a JSON object keyed by source
positions (`{"14":…,"20":…}`). The mutation is currently masked because a fresh service is
constructed per resolution; binding the service as a singleton — which we want for
`OrderResource`'s two `find()` calls per order — would turn it into a real leak where one
filtered read poisons every later read. So the singleton binding and the mutation fix must
land together, not in separate changes. The fix: filter into a local and `array_values()`
the result, leaving `$this->data` untouched.

### `data-src/` as the non-shipped source location

`bin/make-package.sh` copies `resources/data` wholesale (line 28), so a file stays out of
the zip only by living outside that directory. Putting the source at `data-src/countries.json`
needs no change to the packaging script's path list. This keeps the authoring form out of
users' installs; it is not a meaningful size optimisation, since the generated PHP is nearly
as large as the JSON it replaces. `bin/generate-country-data.php`
regenerates both outputs; CI runs it and fails on any git diff, which is what prevents the
committed PHP and the source JSON drifting apart.

## Risks / Trade-offs

- **Silent key-order drift in reassembly** → the `assertSame()` test against the source JSON
  catches it; `===` compares array order, so a misplaced `states` key fails the test.
- **`has_states` leaking into the API response** → same test catches it, since any extra key
  breaks identity.
- **The `group=eu` fix is technically a response-shape change** → no caller passes `group`
  (all ten admin call sites request `{ limit: -1 }` only), so it is unreachable from the
  product; documented as BREAKING in the proposal anyway.
- **OPcache disabled on some hosts** → falls back to parsing the PHP file per request, which
  is still no worse than the current `json_decode` of 552KB, and the memoization means it
  happens once per request rather than once per call.
- **Generated files are large diffs in review** → unavoidable; mitigated by the generator
  being the only thing that writes them and CI proving they match the source.
- **A future dataset refresh changes numeric `id`s** → not solved here, and not mitigated
  either: the source carries no ISO 3166-2 codes, so there is no stable alternative key to
  carry alongside. A refresh must verify id stability or ship a backfill.

## Migration Plan

No database migration, no schema change, no data backfill — `addresses.state` and
`orders.{shipping,billing}_state` keep holding the same numeric identifiers they hold today.

1. Add the generator and generated files; move the source JSON to `data-src/`.
2. Switch consumers to the loader.
3. Land the singleton binding and the `all()` fix together.
4. Verify with the byte-identity test plus the full suite.

Rollback is a plain revert: nothing outside the codebase changes state.
