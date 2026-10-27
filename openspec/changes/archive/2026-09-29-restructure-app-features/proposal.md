## Why

`resources/app` is organised layer-first — `pages/` (543 files, 30.9k lines), `components/` (115), `services/` (20), `schemas/` (129), `types/` (26) — so everything about products is spread across six top-level directories and no feature can be reasoned about, moved, or deleted as a unit. Three measured symptoms show the layering is not merely cosmetic:

- **`types/index.ts` is a god-barrel imported by 179 files.** It re-exports *runtime zod values* (`OrderFormSchema`, `OrderCalculationRequestSchema`, `isApiSuccess`) alongside types, so it is not erased at build time. Every feature has a live module edge to every other feature's schemas.
- **The dependency arrow points the wrong way in 10 places.** `components/` imports from `pages/` 7 times (`components/form/shipping-box-field.tsx` → the settings shipping dialog, `components/shared/select-products-dialog/product-filter-popup.tsx` → three product-table filters, …), and `services/order.ts` and `schemas/forms/coupon-form.ts` each import from `pages/` too.
- **~2,000 lines of business logic are unreachable by tests.** `vitest` runs `environment: 'node'` with `include: ['**/*.test.ts']`, so all 59 existing tests are pure-function tests. Logic sitting in a component body — the shipping-zone mutation ops in `shipping-settings.tsx` (435L), the 45-line `handleSave` in `product-form.tsx`, the fill-down engine in `bulk-edit-table/single-row.tsx` (725L) — cannot be covered at all.

This change makes the feature the unit of organisation and gives the resulting boundary a machine-checked contract. It is a **pure relocation: no behavioral change**. The logic extraction those 2,000 lines call for is a deliberate follow-up (`extract-feature-logic-hooks`) so that a regression can be attributed to one or the other, never both.

## What Changes

- **Twelve features under `resources/app/features/`** — products, orders, customers, coupons, collections, categories, brands, tags, inventory, bulk-edit, settings, system. Each owns its pages, components, hooks, pure logic, services, schemas, types and tests. Root `pages/` is deleted.
- **A fixed feature anatomy.** `index.ts`, `routes.tsx`, `pages/`, `components/`, `hooks/`, `lib/`, `services/`, `schemas/{catalog,forms}/`, `types.ts`, `contexts/`, `tests/` — and nothing else. Today's three names for the same concept (`config/` in orders and coupons, 12 `utils.ts`/`utils.tsx` files, 3 `helper.ts` files) all normalize to `lib/`. Nested sub-features are permitted **only** inside `features/settings/` (`shipping/`, `tax/`, `essentials/`, …), one level deep, each following the same anatomy.
- **A public API per feature.** Cross-feature access goes through `features/<name>/index.ts` only. This is what keeps the 7 legitimate cross-feature edges — all of the form "feature A embeds feature B's create dialog" (add a brand while editing a product, add a customer while creating an order) — expressible without deep reaching.
- **BREAKING — `types/index.ts` and `types/entities/` are deleted.** Types come from the zod schema that defines them. `types/entities/*.ts` is 18 files, most of them a single re-export line. `types/filters/{product,order,coupon}.ts` move to their owning feature's `types.ts`. Genuinely shared types (`types/components/common.ts` 134L, `types/list-state.ts` 121L, `types/api/*`) stay at root behind a slim barrel.
  This reverses a decision `zod-first-type-declarations` and `settings-response-schemas` both made deliberately ("the `@/types` barrel keeps entity/response types so its 182 importers are untouched"). That was correct for those changes, whose cost centre was schema conversion; it is wrong for this one, whose entire purpose is severing that edge.
- **BREAKING — `libs/query-keys.ts` splits per feature.** Each factory gains a typed `all` root and the ~70 raw-string invalidations (`invalidateQueries({ queryKey: ['Brands'] })` while the read uses `queryKeys.Brands(params)`) are replaced with it. Without this the boundary is unenforceable: a raw `['Products']` in another feature keeps working while dodging every check. Only 3 genuine cross-feature invalidations exist (`product.ts` → `Inventory`; `bulk-edit.ts` → `Inventory`, `Products`) and they become explicit barrel imports. Root keeps `Countries`, `Settings`, `DefaultSettings`.
- **16 of 20 services move to their owning feature.** Three stay at root, each because `components/` or `contexts/` imports it and those may not reach into features: `helpers.ts` (parse/toast infra), `country.ts` (reference data, used by `components/{country,state}-selector.tsx`), `settings.ts` (app config, used by `contexts/app-config-context.tsx` and `components/form/weight-field.tsx`).
- **Six data-aware components leave `components/`** for the feature owning their data — `tags-field`, `collections-field`, `attribute-values-field`, `select-products-dialog`, `shipping-box-field`, `regions-field`. This is what removes all 7 wrong-direction imports. `components/` keeps the 52 `ui/` primitives, the generic `form/` fields, `data-table/`, `modal/`, and the three components that read only root-level shared services.
- **Per-feature route modules.** Each feature exports `RouteObject[]` from its own `routes.tsx`, preserving the existing `lazy()` + `withSuspense()` pattern and reading paths from `config/route-config.ts`. Root `routes.tsx` composes them.
- **The boundary is enforced, not documented.** ESLint `no-restricted-imports` blocks deep cross-feature paths and blocks every shared root directory from importing `@/features/*` at all; `import/no-cycle` is added because feature barrels make cycles possible in a way they were not before, and a cycle here fails at runtime (undefined at module init) where `tsc` stays silent. Added as `warn` up front, flipped to `error` at the end.
- **Dead code removed**: `services/page.ts` + `schemas/catalog/page.ts` + `types/entities/page.ts` (zero importers, verified); `preview-pages/` (45 files) and `tryouts.tsx`; the 15 spent one-off codemods in `scripts/` (`babel-plugin-scoped-auto-label.js` stays — `vite.config.js` uses it). `knip` is added to catch what a 543-file move strands.

Out of scope, deferred to `extract-feature-logic-hooks`: pulling business logic out of components into `lib/` + `hooks/`, and the jsdom/@testing-library/MSW test infrastructure that makes hooks and services testable.

## Capabilities

### New Capabilities

- `feature-module-boundaries`: How the admin app is partitioned — what a feature owns, the fixed anatomy every feature follows, the public-API rule for cross-feature access, the permitted direction of dependencies between features and shared layers, where a type's definition lives now that the global barrel is gone, how query-key ownership and cross-feature cache invalidation work, and where tests live.

### Modified Capabilities

None. Every existing spec describes runtime behavior that this change preserves exactly. The two specs that mention paths at all — `product-form` (`resources/app/components/form/`) and `plugin-packaging` (`resources/app/`) — reference directories that survive the move unchanged.

## Impact

**Code:** effectively all of `resources/app`. 543 files relocate under `features/`; ~179 files get import rewrites from the `@/types` deletion; 20 services and 129 schemas are redistributed; `routes.tsx`, `eslint.config.js`, `libs/query-keys.ts`, `types/index.ts` and `contexts/` are rewritten.

**Not impacted:** `theme/`, `libs/` (except `query-keys.ts`), `utils/`, `config/`, `components/ui/` (all 52), `components/data-table/`, `vite.config.js` aliases, `tsconfig.json` paths. No PHP, no REST endpoint, no `docs/ecommerce/*.yml`.

**Dependencies:** adds `knip` and `eslint-plugin-import` as devDependencies. No runtime dependency changes.

**Risk:** the relocation is mechanically verifiable — deleting the `@/types` barrel converts every stale import into a compile error, so `npm run typecheck` is the proof rather than a smoke test. The residual risks are (a) `import/no-cycle` catching a cycle the barrels introduce, which forces a barrel to be narrowed, and (b) the raw-string query-key replacement, where a mis-scoped `all` root would change what a mutation invalidates — the one place in this change where a mistake is behavioral rather than a compile error. Treat the query-key commit as the one needing real review attention.

**Coordination:** three changes are incomplete, but only their *manual browser-QA* tasks remain — all their code is written and green. `stacked-items-primitive` task 7.3 verifies `stacked-items-preview.tsx` through `tryouts.tsx`, both of which this change deletes; it is marked obsolete with that reason. The remaining QA tasks in `stacked-items-primitive`, `rule-items-primitive` and `variant-matrix-regeneration` are dev-server checks against real pages — unaffected by the harness removal, but they should be run against the restructured tree rather than the old one.
