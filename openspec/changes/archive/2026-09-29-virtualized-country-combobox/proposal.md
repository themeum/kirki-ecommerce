## Why

The country picker renders every one of roughly 250 countries as a mounted option row, so opening it and typing in its search box are both visibly laggy. Merchants hit this control on customer addresses, store address settings, order creation, and barcode settings, making it one of the slowest interactions in the admin. Country rows are also plain text today, so scanning for a country means reading every label rather than recognising a flag.

## What Changes

- Add an opt-in `virtualized` mode to the shared searchable select (`components/ui/combobox.tsx`) that renders only the option rows in view plus a small overscan, instead of mounting the entire option list.
- In virtualized mode, move filtering out of `cmdk` and into the component, reusing `cmdk`'s own exported `defaultFilter` scorer so match results and their ranking stay identical to today. This is required because `cmdk` cannot score unmounted rows and its internal sorting reorders the DOM against the virtualizer's absolute positioning.
- Add an optional leading icon to the searchable select's option type, rendered in the dropdown row, on the closed trigger for the selected option, and inside each chip in multi-select mode.
- Opt the country selector into virtualization and give each country its leading flag emoji at a 16px font size, with label alignment preserved for the countries that have no flag.
- The seven other callers of the searchable select keep today's exact non-virtualized code path and behavior. No change to the state selector or state field.

## Capabilities

### New Capabilities

- `searchable-select`: The shared searchable select control — how it renders long option lists without mounting every row, how its search matching and ranking behave, and how a caller attaches a leading icon to an option so it appears consistently in the list, the trigger, and multi-select chips.
- `country-selector`: The country picker built on that control — that it stays responsive across the full country list and identifies each country with its flag beside the name.

### Modified Capabilities

None. `dropdown-alignment` governs how the panel positions and sizes itself relative to its trigger; this change alters what renders inside the panel, not where the panel lands, so its requirements are unaffected.

## Impact

- **Components:** `resources/app/components/ui/combobox.tsx` (new opt-in mode, option type gains a leading icon), `resources/app/components/country-selector.tsx` (opts in, supplies flags, memoizes its option array).
- **Unchanged callers:** `attribute-name-field.tsx`, `brand-filter.tsx`, `brand.tsx`, `collection-filter.tsx`, `capsule.tsx`, `combobox-field.tsx`, and `state-selector.tsx` all stay on the existing path.
- **Dependencies:** none added. `@tanstack/react-virtual` ^3.14.10 is already installed and already used in `components/regions-dialog.tsx`, which is the in-repo precedent for the virtualizer options this change needs. `cmdk` 1.1.1 already exports `defaultFilter`.
- **Data:** none. `Country.flag` already exists as an optional emoji string in `resources/app/schemas/reference/country.ts`; no API or schema change is needed.
- **Verification:** `npm run typecheck`, `npm run lint`, and `npm test` in `resources/app/`. Per CLAUDE.md section 0, this project does not verify through a browser or dev-server preview; any purely visual confirmation is left to the user.
