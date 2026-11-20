## Why

Many merchant-app toasts do not tell the action that the merchant did. For example, a click on the payment method switch shows "Payment method updated", not "activated" or "deactivated". A shipping zone that is turned off or deleted shows "Settings saved". Some actions show 2 toasts, and the toast style is not the same everywhere ("Order marked as shipped." with a period, "Test email sent successfully.").

## What Changes

- Every success toast in the merchant app tells the exact action: activated, deactivated, enabled, disabled, deleted, duplicated, set as default, and so on.
- A toggle toast uses the same verb as its control. "Activate/Deactivate" menu items and switches give "activated/deactivated". "Enable/Disable" menu items give "enabled/disabled".
- A row action on one item (toggle, delete, remove, duplicate, set as default, move to trash, restore) names the item, for example `"Cash on delivery" deactivated`.
- PHP REST messages change where the endpoint knows the action:
  - Payment `set_enabled` (online and offline) returns "Payment method activated" or "Payment method deactivated".
  - Order `partial` returns a message for the field that changed (note or flags).
  - Variant `bulk_update` returns "Variants updated".
  - Online payment `update_plugin` returns "Payment gateway updated to the latest version", so it is different from a settings save.
- For the shared settings endpoint, the caller gives the toast text for single actions (shipping zone activate, deactivate, create, update, and delete; shipping method activate, deactivate, and delete).
- One style for every merchant-app success toast: a short past-tense title, no trailing period, no "successfully". This includes the order action messages and the email template messages.
- Remove the 2 duplicate toasts: the online payment edit dialog and the shipping box "set as default" action.
- Storefront messages (`Api/Site/*`) do not change. Error messages do not change.

## Capabilities

### New Capabilities

- `merchant-toast-messages`: The text rules for success toasts in the merchant app. It covers action accuracy, toggle verbs, item names, style, and one toast for each action.

### Modified Capabilities

None.

## Impact

- **PHP:** `OnlinePaymentController`, `OfflinePaymentController`, `OrderController::partial`, `VariantController::bulk_update`, `EmailTemplateController`, and `PerformOrderAction::get_message`. Only message strings change. The response shape stays the same.
- **Front end (`resources/app/`):**
  - Mutation hooks in `features/*/services/*.ts` and `services/settings.ts`. Some hooks get an optional item name or toast text in their variables.
  - The row-action call sites in payment, shipping, tax, coupons, currencies, brands, tags, categories, collections, customers, attributes, and products.
  - `online-payment-edit-dialog.tsx` and `shipping-box.tsx` (duplicate toasts).
- **Translations:** Changed PHP and JS strings get new msgids. Their old translations stop working until translators update them.
- **Tests:** Vitest tests for the hooks and call sites whose variables change.
