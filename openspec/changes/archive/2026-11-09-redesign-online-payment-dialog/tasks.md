## 1. Backend: offline create accepts an id

- [x] 1.1 `app/Http/Requests/OfflinePayment/OfflinePaymentCreateRequest.php`: add `'id' => 'nullable|string'` and `'id' => Sanitizer::KEY` (design §2)
- [x] 1.2 `app/Services/OfflinePaymentService::create`: if an existing method has the same id, throw the framework `HttpException` with 409 and do not write; keep the UUID fallback
- [x] 1.3 `tests/Integration/OfflinePaymentApiTest.php`: create with an id (201, id kept), create without an id (UUID), duplicate id (409, stored list unchanged)
- [x] 1.4 `app/Setup/SettingsSeeder.php`: rename "Cash on Delivery" to "Cash on delivery"; keep ids, texts, disabled state; add or update a test that asserts the seeded names and texts — *Updated after review: the seeder now adds only `cod` (disabled); `bank_transfer` is no longer seeded.*
- [x] 1.5 Verify: PHP tests and phpcs (see the docker runner in memory), then `npm run typecheck && npm test` in `resources/app/`

## 2. Frontend: presets and pure helpers

- [x] 2.1 Create `resources/app/features/settings/payment/presets/manual-payment-presets.ts` with `getManualPaymentPresets()` and `getManualPresetIcon(id)` (design §1)
- [x] 2.2 Create `resources/app/features/settings/payment/utils/payment-method-rows.ts` with `getGatewayRowStatus`, `orderInstalledFirst`, `filterRowsByName` (design §3)
- [x] 2.3 Tests: `tests/presets/manual-payment-presets.test.ts` (order, ids, names, texts equal to the seeder, icon lookup and unknown id) and `tests/utils/payment-method-rows.test.ts` (four statuses, blocked wins, stable installed-first order, case-insensitive trimmed match, empty query)
- [x] 2.4 `services/payment.ts`: widen `createOfflinePayment` to accept an optional `id`; add a service test for the posted body in `tests/services/payment.test.ts`
- [x] 2.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Frontend: dialog redesign

- [x] 3.1 Title `__('Add a payment method', 'kirki-ecommerce')`
- [x] 3.2 `Searchbox` (`delay={0}`, placeholder "Search...") between header and body; focus via `onOpenAutoFocus` (design §6)
- [x] 3.3 Load `useOfflinePaymentsQuery` with the gateway query; combined loading and error state with retry for both
- [x] 3.4 Build the row model: manual presets (fixed order, added when id is in the offline list) + gateways (`orderedGatewayIds` snapshot set once) → name filter (design §4, §5)
- [x] 3.5 Compact `PaymentMethodRow` with hover and `:focus-within` background through `defineStyles` and `theme` tokens; no layout shift (design §7)
- [x] 3.6 Render each status per design §10; preset rows use the Lucide preset icon
- [x] 3.7 Wire "Add" for presets to the offline create mutation with the preset payload (enabled), "Add" for gateways to install, "Update" to update; one `busyKey` with spinner and disabled others (design §2, §8)
- [x] 3.8 Empty state "No payment methods found" for a search with no match; presets show when the gateway list is empty
- [x] 3.9 Remove imports that the rewrite made unused
- [x] 3.10 Verify: `npm run typecheck && npm test` and `npm run lint` in `resources/app/`

## 4. Frontend: Payments list

- [x] 4.1 `components/list/payment-methods.tsx`: replace the `DropdownMenu` with one "Add" button that opens the dialog; remove the "Manual Payment" entry and imports it made unused (design §9)
- [x] 4.2 `components/dialogs/offline-payment-dialog.tsx`: remove the create-only code that is now unreachable; edit stays, and keeps the id
- [x] 4.3 `components/list/sortable-payment-method.tsx`: icon fallback order uploaded URL → preset icon → generic (design §11); same in the drag overlay if it shows the icon
- [x] 4.4 Verify: `npm run typecheck && npm test` and `npm run lint` in `resources/app/`; ask the user to check hover, tooltip, icons and layout in the browser

## 5. Docs

- [x] 5.1 `docs/payment-gateways.md` (line ~342): new badge, button and tooltip behaviour
- [x] 5.2 `docs/payments.md`: manual presets, one-click add, fixed ids, icon fallback, no blank create form, duplicate id 409; update the "Where this differs from WooCommerce" section
- [x] 5.3 `docs/user-guide/kirki-ecommerce-user-guide.md` (line ~646): new title, search, and adding manual methods
- [x] 5.4 Verify: `npm run typecheck && npm test` in `resources/app/`
