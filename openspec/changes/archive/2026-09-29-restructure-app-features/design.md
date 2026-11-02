## Context

See proposal.md — Why. This section records only the measurements that shape the approach.

The tree is layer-first: `pages/` 543 files / 30.9k lines, `components/` 115, `schemas/` 129, `services/` 20, `types/` 26, `hooks/` 6, `contexts/` 3. Four facts determine how the migration can be sequenced:

- **`pages/` is already feature-shaped.** Thirteen top-level directories map almost exactly onto the intended features, and nesting inside them is already coherent (`products/product-form/sections/…`, `orders/order-details/config/…`). The move is largely `git mv` of whole subtrees.
- **Cross-feature coupling is small and legible.** Only 7 page→page import edges exist, 6 of them the same shape (feature A embeds feature B's create/edit dialog). 44 of 46 form schemas belong to exactly one feature. Only 3 cross-feature cache invalidations exist.
- **The coupling that is large is centralised.** `types/index.ts` (179 importers) and `libs/query-keys.ts` (~60 entries) are two files that together touch everything. They are the whole difficulty, and they can be dealt with once, up front.
- **`typecheck` is a near-total oracle.** `tsconfig.json` sets `strict`, `noUnusedLocals`, `noUnusedParameters`, `isolatedModules`. Deleting the `@/types` barrel makes every stale import a compile error rather than a silent survival. The gap in that oracle — the one place a mistake is behavioral instead of a compile error — is the query-key work, because `queryKey: ['Products']` and `queryKey: productKeys.all` typecheck identically while matching different cache entries.

Constraint from `openspec/project.md`: schemas in `schemas/catalog/` are deliberately lenient and must not be tightened; zod stays at v3.25.76. Nothing here changes schema content — only location.

Constraint from `CLAUDE.md`: no browser-based verification in this project. Verification is `typecheck`, `lint`, `test`, `build`.

## Goals / Non-Goals

**Goals:**

- Every commit on the branch is independently green, so `git bisect` lands on one feature.
- The diff contains relocations and import-line rewrites only. No statement inside a moved file changes.
- The boundary is machine-checked before the branch merges, not after.

**Non-Goals:**

- Any behavioral change. Bugs found in passing are recorded, not fixed.
- Extracting logic from components — that is `extract-feature-logic-hooks`, deliberately separate so a regression is attributable.
- Renaming beyond the two normalizations the anatomy requires (`config/`/`utils`/`helper` → `lib/`, and the two legacy camelCase hook filenames that move anyway).
- Reducing `settings` from one feature to eleven, or merging `inventory` with `bulk-edit`. Both were considered and rejected — see Decisions.

## Decisions

### Pages live inside features; there is no separate route layer

`features/<name>/pages/` holds route components. The alternative — keeping root `pages/` as thin shells that import from `features/` — was rejected because it preserves exactly the split this change exists to remove: a feature would again be two directories, and "where does this file go" would again have two answers.

### Shared code stays at root rather than moving under `shared/`

Considered gathering `components/`, `hooks/`, `utils/`, `libs/`, `theme/`, `types/`, `schemas/`, `services/`, `contexts/`, `config/` under a single `shared/` directory, which would make the shared-vs-feature distinction visually unmissable. Rejected: it rewrites the import path of every `@/components/ui/*`, `@/theme`, `@/libs/*` reference in the app — hundreds of files — to encode information that the lint rule already enforces exactly. The rule does not need the directory name to work.

### `settings` is one feature with nested sub-features

`pages/settings/` is 98 files across 11 sub-areas. Splitting them into 11 top-level features was considered and rejected: they share `SettingsLayout`'s outlet contract (every sub-page publishes its save/discard/dirty state up through `use-settings-page-actions.ts` — the only feature-contract abstraction in the codebase today) and a single section-keyed settings service with its `SettingsSchemaMap`. Splitting would turn both into cross-feature shared code and lose the thing that makes them coherent.

Sub-feature nesting is therefore permitted, but only here, only one level deep, and each sub-feature takes the same anatomy as a top-level feature.

### `inventory` and `bulk-edit` stay separate

They share a service, a list hook, and near-identical contexts, which argues for merging. Rejected: they are separate routes with different UX, and the merged directory would need a name (`variants`?) that names nothing anyone says. The shared service moves to `bulk-edit` and `inventory` consumes it through the public API — one honest edge instead of a euphemism.

### Ownership, not import count, decides where a service lives

The naive reading of the import graph says 12 of 20 services are "shared". That reading is an artifact of the old structure: `brand.ts` is imported by both `brands` and `products` only because the product form embeds a brand picker. Under the public-API rule that is an ordinary cross-feature call, not shared code.

So a service lives with the feature owning its entity. Exactly three stay at root, each for a reason that is a consequence of the boundary rule rather than a judgement call — each is imported by `components/` or `contexts/`, which may not reach into `features/`:

| Service | Kept at root because |
|---|---|
| `helpers.ts` | Response-parsing/toast infrastructure (`parseData`, `parseResponse`, `parseMessage`, `unwrapDataList`); owned by no domain |
| `country.ts` | Reference data; `components/{country,state}-selector.tsx` use it |
| `settings.ts` | Application config; `contexts/app-config-context.tsx` and `components/form/weight-field.tsx` use it |

Note the asymmetry this creates and accept it deliberately: `services/settings.ts` stays at root while `features/settings/` exists. It reads oddly until you see that the file serves app-wide configuration (weight unit, base currency) as much as it serves the settings screens. Splitting it into an app-config half and a settings half is the tidier end state and is explicitly deferred — doing it here would mean editing service internals during a relocation.

### Six components leave `components/`; three stay

Eleven files under `components/` currently import a service or a page. The boundary rule resolves each without a judgement call: if the data is owned by a feature, the component is not shared.

| Component | Resolution |
|---|---|
| `form/tags-field.tsx` | → `features/tags` |
| `form/collections-field.tsx` | → `features/collections` |
| `form/attribute-values-field.tsx` (+ its `VariationDialog` import) | → `features/products` |
| `shared/select-products-dialog.tsx` + `select-products-dialog/` (+ its 3 product-table filter imports) | → `features/products` |
| `form/shipping-box-field.tsx` (+ its shipping-box dialog import) | → `features/settings/shipping` |
| `form/regions-field.tsx` (+ its shipping-region dialog and shipping utils imports) | → `features/settings/shipping` |
| `country-selector.tsx`, `state-selector.tsx` | stay — reference data |
| `form/weight-field.tsx` | stays — application config |

These six moves remove all 7 `components/ → pages/` edges. The two remaining wrong-direction imports resolve by co-location rather than by moving anything: `services/order.ts` → `order-actions` and `schemas/forms/coupon-form.ts` → `coupon-datetime` both become intra-feature imports once both ends land in the same feature.

Considered and rejected: making the fields presentational (taking `options`, `isLoading`, `onCreate` as props) so they could stay shared. That is a better long-term design, but it is a rewrite of 11 components plus every call site, performed during a relocation — precisely the mixing this change is structured to avoid. It remains available as a later change.

### Query keys move with their service, and inline literal keys are removed in the same commit

Splitting `libs/query-keys.ts` per feature is required by the anatomy. Replacing the ~70 inline literal invalidations is required for the split to *mean* anything: a stray `invalidateQueries({ queryKey: ['Products'] })` inside another feature keeps working while being invisible to lint, to `tsc`, and to the reader. Leaving them would make the boundary nominal.

Each factory therefore exposes an `all` root, and reads compose from it, so a read and its invalidation cannot drift apart. Root keeps only `Countries`, `Settings`, `DefaultSettings` — the keys belonging to the three root services.

The three real cross-feature invalidations become explicit imports:

- `product.ts` → `inventoryKeys.all`
- `bulk-edit.ts` → `inventoryKeys.all`, `productKeys.all`

There is one trap here. Today's reads use `queryKeys.Brands(params)` while invalidations use `['Brands']`, and that works only because React Query matches by key prefix. Any replacement must preserve prefix relationships exactly: `productKeys.all` must remain a prefix of `productKeys.list(params)`. A factory whose `list` does not extend `all` will typecheck, lint, and silently stop invalidating. This is the single highest-risk edit in the change and is isolated into its own commit for that reason.

### Types are imported from their defining schema

`types/index.ts` is deleted. It re-exports runtime values (`OrderFormSchema`, `OrderCalculationRequestSchema`, `isApiSuccess`), so it survives compilation as a real module edge — 179 files joined to every feature's schemas.

Disposition of `types/`:

| Current | Destination |
|---|---|
| `types/entities/*.ts` (18 files, most a single re-export line) | deleted; import from the schema |
| `types/filters/{product,order,coupon}.ts` | owning feature's `types.ts` |
| `types/components/{common,icon}.ts`, `types/list-state.ts`, `types/api/{response,result}.ts`, `types/pages/*`, `types/common-actions.ts` | stay at root `types/`, behind a slim shared-only barrel |

This reverses a decision that `zod-first-type-declarations` and `settings-response-schemas` each made on purpose — both kept the barrel so their 182 importers stayed untouched. That was right for those changes, whose cost centre was schema conversion and for whom the barrel was incidental. It is wrong here, where the barrel is the subject.

Note that pages mostly reach schemas *through* this barrel rather than directly, so the rewrite is wider than the grep for `@/schemas` suggests. `noUnusedLocals` plus the deleted barrel makes every such site a compile error, which is what makes the rewrite tractable.

### Routes are declared per feature and composed at the root

Each feature exports `RouteObject[]`. Root `routes.tsx` spreads them inside the existing `UnsavedChangesController` layout route. The `lazy()` + local `withSuspense()` pattern and reading paths from `config/route-config.ts` are both preserved exactly — `manualChunks` in `vite.config.js` routes dynamic entries to `js/pages/[name]-[hash].chunk.js`, and that must keep working. Chunk output is compared before and after.

`RouteConfig.Settings.LicenseSettings` is defined in route config with no registered route. Pre-existing; recorded, not fixed.

### The rule is added as a warning first and promoted at the end

The lint boundary lands in the first commit as `warn` and is promoted to `error` in the last. Landing it as `error` immediately would fail every commit until the final feature moves; landing it only at the end means drift accrues invisibly for thirteen commits. As a warning it reports the shrinking set of remaining violations as a live progress signal.

`import/no-cycle` is added at the same time. Feature barrels make cycles reachable in a way the old flat structure did not, and a cycle here manifests as `undefined` at module initialisation — invisible to `tsc`, fatal at runtime.

### Leaf features go first

Order: `brands`, `tags`, `categories`, `collections` — four near-identical clones, structurally the same four files each — then `customers`, `coupons`, `inventory`, `bulk-edit`, then `orders`, `products`, `settings`, then `system`. The clones validate the codemod on the smallest possible blast radius and, being clones, cover the same code paths four times before anything expensive moves. `settings` is last because it is 98 files and holds the outlet contract.

## Risks / Trade-offs

- **A query-key factory whose `all` is not a prefix of its `list` silently stops invalidating.** Typechecks and lints clean; the symptom is a stale list after a mutation, which no automated check in this repo catches. → Isolate the query-key rewrite in its own commit, diff every read/invalidate pair against the current `queryKeys` entry, and confirm `all` prefixes every derived key in the same file. Highest-attention review target of the change.

- **A public API that re-exports too much recreates the coupling in a legal form.** A barrel exporting a feature's whole surface passes lint while restoring exactly the edges being removed. → Each barrel starts empty and gains an export only when a concrete cross-feature import needs it. The expected total is small: 7 known edges plus the 6 relocated field components.

- **Barrels can introduce import cycles that only fail at runtime.** → `import/no-cycle` from the first commit; a cycle forces the barrel to be narrowed or the shared piece to move, and is not worked around.

- **`git mv` plus import rewrites can hide a real edit inside a large diff.** → Every commit is reviewed with rename detection (`git diff -M`); a moved file showing content changes beyond its import block is treated as a defect. `npm test` must pass with all 59 test files unchanged in content — only their paths move.

- **Codemod-driven rewrites can produce plausible-but-wrong paths at scale.** → `typecheck` after every commit, and the four clone features first so the codemod is exercised on ~24 files before it touches 543. `scripts/` already contains 15 spent codemods from prior migrations of this codebase, so the technique and its failure modes are known here.

- **Three in-flight changes have pending manual QA.** `stacked-items-primitive` 7.3 verifies a preview harness this change deletes. → That task is marked obsolete with the reason recorded; the remaining QA tasks in all three are dev-server checks against real pages, unaffected by the deletion, and should be run against the restructured tree.

- **`services/settings.ts` staying at root while `features/settings/` exists is a genuine wart.** → Accepted for this change and recorded here so it is not mistaken for an oversight; splitting it into app-config and settings halves is a follow-up, since doing it here means editing service internals during a relocation.

## Migration Plan

One branch off `dev`, one commit per stage, each independently green:

```
01  codemod + lint boundary rule (warn) + import/no-cycle
02  shared splits: types barrel, query keys, services, contexts
03  brands       ┐ four near-identical clones —
04  tags         │ these prove the codemod
05  categories   │
06  collections  ┘
07  customers    08  coupons    09  inventory    10  bulk-edit
11  orders       12  products   13  settings
14  system (not-found, coming-soon) + dead-code deletions
15  lint rule → error; add knip
```

`git mv` preserves blame. Rollback is per-commit revert; commit 02 is the only one whose revert is non-trivial, since later commits depend on the split key factories.

**Verification after every commit**, from `resources/app/`:

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

`typecheck` is the primary oracle. `npm test` must show all 59 files passing with unchanged content. `npm run build` must produce an equivalent chunk list under `../../assets`. At commit 15, `npx knip` confirms nothing was stranded. No browser verification, per `CLAUDE.md`.

## Open Questions

None. The design decisions above were settled before proposing; the deferrals (`services/settings.ts` split, presentational form fields) are recorded as follow-ups rather than unknowns.

## Correction during implementation

**Three `types/` symbols had no schema to fall back to.** The disposition table in "Types are imported from their defining schema" assumed every `types/entities/*.ts` file was a pure re-export shim. Three symbols were not:

- `UnitPriceValue` and `UpdateVariantsPayload` (real declarations inside `types/entities/product.ts`) — used by both `products` and `bulk-edit` (via `contexts/bulk-edit-form-context.tsx`). Landed in `features/products/types.ts`, created in commit 02 ahead of the rest of the `products` move, since `bulk-edit`'s context needs it immediately and `bulk-edit` already treats `products` as the owning feature for its other cross-feature key (`productKeys`, task 2.7).
- `ToastVariant` (`types/entities/toast.ts`) — used by `pages/utils.ts` and `pages/settings/shipping-settings/utils.tsx`, genuinely feature-independent. Folded into the surviving `types/pages/common.ts`, next to the related `ToastMessageConfig`.

**The query-key split surfaced 2 more raw-literal invalidations than the original count.** The proposal's "~70" estimate came from a `services/`-only scan. An app-wide sweep for `queryKey: ['` after finishing the services found two more in page components using `useQueryClient()` directly for optimistic updates (`shipping-profile.tsx`, `tax-profile.tsx`) — both fixed the same way. Recorded here since it means the real count of independent invalidation call sites this change touches is 63, not ~70 minus these two; the risk and mitigation are unchanged.
