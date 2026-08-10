## Context

See proposal.md - Why. Relevant existing code:

- `database/migrations/CreateOrdersTable.php` already has `customer_email`/`customer_phone` columns but no customer name columns. It also already has `shipping_first_name`/`shipping_last_name` and `billing_first_name`/`billing_last_name` as separate `string(100)` columns — the pattern this change's new columns follow. This codebase has never shipped a schema yet — every prior order-field change (price-field renaming, payment/shipping snapshotting, etc.) was made by editing `CreateOrdersTable.php` directly; there are zero `Add*`/`Alter*` migrations anywhere in `database/migrations/`.
- `CreateOrderAction::prepare_checkout_customer_dto()` already implements a WordPress-user-first, billing-fallback resolution for provisioning a `Customer` record (`checkout-customer-provisioning` capability), assigning `first_name`/`last_name` separately — same shape of fallback, different target (a `Customer` row, not the order's own contact snapshot).
- `OrderListResource::resolve_customer_name()` currently fakes a display `customer_name` from `shipping_first_name`/`shipping_last_name` on every read; this is being changed to source from the new stored `customer_first_name`/`customer_last_name` columns instead, populated once at creation.
- `customer_email`/`customer_phone` were previously accepted as top-level fields on `CreateOrderPayloadDTO`/`OrderCreateRequest`, but `CreateOrderAction::prepare_create_order_dto()` passed them straight through with no fallback — if omitted, they were stored as null even when billing info was submitted in the same request. This change removes request-level acceptance of these fields entirely rather than keeping them as an override (see Correction during implementation).

## Correction during implementation

The original plan (see git history of this file) kept an "explicit value on the request" tier ahead of WordPress-profile/billing, on the theory that `customer_email`/`customer_phone` already existed as request fields and a future explicit-name input might want the same hook. Once in the code, the user redirected: these fields should never come from the request — only from the placing user's WordPress account, or billing as a fallback. This is a two-tier resolution, not three. Implemented by simplifying `resolve_customer_contact_details()` to drop the request-value check, and removing `customer_first_name`/`customer_last_name`/`customer_email`/`customer_phone` from `CreateOrderPayloadDTO` and from `OrderCreateRequest`'s `rules()`/`filters()` entirely, since nothing reads them anymore. `CreateOrderDTO` keeps all four fields — it holds the resolved output that gets persisted, not raw request input.

## Goals / Non-Goals

**Goals:**
- Persist `customer_first_name`/`customer_last_name` on the order, resolved once at creation time, matching the existing `shipping_first_name`/`billing_first_name` column shape.
- Give `customer_first_name`, `customer_last_name`, `customer_email`, and `customer_phone` the same two-tier resolution: WordPress user profile (if the placing user has an account) → billing. No request-level override.
- Keep the order list API's `customer_name` field (a single display string) working as it does today, now built from the stored names instead of shipping.

**Non-Goals:**
- Not touching `UpdateOrderAction` — these fields are a creation-time snapshot, not something an update re-resolves.
- Not changing the `checkout-customer-provisioning` `Customer`-provisioning flow (`prepare_checkout_customer_dto`) — it has its own, separately-specced resolution for the `Customer` entity's own `first_name`/`last_name`/`email`/`phone` columns. The two resolutions happen to use the same fallback shape but populate different rows for different purposes; they are not unified into one shared code path (see Decisions).
- Not changing the single-order detail resource (`OrderResource`) — it doesn't expose customer contact fields today and the proposal doesn't ask for that; only `OrderListResource` is in scope.
- Not adding `customer_phone` to the order list API — it isn't exposed there today and stays out of scope.
- Not touching the React admin app — `OrderListItemSchema` already models `customer_name`/`customer_email` as nullish, so a change in what backs `customer_name` is invisible to it; no frontend file changes.
- Not changing `OrderRepository`'s order search (`order_number`, `customer_email`, `shipping_first_name`, `shipping_last_name`) to use the new columns. Search continues to match shipping name as it does today — pulling it into scope here would change search semantics without being asked for.

## Decisions

**Resolve contact fields in `CreateOrderAction`, not in the request/DTO layer.** `prepare_create_order_dto()` already assembles `CreateOrderDTO` from `CreateOrderPayloadDTO` plus derived values (e.g. currency conversion, payment/shipping snapshots) — this is the established place for "derive an order field from more than just a 1:1 request passthrough." A new protected method, `resolve_customer_contact_details(CreateOrderPayloadDTO $dto): array`, returns `['first_name' => ..., 'last_name' => ..., 'email' => ..., 'phone' => ...]` and is called from `prepare_create_order_dto()`.

**Don't unify with `prepare_checkout_customer_dto()`.** Both methods now do the exact same "WordPress user profile → billing" resolution shape, split first/last name included — they are byte-for-byte the same fallback logic, just populating different rows for different purposes: one fills `CreateCustomerDTO` for provisioning a `Customer`, only when `customer_id` is empty and the order isn't manual; the other always runs and fills the order's own snapshot columns. This is a clear candidate for a shared private helper (e.g. resolve first/last/email/phone once from `$dto`, reuse for both the `Customer` payload and the order's own columns) — deferred here to keep this change surgical; revisit if a third caller appears. Each method independently calls `get_userdata($dto->created_by)`, duplicating one WP API call per order-creation request when both paths run, which is negligible.

**`customer_first_name`/`customer_last_name` as separate columns, matching `shipping_*`/`billing_*`.** The order table already models names as split `first_name`/`last_name` pairs for shipping and billing; a single joined `customer_name` string would have been the odd one out. Splitting also means no join/trim logic is needed when storing — that only happens where a display string is still needed (`OrderListResource`).

**`OrderListResource::resolve_customer_name()` stays, but re-pointed.** The API's list-row shape (`customer_name` as one string) is an existing frontend contract (`OrderListItemSchema`) that isn't changing. The method keeps doing `trim($first . ' ' . $last)` (empty → null), just reading `customer_first_name`/`customer_last_name` instead of `shipping_first_name`/`shipping_last_name`.

**No request-level override.** The create-order request does not accept `customer_first_name`/`customer_last_name`/`customer_email`/`customer_phone` as input at all — resolution is always WordPress profile, else billing. `CreateOrderPayloadDTO` and `OrderCreateRequest` carry no fields for this; only `CreateOrderDTO` (the resolved output) does.

**Migration: edit `CreateOrdersTable.php` in place.** Consistent with every other schema change so far in this repo (confirmed via `git log` — no `Add*Table`/`Alter*Table` migration exists anywhere). Add `$table->string('customer_first_name', 100)->nullable();` and `$table->string('customer_last_name', 100)->nullable();` next to `customer_email`, matching the `string(100)` sizing already used for `shipping_first_name`/`billing_first_name`. No new index — nothing in this change queries by these columns (see Non-Goals on search).

## Risks / Trade-offs

- **[Divergent name sources for search vs. display]** The order list now displays a `customer_name` sourced from WP-user-or-billing, while `OrderRepository`'s search still matches against `shipping_first_name`/`shipping_last_name`. For orders where shipping and billing/WP-user names differ (e.g. gifting to someone else), a search by the displayed name may not find the order, or a search by shipping name may return an order whose displayed name looks unrelated. → Mitigation: out of scope for this change (see Non-Goals); flagging so it doesn't read as an oversight. A follow-up could add the new columns to the search columns if this proves confusing in practice.
- **[Guest checkout with no billing name]** If a guest checkout somehow omits billing first/last name (shouldn't happen — `OrderCreateRequest` requires `billing_first_name`/`billing_last_name` — see `rules()`), `customer_first_name`/`customer_last_name` store null. This mirrors existing null-handling for `customer_email`/`customer_phone` and needs no special handling.

## Migration Plan

Single-PR change, no phased rollout needed:
1. Add `customer_first_name`/`customer_last_name` columns to `CreateOrdersTable.php`.
2. Add both to `Order::$fillable`.
3. Add both to `CreateOrderDTO` as resolved output fields.
4. Implement `resolve_customer_contact_details()` in `CreateOrderAction` (WordPress profile → billing, no request input), wire it into `prepare_create_order_dto()` for all four fields.
5. Update `OrderListResource::resolve_customer_name()` to read `customer_first_name`/`customer_last_name` instead of the shipping fields. `customer_email` output is unchanged; `customer_phone` is not added.

No backfill for existing orders — this is a pre-release codebase with no shipped schema (per repo convention noted above), so there's no production data to migrate.
