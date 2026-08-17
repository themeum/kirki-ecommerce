## Why

The admin app's business logic lives inside component bodies, where no test can reach it. `vitest` runs `environment: 'node'` with `include: ['**/*.test.ts']`, so all 59 existing tests are pure-function tests — schemas, `libs/zod.ts`, `libs/route.ts`, `utils/color.ts`, and three feature helpers. Everything a component computes is uncovered by construction.

That is roughly 2,000 lines of real decision-making:

- `shipping-settings.tsx` (435 lines, 6 stateful hooks) holds a hand-rolled nested-array reducer over shipping zones — `handleToggleMethod`, `handleDeleteItem`, a `setValue`-based pseudo-`setState`, and a zone→view-model mapper — inline in the component, even though the pure helpers it calls already sit in a sibling `utils.tsx`. The seam exists; it is drawn one level too low.
- `product-form.tsx` has a 45-line `handleSave` doing server-error field matching, unmatched-error collection, toasting and focus management — the largest single block of untested logic in the products feature.
- `order-create.tsx` derives a debounced calculation payload, a variant-id lookup index, and an 18-line set-diff merge (`handleAddItems`) in the component body.
- `bulk-edit-table/single-row.tsx` (725 lines) is a fill-down/drag-select spreadsheet engine — including a global `mouseup` listener — implemented inside a table row.

The consequence is not theoretical. These are the paths where a regression is silent: a shipping zone that stops persisting, a save that swallows a server error, a bulk edit that fills the wrong cells. None of them can be covered today no matter how much anyone wants to.

A second, smaller problem: the same concept has three names. Pure logic is filed under `config/` in orders and coupons, `utils.ts`/`utils.tsx` in twelve places, and `helper.ts` in three. `restructure-app-features` normalizes the directory; this change puts the right things in it.

## What Changes

- **A three-layer separation in every feature.** Pure decision logic — reducers, mappers, derived rules, merges, view-model builders — moves to `features/<f>/lib/*.ts`, free of React and testable with the existing node runner. Stateful wiring — queries, mutations, form instances, dialog state, effects — moves to `features/<f>/hooks/use-*.ts`. The route component is left with JSX and a hook call.
- **Test infrastructure gains a DOM project.** `vitest.config.ts` splits into two projects: `unit` (node, `**/*.test.ts`) keeping the existing 59 tests fast and unchanged, and `dom` (jsdom, `**/*.test.tsx`). Today `.test.tsx` is not even matched by `include`, so a component or hook test added now would silently never run.
- **New devDependencies**: `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `msw`. The existing `vitest.setup.ts` stubs `globalThis.window ??= {}` because modules read `window.wp.i18n` at import time; the DOM project needs an equivalent that works against a real `window`.
- **Every extracted `lib/` function ships with tests**, following the house style already established in `schemas/forms/brand-form.test.ts` and `shipping-profile/utils.test.ts` — behaviour-phrased test names, local fixture builders, exact-value assertions.
- **Hook tests where the wiring is genuinely tricky**, via `renderHook`, rather than as a blanket rule — a hook that only forwards a query to a form is verified by the typechecker and its `lib/` tests.
- **Service-layer tests via MSW** for the paths where WordPress REST payloads actually drift. `unwrapDataList` exists precisely because PHP returns an empty associative array as `[]` and a keyed map where a list is expected; that class of bug currently surfaces as a blank screen.
- Priority order follows size and risk: products, orders, settings, then the remainder. Table and list pages are templatized rather than rewritten one by one — they already share a single consistent shape.

Out of scope: changing any component's rendered output, props contract, or behavior; touching schemas, services or route definitions beyond moving logic into `lib/`; and any further structural moves — `restructure-app-features` owns those.

## Capabilities

### New Capabilities

- `component-logic-separation`: How feature code is layered — what belongs in a component, what belongs in a hook, what belongs in pure logic — and the testability guarantee that layering exists to provide: every decision the app makes is reachable by a test that does not render anything.

### Modified Capabilities

None. This change relocates logic without altering behavior, so no existing requirement changes. `feature-module-boundaries` (introduced by `restructure-app-features`) already fixes the feature anatomy this change fills in; it defines where `lib/` and `hooks/` are, while this change defines what goes in them.

## Impact

**Code:** the ~20 highest-density components identified across `features/products`, `features/orders`, `features/settings`, `features/bulk-edit`, plus the eight list/table pages. New `lib/` and `hooks/` modules and their tests in each affected feature. `vitest.config.ts`, `vitest.setup.ts` and a new DOM setup file.

**Not impacted:** rendered markup, component props, route definitions, schemas, API contracts, PHP. No user-visible change is intended anywhere in this change.

**Dependencies:** adds `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `msw` as devDependencies. No runtime dependency changes.

**Risk:** unlike `restructure-app-features`, this change edits statements, so the typechecker is a much weaker oracle — a moved reducer with an inverted condition compiles cleanly. Mitigation is that the extraction is what makes the test possible: each `lib/` function is tested at the point it is extracted, in the same commit, so the test and the move are reviewed together rather than the test arriving later.

**Sequencing:** depends on `restructure-app-features` landing first — it targets `features/<f>/lib/` and `features/<f>/hooks/`, which that change creates. The two are deliberately separate so that a regression can be attributed to a relocation or to a rewrite, never ambiguously to both.
