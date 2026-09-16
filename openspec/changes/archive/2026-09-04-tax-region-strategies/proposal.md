## Why

The PHP backend already models tax as a strategy pattern: `config/tax-strategies.php` maps `['EU' => EUTaxStrategy::class, 'DEFAULT' => DefaultTaxStrategy::class]`, `TaxStrategyFactory::get_strategy()` normalizes a country code to `EU` or falls back to `DEFAULT`, and neither strategy references its sibling. Adding a region kind there is one class plus one config line.

The admin UI has the identical EU-vs-general split but expresses it as scattered `code === 'EU'` ternaries. `features/settings/tax/pages/tax-region/tax-region.tsx` (331 lines) branches four separate times — for a region's display name and flag, its summary line, which route Edit navigates to, and what object shape a newly added region gets. A third region kind means finding and editing all four, with nothing structural to say when one has been missed.

Two adjacent problems make the feature hard to navigate at all. `pages/` holds 21 files but only 4 are routes; the rest are dialogs, rows and cards, and three more (`tax-services.tsx`, `seller-tax-id.tsx`, `tax-simulator.tsx`, 200 lines) have zero importers and are not routes at all. And the "load tax settings → merge my region → PUT the whole blob back" flow is copy-pasted verbatim across all three region pages.

## What Changes

- **Each region kind becomes a self-contained strategy directory.** `strategies/general/` and `strategies/eu/`, each owning its own pages, components, pure logic, form schemas and tests. A strategy may depend on shared code; it may never depend on a sibling. The current split is already clean — no file is imported by both — so no strategy-to-strategy edge is introduced or left behind.
- **A registry replaces the four branch sites.** `tax/registry.ts` holds an `EU` / `DEFAULT` map and a `resolveTaxRegionStrategy(code)` with the same `?? DEFAULT` fallback as `TaxStrategyFactory::get_strategy()`. Keys match `config/tax-strategies.php`; directory names stay `eu` / `general` to match the existing `EuTaxRegion` / `GeneralTaxRegion` schemas. `general/` owns both general routes, mirroring `DefaultTaxStrategy`, which handles both `is_central_tax_enabled` modes internally.
- **A `shared/` directory holds everything strategy-agnostic** — the contract, the tax-rules editor, tax profiles, the catalog schema, services, skeletons and their tests. It never imports a strategy, so the dependency arrow runs composition → strategies → shared, one way.
- **`pages/` holds only route components.** The four route targets stay; every nested dialog, row and card moves to `components/` in whichever layer owns it.
- **Strategies own their routes.** Each exports its own `RouteObject[]`; `tax/routes.tsx` composes them; `features/settings/routes.tsx` drops four `lazy()` declarations for one spread. Route path templates still come from `RouteConfig`, which stays central by design.
- **The triplicated save flow is extracted** to one `useTaxRegionSettings()` hook owning exactly one responsibility: reading and writing the whole `tax` settings blob. How a region merges into that list stays in each strategy's own logic. The hook rethrows so each page keeps its existing `applyServerErrors` handling, and the region-delete path keeps its distinct direct-`updateSettings` behavior.
- **The three orphaned files move out of `pages/`** into `shared/components/` unchanged, rather than being deleted.

Explicitly **not** changing: any CSS or design. Every Emotion `defineStyles` block moves with its owning file byte-for-byte. No runtime behavior of tax settings changes — `tax-region-rate-model` is untouched.

## Capabilities

### New Capabilities

- `tax-region-strategies`: How the tax settings UI is partitioned by region kind — what a strategy owns, the contract every strategy satisfies, how a region is dispatched to one with a default fallback, the prohibition on one strategy depending on another, and what adding a future region kind requires.

### Modified Capabilities

None. `tax-region-rate-model` describes the merchant-facing behavior of tax regions, which this change preserves exactly.

**Coordination note:** `feature-module-boundaries` — the app-wide anatomy rule from `restructure-app-features` — states that a feature's top-level parts are a closed set and that sub-feature nesting goes at most one level deep. `strategies/` and `shared/` are outside that set, and `tax/strategies/eu/` is a second level. That change is complete but not yet archived or synced, so the capability does not exist under `openspec/specs/` and cannot carry a delta from here. Until it is synced, the anatomy rule stands in tension with this structure; resolving it is deferred and should be folded in when `restructure-app-features` is archived.

## Impact

**Code:** all 48 files of `resources/app/features/settings/tax/` (5,228 lines) relocate; 10 test files (953 lines) move with them, and `tests/lib/region-tax.test.ts` splits three ways along the same shared/general/EU line as its subject. New files: `registry.ts`, `routes.tsx`, `shared/contracts/tax-region-strategy.ts`, `shared/hooks/use-tax-region-settings.ts`, and an `index.ts` + `routes.tsx` per strategy.

**Outside the feature**, four import sites update: the three tax re-exports in `features/settings/index.ts` (`TaxProfilePopup`, `TaxSettingsFormPayload`, `useTaxProfilesQuery`), the four `lazy()` tax imports in `features/settings/routes.tsx`, and the eslint-disabled `TaxRegionSchema` import in `schemas/catalog/settings.ts`.

**Not impacted:** no PHP, no REST endpoint, no `config/route-config.ts` path change, no `docs/ecommerce/settings/tax.yml`, no dependency changes, no theme or style tokens.

**Risk:** the relocation is mechanically verifiable — every moved file breaks its importers at compile time, so `npm run typecheck` is the proof rather than a smoke test. The residual risk is concentrated in the `useTaxRegionSettings` extraction, the one part that rewrites live save paths, where a mistake is silent data loss rather than a compile error. Treat that step as the one needing real review attention, and note that the EU page currently hydrates its region list inside the same effect that resets its form — splitting that is equivalent but is the specific line worth checking.
