## Why

The Inventory screen reports stock but cannot change it. Its only editing path
is selecting rows and jumping to the bulk-edit grid — a spreadsheet built for
changing one field across many variants, not for working on a single one. A
merchant who spots a wrong price or a missing SKU on one variant has nowhere to
open it. There is also no screen anywhere in the admin that sets a variant's
visibility; `is_visible` exists only as a checkbox column in that same grid.

The backend has the same hole: `VariantService::find()`, `update()` and
`UpdateVariantDTO` are all written, but no route or controller reaches them, so
the only way to change one variant today is a bulk request carrying a
single-element array.

## What Changes

- A variant edit page at `#/inventory/:id`, reached by clicking a row in the
  inventory table. Two-column layout: Price, Inventory and Shipping cards on the
  left; Image and Visibility cards on the right.
- The visibility switch (`is_visible`) gets a home in the admin for the first
  time.
- A real single-variant REST surface: `GET /variants/{id}` and
  `PUT /variants/{id}`, behind a new `UpdateVariantRequest`, writing through
  `VariantService::partial_update()` so only submitted fields are touched.
  (`UpdateVariantDTO` was the original intent; see design.md — Corrections
  during implementation for why it is unsafe for a partial write.)
- `VariantResource` gains `product_id`, so the page's header can link back to the
  parent product. The resource currently carries the product's title with no id.
- The inventory table's rows become clickable. Cells stay non-editable and the
  screen still offers no save or discard action — bulk edit remains the
  multi-select path.
- The product form's unsaved-changes guard and floating toast move to shared
  locations (`hooks/`, `components/`) so a second form can use them. The toast
  already accepts a caller-supplied message; the hook is generic `useBlocker`
  plumbing. No behaviour changes for the product form.

The page deliberately carries no barcode field, matching the product form's
Inventory card rather than adding a control the rest of the admin does not
expose.

## Capabilities

### New Capabilities

- `variant-edit-page`: the per-variant edit screen — its route, how it is
  reached, its card and field composition, its header, its save and validation
  behaviour, and the single-variant read/write endpoints that back it.

### Modified Capabilities

- `inventory-table`: the "table is read-only" requirement currently states that
  editing is reachable *only* by selecting rows and invoking bulk edit. A row
  click now opens the variant edit page. Cells remain non-editable and the
  screen still presents no save or discard action.
- `product-form-unsaved-toast`: the guard and toast become shared primitives
  rather than product-form-internal ones, with the toast's message supplied by
  its caller.

## Impact

**Backend**

- `routes/api.php` — two new routes. Registration order matters: `PUT /variants/bulk`
  and `PUT /variants/{id}` are both single-segment, so the bulk route must stay
  above the new one or `bulk` will match `{id}`.
- `app/Http/Controllers/Api/VariantController.php` — new `show` and `update`.
- `app/Http/Requests/Variant/UpdateVariantRequest.php` — new.
- `app/Resources/Variant/VariantResource.php` — adds `product_id`. Additive; no
  existing consumer breaks.

**Frontend** (`resources/app/`)

- New: `features/inventory/pages/edit-inventory.tsx`,
  `features/inventory/components/variant-form/sections/`,
  `features/inventory/components/fields/`,
  `features/inventory/schemas/forms/variant-form.ts`,
  `features/inventory/skeletons/`, and its payload test.
- Modified: `config/route-config.ts`, `config/endpoints.ts`,
  `features/inventory/{routes.tsx,index.ts}`,
  `features/inventory/services/{inventory.ts,query-keys.ts}`,
  `features/inventory/components/inventory-table/inventory-table.tsx`.
- Moved: the product form's `use-unsaved-navigation-guard.ts` → `hooks/`, and
  `unsaved-toast.tsx` → `components/`. Two import lines in the product form
  change; nothing else there is touched.

**Not affected**: the bulk-edit grid keeps its endpoints and behaviour. No
database migration, no dependency change.
