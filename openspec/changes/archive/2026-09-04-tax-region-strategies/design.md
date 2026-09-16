## Context

See proposal.md — Why. What shapes the approach:

- The two region kinds are already cleanly separable. Mapping the full intra-feature import graph shows no file imported by both `edit-region-eu.tsx` and `general-edit-region.tsx` that isn't genuinely shared, so the partition needs no untangling first.
- The discriminator already exists and is load-bearing: `TaxRegionSchema` is `z.union([EuTaxRegionSchema, GeneralTaxRegionSchema])` where `code: z.literal('EU')` is what separates the members, and union order matters because a general region's `code` would otherwise also accept `EU`.
- ESLint's feature-boundary rules treat `settings` as one feature. Sub-features are not separately boundaried, so this restructure needs no new lint configuration — but it also gets no automatic enforcement of the layering it introduces.
- `resources/app` contains no classes and no existing registry, factory or strategy abstraction. The nearest precedent is a flat `Record<string, ReactNode>` of already-instantiated elements in the shipping delivery-method page, which stores elements rather than a contract and has no shared type to extend.
- Only four modules outside the tax directory reach into it, all through paths this change moves.

## Goals / Non-Goals

**Goals:**

- A layering whose direction is obvious from the directory a file sits in, so a violation is visible in an import line without running a tool.
- A contract derived from the branches that actually exist, not from anticipated ones.
- Keep `npm run typecheck` as the proof of correctness for the relocation.

**Non-Goals:**

- Lint enforcement of the new three-layer rule. The layering is a review convention here; adding a bespoke ESLint config for one sub-feature is disproportionate, and the existing feature-boundary rules already cover the edges that leave `settings`.
- Deduplicating the two hover-swap style implementations, the twice-defined empty-state style, or the `TaxRules` `states` prop that the EU page shims countries into. All noted as follow-ups; touching them would put design changes in a change that promises none.
- Extracting logic out of component bodies beyond the one triplicated save flow.

## Decisions

### Three layers, with the resolver above the strategies

Composition (`registry.ts`, `routes.tsx`, `pages/`, `components/`) → strategies → `shared/`. The resolver sits in the composition layer, not in `shared/`.

*Why:* the region list needs the resolver, and the resolver needs every strategy. Putting either in `shared/` inverts the arrow and makes `shared/` the thing that knows all region kinds — exactly what this change exists to stop. This also mirrors the server, where `TaxStrategyFactory` sits in `app/Tax/` rather than inside `app/Tax/Strategies/`.

*Alternative rejected:* registry in `shared/`, giving one directory for all non-strategy code. Simpler tree, but `shared/` would then import both strategies, and every "is this shared?" question would have two contradictory answers.

*Consequence worth naming:* the tax directory has both `components/` (composition, strategy-aware — one file) and `shared/components/` (strategy-agnostic). The near-duplicate names are the cost of encoding the rule in the path.

### Registry keys `EU` / `DEFAULT`; directories `eu` / `general`

*Why:* the keys are a cross-language contract with `config/tax-strategies.php` and should read identically on both sides. The directory names describe the domain and already match `EuTaxRegion` / `GeneralTaxRegion` in the catalog schema. Renaming either half to make them uniform would put one of them out of step with an existing source of truth.

### `general/` owns both general routes

The country-wide region editor and the per-state editor live in one strategy.

*Why:* they are two modes of one region kind, not two kinds. `DefaultTaxStrategy` handles both `is_central_tax_enabled` branches internally, a state is addressed as `/region/:code/:state` and has no existence apart from its region, and the two pages share the general form schemas. Splitting them would create a strategy that cannot resolve from a region code — the very thing the resolver is keyed on.

### A plain object satisfying a type, not a class hierarchy

`TaxRegionStrategy` is a `type`; each strategy is an object literal exported from its `index.ts`.

*Why:* the server's `AbstractTaxStrategy` is a base class because it carries shared implementation (`apply_rules`, `prepare_decision_context`). The frontend contract has no shared implementation — every member differs per kind — so a base class would be an empty one. `resources/app` also contains no classes at all; a type plus object literals is what this codebase reads like, and a missing member is still a compile error.

### Each strategy lazy-loads its own pages

A strategy's `index.ts` is eagerly reachable (the region list calls `resolveSummary` synchronously during render), but its route entries wrap pages in `lazy()`.

*Why:* it keeps page code in its own chunk exactly as today, and — because the strategy reaches its pages only through a dynamic import — it prevents an initialisation cycle between `index.ts` and pages that import shared modules. This is what keeps `import/no-cycle` clean; a static re-export of the page from `index.ts` would not.

### The shared save hook rethrows

`useTaxRegionSettings()` owns the query, the region-list state, the settings-record merge and the write. It does not catch. Each page keeps its own `catch { applyServerErrors(form, error) }`.

*Why:* reporting a server error needs the page's `form` instance and its schema. Handling it inside the hook would couple a data-access hook to react-hook-form and give it a second responsibility. The region-delete path, which persists immediately and reports via toast instead, is expressed as an option on the call rather than a second hook.

### Shared type barrel kept as-is

`lib/utils.ts` — a barrel re-exporting six types from the catalog schema plus three option constants — moves to `shared/lib/` unchanged.

*Why:* every page imports its types from there today. Splitting it would churn roughly ten files for no functional gain, and it is not what `feature-module-boundaries` warns about — that rule targets a barrel spanning *features*, not one internal to a single feature.

### The orphans move rather than being deleted

`tax-services.tsx`, `seller-tax-id.tsx` and `tax-simulator.tsx` relocate to `shared/components/`.

*Why:* they are unreachable but they are also placeholders for tax services, seller tax IDs and the simulator — all of which have fields reserved in `TaxSettingsFormShape`. Deleting them is a product decision, not a refactoring one. Relocation satisfies the routes-only rule without making that call.

## Risks / Trade-offs

- **The save-hook extraction is the one place a mistake is silent.** Everything else in this change is a compile error if wrong; a mis-merged settings record persists bad data. → Do it as the last step, after the relocation is green, so a regression is attributable to one commit. Preserve the delete path's distinct behaviour (direct `updateSettings`, clear the unsaved marker, invalidate, toast on failure) explicitly rather than folding it into the normal path.
- **The EU page hydrates its region list inside the same effect that resets its form.** Moving that into the hook's own effect is equivalent but changes effect ordering. → Call it out in review; verify by loading the EU editor and confirming the VAT country list and rules render on first paint.
- **The new layering has no automatic enforcement.** → The one-way arrow is legible from paths, and the composition layer is two files; a violation is visible in an import line. Revisit if a third strategy arrives.
- **A missed import path is caught by the type checker, but a missed *test* path is not** — a test file that no longer matches its subject still passes. → Assert the total test count is unchanged after splitting `region-tax.test.ts`, not just that the suite is green.
- **Style regressions would be invisible to every automated check.** → Verify by diffing that each `defineStyles` body is a pure relocation with no content change.

## Migration Plan

Shared layer first, then each strategy, then composition, then the hook. Shared must land first so the strategies have something to import; the hook goes last so the only behavioural step is isolated from the mechanical ones.

Each step ends with `npm run typecheck && npm test` from `resources/app/`. There is no runtime migration and no data change — rollback is `git revert` of the offending step.

## Open Questions

- **When `feature-module-boundaries` gets reconciled.** The app-wide anatomy rule (closed set of feature parts, sub-feature nesting one level deep) is in tension with `strategies/` and `shared/`, but that capability is not yet in `openspec/specs/` — `restructure-app-features` is complete and unarchived — so it cannot carry a delta from here. Deferrable: it changes no requirement, no approach, and no task in this change. Fold the carve-out in when `restructure-app-features` is archived.

## Correction during implementation

None yet. Append here if implementation shows a premise above was wrong, rather than diverging silently.
