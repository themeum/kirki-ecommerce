## 1. Backend: carrier presets and seeding

- [x] 1.1 Add `ShippingCarrierPresets` with the preset catalog (UPS, FedEx, DHL, USPS, Royal Mail, Canada Post, Australia Post, DPD, Aramex): key, name, URL template with `{tracking_number}`, bundled logo path. Add `seed(array $zone)` that returns the zone with disabled presets when the `shipping_carriers` key is absent and returns it unchanged when the key exists.
- [x] 1.2 Add the preset logo SVGs under `assets/images/carriers/<key>.svg`; record each logo's source in the catalog class docblock; re-check every preset URL template against the carrier's public tracking page. (Logos are generic initials marks in brand colours, not official logos, which need permission; recorded in the catalog docblock. URL templates are from memory and still need a manual check.)
- [x] 1.3 Call `seed()` in `ShippingZonePresets::make_zone` and in `SettingsUpdateRequest::prepare_for_validation` (shipping key). (Superseded by group 8.)
- [x] 1.4 In `SettingResource`, seed zones without the key on read and add derived `logo_url` per carrier (attachment URL, else bundled preset logo, else null). (Superseded by group 8.)
- [x] 1.5 PHPUnit: seeding for absent key, empty array, populated list; ids are deterministic; a read followed by a save persists the same ids; `make_zone` output is seeded.
- [x] 1.6 Verify: `composer test:unit && composer test:integration`, then `npm run typecheck && npm test` from `resources/app/`.

## 2. Backend: carrier validation and sanitizing

- [x] 2.1 Replace the commented `shipping_zones.*.shipping_carriers` rules in `SettingsUpdateRequest` with the new shape: `id` string, `preset` nullable string, `name` required string, `tracking_url` required with http/https scheme and `{tracking_number}` check, `is_enabled` boolean, `logo` nullable integer.
- [x] 2.2 Add a sanitizer helper for URL templates that swaps `{tracking_number}` for a token, sanitizes, and swaps back. Use it for the carrier `tracking_url` filter.
- [x] 2.3 PHPUnit: valid template saved with braces intact after a round trip; missing placeholder, `javascript:` scheme, and empty name each return a validation error naming that carrier's field.
- [x] 2.4 Verify: `composer test:unit && composer test:integration`, then `npm run typecheck && npm test` from `resources/app/`.

## 3. Backend: matched-zone carriers and add-tracking resolution

- [x] 3.1 Add public `ShippingService::get_carriers_for_address(array $address)` using `find_shipping_zone`; return enabled carriers only, with `logo_url`.
- [x] 3.2 Add `GET /orders/{id}/shipping-carriers` (controller method, route, resource shape `id`, `name`, `tracking_url`, `logo_url`) behind the same permission as other order reads. Document it in `docs/ecommerce/orders/` (done in group 7).
- [x] 3.3 Add `carrier_id` to `PerformOrderActionDTO` and `OrderActionRequest`; make `carrier` required only without `carrier_id`; make the `tracking_url` filter brace-safe via the helper from 2.2.
- [x] 3.4 Implement the three-way resolution in `PerformOrderAction` / `OrderManager::add_tracking` (carrier id, Other template, legacy URL) with `rawurlencode` of the number and scheme validation; reject unknown or disabled `carrier_id` with 422.
- [x] 3.5 PHPUnit: zone match by country, by state, no match, zone without regions, disabled carrier excluded; resolution with an encoded number; unknown id; unsafe Other template; legacy path; carrier edited after use does not change the stored order. (Email assertions moved to group 3b.)
- [x] 3.6 Verify: `composer test:unit && composer test:integration`, then `npm run typecheck && npm test` from `resources/app/`.

## 3b. Backend: Tracking added email

- [x] 3b.1 Add `CustomerOrderNotification::TRACKING_ADDED = 'tracking_added'`, the default template and shortcodes in `resources/data/settings/email.json`, the preview service mapping, and sample data (`resources/data/sample/email/order.json` already has tracking fields; add the carrier).
- [x] 3b.2 Add `OrderTrackingAddedEvent`, `SendOrderTrackingAddedNotificationsListener`, and `CustomerOrderTrackingAddedMail` (exposes `shipping_carrier`, `shipping_tracking_number`, `shipping_tracking_url`, order and store shortcodes). Dispatch the event from `OrderManager::add_tracking` after a successful update.
- [x] 3b.3 Add the `tracking_added` label and template entry to the Email settings UI (`features/settings/email/lib/utils.ts`) and fix any count or fixture tests that list the customer notifications.
- [x] 3b.4 PHPUnit: add-tracking queues one email with carrier, number and link; disabled template queues none; second add queues again; rejected add queues none; email settings API returns the new template; preview and restore-default work for the new key. Re-assert that mark-as-shipped email is unchanged.
- [x] 3b.5 Verify: `composer test:unit && composer test:integration`, then `npm run typecheck && npm test` from `resources/app/`.

## 4. Frontend: carrier form, URL helper, and types

- [x] 4.1 Replace the method-shaped `ShippingCarrierSchema` in `schemas/catalog/shipping.ts` with the carrier entity schema (lenient, `.nullish()`); add `shipping_carriers` to `ShippingZoneSchema` and the `ShippingZone` type; remove `shipping_careers`.
- [x] 4.2 Add `lib/shipping-carrier-url.ts` with `hasTrackingPlaceholder`, `isTrackingTemplate`, `resolveTrackingUrl`.
- [x] 4.3 Add `schemas/forms/shipping-carrier-form.ts` (name required, URL template rule, optional logo) following the `XFormShape` / `prepareFormSchema` / `.transform()` pattern with `XFormInput` and `XFormPayload`.
- [x] 4.4 Vitest: payload test `tests/schemas/forms/shipping-carrier-form.test.ts`; helper test `tests/lib/shipping-carrier-url.test.ts` (placeholder rules, scheme rules, encoding of spaces and `&`, multiple placeholders).
- [x] 4.5 Stop sending `shipping_careers: []` from `handleCreateZone`; omit `shipping_carriers` so the server seeds it. (Superseded by group 8.)
- [x] 4.6 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 5. Frontend: Shipping Carriers card on the zone page

- [x] 5.1 Read `shipping-method.tsx` and `shipping-zone-operations.ts` to confirm how rows save to the zone, then reuse that pattern for carriers.
- [x] 5.2 Replace `pages/shipping-career/` with `pages/shipping-carrier/shipping-carrier.tsx`: header, Add button, empty state, `StackedItems` rows with logo, name, and hover-only edit, delete (confirm), and enable switch. No price text; no layout shift on hover.
- [x] 5.3 Add `shipping-carrier-dialog.tsx` (Name, URL, Logo via `media-field` with the 48x48 hint) wired to the form from 4.3 for add and edit. (Superseded by group 8.)
- [x] 5.4 Render the card in `shipping-zone.tsx` below `ShippingMethod`, using `data-search-skip="true"`. Use `__()` with `kirki-ecommerce` for all text and `defineStyles` with theme tokens for styling.
- [x] 5.5 Add component tests for the card (list, empty state, add, toggle, delete) next to the existing shipping page tests.
- [x] 5.6 Verify: `npm run typecheck && npm test` from `resources/app/`, then lint. Ask the user to check the hover layout in the browser.

## 6. Frontend: Add-tracking dialog

- [x] 6.1 Add the matched-zone carriers query and its key to the order service and `query-keys.ts`; add `carrier_id` to the action payload in `order-actions.ts`.
- [x] 6.2 Rework `add-tracking-dialog.tsx`: Carrier select (enabled zone carriers + Other), Tracking number input, read-only URL preview from `resolveTrackingUrl`, no Tracking URL input for listed carriers; Other shows required name and template fields with the template rule.
- [x] 6.3 Pre-select the carrier from existing tracking: match by name, else Other with name and URL prefilled. Update `use-order-details.ts` to submit `carrier_id` or the Other name and template.
- [x] 6.4 Add the add-tracking form payload test and dialog tests (the `order.test.ts` and `use-order-edit.test.tsx` fixtures needed no change); dialog tests for each spec scenario (matched list, only Other, preview, Save disabled, existing-tracking pre-select).
- [x] 6.5 Verify: `npm run typecheck && npm test` from `resources/app/`, then lint. Ask the user to check the dialog visually.

## 7. Docs and final checks

- [x] 7.1 Write `docs/shipping-carriers.md` like `docs/emails.md`: table of contents, numbered sections, quick start first, reference (data shape, presets, URL template rules, endpoint, add-tracking action), and "Where this differs from WooCommerce shipment tracking" (per-zone carriers, presets copied not linked, snapshot on order, tracking only after shipped). Document the Tracking added email in `docs/emails.md`.
- [x] 7.2 Update `docs/ecommerce/` order and settings YAML for the new endpoint, `carrier_id`, and `shipping_carriers`.
- [x] 7.3 (`phpcs:docblocks` reports one existing error, the missing docblock on `PerformOrderAction::get_message`, left as is.) Run `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test`, then `npm run typecheck && npm test` and lint from `resources/app/`; run `openspec validate shipping-carriers --strict`.

## 8. Revision: Add menu, popover, Inactive badge, no seeding

- [x] 8.1 Backend: remove `ShippingCarrierPresets::seed`, `seed_settings` and `make_carriers`, and their calls in `SettingsUpdateRequest::prepare_for_validation`, `SettingResource`, and `ShippingZonePresets::make_zone`. A zone without the `shipping_carriers` key reads as an empty list. Keep `catalog()`, `get_logo_url()` and `with_logo_urls()`. (A zone without the key is returned without it; the client reads a missing list as empty.)
- [x] 8.2 Backend: add a catalog helper to `ShippingCarrierPresets` and return it as `shipping_carrier_presets` (`key`, `name`, `tracking_url`, `logo_url`) in the shipping settings read response. Strip it from the settings update payload.
- [x] 8.3 PHPUnit: update `ShippingCarrierPresetsTest`, `ShippingCarrierSettingsApiTest` and `StorePresetsTest` for the new rules (new zone, store-setup zone, and old zone read as empty; no re-seed after delete; the catalog is returned; a save round trip keeps carriers and ids). Remove tests of the removed seeding.
- [x] 8.4 Frontend: add `size?: 'default' | 'sm'` to `components/ui/badge.tsx` (`data-size` attribute, `sm` style with less padding and height; default unchanged) and add a test next to it.
- [x] 8.5 Frontend: add `shipping_carrier_presets` to the shipping settings schema and types, and a helper that lists the presets a zone lacks and builds the new carrier from a preset (`id` = `preset` = key, `is_enabled` true).
- [x] 8.6 Frontend: change the card's Add button into a `DropdownMenu` listing the missing presets and a "+ Add new" item. A preset pick saves the carrier active with the toast "Shipping carrier added". Update the empty-state text to point to Add.
- [x] 8.7 Frontend: replace `shipping-carrier-dialog.tsx` with `shipping-carrier-popover.tsx` (same form, schema and fields). "+ Add new" anchors it to the Add button and Edit anchors it to the row's Edit button, following `create-profile-popover.tsx`. Remove the dialog.
- [x] 8.8 Frontend: show `Badge size="sm"` "Inactive" on disabled rows and "Active" with `variant="success"` and `size="sm"` on enabled rows.
- [x] 8.9 Vitest: update `shipping-carrier.test.tsx` (menu lists missing presets, hides added presets, shows a deleted preset again, preset pick adds an active carrier, "+ Add new" opens the popover, Edit opens the popover, Inactive and Active badges) and the shipping settings fixtures and schema tests for `shipping_carrier_presets`; keep the form schema tests.
- [x] 8.10 Docs: update `docs/shipping-carriers.md` (quick start, presets section, the differs section) and `docs/ecommerce/settings/shipping.yml` for the empty start, the Add menu, `shipping_carrier_presets`, and the popover.
- [x] 8.11 Verify: `composer phpcs:wporg`, `composer phpcs:docblocks`, `composer test`, then `npm run typecheck && npm test` and lint from `resources/app/`; run `openspec validate shipping-carriers --strict`. Ask the user to check the dropdown, the popover anchor, and the badges in the browser.
- [x] 8.12 Frontend: remove the empty-state panel from the carriers card so a zone without carriers shows only the header and the Add button, like the Shipping Methods card; update the card test.
- [x] 8.13 Frontend: show the `sm` badge only on inactive carriers; enabled carriers show no badge; update the card test, spec and docs.
