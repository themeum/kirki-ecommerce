## Why

Merchants can currently only save a product as Draft or Published — there is no way to prepare a product ahead of time and have it go live on a specific date. The product form's status card also mixes unrelated concerns (a Duplicate action, an always-bottom Preview link, a plain bordered slug field) that don't match the intended layout. This change adds a Scheduled status with a `scheduled_at` date/time, and reworks the status card and topbar to the agreed layout.

## What Changes

- Add `scheduled` as a third selectable product status (alongside `draft`/`published`; `trashed` is system-only) on the frontend `ProductStatusSchema` and the backend `ProductStatus` constants.
- Add a nullable `scheduled_at` datetime column on `kirki_ecommerce_products` via a new migration, exposed through the model, resource, and create/update requests.
- Require `scheduled_at` (present and in the future) whenever status is `scheduled`, and apply the same variant-pricing completeness rule that `published` already has. **BREAKING**: `ProductCreateRequest`/`ProductUpdateRequest` reject a `status: scheduled` payload that omits `scheduled_at` or sends one in the past.
- Clear `scheduled_at` server-side whenever status is set to anything other than `scheduled`.
- No automatic Draft/Scheduled → Published transition is implemented in this change — `scheduled_at` is stored only; the cron-driven auto-publish is explicitly deferred (see design.md).
- Rework the product form's status card (`RightPanel`):
  - Status info row now covers all three visible statuses (Draft, Published, Scheduled), each with its own label and timestamp — previously only Published/Trashed showed a row.
  - When status is Scheduled, a date picker and a time picker appear under the status select, writing into the single `scheduled_at` value.
  - The Preview link moves to the top-right corner of the card, next to the info row.
  - The Duplicate action is removed from this card.
  - The slug field gains a read-only page-slug prefix (from the shop page's slug, falling back to `/products`), a borderless-until-hover/focus style, an `untitled` fallback, and real-time slugify-from-title while creating a not-yet-saved product.
- Rework the product form's topbar: add a three-dot dropdown menu (left of Cancel) holding the Duplicate action that was removed from the status card, shown only in edit mode.

## Capabilities

### New Capabilities
- `product-status-scheduling`: The product status lifecycle — the `scheduled` status value, the `scheduled_at` field's presence/future-date/pricing-completeness validation, and its clearing when status moves away from `scheduled`.
- `product-status-card`: The product form's status card UI — the per-status info row, the Scheduled date/time pickers, Preview's position, the slug field's prefix/styling/live-slugify behavior, and the topbar dropdown that now hosts Duplicate.

### Modified Capabilities
- (none — `product-form` and `product-sidebar-fields` requirements are unchanged; the status card was explicitly out of `product-sidebar-fields`' scope already)

## Impact

- **Backend**: `app/Constants/Product/ProductStatus.php`, a new migration under `database/migrations/`, `app/Models/Product.php`, `app/Http/Requests/Product/ProductCreateRequest.php` + `ProductUpdateRequest.php`, `app/Services/ProductService.php`, the product Resource that exposes `published_at`/`trashed_at`.
- **Frontend**: `resources/app/features/products/schemas/catalog/product.ts`, `resources/app/features/products/schemas/forms/product-form.ts`, `resources/app/features/products/components/product-form/product-form.tsx`, `resources/app/features/products/components/product-form/sections/right-panel/right-panel.tsx`, a new slugify helper in `resources/app/utils/`.
- **No changes** to `app/Scheduler/*` (existing generic job-queue infra) — noted as a future integration point, not touched here.
