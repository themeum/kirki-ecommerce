Implemented tasks are marked `[x]` from the staged diff. Verification steps and
open review items are `[ ]`.

## 1. Backend

- [x] 1.1 Add `OrderAction::REMOVE_TRACKING` (`remove-tracking`) and `OrderManager::remove_tracking()` that clears `shipping_carrier`, `shipping_tracking_number`, `shipping_tracking_url` (design D4)
- [x] 1.2 `PerformOrderAction`: handle `REMOVE_TRACKING`, allow it in `guard()` next to `ADD_TRACKING`, add the "Tracking removed." message
- [x] 1.3 `PerformOrderAction`: on `MARK_AS_SHIPPED`, store tracking when `has_tracking_info()` is true, in the same transaction (design D1)
- [x] 1.4 Add `OptionKeys::LAST_USED_SHIPPING_CARRIER` and `ShippingService::get_last_used_carrier()` / `set_last_used_carrier()`; call `remember_carrier()` after add-tracking and mark-as-shipped with tracking (design D3)
- [x] 1.5 Add `OrderController::last_used_shipping_carrier()` and route `GET /shipping-carriers/last-used`
- [x] 1.6 Move tracking validation into `OrderActionRequest` (exclusive `carrier`/`carrier_id`, zone check, number with carrier, URL for Other); remove the duplicated checks from `resolve_tracking()`; add `notify_customer` rule and filter (design D2)
- [x] 1.7 Pass the order id to `execute()` and remove `PerformOrderActionDTO::$order_id` (design D5)
- [x] 1.8 Integration tests in `tests/Integration/OrderTrackingCarriersApiTest.php`: last used is null at first, listed id remembered, Other name remembered, mark-as-shipped remembers, rejected request does not change it
- [x] 1.9 Backward compatibility of `execute()` and `PerformOrderActionDTO::$order_id` — owner decision: keep the break. `execute()` keeps the required `int $order_id`, and `$order_id` stays removed from the DTO. Recorded as BREAKING (PHP API) in proposal.md and design.md.
- [x] 1.10 Stricter `PATCH /orders/{id}/action` validation — owner decision: keep it strict and document it as BREAKING (REST). `docs/shipping-carriers.md` §7 has a "Changed in 1.0.2" note. The delta does not change.
- [x] 1.11 Owner sign-off for the new option `kirki_ecommerce_last_used_shipping_carrier` — approved as is.
- [x] 1.12 Add integration tests for `remove-tracking` and for `mark-as-shipped` with a carrier but no number (rejected, order not shipped). Also: `setUp()` now deletes the last-used option. The framework `OptionManager` keeps a static cache that stays between tests, so the value leaked from earlier tests.
- [x] 1.13 Fix the `has_tracking_info()` docblock: `@param` description, trailing spaces
- [x] 1.14 Verify: `kirki-ecommerce-test integration`, then `npm run typecheck && npm test` from `resources/app/` — `OrderTrackingCarriersApiTest`: OK (29 tests). The order-related suites have 4 errors in `OrderEditApiTest` ("loadBaseCurrency does not exist on Brick\Money\Money"). This is a base-currency code path that the change does not touch, so the errors existed before this change.
- [x] 1.15 `ShippingService`: add protected `get_pickup_details()`; use it in `get_final_available_shipping_options()` (same output) and add the pickup keys to `get_selected_shipping_method_snapshot()` for local pickup (design D8). Premise corrected: the snapshot reads the selected option from `get_final_available_shipping_options()`, which already applies the pickup null rules. No helper was necessary; the snapshot copies `address`, `description`, `pickup_time_start`, `pickup_time_end` for local pickup. `get_final_available_shipping_options()` is unchanged.
- [x] 1.16 Admin `OrderResource`: add `shipping_meta` (`{ description, is_taxable, address, pickup_time_start, pickup_time_end }`) for every order; pickup keys `null` when not local pickup. Renamed from `shipping_pickup` on owner request.
- [x] 1.17 Integration test in `OrderApiTest`: a local-pickup order returns all `shipping_meta` keys; a flat-rate order returns its description and `null` pickup keys

## 2. Frontend data layer

- [x] 2.1 Add `LAST_USED_SHIPPING_CARRIER` endpoint, `LastUsedShippingCarrierSchema`, `orderKeys.lastUsedShippingCarrier()`, `useLastUsedShippingCarrierQuery()`; invalidate the key in `useOrderActionMutation` `onSuccess`
- [x] 2.2 Add `REMOVE_TRACKING` and its label to `lib/order-actions.ts`; add `notify_customer` to `OrderActionPayload`
- [x] 2.3 Add `lib/shipping-tracking.ts` (`getInitialTrackingValues`, `getEmptyTrackingValues`, `isTrackingNumberAdded`)
- [x] 2.4 `AddTrackingFormSchema` transform returns `{}` without a tracking number (design D7)
- [x] 2.5 Payload test for `AddTrackingFormSchema`. Premise corrected: the test was already there (`features/orders/tests/schemas/forms/add-tracking-form.test.ts`, 7 cases). It covers the listed carrier, Other, and the rejection of an empty number. "No number → `{}`" cannot be reached, because the form rejects an empty number before the transform runs (see design D7 correction). No change was necessary.
- [x] 2.6 Verify: `npm run typecheck && npm test` from `resources/app/`
- [x] 2.7 `OrderSchema`: add `shipping_meta`

## 3. Order details UI

- [x] 3.1 Add `OrderDetailsProvider` and `OrderActionProvider` contexts and `useOrderAction()`; slim `use-order-details.ts`; wire `pages/order-details.tsx` (design D6)
- [x] 3.2 `MarkAsPaidDialog` and `TakeActionCard` read the contexts instead of props
- [x] 3.3 Extract `TrackingFields`; `AddTrackingDialog` pre-selects the last used carrier and shows "Remove tracking" when a number is stored
- [x] 3.4 Add `MarkAsShippedDialog` (ship form with optional tracking details, pickup variant)
- [x] 3.5 Add `TrackingInfo` and the shipped-order tracking section in `TakeActionCard`
- [x] 3.6 Tests in `add-tracking-dialog.test.tsx`: placeholder, last used listed, last used not in zone, last used Other, stored tracking wins, Remove tracking
- [x] 3.7 Add tests for `MarkAsShippedDialog`: ship without tracking sends no tracking fields; ship with tracking sends them; pickup variant shows no tracking fields. Also fixed the 3.6 test "calls onRemove…": it rendered an order without tracking, so the "Remove tracking" button was not shown.
- [x] 3.8 Code style: single quotes and Prettier in `notify-customer.tsx`; labels changed to "No tracking added" / "Add tracking". Owner decision: keep the `NotifyCustomer` component, the `notifyCustomer` state, and the commented blocks for the later checkbox work.
- [x] 3.9 Verify: `npm run typecheck && npm test` from `resources/app/` — typecheck clean, 2324 tests passed
- [x] 3.10 `MarkAsShippedDialog` `LocalPickup`: pickup box with "Pickup at <address>" (fallback to the method name), hours, and instructions
- [x] 3.11 Tests in `mark-as-shipped-dialog.test.tsx`: pickup with details shows the three lines; pickup without details shows the method name only
- [x] 3.12 Verify: `kirki-ecommerce-test integration`, then `npm run typecheck && npm test` from `resources/app/` — `OrderApiTest`: OK (128 tests); typecheck and lint clean; 2328 tests passed

## 4. Docs

- [x] 4.1 `docs/shipping-carriers.md`: last used carrier pre-selection and `GET /shipping-carriers/last-used`; add `docs/ecommerce/orders/get-last-used-shipping-carrier.yml`
- [x] 4.2 Document `remove-tracking`, mark-as-shipped with tracking (including the two emails), and `notify_customer` (accepted, no effect yet) in `docs/shipping-carriers.md`; also the stricter validation (§7) and the "Where this differs" section (§8)
- [x] 4.3 Verify: `npm run typecheck && npm test` from `resources/app/`
- [x] 4.4 Add `shipping_meta` to the order response in `docs/ecommerce/orders/get-by-id-5.yml` (the example is a flat-rate order, so the pickup keys are `null`)
