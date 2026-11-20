## Context

The success toast text comes from 3 places today:

1. **The PHP REST `message`.** Most mutation hooks call `toastMutationSuccess(response.message || __('<fallback>'))`, so the server text wins.
2. **The hook fallback.** The fallback shows only when the server sends no message.
3. **The call site.** Some components call `toast.success()` or `dispatchToastMessage()` directly (shipping method dialog, shipping box default, carriers through `saveShippingZones({ toastMessage })`).

The audit found these problems:

- **Generic endpoint, specific action.**
  - Payment `set_enabled` (online and offline) returns "Payment method updated".
  - Order `partial` returns "Order updated" for a note save and for a flags save.
  - The settings endpoint returns "Settings saved" for shipping zone activate, deactivate, create, update, and delete, and for shipping method activate, deactivate, and delete (`use-shipping-settings.ts`, `shipping-zone.tsx`).
  - Variant `bulk_update` returns "Inventory updated", but the bulk edit page also changes prices and SKUs.
  - `update_plugin` and the settings `update` of an online gateway both say "Payment gateway updated" or "Payment method updated".
- **Wrong verb at the call site.** A carrier switch toggle says "Shipping carrier updated".
- **Double toasts.**
  - `online-payment-edit-dialog.tsx` toasts "Payment gateway updated", and the hook also toasts the server's "Payment method updated".
  - `shipping-box.tsx` toasts "set as default", and `useUpdateShippingBoxMutation` also toasts "Shipping box updated".
- **Style.**
  - `PerformOrderAction::get_message` uses trailing periods and some unclear phrases ("Order delivered.", "Order on hold.", "Tracking removed.").
  - `EmailTemplateController` returns "Template restored to default." and "Test email sent successfully.".

## Goals / Non-Goals

**Goals:**

- One text source for each toast, with a clear order of precedence.
- The hook owns the wording for named row actions. A call site gives only the item name, so the same action has the same words everywhere.

**Non-Goals:**

- New toasts for actions that show no toast today. Examples: currency activate and deactivate in `use-available-currency-list.ts`, payment method reorder, tax region delete (silent save), and currency create and update. I record them in Open Questions.
- Counts in bulk messages ("3 brands deleted").
- Error and warning toast text.
- Storefront (`Api/Site/*`) messages.

## Decisions

### D1. Order of precedence

`successMessage` from the caller, then the hook's named message (when a `name` is given), then `response.message`, then the hook fallback.

- *Alternative:* the front end always ignores `response.message`. I rejected it because the user chose to fix the REST text as well, so other API clients also get correct text.

### D2. The hook composes named messages, and the caller gives only `name`

Hooks that serve a single-item row action accept an optional `name` in their variables. The hook builds the text with a shared helper in `services/helpers.ts`:

```ts
getItemActionMessage('deactivated', name) // '"Cash on delivery" deactivated', or undefined if name is empty
```

The helper has one literal `__()` string for each action, so the i18n extractor finds it. The strings are `"%s" activated`, `"%s" deactivated`, `"%s" enabled`, `"%s" disabled`, `"%s" deleted`, `"%s" deleted permanently`, `"%s" removed`, `"%s" duplicated`, `"%s" restored`, `"%s" moved to trash`, `"%s" set as default`, and `"%s" removed as default`. Each has a `/* translators: %s: item name */` comment. The quote style follows the existing `Add "%s"` strings.

- *Alternative:* each call site writes its own `successMessage`. I rejected it because about 30 call sites would repeat the same words, and the words would drift.

### D3. Mutations with only an id get object variables

Some mutations have only an id as their variables: delete brand, tag, category, collection, customer, coupon, attribute, attribute value, tax profile, shipping profile, shipping box, offline payment, and currency, and uninstall online payment. For these, the variables change from `id` to `{ id, name? }`. The `mutationFn` destructures them and calls the same request function, so the request functions (`deleteBrand(id)` and others) do not change.

Mutations that already use object variables (`set_enabled`, coupon action, product duplicate, bulk trash and restore) get an optional `name` field. Bulk trash and restore use the name only when `ids.length === 1`.

### D4. The caller gives `successMessage` for generic endpoints

- `useUpdateSettingsMutation` variables get `successMessage?: string`. The `mutationFn` destructures `{ key, data }` before it calls `updateSettings`, so the extra field is not sent. The shipping callers give:
  - zone activate and deactivate: named;
  - zone delete: named;
  - zone create: "Shipping zone created";
  - zone page save: "Shipping zone updated";
  - method switch: named activated or deactivated;
  - method delete: named.
- `useUpdateShippingBoxMutation` variables get `successMessage?: string`. `shipping-box.tsx` gives the named set-as-default or removed-as-default text and removes its own `dispatchToastMessage`.
- `saveShippingZones({ toastMessage })` already gives caller text. The carrier toggle changes from "updated" to named activated or deactivated. Carrier delete and shipping method delete (`shipping-method.tsx`) become named.

### D5. Fixes in PHP

These are string changes only, in the same `message` key:

- `set_enabled` uses a ternary on the `is_enabled` value that it already reads.
- `OrderController::partial` selects the text from the `order_notes` and `flags` keys that it already checks.
- `VariantController::bulk_update` returns "Variants updated".
- `update_plugin` returns "Payment gateway updated to the latest version".
- `PerformOrderAction::get_message` and `EmailTemplateController` get the spec texts.

### D6. The online payment edit dialog

The dialog removes its own `dispatchToastMessage`. The hook shows the server's "Payment method updated", which is correct for a settings save.

### D7. Toggle verbs

The spec table applies:

- Shipping zone and coupon menus show "Activate/Deactivate", so the toasts say activated/deactivated.
- The payment method, shipping method, and carrier controls are switches, so the toasts say activated/deactivated. This matches the merchant's own words ("activate/deactivate a payment method").
- No "Enable/Disable" menu control has a toast in this change. The tax region menu changes only local form state, which the page Save button saves.

## Risks / Trade-offs

- **Translations.** Changed msgids lose their translations until translators update them. → This is acceptable for admin-only text. The next `npm run make:pot` picks up the new strings.
- **REST message text.** An external client that compares `message` text breaks. → The `message` text is not a documented contract. The response shape does not change.
- **Tests.** Tests that call `mutate(id)` or assert old text fail. → The tasks include updating those tests (for example `features/settings/payment/tests/services/payment.test.ts`).
- **Long names.** A long name makes the toast wrap. → The toast title clamps to 2 lines.

## Migration Plan

No data migration. This is a normal release.

## Open Questions

- Do we add toasts to the silent toggles (currency activate and deactivate, payment method reorder)? This does not change this change's tasks. It can be a follow-up.

## Corrections during implementation

- **Coupon name.** The spec first said that a coupon toast uses the coupon code. The coupon table shows the coupon title, and an automatic coupon has no code. The toast now uses the title, and the code when the title is empty. The spec table is updated.
- **Attribute value name.** An attribute value has no `name` field. The toast uses its `value` text, which the variation table shows.
- **Bulk trash and restore variables.** `bulkTrashProducts` already sends only `action`, `ids`, and `params`, so the extra `name` field is not sent to the server. The hook passes its variables unchanged.
- **Tests that needed changes.** No existing test called a changed hook with an id only, so no existing test needed changes except the mocked `set_enabled` message in `payment.test.ts`. New hook tests cover the settings mutation, payment, shipping box, coupon, product, and brand toasts.
