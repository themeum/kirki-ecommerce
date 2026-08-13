## Context

See proposal.md — Why. What makes this change simple is that it is entirely
subtractive and entirely type-checked: every item is either a whole module or an
exported type, so a surviving consumer surfaces as a compile error rather than a
runtime failure.

Two facts about the repo's tooling shape the verification approach:

- `knip` is a devDependency but has **no configuration file and no npm script**.
  Running it unconfigured will report unused exports across the whole app,
  including plenty that predate this work. It is therefore an advisory signal here,
  not a gate.
- `ListState` and `parseBoolean` in `types/list-state.ts` are already referenced
  nowhere in the app — confirmed by search — and predate the table rewrite. They are
  swept up here because this is the change that tidies list-state leftovers, not
  because the rewrite orphaned them.

## Goals / Non-Goals

**Goals:**

- One table stack in the tree, so the next table has exactly one pattern to copy.
- No dead module left as a tempting reference implementation.

**Non-Goals:**

- Not removing anything that still has a consumer. If something turns out to be
  referenced, that is a signal the preceding migration is incomplete — finish it
  there rather than keeping a shim here.
- Not a general dead-code sweep of the app. Scope is the table stack plus the two
  already-orphaned list-state leftovers.
- Not configuring `knip`. Worth doing, but it is its own change with its own
  baseline argument.

## Decisions

### Delete rather than deprecate

No `@deprecated` markers, no compatibility shims, no re-export stubs. This is an
internal admin bundle with no external consumers, and the migration changes already
moved every call site. A shim would only preserve the ambiguity the change exists to
remove.

### Deletion order follows the dependency direction

Components first (`pagination.tsx`, `sorting.tsx`, `bulk-action-handler.tsx`), then
the hook they leaned on (`useMarkList.ts`), then the types that only existed to serve
them. Working in that order means each `tsc --noEmit` run reports a small, coherent
set of errors if something was missed, rather than one large tangle.

### `grep` plus `tsc` is the gate; `knip` is advisory

The authoritative check for each deletion is a search for importers followed by a
clean typecheck. `knip` is run once at the end as a cross-check, with the
expectation of pre-existing noise unrelated to this change — it should not be
treated as a pass/fail signal in its current unconfigured state.

### A surviving importer means stopping, not adapting

If a deletion turns out to break something, the correct response is to finish
migrating that consumer in `data-table-migrate-remaining` — where the pattern and
its verification live — and then return here. Adapting the consumer inside this
change would put migration work in a change whose stated scope is deletion, and
would hide an incomplete migration.

## Risks / Trade-offs

- **[Something still imports a deleted module]** → Caught by `tsc --noEmit`
  immediately. The response is to complete that consumer's migration in the previous
  change, not to keep the module alive here.
- **[Removing `PaginationData` could break a caller that was relying on the cast to
  paper over a shape difference]** → That is precisely what should surface. Any such
  site is reading a field the API does not actually return (`from`,
  `has_more_pages`), and the compile error is the discovery mechanism.
- **[`ListState` / `parseBoolean` removal is adjacent to the change's stated scope]**
  → Both are verified unreferenced. Called out explicitly in the proposal so the
  diff does not look like scope creep.
- **[Unconfigured `knip` output could be mistaken for regressions introduced here]**
  → Stated up front as advisory; the tasks say to compare against expectation rather
  than aim for a clean run.
