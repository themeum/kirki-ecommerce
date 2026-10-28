## Why

Merchants add tracking to an order by typing a carrier name and a full tracking URL by hand, every time. That is slow, error-prone, and gives the customer a link the merchant may have mistyped. Merchants need a one-time carrier setup (name, tracking-link template, logo) per shipping zone, so that adding tracking becomes "pick a carrier, type the number" and the customer always gets a working link.

## What Changes

- Add a **Shipping Carriers** card to the shipping **zone** page, below the shipping methods card. It replaces the empty `shipping-career` stub.
- Each carrier has a name, a tracking-URL template that contains the `{tracking_number}` placeholder, an optional logo, and an on/off switch. Carriers have no price. Rows use `StackedItems`; edit, delete, and the switch show on hover. A disabled carrier shows an "Inactive" badge; an enabled carrier shows no badge. The `Badge` component gets a small size (`sm`) for these.
- Carriers live inside each zone in the shipping settings (`shipping_zones[].shipping_carriers[]`). The stale frontend `shipping_careers` field and the old method-shaped `ShippingCarrierSchema` are replaced.
- Ship a preset catalog of popular carriers (name, URL template, bundled logo). A zone starts with **no carriers**. The card's **Add** button opens a dropdown that lists the presets the zone does not have yet; a click adds the preset **active**. The dropdown also has "+ Add new", which opens the carrier form in a popover (the same popover is used for Edit). Presets can be edited, switched off, and deleted; a deleted preset shows in the dropdown again.
- Carrier URL templates must start with `http://` or `https://` and contain `{tracking_number}`. The server enforces this too.
- Change the order **Add tracking** dialog: the Carrier field becomes a select of the enabled carriers of the zone that matches the order's shipping country/state, plus an **Other** option. The Tracking URL input is removed; a read-only preview shows the resolved link once a tracking number is typed. **Other** asks for a carrier name and a URL template.
- Resolve the tracking URL on the **server**. The add-tracking action takes a carrier reference and a tracking number, then stores carrier name, number, and the resolved URL on the order (a snapshot).
- Add a new customer email, **Tracking added**, queued when tracking is added. It shows carrier, number, and the clickable link, and is editable and switchable in Email settings. (Add tracking is only possible after an order ships, and the Order Shipped email does not carry tracking, so without this the customer never gets the link.)
- Add a read endpoint that returns the enabled carriers for an order's matched zone.
- Add `docs/shipping-carriers.md`.

No **BREAKING** API changes: the add-tracking action still accepts `carrier`, `tracking_number`, and `tracking_url`; `carrier_id` is additive.

## Capabilities

### New Capabilities

- `shipping-carriers`: per-zone carrier list on the zone page, preset catalog and the Add dropdown, carrier form popover and URL-template validation, hover actions, enable switch, and the Inactive badge.
- `order-tracking-carriers`: carrier choice in the Add-tracking dialog, matched-zone carrier lookup, server-side URL resolution and snapshot, the "Other" path, and the Tracking added customer email.

### Modified Capabilities

None. Existing `shipping-settings` requirements are not changed; the zone page gains a card.

## Impact

- **Backend**: `SettingsUpdateRequest` (replace commented `shipping_carriers` rules, add placeholder-safe sanitizing), `SettingResource` (derived `logo_url` per carrier and the preset catalog), `ShippingService`, new carrier preset catalog class, `OrderActionRequest`, `PerformOrderActionDTO`, `PerformOrderAction`, `OrderManager::add_tracking`, `OrderController` and `routes/api.php` (new carriers endpoint), bundled logos under `assets/`, and the email pipeline for the new Tracking added email (notification constant, mailer, event, listener, default template in `resources/data/settings/email.json`, preview service, sample data) plus its label in the Email settings UI.
- **Frontend**: `components/ui/badge.tsx` (`sm` size), `features/settings/shipping` (zone page, new carrier card with Add dropdown and form popover, form schema, types, catalog schema, services) and `features/orders` (`add-tracking-dialog.tsx`, `use-order-details.ts`, `order-actions.ts`, order schema/service).
- **Data**: no new table. Zone entries in the `shipping` option gain a `shipping_carriers` array. Orders keep their existing three tracking columns.
- **Docs and tests**: `docs/shipping-carriers.md`; Vitest for the carrier form schema and URL resolver; PHPUnit for validation, resolution, seeding, and zone matching.
- **Distribution**: logos ship inside the plugin; no remote assets (wordpress.org rule).
