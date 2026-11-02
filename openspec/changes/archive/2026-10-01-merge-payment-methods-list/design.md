## Context

`PaymentManager` registers offline methods, PayPal and extension-provided providers in one registry; `Payment::get_all_providers()` already returns them all. The UI instead calls `GET /offline-payments` and `GET /online-payments` and renders two cards (`offline-payment.tsx`, `online-payment-list.tsx`) with near-identical row markup. Mutations differ by kind: offline toggle/edit use `PUT /offline-payments/{id}`, online toggle uses `PATCH /online-payments/{id}`, online edit loads `GET /online-payments/{id}` first. See proposal.md for motivation.

The current `payment-providers` spec retires `/payment-methods`; this change deliberately reintroduces it as a read-only listing (see specs delta).

## Goals / Non-Goals

**Goals:**
- One list request feeding one card that matches the supplied design.
- Reuse the existing dialogs, mutations and per-kind endpoints unchanged.

**Non-Goals:**
- Unified CRUD under `/payment-methods`.
- Removing or changing `GET /online-payments` / `GET /offline-payments`.
- Implementing online-method delete (still a toast-only stub).

## Decisions

**New read endpoint from the registry.** `PaymentMethodService::get()` returns `collection(Payment::get_all_providers())`, serialized by a new `PaymentMethodListResource` (superset of the two list resources, including `icon_media` so the offline edit dialog works without a refetch). Alternative: have the frontend merge two requests — rejected because the user asked for a new API and it keeps ordering and loading state in one place.

**Per-row behavior branches on `is_offline`.** Toggle: offline → `useUpdateOfflinePaymentMutation`, online → `useSetEnabledOnlinePaymentMutation`. Edit: offline → `OfflinePaymentPopup`, online → `getOnlinePayment` then `OnlinePaymentEditPopup`. Delete: offline → delete mutation, online → existing stub. Alternative: unified mutation endpoints — rejected as over-scoped because offline and online are stored differently.

**Cache invalidation.** Add `paymentKeys.methods.all` and invalidate it from every existing online/offline mutation, so the merged list refreshes. The old list queries remain valid and are still invalidated.

**"+ Add" is a menu, not a new dialog.** It opens "Manual payment" or "Online gateway", each mapping to an existing dialog. Alternative: one combined dialog — rejected for rewrite cost and risk.

**Hover-reveal controls without layout shift.** Switch and ⋮ stay in the layout and toggle `visibility`/opacity on row hover or `:focus-within` (same technique as `data-add-button` in `online-payment-dialog.tsx`). Always visible when the device has no hover (`@media (hover: none)`).

**Frontend schema.** `PaymentMethodSchema` follows the offline schema shape (`id` required, `icon_media` nullish, lenient `passthrough`) and is parsed with the existing `ResourceCollectionSchema`.

## Risks / Trade-offs

- Spec previously forbade `/payment-methods` → the delta spec modifies that requirement explicitly, so archive keeps main spec accurate.
- Two code paths per action inside one component → keep handlers small and keyed on `is_offline`; cover with component/service tests.
- Online delete remains non-functional → unchanged from today; surfaced to the user.
- Visual fidelity can't be verified by browser in this project → user confirms the design match.
- The design's rows (Stripe, PayPal, etc.) are demo data → the list renders whatever the registry returns. Online gateways come from external packages and join the registry automatically once installed, so no frontend change is needed when one is added.

## Migration Plan

Additive endpoint and a frontend swap; no data migration. Rollback is reverting the commit; old endpoints remain available throughout.
