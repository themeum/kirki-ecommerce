## Why

A shipping method is added and edited on its own page
(`/settings/shipping/zone/:zone_id/method/:method_id`). The page loads the shipping
settings again to find a method that the zone list already shows, and a new method cannot
get rules until it is saved once. The approved design puts the same form in a dialog that
opens over the list, so the merchant stays in context and completes a method, with its
rules, in one step.

## What Changes

- A shipping method is added and edited in a dialog with **Cancel** and **Save**. The
  dialog opens from the method list on the zone screen (add and edit) and from the method
  list on the Shipping settings page (edit).
- The dialog shows the values that the list already holds. It makes no request to load a
  method.
- The form fields, the method types, and the validation do not change.
- The Rules card shows in the dialog for a new method and for an existing method.
- **BREAKING (admin behaviour)**: rules are no longer stored one by one. Rules that the
  merchant adds, edits, or deletes are stored together with the method when the merchant
  selects **Save**. **Cancel** discards them.
- **BREAKING (admin URL)**: the shipping method page and its route are removed. An old
  link to `/settings/shipping/zone/:zone_id/method/:method_id` shows the not-found screen.
- **Save** closes the dialog. The page stayed open after a save.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `shipping-settings`: a method is added and edited in a dialog and not on a separate
  screen; rules are composed in that dialog and stored together with the method.

## Impact

- Frontend only, in `resources/app/`:
  - New: `features/settings/shipping/components/shipping-method/shipping-method-dialog.tsx`
    and its Vitest test.
  - Changed: `shipping-method.tsx`, `shipping-rules/shipping-rules.tsx`,
    `shipping-rules/shipping-rule-form-card.tsx`, `hooks/use-shipping-settings.ts`,
    `pages/shipping-settings.tsx`, `features/settings/routes.tsx`,
    `config/route-config.ts`, `libs/route.test.ts`.
  - Deleted: `pages/shipping-delivery-method.tsx`,
    `skeletons/shipping-delivery-method-skeleton.tsx`.
- No backend, REST, database, or stored-data change. The saved shape of
  `shipping_zones[].shipping_methods[]` (with `shipping_rules`) stays the same, and the
  save request still sends only the shipping zones.
- No new dependency.
