## Context

The product status today is `draft` | `published` | `trashed` (`app/Constants/Product/ProductStatus.php`, mirrored by `ProductStatusSchema` in `resources/app/features/products/schemas/catalog/product.ts`), stored as a plain `VARCHAR(50)` on `kirki_ecommerce_products` (`database/migrations/CreateProductsTable.php`) with no DB-level enum constraint. `published_at`/`trashed_at` are nullable `timestamp` columns added later by `AddPublishedAtAndTrashedAtToProductsTable.php`, set server-side via `Date::now()->set_timezone('UTC')` (`app/Services/ProductService.php`), cast as `'datetime'` on the model, and read back on the frontend as plain ISO strings that `new Date(...)` and `formatDateValue` render in the browser's local timezone.

The status card lives entirely in `RightPanel` (`resources/app/features/products/components/product-form/sections/right-panel/right-panel.tsx`) — status `SelectField`, a `slug` `TextField` that already exists but is unstyled/plain, a `Duplicate` link button, and a `Preview` link button, both gated on `isDefined(product)`. `Duplicate`/`Preview`'s handlers and `isDuplicating` are threaded down as props from `product-form.tsx`, which itself receives `onDuplicate` only from `edit-product.tsx` (never from `create-product.tsx`).

Reusable pieces already exist and this design deliberately builds on them rather than adding new primitives: standalone `DatePicker` and `TimePicker` (`resources/app/components/ui/calendar/`), a Radix-based `DropdownMenu` family (`resources/app/components/ui/dropdown-menu.tsx`), `mergeDateAndTime`/`toValidDate`/`formatDateValue` (`resources/app/libs/date.ts`), and `useSettingsQuery('advance')` for the shop page's slug (`resources/app/services/settings.ts` / `resources/app/schemas/catalog/settings.ts`'s `AdvanceSettingsPageSchema`).

## Goals / Non-Goals

**Goals:**
- Add `scheduled` end-to-end (constant → migration → model → request validation → resource → frontend schema → form → UI) following the exact pattern `published_at` already established, so the change reads as "one more status" rather than a new subsystem.
- Rework the status card and topbar to the agreed layout using only existing UI primitives.

**Non-Goals:**
- Building the scheduler job that flips `scheduled` → `published` when `scheduled_at` arrives. `app/Scheduler/` (`Dispatchable`/`Queueable`/`delay()`) is generic async-job infra with no existing "flip a domain status at a future time" example; wiring a `PublishScheduledProductJob` through it is a follow-up change once this one lands. Until then, `scheduled_at` is inert data.
- Any change to how `published_at`/`trashed_at` themselves behave.
- A DB-level enum constraint on `status` — it stays a validated `VARCHAR`, matching how `trashed` was added previously.

## Decisions

**`scheduled_at` storage: nullable `timestamp`, added after `trashed_at`.** Mirrors `AddPublishedAtAndTrashedAtToProductsTable.php` exactly (`$table->timestamp('scheduled_at')->nullable()->after('trashed_at')`) so the column follows the same cast (`'datetime'` in `Product::$casts`) and the same UTC-in/local-out convention the frontend already handles for the other two timestamps. Rejected: reusing `published_at` with a separate `is_scheduled` flag — would make the "info row" logic (`resolveStatusInfo`) branch on two fields instead of one and complicate the "clear on status change" rule.

**Validation placement: `ProductCreateRequest`/`ProductUpdateRequest`, not the model.** `required_if:status,scheduled` plus a custom future-date rule for `scheduled_at`, and extending the existing `required_if:status,published` variant-price rule to also match `status,scheduled`. This matches where the equivalent `published` rules already live, keeping status-dependent validation in one layer.

**Clearing `scheduled_at`: server-side in `ProductService`, on every save where status ≠ scheduled.** `ProductService.php` already nulls `published_at` in the analogous branches (~lines 143-200); the same `if/else` ladder gets a `scheduled_at = null` branch. This is a server-side guarantee independent of the frontend also clearing its form field on status change (product-status-card's requirement) — the two aren't redundant, they cover different entry points (API called directly vs. the form).

**Timezone: no site-timezone lookup, reuse the existing local-Date round-trip.** `published_at`/`trashed_at` are stored UTC server-side and rendered by doing `new Date(isoString)` client-side, which JS auto-converts to the browser's local time for display. `scheduled_at` follows the identical path: the `DatePicker`/`TimePicker` pair work with a plain local `Date` object in form state, and the payload transform calls `.toISOString()` before sending — no new timezone-conversion code, no dependency on WP's site-timezone setting.

**Date/time UI: two `DateField`s (`mode="date"` / `mode="time"`), not the combined `DateTimePicker`.** `resources/app/components/ui/calendar/date-time-picker.tsx` exists but renders one trigger that opens a single popover with a calendar + time picker inside — visually one control. The target layout (screenshot) shows two separate boxes side by side (`dd/mm/yyyy` and `hh:mm AM`). See "Correction during implementation" below: the actual mechanism is two separate `scheduled_date`/`scheduled_time` string form fields via the existing `DateField` component (as the coupon form's start/end date-time fields already do), merged into one `scheduled_at` only in the payload transform — not two pickers writing into one `Date`-typed field in component state.

**Slug prefix source: `useSettingsQuery('advance')`, not a new endpoint.** The shop page's slug is already returned inside `advancedSettings.pages` (`AdvanceSettingsPageSchema`, `key: 'shop'`). The status card reads `pages.find(p => p.key === 'shop')?.slug`, falling back to the literal string `/products` when absent — no backend change needed for this part.

**Slug auto-sync lock: a `slugTouched` ref/state local to the form, not a schema concern.** The rule ("slugify from title only pre-save and pre-touch") is UI behavior, not a payload shape change, so it's implemented as local component state in `RightPanel`/`product-form.tsx` (e.g. a ref flipped to `true` on the slug field's first `onChange`, and short-circuited once `mode === 'edit'` or the product has been saved), not in `product-form.ts`'s zod schema.

**New `slugify` utility in `resources/app/utils/string.ts`.** No slugify helper exists anywhere in `resources/app/` outside of `node_modules`. A small, dependency-free implementation (lowercase, strip diacritics, replace non-alphanumerics with `-`, collapse/trim dashes) is added alongside `toDisplayString`/`incrementString`.

**Topbar dropdown: single `DropdownMenuItem` today, no generalized "menu items" prop.** The dropdown is written directly in `product-form.tsx` using the existing `DropdownMenu`/`DropdownMenuTrigger`/`DropdownMenuContent`/`DropdownMenuItem` primitives with one item wired to the current `handleDuplicateClick`. "Structured for easy extension" means: it already accepts arbitrary `DropdownMenuItem` children as a normal JSX list, so a second action is a second `DropdownMenuItem` — no premature props API (e.g. an `actions: MenuAction[]` array) is introduced for a single item.

## Correction during implementation

The original "Date/time UI" decision above (two standalone pickers bound directly to one `scheduled_at` `Date` value via `mergeDateAndTime`) was made without having found `resources/app/components/form/date-field.tsx` or the coupon form's validity-period pattern (`resources/app/features/coupons/schemas/forms/coupon-form.ts` + `.../sections/validity-period-section.tsx`). That pattern is the actual established convention for exactly this "pick a date and a separate time, combine into one ISO datetime payload field" case, and it does something different from what was assumed:

- Form state never holds a raw `Date` — every date-ish field is a formatted **string**, converted to/from `Date` only at the picker boundary (`DateField`'s `parseDateValue`/`formatDateValue`).
- Date and time are kept as **two separate form fields** (coupon's `start_date` + `start_time`), each bound with `<DateField mode="date" />` / `<DateField mode="time" />` — not merged in component state.
- Merging happens once, in the schema's payload `.transform()`, via `mergeDateAndTime(dateStr, timeStr)` + `formatAtomDateTime(...)` (already exported from `resources/app/libs/date.ts`, alongside a `splitIsoDateTime(iso)` helper that does the reverse for hydration — both apparently added for this exact purpose and currently unused elsewhere).
- `formatAtomDateTime` produces `DATE_FORMATS.ATOM` (`"yyyy-MM-dd'T'HH:mm:ssxxx"`), which matches the backend's `Somoy::ATOM` (PHP's `DateTime::ATOM`) byte-for-byte — the same format the existing `CouponCreateRequest`/`CouponUpdateRequest` validate `start_datetime`/`end_datetime` against via `date|format:` . Somoy::ATOM`.

Revised approach: the form shape gets `scheduled_date: string | null` and `scheduled_time: string | null` (mirroring `start_date`/`start_time` exactly), rendered as two `DateField`s side by side. The payload transform produces `scheduled_at: status === 'scheduled' ? formatAtomDateTime(mergeDateAndTime(scheduled_date ?? '', scheduled_time ?? '')) : null`. Hydration (`mapProductToFormValues`) uses `splitIsoDateTime(product.scheduled_at)` to populate the two fields. The backend's `scheduled_at` rule is updated to also require `format:` . Somoy::ATOM` (matching the coupon rules), not just `date|after:now`, since the frontend now guarantees that exact format.

This changes tasks 4.2/4.3/6.3 from "one `scheduled_at` field merged via `mergeDateAndTime` in component state" to "two fields (`scheduled_date`/`scheduled_time`) merged only in the schema transform, via the existing `DateField` component" — same observable behavior (one stored value, two visible pickers), different — and more consistent — implementation. No spec changes needed: both spec files describe the two-picker/one-value behavior without dictating field names or component wiring.

## Risks / Trade-offs

- **`scheduled_at` becomes stale data with no automated consumer** → acceptable per explicit scope decision (see Non-Goals); flagged here so it isn't mistaken for an oversight when the follow-up scheduler change is proposed.
- **Two independent "clear scheduled_at" implementations (form state + `ProductService`)** could drift if only one is updated later → both are covered by `product-status-scheduling`'s and `product-status-card`'s scenarios respectively, so a regression in either is spec-testable.
- **`resolveStatusInfo` now branches on three statuses instead of two** → low risk, purely additive to an existing pure function; no change to its Published/Trashed branches.

## Migration Plan

1. Backend: migration + constant + model + request validation + service clearing logic + resource field, in that order (each step is independently testable against the existing `published` pattern).
2. Frontend schemas: `ProductStatusSchema`, `product-form.ts` payload/validation, before touching UI.
3. UI: `RightPanel` (status options, info row, pickers, slug row, preview position, duplicate removal), then `product-form.tsx` (topbar dropdown).
4. No data backfill needed — `scheduled_at` is nullable and no existing rows can have `status: scheduled`.
5. Rollback: drop the column and revert the constant/enum additions; no other change depends on `scheduled` existing.
