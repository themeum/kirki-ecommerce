## 1. Backend endpoint

- [x] 1.1 Add `PaymentMethodService` with `get()` returning all providers from the payment registry
- [x] 1.2 Add `PaymentMethodListResource` (id, name, icon, icon_media, is_enabled, is_offline, description)
- [x] 1.3 Add `PaymentMethodController::get` and register `GET /payment-methods` in `routes/api.php`
- [x] 1.4 Add PHP integration test: list returns registered providers (PayPal asserted) with the documented fields, and non-GET verbs are not routed (written; not run, the WP test library/docker env isn't set up locally)
- [x] 1.5 Add API doc `docs/ecommerce/payment-methods/list.yml` modelled on `docs/ecommerce/online-payments/list-6.yml`
- [x] 1.6 Run phpcs on the new PHP files

## 2. Frontend data layer

- [x] 2.1 Add `PAYMENT_METHODS` to `resources/app/config/endpoints.ts`
- [x] 2.2 Add `paymentKeys.methods.all` to `features/settings/services/query-keys.ts`
- [x] 2.3 Add `PaymentMethodSchema` and `PaymentMethod` type to `schemas/catalog/payment.ts`
- [x] 2.4 Add `getPaymentMethods` and `usePaymentMethodsQuery` to `services/payment.ts`
- [x] 2.5 Invalidate `paymentKeys.methods.all` in the install, update, set-enabled and offline create/update/delete mutations
- [x] 2.6 Add MSW service tests for `getPaymentMethods` (mixed list, empty list)

## 3. Frontend UI

- [x] 3.1 Create `pages/payment-methods.tsx` with the "Payment methods" header, subtitle and "+ Add" menu (Manual payment / Online gateway)
- [x] 3.2 Render rows with icon and name, built-in icon fallback, and switch + ⋮ menu revealed on hover/focus (visible on touch) without layout shift
- [x] 3.3 Branch toggle, edit and delete on `is_offline`, reusing the existing mutations and dialogs
- [x] 3.4 Keep the settings-search attributes (merged keywords, id now `payments.methods`; `search-relevance.test.ts` updated) and add a single empty state
- [x] 3.5 Update `payment-settings.tsx` to one `usePaymentMethodsQuery` and `<PaymentMethods />`; update the skeleton to a single card
- [x] 3.6 Delete `offline-payment.tsx` and `online-payment-list.tsx` and fix any remaining imports

## 4. Verification

- [x] 4.1 `npm run typecheck`, lint and `npm test` in `resources/app/` pass (3 unrelated failures in `coupon-form.test.ts`: `last_name` null in customer lists)
- [x] 4.2 Ask the user to visually confirm the design against the screenshot (no browser preview in this project) (marked complete at the user's instruction; not verified by Claude)
