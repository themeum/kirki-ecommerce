## Context

See proposal.md — Why. What shapes the approach:

- **The blocking bug is client-side only.** `AddressCreateRequest` and `AddressUpdateRequest`
  both declare `'state' => 'nullable|string'`; the server has never required a state. Everything
  customers hit today comes from `validateAddress()` in
  `resources/site/ts/components/checkout-address.ts:153`. So the fix that matters is small and
  low-risk, and there is a pre-existing client/server asymmetry to resolve deliberately rather
  than by accident.
- **We already have a good pattern for shipped reference data.** `CountryData` — generated PHP
  array, lazy `require`, memoized in a static — works and is tested. The rules table should look
  exactly like it rather than inventing a second idiom.
- **Two datasets, two jobs.** `countries.php`/`states.php` answer "what subdivisions exist";
  the rules answer "what should the form ask for". Keeping them separate means neither has to be
  regenerated when the other changes, and the existing dataset stays untouched by this change.
- PHP 7.4, Alpine on the storefront, React in admin.

## Goals / Non-Goals

**Goals:**

- Stop blocking checkout on fields a country does not use.
- One source of truth for the rules, applied by the storefront, the API, and any future client.
- Correct labels: Prefecture, Emirate, County, Province, State.
- Leave the subdivision dataset and its behaviour entirely alone.

**Non-Goals:**

- Per-country field ordering. `fmt` is read only to detect `%S`/`%Z` presence.
- Changing which subdivisions exist, or their identifiers.
- Matching Shopify's exact hide/show set. We are deliberately more permissive; see Decisions.

## Decisions

### libaddressinput as the data source, Shopify as the structural model

Shopify's shape is the better model — a per-country record carrying field rules, a label key and
the zone list — but their country service is internal infrastructure, not a public API, and
their payload is theirs. libaddressinput is the Apache-2.0 upstream both Shopify and WooCommerce
derive from, is publicly served per country, and carries everything needed: `require` (which
fields are mandatory), `fmt` (which fields exist at all), `state_name_type` (the label), plus
`sub_keys`/`sub_names`/`sub_isoids` for later. We take the structure from one and the data from
the other, and depend on neither at runtime — the import is vendored into a committed PHP array.

### Optional, not hidden, where we have subdivisions upstream does not require

Shopify shows a province field for 36 countries and hides it everywhere else. Applied literally
that would remove the state dropdown for ~164 countries where we currently offer one, including
places a merchant may be using it for shipping zones. The conservative mapping instead is:

| libaddressinput | our rule |
|---|---|
| `%S` absent from `fmt` | hidden |
| `%S` present, `S` in `require` | required |
| `%S` present, `S` not in `require` | optional |
| `%S` absent but we hold subdivisions | optional |

That last row is the deliberate deviation: it unblocks checkout without taking anything away.
Tightening to Shopify parity is a later decision that should be informed by whether anyone
actually uses those dropdowns, and it is much easier to tighten than to restore.

### The importer is kept, unlike the last one

`generate-country-data.php` was deleted because its conversion was one-time. This importer is
not analogous: libaddressinput is a living upstream that gains and corrects countries, so
re-running it has ongoing value. It is kept, documented as re-runnable, and the generated file
carries a header saying so. No CI drift check — there is nothing to drift against, since the
upstream can legitimately change under us.

### Server-side alignment is isolated so it can be dropped

Making the server enforce the same rules is correct — rules that only the browser applies are
not rules. But it is the only part of this change that makes the system reject something it
previously accepted, and any existing API integration omitting a state for the US would start
failing. It therefore lives in its own task group with its own tests, and can be deferred
without affecting the customer-facing fix.

### Hidden fields are not rendered, and stored values are not erased

A hidden field is absent from the form, not present-and-disabled, so nothing is submitted for
it. Existing rows that hold a state for a now-hidden country keep it: the rules govern input,
not storage. This avoids a destructive migration and keeps historical orders readable.

## Risks / Trade-offs

- **A country is mis-classified and a genuinely needed field disappears** → the rules come from
  the same upstream the rest of the industry uses, and the optional-not-hidden default means the
  realistic failure is an extra optional field rather than a missing required one.
- **Server alignment breaks an existing integration** → isolated task group, documented as
  BREAKING, droppable.
- **Two datasets keyed by country can disagree** — a rule for a country that no longer exists in
  `countries.php`, or vice versa → a test asserting every country in the rules table exists in
  the country index, and that every country has a rule entry.
- **libaddressinput is fetched at import time** → a network dependency in a developer script, not
  at runtime. The committed output is what ships.
- **Alpine forms rebuild field visibility on country change** → the storefront already watches
  `values.country` in `state-field.ts`, so the hook exists; the risk is a flash of the wrong
  fields on first paint, which server-rendering the initial country's rules avoids.

## Migration Plan

No database migration, no schema change, no backfill. Address rules govern what forms ask for;
stored addresses and orders are untouched.

1. Import the rules and commit the generated table.
2. Add the loader and expose the rules to the storefront and API.
3. Switch storefront rendering and validation onto them.
4. Align server validation (separable).

Rollback is a plain revert; nothing outside the codebase changes state.
