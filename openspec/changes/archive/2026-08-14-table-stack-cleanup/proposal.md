## Why

After `data-table-migrate-remaining`, the old table stack has no consumers left but
is still in the tree: two pagination components, two selection models, two sorting
mechanisms and the types that bridged them. Leaving it there is worse than merely
untidy — a developer adding the next table has two plausible patterns to copy, and
the whole point of the rewrite was to have one. Dead code that still compiles also
keeps its own defects alive as reference material: the untranslated
`${itemCount} items selected` string, the `PaginationData`/`PaginatedData` type
mismatch that forced casts at every call site, and `useMarkList`'s
recreated-every-render handlers.

This change removes it.

## What Changes

- Delete `components/pagination.tsx` — replaced by `components/ui/pagination.tsx`.
- Delete `components/sorting.tsx` — replaced by sortable column definitions, whose
  ids are the API sort fields.
- Delete `components/bulk-action-handler.tsx` — replaced by the DataTable's own
  selection bar, which also translates its selected-count string.
- Delete `hooks/useMarkList.ts` and its `hooks/index.ts` export — replaced by
  TanStack row selection keyed by entity id plus the explicit all-matching flag.
- Remove `MarkListHandlers` and `TaxonomyTableHeader` from `types/pages/common.ts` —
  the legacy row-props and table-header interfaces, superseded by `ColumnDef`.
- Remove `PaginationData` from `types/components/common.ts` — the type that never
  matched the API's `PaginatedData<T>`, forcing a cast at every call site.
- Remove the unused legacy `ListState` type and `parseBoolean` from
  `types/list-state.ts`. Both are already unreferenced anywhere in the app,
  predating this effort; they are removed here because this is the change that
  cleans up list-state leftovers.

## Capabilities

This change deletes code that nothing references. No behaviour changes, so no spec
changes: `skip_specs: true` is set in `.openspec.yaml`.

## Impact

- **Deleted files**: `resources/app/components/pagination.tsx`,
  `resources/app/components/sorting.tsx`,
  `resources/app/components/bulk-action-handler.tsx`,
  `resources/app/hooks/useMarkList.ts`
- **Edited**: `resources/app/hooks/index.ts` (drop the `useMarkList` export),
  `resources/app/types/pages/common.ts`,
  `resources/app/types/components/common.ts`,
  `resources/app/types/list-state.ts`
- **Depends on**: `data-table-migrate-remaining`. Every deletion here is gated on
  that change having removed the last importer; task 8.2 of that change is this
  change's precondition
- **Risk**: low, and type-checked. Every removal is either a module deletion or an
  exported-type removal, so a missed consumer is a compile error, not a runtime
  failure
- **No behavioural change**: nothing in the app references any of this after the
  preceding change
