## Why

A Bangladesh store gets one *Domestic* zone for the whole country from the
store presets. Bangladesh merchants normally charge one rate inside Dhaka and
a different rate outside Dhaka, so the preset zone does not match how they
ship. The BD `regional` method entry (Standard ৳180) was written for this
purpose. It is never used, because BD belongs to no trade bloc.

## What Changes

- New optional key `countries.<ISO2>.shipping.domestic_zones` in `presets.json`.
  When it is present, it replaces the single Domestic zone with one zone for
  each entry. Each entry has a `title`, `states` or `exclude_states` (state ID
  → name map), and its own `methods`. The format version stays `2`.
- BD entry: add 2 zones. **Inside Dhaka** (state `771` only) gets Standard
  ৳120, Express ৳200 and Local Pickup. **Outside Dhaka** (every other BD
  state) gets Standard ৳180. The BD `domestic` list is removed. Backward
  compatibility with older plugin versions is not needed. The unused BD
  `regional` list is removed.
- `ShippingZoneBuilder` builds the split zones. Both zones match industry rule
  templates as kind `domestic`. The currency check for method amounts does
  not change.
- BD state list in `resources/data/states.php`: remove the 2 division entries
  (`807` Barisal Division, `758` Mymensingh Division). Remove the " District"
  suffix from the remaining 61 names. The IDs do not change.
  **BREAKING** (data): a stored address or zone that uses state `807` or
  `758` loses its state name. Translations of the renamed strings stop
  matching.
- Docs: `docs/onboarding.md` and `docs/preset-data.md` describe `domestic_zones`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `store-presets`: the requirement "Shipping zones follow the store's country"
  changes. A country entry can split the Domestic zone into state-based zones,
  and Bangladesh gets *Inside Dhaka* and *Outside Dhaka*. The requirement
  "Shipping method amounts apply only in the matching currency" now also
  covers the methods of split zones.

## Impact

- Code: `app/Setup/Presets/Local/ShippingZoneBuilder.php`.
- Data: `resources/data/preconfigured-data/presets.json` (BD entry; must be
  published to S3 with `npm run publish:presets`), `resources/data/states.php`
  (BD list), `database/seeders/SettingsSeeder.php` (seeded state name).
- Tests: `tests/Integration/StorePresetsTest.php`.
- Docs: `docs/onboarding.md`, `docs/preset-data.md`.
- No API, schema or React change. `ShippingZonePresets` already accepts
  explicit state IDs.
