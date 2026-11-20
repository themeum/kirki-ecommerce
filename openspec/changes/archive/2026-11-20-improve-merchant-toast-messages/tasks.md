## 1. PHP REST messages

- [x] 1.1 `OnlinePaymentController::set_enabled` and `OfflinePaymentController::set_enabled`: return "Payment method activated" or "Payment method deactivated" from the `is_enabled` value
- [x] 1.2 `OnlinePaymentController::update_plugin`: return "Payment gateway updated to the latest version"
- [x] 1.3 `OrderController::partial`: return "Order note updated" for only `order_notes`, "Order flags updated" for only `flags`, and "Order updated" for both
- [x] 1.4 `VariantController::bulk_update`: return "Variants updated"
- [x] 1.5 `PerformOrderAction::get_message`: use the order action texts from the spec (no trailing period)
- [x] 1.6 `EmailTemplateController`: return "Template restored to default" and "Test email sent"
- [x] 1.7 Search the PHP tests for the old strings and update them. Run the PHP tests and phpcs for the changed files with the docker runner
- [x] 1.8 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Shared helper and settings mutation

- [x] 2.1 Add `getItemActionMessage(action, name)` to `services/helpers.ts`, with one literal `__()` string for each action (D2). Add a Vitest test for every action and for an empty name
- [x] 2.2 `useUpdateSettingsMutation`: accept `successMessage?: string` in its variables, send only `{ key, data }`, and apply the D1 precedence
- [x] 2.3 Verify: `npm run typecheck && npm test`

## 3. Payment settings

- [x] 3.1 `useSetEnabledOnlinePaymentMutation` and `useSetEnabledOfflinePaymentMutation`: accept `name` and toast named activated or deactivated from `data.is_enabled`
- [x] 3.2 `useDeleteOfflinePaymentMutation` (named deleted) and `useUninstallOnlinePaymentMutation` (named removed): change the variables to `{ id, name? }`
- [x] 3.3 `payment-methods.tsx`: pass the method name to the toggle, delete, and remove calls
- [x] 3.4 `online-payment-edit-dialog.tsx`: remove the duplicate `dispatchToastMessage`
- [x] 3.5 Update `features/settings/payment/tests/services/payment.test.ts` and the other affected tests
- [x] 3.6 Verify: `npm run typecheck && npm test`

## 4. Shipping settings

- [x] 4.1 `use-shipping-settings.ts`:
  - zone activate and deactivate: named;
  - zone delete: named;
  - zone create: "Shipping zone created";
  - method switch: named activated or deactivated;
  - method delete: named.
  Pass each text as `successMessage`
- [x] 4.2 `shipping-zone.tsx`: zone save passes "Shipping zone updated"
- [x] 4.3 `shipping-carrier.tsx`: the toggle uses named activated or deactivated, and delete uses named deleted
- [x] 4.4 `shipping-method.tsx`: delete uses named deleted
- [x] 4.5 `useUpdateShippingBoxMutation`: accept `successMessage`. `shipping-box.tsx` passes named set as default or removed as default, and its own toast is removed. `useDeleteShippingBoxMutation`: use `{ id, name? }` (named deleted)
- [x] 4.6 `useDeleteShippingProfileMutation`: use `{ id, name? }` and pass the name from `shipping-profile.tsx`
- [x] 4.7 Update the affected shipping tests
- [x] 4.8 Verify: `npm run typecheck && npm test`

## 5. Other settings

- [x] 5.1 `useDeleteTaxProfileMutation`: use `{ id, name? }` and pass the name from `tax-profile.tsx`
- [x] 5.2 `useDeleteCurrencyMutation`: use `{ id, name? }` and pass the currency code from `use-available-currency-list.ts`
- [x] 5.3 `useDeleteAttributeMutation` and `useDeleteAttributeValueMutation`: use `{ id, name? }` and pass the name from `variation-library.tsx` and `variation-table.tsx`
- [x] 5.4 Update the affected tests
- [x] 5.5 Verify: `npm run typecheck && npm test`

## 6. Catalog, coupons, customers

- [x] 6.1 Single delete hooks for brand, tag, category, collection, and customer: use `{ id, name? }` and pass the row name from each table
- [x] 6.2 `useCouponActionMutation`: accept `name` and toast named activated, deactivated, or duplicated from `action`. `useDeleteCouponMutation`: use `{ id, name? }`. Pass the coupon code from `coupon-table/columns.tsx`
- [x] 6.3 Products:
  - `useDuplicateProductMutation`: named duplicated.
  - `useBulkTrashProductsMutation`: named moved to trash when `ids.length === 1`, and keep the description.
  - `useBulkRestoreProductsMutation`: named restored when `ids.length === 1`.
  - `useDeleteProductMutation`: named deleted permanently.
  Pass the title from `product-table/columns.tsx` and `edit-product.tsx`
- [x] 6.4 Update the affected tests
- [x] 6.5 Verify: `npm run typecheck && npm test`

## 7. Final check

- [x] 7.1 Search `resources/app/` for success toast titles with a trailing period or "successfully", and fix any that remain
- [x] 7.2 Run `npm run lint` and `openspec validate improve-merchant-toast-messages --strict`
- [x] 7.3 Verify: `npm run typecheck && npm test`
