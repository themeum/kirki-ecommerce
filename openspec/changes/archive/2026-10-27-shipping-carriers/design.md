## Context

See `proposal.md` for motivation. Current state, from reading the code:

- Shipping zones are not a table. They are an array in the `shipping` settings option (`shipping_zones[]`, each with `id`, `title`, `is_enabled`, `regions`, `shipping_methods`). Zone ids are UUIDs.
- Zones are created in three places: the zone dialog (`handleCreateZone` in `use-shipping-settings.ts`), store-setup presets (`ShippingZonePresets::make_zone`), and `SettingsSeeder`.
- The frontend already has two stale carrier traces: `ShippingZone.shipping_careers?: unknown[]` (typo, always `[]`) and a `ShippingCarrierSchema` in `schemas/catalog/shipping.ts` shaped like a shipping *method* (rate, type, rules). `SettingsUpdateRequest` has the old `shipping_zones.*.shipping_carriers.*` rules commented out, also method-shaped.
- `ShippingService::find_shipping_zone()` (protected) already finds the first enabled zone covering a `{country, state}` address. Checkout uses it.
- Orders already have `shipping_carrier`, `shipping_tracking_number`, `shipping_tracking_url` columns. `add_tracking` stores whatever the client sends. `OrderActionRequest` runs `tracking_url` through `Sanitizer::URL`. `CustomerOrderShippedMail` prints `shipping_tracking.tracking_url`. That mail is sent by "Mark as shipped", not by "Add tracking".
- There is no upgrade/backfill routine in the plugin (migrations were squashed into `Create*Table` classes).
- `Sanitizer::URL` is `esc_url_raw`-style; WordPress URL escaping drops `{` and `}`, so it would destroy a `{tracking_number}` template.

## Goals / Non-Goals

**Goals:**
- One server-owned rule for template validity and URL building, mirrored by a small client helper for live preview.
- Zones that start empty however they are created, with presets added on request, without a data migration.
- No change to the orders table or to the email template.

**Non-Goals:**
- Carrier APIs (rates, label printing, live tracking status).
- Region filtering on a carrier itself; the zone is the filter.
- Changing when the existing emails send, or the content of the Order Shipped email.
- A global (cross-zone) carrier list or a preset-management screen.

## Decisions

### 1. Store carriers in the zone, key `shipping_carriers`

A carrier is `{ id, preset, name, tracking_url, logo, is_enabled }`. `preset` is a catalog key or null. `logo` is an attachment id or null. The read response also carries a derived `logo_url`.

Rename the frontend `shipping_careers` to `shipping_carriers` and replace the method-shaped `ShippingCarrierSchema`.

*Why:* the user chose per-zone storage, and the order dialog filters by zone. It adds no table and rides on the existing settings save.
*Alternative rejected:* a `kirki_ecommerce_shipping_carriers` table like shipping boxes. It would need its own zone link and CRUD, and breaks "carriers are part of the zone".

### 2. Preset ids are the preset key; custom ids are UUIDs

A preset carrier in a zone has `id = preset = 'ups'`. A custom one gets `wp_generate_uuid4()` (`uuid()` on the client). Ids only need to be unique inside one zone.

*Why:* the Add menu decides "already in this zone" by comparing the preset key with the zone carriers' `preset` field, and the order-tracking lookup needs an id that is stable inside a zone. A preset can be added to a zone only once, so the key is unique there.

### 3. No seeding: the merchant adds presets from the Add menu

*Revised after review:* the first design seeded every preset, disabled, into every zone (absent `shipping_carriers` key meant "seed"). The user replaced that. A zone starts with an empty carrier list. Presets are added one by one from the card's Add menu, and they are added **enabled**.

A zone without the `shipping_carriers` key is read as an empty list. A deleted preset is simply absent, so the menu lists it again.

`ShippingCarrierPresets` keeps the catalog (`catalog()`, `get_logo_url()`) and a helper that builds the catalog list for the client. Its `seed()`, `seed_settings()` and `make_carriers()` are removed, together with their callers:
- `SettingsUpdateRequest::prepare_for_validation` (shipping key),
- `SettingResource` (read-time seeding; the derived `logo_url` per carrier stays),
- `ShippingZonePresets::make_zone`.

*Assumption:* the feature has not shipped, so no migration or cleanup is made for zones that already hold seeded, disabled presets from development builds. Such a zone shows those carriers as Inactive, and the merchant can delete them.
*Alternatives rejected:* keep seeding and only hide disabled presets (contradicts the requested empty start); a migration that strips seeded presets (nothing to migrate in released data).

### 4. Template validation and sanitizing live on the server, with a mirrored client helper

Server rule per carrier: name required text; `tracking_url` required, scheme `http`/`https`, contains `{tracking_number}`; `is_enabled` boolean; `logo` nullable integer.

Sanitizing swaps `{tracking_number}` for an inert token, runs the URL sanitizer, and swaps it back. Never run the raw template through `Sanitizer::URL`. The same swap is needed for the add-tracking `tracking_url` filter, which today strips braces.

Client: `lib/shipping-carrier-url.ts` exports `hasTrackingPlaceholder`, `isTrackingTemplate`, and `resolveTrackingUrl(template, number)` (`encodeURIComponent`). The zod form schema and the dialog preview use it. The server stays the authority; the helper is for feedback and preview.

### 5. Server resolves the order's tracking URL

`PerformOrderActionDTO` gains `carrier_id`. `OrderActionRequest` adds `carrier_id` (nullable string) and relaxes `carrier` to required only when `carrier_id` is absent.

`add_tracking` logic:
1. `carrier_id` present: find the order's matched zone with `ShippingService`, find an **enabled** carrier with that id in that zone, else 422. Build URL from its template; store its name.
2. No `carrier_id`, and `tracking_url` contains `{tracking_number}`: treat as an "Other" template. Validate scheme, build URL; store `carrier` name.
3. No `carrier_id`, plain `tracking_url`: legacy path. Validate http/https and store as sent.

The number is `rawurlencode`d. The resolved URL then goes through the URL sanitizer.

*Why the matched zone, not all zones:* preset ids repeat across zones, so an id is only unique within one zone.
*Alternative rejected:* trust a resolved URL from the client. It is spoofable, and the URL ends up in customer emails.

### 6. Matched-zone carriers come from a dedicated endpoint

`GET /orders/{id}/shipping-carriers` returns `[{ id, name, tracking_url, logo_url }]` for the enabled carriers of the matched zone (empty array for no match). `ShippingService` gets a public `get_carriers_for_address(array $address)` that wraps the existing `find_shipping_zone`.

The dialog fetches it with `useQuery` when it opens.

*Alternatives rejected:* a field on `OrderResource` (computed for every row of the order list); matching zones in the browser (duplicates `matches_zone`, which treats empty regions and state lists in a subtle way).

### 7. Logos

Preset logos are SVGs in `assets/images/carriers/<key>.svg`, served from the plugin URL. A custom logo uses the existing media picker field (`media-field`) and is stored as an attachment id. `logo_url` is: custom attachment URL, else bundled preset logo for the preset key, else null. Rows with no `logo_url` show a generic truck mark.

Editing a preset and uploading a logo sets `logo`; removing it returns to the bundled logo.

### 8. Frontend structure

Follow `react-standards.md`. Files under `features/settings/shipping/`:
- `pages/shipping-carrier/shipping-carrier.tsx` (card; replaces `shipping-career/`) and `shipping-carrier-dialog.tsx`;
- `schemas/forms/shipping-carrier-form.ts` (+ test in `tests/schemas/forms/`);
- `lib/shipping-carrier-url.ts` (+ test in `tests/lib/`).

The card persists each add, edit, delete, and toggle through the same zone-settings save the method rows use, and updates `shippingZonesObj`. The task list includes confirming that pattern in `shipping-method.tsx` before coding. Rows use `StackedItem` with the existing `data-action-group` hover behaviour and no right-text, so no layout shift.

*Revised after review:* the Add button opens a `DropdownMenu` of the catalog presets the zone lacks plus a "+ Add new" item. "+ Add new" and Edit open the carrier form in a `Popover` (the existing `create-profile-popover.tsx` in `features/settings/shipping/pages/shipping-profile/` is the pattern to follow). The popover is controlled by the card. "+ Add new" anchors to the Add button with `PopoverAnchor`; Edit anchors to the row's Edit button. The dropdown closes first, then the popover opens, so focus returns to a stable element. `shipping-carrier-dialog.tsx` is replaced by `shipping-carrier-popover.tsx` and the form and schema stay as they are.

Row badge: a disabled carrier shows a neutral `Badge size="sm"` "Inactive"; an enabled carrier shows no badge. `Badge` gets `size?: 'default' | 'sm'`, applied as `data-size` plus an `sm` style that lowers padding, radius and height (the default text is already the smallest theme size), with `default` unchanged.

In `features/orders`: `add-tracking-dialog.tsx` is reworked to a carrier select, a tracking number input, an "Other" group, and a preview. The carriers query goes in the order service; `use-order-details.ts` and `order-actions.ts` send `carrier_id`.

### 9. Preset list

UPS, FedEx, DHL, USPS, Royal Mail, Canada Post, Australia Post, DPD, Aramex. URL templates are written in the catalog from each carrier's public tracking page and must be re-checked during implementation.

### 10. New "Tracking added" customer email

*Correction during implementation:* the plan assumed the Order Shipped email would carry the tracking link ("keep current flow"). Reading `resources/data/order-state-matrix.json` showed `add-tracking` is allowed only in shipped states, so the Order Shipped email is always sent before tracking exists, and its default message holds no tracking shortcodes. With that flow the customer never receives the link. The user chose a dedicated email.

Design: `OrderManager::add_tracking` dispatches a new `OrderTrackingAddedEvent` after a successful update. `SendOrderTrackingAddedNotificationsListener` queues `CustomerOrderTrackingAddedMail` (it only queues, like the shipped listener, so it is safe inside the action's transaction). The notification key is `tracking_added` in `customer_emails.order_notifications`, so it appears in Email settings, preview, and test-send through the existing constant-driven pipeline. The mail exposes `{shipping_carrier}`, `{shipping_tracking_number}`, `{shipping_tracking_url}` plus the usual order and store shortcodes. Default message: greeting, carrier, number, link, view-order button.

*Alternatives rejected:* resend the Order Shipped email (duplicate "shipped" mail, first one has empty tracking lines); no email (goal unmet).

*Correction during implementation (logos):* official carrier logos were not bundled. They need each carrier's permission and cannot be fetched from a trusted source here. `assets/images/carriers/<key>.svg` are generated initials marks in each carrier's brand colour, recorded as such in the `ShippingCarrierPresets` docblock and in `docs/shipping-carriers.md`. Merchants can upload a real logo per carrier.

*Correction during implementation (helper placement):* `feature-module-boundaries` says a second feature reaches an entity through the owning feature's public API, so the URL helper stays in `features/settings/shipping/lib/` and `features/orders` imports it from `@/features/settings`.

*Correction during implementation (sanitizing):* the server uses `Sanitizer::apply_rule(..., Sanitizer::URL)` with the placeholder token swap, as the PHP standards prefer, instead of calling a WordPress URL function directly. Settings and action request filters accept a callable, which is how the swap is applied.

### 11. The server sends the preset catalog; the client builds the carrier

*Added after review.* The Add menu needs the catalog, and the client has no copy of it. `SettingResource` adds `shipping_carrier_presets` to the shipping settings response: a list of `{ key, name, tracking_url, logo_url }` (the bundled logo URL). It is read-only and is never sent back in the settings update. The client filters out presets whose key matches a zone carrier's `preset`, and on a pick it builds `{ id: key, preset: key, name, tracking_url, logo: null, is_enabled: true }` and saves it with the zone like any other add. The server still validates the saved carrier with the normal rules. `logo_url` of the stored carrier is derived on read from the preset key, so the client does not store it.

*Why:* the catalog stays in one place (PHP), the client needs no second endpoint, and the settings response is already loaded on the zone page.
*Alternative rejected:* a dedicated catalog endpoint (an extra request and query key for a small static list); duplicating the catalog in TypeScript (two sources of truth for URL templates).

## Risks / Trade-offs

- [Brand logos may need permission or fall under trademark rules for the wordpress.org directory] → source logos from each carrier's brand/press resources, record the source in the catalog, and ship a generic mark for any carrier whose logo cannot be bundled.
- [Preset tracking URLs can change at carrier sites] → merchants can edit any template per zone; docs say presets are a starting point.
- [Preset URLs are copied into a zone when the merchant adds them, so app updates to a preset do not reach zones that already hold it] → accepted by the "copy and let merchant edit" choice; documented.
- [A merchant must add carriers by hand before the order dialog lists any] → the order dialog always offers "Other"; the card header and its Add button are the only prompt, as on the Shipping Methods card.
- [Zones saved by development builds hold seeded, disabled presets] → accepted because nothing has shipped; they show as Inactive and can be deleted.
- [Adding tracking twice emails the customer twice] → intended (latest details win); merchants can switch the email off.
- [Order address changes after the dialog opens could move the order to another zone] → the server re-matches at save and rejects an unknown `carrier_id`; the dialog shows the validation error.
- [Brace-stripping by WordPress sanitizers] → single helper does the token swap; tests assert templates survive a settings round trip.

## Migration Plan

No schema change and no migration. Existing zones start with an empty carrier list (Decision 3). Rollback: older code ignores the extra `shipping_carriers` key in the option; orders keep their stored values.
