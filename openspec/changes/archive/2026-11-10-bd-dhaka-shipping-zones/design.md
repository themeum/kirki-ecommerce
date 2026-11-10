## Context

`LocalPresetSource::fetch()` calls `ShippingZoneBuilder::build()`. The builder
returns one zone for each kind (`domestic`, then `regional` when the country
has a bloc). `make_methods()` reads the method definitions from
`countries.<ISO2>.shipping.<kind>`. When the store's base currency is the
country's currency, the methods are enabled with their amounts. If not, they
are disabled at zero. Rule templates of an industry select zones by kind.

`ShippingZonePresets::make_zone()` writes the zones. A region with an empty
`states` list gets every state of the country (`CountryData::state_ids()`). A
non-empty list is kept as it is (as strings).

The tax presets already reference states by ID in `presets.json`, with a
`name` only for readability (`countries.CA.tax.states`). `presets.json` is
served from S3 to every plugin version, so the format must stay readable by
old versions (`docs/preset-data.md` §8).

## Goals / Non-Goals

**Goals:**
- A country entry can split its home-country zone by state, with its own
  methods for each part.
- Bangladesh uses this for Inside Dhaka and Outside Dhaka.

**Non-Goals:**
- Splitting the Regional zone.
- Adding the BD districts that are missing from `states.php` (the list has
  61 districts; Bangladesh has 64).
- Changing the TS test fixtures that use the literal `'Dhaka District'`.

## Decisions

1. **New key `shipping.domestic_zones`, list of `{title, states | exclude_states, methods}`.**
   It replaces only the Domestic zone. The key is optional, so the format
   version stays `2`.
   *Alternative:* reuse the `domestic`/`regional` kinds (Inside = domestic,
   Outside = regional) with a state filter on each kind. Rejected. "Regional"
   means "across a border", and the industry templates disable Perishable,
   Frozen and Hazardous shipping in regional zones. That is wrong inside one
   country.

2. **`states` / `exclude_states` are maps of state ID → name.** This is the
   same shape as the tax `states` map. The ID is the key; the name is for
   people who read the file. `exclude_states` lets Outside Dhaka mean "all but
   Dhaka" without a list of 60 IDs that goes stale when `states.php` changes.
   JSON numeric keys decode to PHP ints, so the IDs are cast to strings.

3. **Methods are inline in each zone entry.** Each part has different amounts
   and a different set of methods (Outside Dhaka has no Express and no
   Pickup), so a shared list does not work. The Inside Dhaka methods are the
   former BD `domestic` methods, and the BD `domestic` list is removed (see
   the correction below).

4. **Split zones are kind `domestic` for rules and for the currency check.**
   `make_methods()` gets the method definitions as a parameter in place of
   looking them up by kind. The kind is still passed for rule matching.

5. **Remove the BD `regional` list.** BD has no bloc, so no plugin version
   reads it. Its one method moves to Outside Dhaka.

6. **BD state cleanup in `states.php`.** Remove `807` and `758` (divisions,
   not districts; Barisal Division overlaps Barisal District). Remove the
   " District" suffix, so the checkout reads "Dhaka", not "Dhaka District".
   The IDs do not change, so stored references stay valid.

**Correction during implementation:** the BD `shipping.domestic` list was
first kept so that older plugin versions (which ignore `domestic_zones`) still
got the BD methods. The user does not need that compatibility: a store that
cannot read the presets gets no preset zones at all. The current builder does
not read `domestic` when `domestic_zones` exists, so the list was dead data
that repeated the Inside Dhaka methods. It was removed.

**Correction during implementation:** the user later reduced each BD zone to
one flat-rate method: "Inside Dhaka" ৳120 (key `inside_dhaka`) and "Outside
Dhaka" ৳180 (key `outside_dhaka`). Express and Local Pickup are gone. Industry
rules that name a method key (for example Food's "Frozen: disable domestic
`standard`") now match no BD method, so only `*` rules (for example Fragile
×1.25) apply to the BD zones. `test_domestic_rules_apply_to_both_bangladesh_zones`
checks the Fragile rule for this reason.

## Risks / Trade-offs

- [A stored address or zone uses state `807` or `758`] → its state name is no
  longer found. The impact is small (2 rarely used entries). It is accepted and
  recorded in the proposal as BREAKING.
- [The translations of the renamed state names stop matching] → the new
  English names show until the translations are updated.
- [The BD presets on S3 must be published again] → run
  `npm run publish:presets` after the merge. Until then, stores get the old
  single Domestic zone.
- [A state in `states`/`exclude_states` that does not exist] → `states`
  keeps the unknown ID, and `exclude_states` ignores it. `check:presets` does
  not validate state IDs. This is accepted, because the data is
  written by hand and is covered by the BD test.

## Migration Plan

1. Merge the code, `states.php` and `presets.json` together.
2. Run `npm run publish:presets` to upload the new `presets.json`.
3. Rollback: publish the previous `presets.json` again. Old and new plugins
   then build one Domestic zone.
