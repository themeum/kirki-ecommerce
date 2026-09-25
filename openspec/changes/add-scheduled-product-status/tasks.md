## 1. Backend: status value and scheduled_at column

- [x] 1.1 Add `SCHEDULED = 'scheduled'` to `app/Constants/Product/ProductStatus.php`
- [x] 1.2 Add a new migration `AddScheduledAtToProductsTable.php` under `database/migrations/`, mirroring `AddPublishedAtAndTrashedAtToProductsTable.php`: nullable `timestamp('scheduled_at')` after `trashed_at`, with a matching `down()` that drops it (registered in `config/migrations.php`, same as the reference migration)
- [x] 1.3 Add `'scheduled_at'` to `Product::$fillable` and cast it as `'datetime'` in `Product::$casts` (`app/Models/Product.php`)
- [x] 1.4 Run `composer phpcs:wporg` and fix any reported issues in the touched files

## 2. Backend: validation and status-change side effects

- [x] 2.1 In `ProductCreateRequest` and `ProductUpdateRequest`, add `scheduled_at` validation: `required_if:status,scheduled` plus a rule rejecting a value that is not strictly in the future (`date|format:` . Somoy::ATOM . `|after:now`, matching the coupon `start_datetime`/`end_datetime` convention; also added `scheduled_at` to `CreateProductDTO`/`UpdateProductDTO` so it flows through)
- [x] 2.2 Extend the existing `variants.*.base_price` `required_if:status,published` rule to also apply when `status,scheduled`
- [x] 2.3 In `ProductService.php`, extend `create()`/`update()` so `scheduled_at` is nulled whenever the resolved status is not `scheduled` (unconditionally, not just on status change, matching the spec's "SHALL be null whenever status is not scheduled" invariant)
- [x] 2.4 Add/update docblocks for every method touched, per this repo's docblock standard
- [x] 2.5 Run `composer phpcs:wporg` and fix any reported issues in the touched files

## 3. Backend: expose scheduled_at in the API response

- [x] 3.1 Add `scheduled_at` to the product Resource alongside `published_at`/`trashed_at`
- [x] 3.2 Verify `status,in:` list used by both request classes (via `ProductStatus::join()`) now includes `scheduled` without further changes — confirmed `HasConstants::join()`/`get_constant_values()` reflect class constants dynamically
- [x] 3.3 Run `composer phpcs:wporg` and fix any reported issues in the touched files

## 4. Frontend: catalog and form schemas

- [x] 4.1 Add `'scheduled'` to `ProductStatusSchema` in `resources/app/features/products/schemas/catalog/product.ts`; add `scheduled_at: z.string().nullish()` next to `published_at`/`trashed_at`
- [x] 4.2 Add `scheduled_date`/`scheduled_time` (mirroring coupon-form.ts's `start_date`/`start_time`) to `resources/app/features/products/schemas/forms/product-form.ts`'s form shape, each `requiredWhen` status is `'scheduled'`, with the combined date+time additionally required to be in the future; payload transform produces `scheduled_at: status === 'scheduled' ? formatAtomDateTime(mergeDateAndTime(scheduled_date ?? '', scheduled_time ?? '')) : null` (see design.md "Correction during implementation")
- [x] 4.3 Update `mapProductToFormValues` to populate `scheduled_date`/`scheduled_time` from `product.scheduled_at` via `splitIsoDateTime` (`resources/app/libs/date.ts`)
- [x] 4.4 Update/add the payload test for `product-form.ts` (`product-form.test.ts`) covering: scheduled with a valid future date, scheduled missing the date (invalid), scheduled with a past date (invalid), and a non-scheduled status producing `scheduled_at: null` in the output
- [x] 4.5 Run `npm run typecheck && npm test` (from `resources/app/`) — typecheck clean; also fixed a compile break the widened `ProductStatusSchema` caused in `product-table/columns.tsx`'s status color/label maps (unrelated pre-existing file, required for the build to typecheck). Test suite: all 4 new tests pass; 1 pre-existing failing test (`ProductFormVariantSchema > produces the exact payload for a fully filled variant`, a `committed_quantity` mismatch) is unrelated to this change — confirmed via `git diff` that neither the variant schema/transform nor that test file were touched here

## 5. Frontend: slugify utility

- [x] 5.1 Add a `slugify(input: string): string` helper to `resources/app/utils/string.ts` (lowercase, strip diacritics, non-alphanumeric → `-`, collapse/trim dashes)
- [x] 5.2 Add a unit test for it (`string.test.ts`) covering accented characters, punctuation, and repeated/leading/trailing separators
- [x] 5.3 Run `npm run typecheck && npm test` (from `resources/app/`) — typecheck clean, all 5 new tests pass

## 6. Frontend: status card — status options, info row, scheduled pickers

- [x] 6.1 Add `{ value: 'scheduled', label: __('Scheduled', 'kirki-ecommerce') }` to `statusOptions` in `right-panel.tsx`
- [x] 6.2 Extend `resolveStatusInfo` to also return a Draft case (`"Created on"`, `product.created_at`, `variant: 'default'`) and a Scheduled case (`"Scheduled on"`, `product.scheduled_at`, `variant: 'success'`); keep the existing Published/Trashed cases unchanged
- [x] 6.3 Render two `DateField`s (`mode="date"` / `mode="time"`, from `resources/app/components/form/date-field.tsx`) side by side, bound to `scheduled_date`/`scheduled_time`, when the watched `status` field is `'scheduled'`
- [x] 6.4 Clear `scheduled_date`/`scheduled_time` in form state when `status` changes away from `'scheduled'`
- [x] 6.5 Run `npm run typecheck && npm test` (from `resources/app/`) — clean; also fixed a pre-existing eslint import-sort violation in `product-form.tsx` surfaced by the new imports

## 7. Frontend: status card — Preview position and Duplicate removal

- [x] 7.1 Move the Preview button to the top-right of the card's info row (same `isDefined(product.preview_url)` gating as today)
- [x] 7.2 Remove the Duplicate button and its row from `right-panel.tsx`; remove `onDuplicate`/`isDuplicating` from `RightPanelProps` and their usage in `right-panel.tsx`
- [x] 7.3 Run `npm run typecheck && npm test` (from `resources/app/`)

## 8. Frontend: status card — slug row

- [x] 8.1 Fetch the shop page slug via `useSettingsQuery('advance')` (`advancedSettings.pages.find(p => p.key === 'shop')?.slug`), falling back to `/products`
- [x] 8.2 Render the prefix as static text immediately before the existing `slug` `TextField`
- [x] 8.3 Restyle the slug `TextField` to be borderless by default, showing a border on hover/focus (border-color/background-color toggle only, no padding change, to avoid layout shift)
- [x] 8.4 Display `untitled` in place of the slug when there is no title and no slug yet (via the `TextField`'s `placeholder`, since the live-slugify effect already fills the real value the moment a title exists)
- [x] 8.5 Track whether the slug field has been manually touched (local ref/state); while `mode === 'create'`, the product is unsaved, and the slug is untouched, slugify the `title` field's value into `slug` in real time as the merchant types; stop once the product is saved or the slug has been touched (touch is marked on the slug field's `onBlur`, the only hook `TextField` exposes for this)
- [x] 8.6 Run `npm run typecheck && npm test` (from `resources/app/`)

## 9. Frontend: topbar Duplicate dropdown

- [x] 9.1 In `product-form.tsx`, add a `DropdownMenu`/`DropdownMenuTrigger` (three-dot icon button) / `DropdownMenuContent` to `PageHeading`'s `actions`, positioned to the left of the Cancel button, rendered only when `onDuplicate` is provided (edit mode) — reused the exact pattern from `features/orders/pages/order-details.tsx` (`ShowMoreIcon`, `Button variant="tertiary" size="icon"`)
- [x] 9.2 Add a single `DropdownMenuItem` wired to the existing `handleDuplicateClick`/`isDuplicating` state, replacing the removed button in `RightPanel`
- [x] 9.3 Run `npm run typecheck && npm test` (from `resources/app/`)

## 10. End-to-end verification

- [ ] 10.1 Manually verify in the running app: creating a product, switching status through Draft → Scheduled → Published shows the correct info row and controls at each step, the slug live-updates pre-save then locks after save, and the topbar dropdown only appears in edit mode — **skipped per this project's CLAUDE.md** ("Do not use the Browser tool (or any dev-server preview) to test or verify changes in this project... If a change genuinely needs visual confirmation, say so and let the user check it themselves"); needs your own manual check
- [x] 10.2 Run `npm run typecheck && npm test` (from `resources/app/`) and `composer phpcs:wporg` for a final full pass — typecheck clean, all touched PHP files clean under `phpcs:wporg`, full test suite 1265/1266 passing (the 1 failure is the pre-existing, unrelated `committed_quantity` mismatch noted in 4.5)
