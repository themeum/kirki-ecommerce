## Context

See `proposal.md — Why` for motivation. The constraints that shape the approach:

- **Sorting is already server-driven.** `DataTable` runs with `manualPagination`, `manualSorting`
  and `manualFiltering` all true. A column's TanStack `id` is used verbatim as the API's `sort_by`
  (`resources/app/hooks/use-data-table-params.ts`), a contract established in
  `openspec/changes/archive/2026-08-13-data-table-tanstack/design.md`. Nothing about that changes;
  the work is filling in the fields the backend will actually honour.
- **The backend already sorts, seventeen times over.** The same
  `when(sort_by && sort_order) → order_by()` block is copy-pasted into 17 services, and an inline
  `$request->whitelisted('sort_by', 'id', [...])` array literal sits in 14 controllers. There is no
  base service class and no shared query concern for sorting — the only precedent for one is the
  model trait `app/Traits/HasDateRangeFilter.php`.
- **An unknown sort field is silent.** `Request::get_whitelisted()` returns the default when the
  value is not in the list, so a mistyped or unlisted column produces a successful response in
  default order. Three columns are in exactly this state today (brands/categories/tags
  `description` and `count`, tags `slug`).
- **`sort_order` is validated nowhere.** It lands on the DTO by property assignment and reaches
  `QueryBuilder::order_by()`, which throws `InvalidArgumentException` on anything but `asc`/`desc`
  — a 500 from a query string.
- **`columnVisibility` is controlled with a `noop` change handler**, so the table structurally
  cannot host a picker today. Inventory therefore built one in its toolbar, and `bulk-edit` — which
  does not use `DataTable` at all — built a third.
- **Prior art exists for both new controls.** `features/bulk-edit/hooks/use-column-visibility.ts`
  is the localStorage pattern (lazy-init read, write-on-change effect, both `try/catch`'d, key
  namespace `kirki-ecommerce:<feature>:<thing>`), and
  `features/bulk-edit/pages/column-visibility-menu.tsx` is the stay-open-across-toggles pattern
  (`onSelect={event => event.preventDefault()}` per item, a decision already recorded in
  `bulk-edit-grid-refinements/design.md`).

## Goals / Non-Goals

**Goals:**

- One authority per resource for what may be sorted by, shared between the "is it allowed" check
  and the "what do we order by" resolution — so the two cannot disagree.
- Derived columns sortable on the same terms as stored ones, without a second naming scheme.
- `DataTable` able to own column visibility, so no feature needs to build its own.
- One filter overlay implementation, with the applied-count and clear-all built into its trigger.

**Non-Goals:**

- Client-side sorting. `manualSorting` stays uniformly `true`; the two tables that cannot sort
  server-side (Customer Groups, Variation Library) keep no-op sorting rather than gaining a second
  sorting mode.
- Multi-column sort. The address holds one field and one direction; that stays.
- Reworking `bulk-edit`'s own grid, which does not use `DataTable`.
- Making the applied-filter count cover search or the date range — both have their own visible
  toolbar controls, so folding them in would make the clear-all wipe a search box the merchant can
  see.

## Decisions

### 1. A `sortable_columns()` map on the service, not an allowlist on the controller

A new `app/Concerns/HasSortableColumns.php` declares `abstract protected function
sortable_columns()` returning `array<string, mixed>` — request field ⇒ column name, query alias, or
`Closure` subquery — plus `apply_sorting(QueryBuilder $query, ListFilterDTO $filters)`. Each of the
17 `list_query()` methods calls `static::apply_sorting(...)` in place of its `when()` block, and the
14 controllers drop their inline `whitelisted('sort_by', ...)` call.

*Why:* the allowlist and the resolution are the same knowledge. Keeping them in two layers is what
let three columns drift into being sortable-but-inert. Putting the map on the service also puts it
next to the query whose aliases it must match — `products_count`, `orders_max_created_at` — which
the controller cannot see.

*Alternatives:* keeping the whitelist in the controller and adding only a resolution map (two lists
to keep in step, the exact failure being fixed); a base `ListService` class (services are standalone
today, and a trait is the established shape — `HasDateRangeFilter`); a `sortable_columns` field on
`ListFilterDTO` (a DTO is data, not policy, and it is shared by five subclasses).

*Placement:* `app/Concerns/` per `CLAUDE.md` §2 ("traits live in a `Concerns/` sub-namespace"), even
though `app/Traits/` also exists — that one holds model scopes, this is a service concern.

### 2. Derived columns resolve through the same map, using the framework's existing affordances

`QueryBuilder::order_by()` already accepts a Closure/subquery (`is_queryable()` wraps it in an
`Expression`), and relation aggregates already emit deterministic aliases (`with_count('products')`
⇒ `products_count`, `with_max('orders','created_at')` ⇒ `orders_max_created_at`). So a derived
column needs a map entry, not new framework support. `ProductService` already demonstrates the
subquery form for variant price.

*Why:* no new abstraction for a problem the query builder solves. The map's value type doing triple
duty (string column, string alias, Closure) is what keeps a derived column indistinguishable from a
stored one at the call site.

*Trade-off:* a wrong alias produces a successful response in the wrong order rather than an error —
which is why the derived columns get integration tests asserting actual row order (see
`tasks.md`), not just a 200.

### 3. `sort_order` is clamped in the concern, not validated per-controller

`apply_sorting` lowercases and clamps the direction to `asc`/`desc`, falling back to the resource
default. *Why:* it fixes a live 500 in one place, including `CurrencyController` and
`AddressService`, which have no allowlist at all today. Returning a 422 was considered and rejected
— an unknown `sort_by` already degrades silently, so degrading the direction differently would be
inconsistent.

### 4. Sort removal clears the address rather than adding an "unsorted" state

`enableSortingRemoval` flips to `true`, and `use-data-table-params.ts`'s `onSortingChange` — which
currently early-returns on an empty array — clears `sort_by`/`sort_order` instead. `useListParams`
deletes params that serialize to `null` and falls back to the feature's `defaults.sort_by`.

*Why:* "unsorted" for a server-driven list means "the order the service chooses", which is exactly
the feature's declared default. No new concept, no change to `use-list-params.ts`. The visible
consequence is that after the third click no header is highlighted, because most defaults sort by
`id` — a field no table displays. That is honest: the list is in insertion order.

### 5. `DataTable` renders the column control itself, and holds the visibility state

The toolbar row becomes `<Flex justify="space-between">{toolbar}<ColumnVisibility /></Flex>`. A new
`use-table-column-visibility.ts` generalises the bulk-edit hook, keyed
`kirki-ecommerce:table-columns:<tableId>`. The existing `columnVisibility` prop is retained as a
controlled override: when supplied, the table follows it and presents no control of its own.

*Why:* "available by default" cannot be satisfied by a component each of the ~11 toolbars must
remember to render. Owning the state is also what the `noop` change handler was blocking.

*Selection behaviour:* the control disappears while rows are selected, because the selection bar
replaces the whole toolbar row. Keeping it in a persistent right-hand slot was considered; matching
today's behaviour (the whole toolbar vanishes) won, as a narrower change.

*Menu contents:* `select` is excluded by id; everything else is filtered on
`column.getCanHide() && typeof header === 'string' && header !== ''`. Verified across the codebase:
every column header is a plain string, and all seven `actions` columns use `header: ''`. Per-column
opt-out is TanStack's native `enableHiding: false` — no new `meta` field. Alternative rejected:
requiring `meta.label` on all ~50 column definitions.

### 6. `tableId` is required on every table

Including the two that opt out of the control via `enableColumnVisibility={false}`. A discriminated
union (`tableId` required unless `enableColumnVisibility: false`) would enforce the invariant more
tightly; a plain required `string` was chosen for the simpler type, at the cost of one unused prop
on two files. Deriving the key from the route was rejected: it breaks on parameterised routes and on
two tables sharing a screen.

### 7. `DataTableBulkAction` replaces `SelectOption` for bulk actions

`{ value, title, destructive?, icon? }`. The single-option button renders `variant="destructive"`
when flagged, `"secondary"` otherwise; the multi-option path ignores the flag. *Why:* eight of nine
tables' one action is Trash/Delete, and `SelectOption` has no way to say so — its `color` field is
for select-item text and maps badly onto a button variant. Renaming the prop
`bulkActionOptions` → `bulkActions` makes the type change visible at every call site rather than
silently re-typing an existing prop.

`handleApply` also gains a `try/finally` pending flag and stops clearing the selection when the
caller's promise rejects. *Why:* it is code being rewritten anyway, and a one-click destructive
button makes both faults materially worse — today a failed trash silently empties the selection and
raises an unhandled rejection.

### 8. The shared filter overlay stays on `DropdownMenu`

`DataTableFilterPopover` absorbs the trigger, sticky header, scrolling body, sticky footer,
open/close and draft seeding; features pass only their filter controls plus `onApply`/`onClear`.

*Why keep `DropdownMenu`:* `ui/popover.tsx` is the semantically correct primitive for a form-bearing
overlay (menu roles and typeahead do not belong on form fields), but all three existing popups are
built on `DropdownMenu` and work. Swapping the primitive in the same change as the extraction would
mix a refactor with a behavioural risk to keyboard and focus handling. Recorded as follow-up debt.

*Count semantics:* one per filter control holding a non-default value — a categories control with
six chips counts one. Counting individual values was rejected: the number grows large and the button
width becomes unstable.

### 9. The active-filter chip bar is removed, and the `filterBar` region with it

All three `*-table-filter-bar.tsx` files go, and `DataTableProps.filterBar` goes with them since no
caller remains. *Why:* the trigger's count and clear-all cover the same ground, and screenshot 2 has
no chip row.

*Trade-off, accepted:* dropping a single filter now requires reopening the overlay. The chip bar was
the only per-filter removal affordance.

## Risks / Trade-offs

- **A derived-column sort silently returns the wrong order** (bad alias, subquery correlating on the
  wrong key) → the integration tests assert actual row ordering for every derived field, not just a
  2xx. This is the single highest-value test in the change.
- **Removing the controller allowlists briefly widens the accepted input surface** if a service's
  map is written more permissively than the array it replaces → port each allowlist array into its
  map first, then extend; review the two endpoints that have no allowlist today
  (`CurrencyController`, `AddressService`) as additions rather than ports.
- **Touching 17 services in one change** → the concern is additive and each `list_query()` edit is
  mechanical; the per-resource integration tests already exist and cover every one of them.
- **Merchants lose per-filter removal** with the chip bar gone → accepted above; reopening the
  overlay is two clicks.
- **Persisted visibility can outlive a column** — a stored key naming a column that no longer exists
  → TanStack ignores unknown keys in `VisibilityState`, so a stale entry is inert. A newly added
  column is absent from the stored map and defaults to visible, which is the right default.
- **A merchant hides a column and forgets** → the control guarantees at least one visible column, and
  its icon is in a fixed position on every table.
- **`bulk-edit` keeps its own column-visibility hook and menu**, now near-duplicates of the shared
  ones → it does not use `DataTable`, so unifying it is a separate change. Noted, not attempted.

## Migration Plan

No data migration. Deployment is a single release; the API only widens what it accepts, so an older
frontend against a newer backend is unaffected, and a newer frontend against an older backend
degrades to default ordering rather than erroring (see `list-sorting-api` — unrecognised fields fall
back). Persisted column choices start absent, so every table opens fully visible on first load after
release.

## Open Questions

- The exact backing for four column identifiers needs a schema check when the map for that service
  is written: coupons `method`, `discount_type`, `current_usage_count`, and inventory
  `committed_quantity`. Each is either a stored column or an aggregate — the resolution differs, the
  approach does not, so this is safely answered at implementation time.
