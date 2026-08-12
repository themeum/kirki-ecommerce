## Context

See proposal.md — Why. This section records the constraints that shape the approach.

**The test runner is the binding constraint.** `vitest.config.ts` sets `environment: 'node'` and `include: ['**/*.test.ts']`. Two consequences follow, and both matter more than they first appear:

1. `.test.tsx` is not matched at all. A component or hook test written today runs zero assertions and reports success — worse than having no test.
2. Extracting logic into a *hook* buys no coverage on its own. Hooks need React. Only the pure layer becomes testable without new infrastructure. That is why the seam is drawn at pure-logic-vs-wiring rather than simply "move it all into `use-<page>.ts`".

**`vitest.setup.ts` is three lines and load-bearing.** It stubs `globalThis.window ??= {}` because modules read `window.wp.i18n` and `window.kirki_ecommerce` at import time. Under jsdom `window` already exists, so the `??=` guard does nothing and the properties are still missing — the DOM project needs its own setup that populates them rather than reusing this file.

**The codebase already does the right thing in three places**, and these are the templates rather than inventions:

- `orders/order-details/config/{order-actions,order-badge,order-address}.ts` — pure decisions (`getAvailableActions`, `getPaymentBadgeInfo`, `toOrderFormAddresses`) already extracted and called from the component. The gap is that the *stateful* wiring around them has no home.
- `product-form/use-unsaved-navigation-guard.ts` — the model hook: single responsibility, returns a named result object (`{ isBlocked, discardChanges, dismissToast, markSaving, shakeSignal }`).
- `settings-layout/use-settings-page-actions.ts` — the only feature-contract abstraction in the app; every settings sub-page publishes save/discard/dirty state up through it. It must survive this change intact.

**`edit-product.tsx` (57 lines) already demonstrates the target shape** — it fetches, maps, and hands `ProductForm` a `mode`/`initialValues`/`onSubmit` contract. The work is to make the rest look like this.

Constraint from `CLAUDE.md`: no browser verification. Correctness is established by tests, not by looking at the app.

## Goals / Non-Goals

**Goals:**

- Every decision the app makes is callable from a test that renders nothing.
- Behavior is provably unchanged where a test can prove it, and the extraction is what creates that proof.
- The layering is uniform enough that the next contributor doesn't have to decide where logic goes.

**Non-Goals:**

- Improving the logic being extracted. A confusing reducer moves as-is; its test documents current behavior. Fixing it is a later change against a now-covered function.
- Any change to rendered output, props, routes, schemas, or API calls.
- Blanket hook tests. Coverage is a means here, not a target.
- Structural moves — `restructure-app-features` owns those.

## Decisions

### The seam is pure-logic vs wiring, not "everything into a hook"

Considered the simpler rule — one `use-<page>.ts` per fat component holding all of it, component reduced to JSX. Rejected: it produces the same fat file with a different extension and buys no testability, since hooks need React either way. The two-layer split is what converts untested lines into tested ones under the runner this project already has.

The corollary is that the `lib/` layer is the valuable one and the hook layer is bookkeeping. When in doubt, push logic down to `lib/`.

### Extraction and its tests are one unit of work

This change edits statements, so `tsc` is a weak oracle — a transplanted condition can be inverted and compile clean. The test written at the moment of extraction is the only thing that establishes behavior was preserved. Deferring tests to a later task would mean the risky edit ships unverified and the verification arrives against code nobody remembers writing.

Practically: a task is not done when the function has moved. It is done when the function has moved and its tests pass.

### Tests document current behavior, including behavior that looks wrong

Where extracted logic turns out to be questionable — and it will, in a 725-line spreadsheet engine — the test asserts what it does today, with a note. Changing behavior inside a refactor makes the refactor unverifiable, which is the whole reason this change is separate from the relocation in the first place.

### Two vitest projects rather than switching the whole suite to jsdom

```ts
test: {
  projects: [
    { name: 'unit', environment: 'node',  include: ['**/*.test.ts'] },
    { name: 'dom',  environment: 'jsdom', include: ['**/*.test.tsx'],
      setupFiles: ['./vitest.setup.dom.ts'] },
  ],
}
```

Considered running everything under jsdom for simplicity. Rejected: the 59 existing tests are pure and would pay jsdom's startup cost for nothing, and the file-extension split gives a rule with no ambiguity — needs a DOM, name it `.tsx`.

`vitest.setup.ts` stays as-is for the node project. `vitest.setup.dom.ts` is new and must actually populate `window.wp.i18n` and `window.kirki_ecommerce`, since under jsdom the existing `??=` guard is a no-op.

### Hook tests are selective; MSW covers the service layer

`renderHook` tests are written where the wiring itself is the risk — a debounced watch feeding a server calculation, a form-reset effect keyed on arriving data, an unsaved-changes guard. A hook that forwards a query into a form is covered by the typechecker and its `lib/` tests; testing it asserts that React works.

MSW is aimed narrowly at where WordPress REST payloads actually drift: `unwrapDataList` exists because PHP serialises an empty associative array as `[]` and returns a keyed map where the caller reads a list. `settings-response-schemas` records that exact class of bug making `/settings/payments` unreachable. Those are the paths worth a fixture.

### List and table pages are templatized, not rewritten individually

`product-table`, `order-table`, `coupon-table`, `customer-table`, `brand-table`, `collection-table`, `category-table`, `tag-table` and `inventory-table` already share one shape: `useListParams` → query → bulk-delete mutation → `DataTable` with a module-scope `columns` array.

**`columns` declarations must stay at module scope.** `product-table.tsx` carries an explicit comment recording why: the stable reference is what lets the memoized table header sit out a search. Moving them into a hook or a `useMemo` would silently reintroduce a re-render on every keystroke — a performance regression with no failing test.

### Order of work: highest density first

Ranked by stateful-hook count against line count, not lines alone — density is what predicts entanglement:

| Target | Size | Extracted to `lib/` |
|---|---|---|
| `bulk-edit-table/single-row.tsx` | 725L | fill-down / drag-select engine |
| `variants/variation-table/single-group.tsx` | 466L, 9 hooks | variant group derivation |
| `shipping-method/shipping-rules/shipping-rule-form-card.tsx` | 451L, 8 hooks | rule condition/action logic |
| `shipping-settings.tsx` | 435L, 6 hooks | zone operations, method view model |
| `tax-region/general-edit-region.tsx` | 302L, 9 hooks | region/rate mapping |
| `order-details.tsx` | 327L | already has `lib/`; wiring → `use-order-details.ts` |
| `product-form.tsx` | 256L | `handleSave` server-error matching |
| `order-create.tsx` | 216L, 5 hooks | `handleAddItems` set-diff, row derivation |

`order-details.tsx` is deliberately early despite not being the largest: its pure layer already exists, so it is the cheapest end-to-end demonstration of the target shape and sets the pattern the rest follow.

### The three `useQueryClient` leaks

`tax-profile.tsx`, `general-edit-region.tsx` and `edit-region-eu.tsx` call `useQueryClient()` directly — the only three places outside `services/` that touch React Query. They are folded into the tax feature's hooks as those files are extracted, provided the fold is behavior-preserving. Where it is not obviously so, the leak stays and is recorded; an unverifiable cache change is not worth the tidiness.

## Risks / Trade-offs

- **A transplanted condition can be inverted and still compile.** The central risk of this change, and the reason it is separate from the relocation. → Test at the point of extraction, in the same unit of work; assert concrete values, not call counts.

- **Moving `columns` off module scope silently regresses table performance.** No test catches it. → Recorded as an explicit constraint above; treat any `columns` array that gains a hook call as a defect in review.

- **jsdom can make an unrunnable test look green.** A `.test.tsx` not matched by `include` reports success having run nothing. → After wiring the DOM project, verify it by asserting a deliberate failure actually fails before trusting any passing DOM test.

- **Extraction can quietly change effect timing.** Moving a `useEffect` into a hook changes nothing by itself, but reordering hook calls relative to each other changes when effects fire. → Preserve hook call order within the extracted hook exactly as it was in the component; where order must change, cover it with a `renderHook` test.

- **`use-settings-page-actions.ts` is the only cross-page contract in the app.** Eleven settings sub-pages publish through it. → Do not refactor it as part of extracting the pages that consume it; if it must change, that is its own task with its own tests.

- **Scope drift toward "fixing while extracting".** The extracted logic will contain things worth improving. → Tests document current behavior; improvements are follow-up changes against covered code.

## Migration Plan

Sequenced after `restructure-app-features` archives, since this targets `features/<f>/lib/` and `features/<f>/hooks/`.

One branch, commits grouped by feature. Test infrastructure lands first and is verified to actually run before any extraction depends on it. Each extraction commit contains the moved logic and its tests together — never one without the other.

Verification after every commit, from `resources/app/`:

```bash
npm run typecheck && npm test
```

with `npm run lint` and `npm run build` at the end. No browser verification, per `CLAUDE.md`.

Rollback is per-commit revert; because each commit is one feature's extraction plus its tests, reverting one leaves the rest intact.

## Open Questions

None blocking. One deferred deliberately: whether the eight list/table pages warrant a shared `use-list-page` hook rather than eight parallel hooks of the same shape. That is answerable only after three or four have been extracted and the real variation is visible — deciding it now would be guessing. It does not change the specs, the approach, or the task breakdown.
