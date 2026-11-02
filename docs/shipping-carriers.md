# Shipping Carriers

The carriers a store ships with, set up once per shipping zone, so that adding a
tracking number to an order is "pick a carrier, type the number" and the
customer receives a working tracking link.

A carrier is a name, a **tracking-URL template** and an optional logo. The
template is the carrier's tracking page address with the placeholder
`{tracking_number}` where the number goes. When a merchant adds tracking to an
order, the store fills the placeholder in and emails the resulting link to the
customer.

- [1. Quick start](#1-quick-start)
- [2. Carriers live inside a zone](#2-carriers-live-inside-a-zone)
- [3. Preset carriers](#3-preset-carriers)
- [4. Tracking URL templates](#4-tracking-url-templates)
- [5. Adding tracking to an order](#5-adding-tracking-to-an-order)
- [6. The Tracking added email](#6-the-tracking-added-email)
- [7. API reference](#7-api-reference)
- [8. Where this differs from WooCommerce Shipment Tracking](#8-where-this-differs-from-woocommerce-shipment-tracking)

---

## 1. Quick start

1. Go to **Settings → Shipping** and open a zone. Below **Shipping Methods**
   there is a **Shipping Carriers** card.
2. A new zone has no carriers. Choose **Add**. The menu lists the preset carriers
   (UPS, FedEx, DHL, …) that the zone does not have yet. Choose one to add it;
   it is added **active**. To make your own carrier, choose **Add new** at the
   bottom of the menu and fill in the form that opens in a popover. Use **Edit**
   on a row to change a carrier's name, link or logo.
3. Open a shipped order and choose **Add tracking**. The **Carrier** list holds
   the enabled carriers of the zone that covers the order's shipping address.
   Pick one, type the tracking number, and save.
4. The customer gets the **Tracking added** email with the link (section 6).

Each row has **Edit**, **Delete** and an on/off switch. They appear when you
hover or focus the row. A row shows an **Inactive** badge when the carrier is
off, and no badge when it is on. An inactive carrier stays in the zone
but is not offered when adding tracking. A carrier has no price: carriers do not affect shipping
costs, which belong to the zone's shipping methods.

---

## 2. Carriers live inside a zone

Carriers are stored with the zone, in the `shipping` settings, under
`shipping_zones[].shipping_carriers[]`. Zones do not share carriers: adding UPS to
one zone does not add it to the others, and each zone can use different links.

| Field | Meaning |
|---|---|
| `id` | Unique inside the zone. A preset carrier uses its preset key (`ups`); a carrier you add gets a UUID. |
| `preset` | The preset key, or `null` for a carrier you added. |
| `name` | Shown to the merchant and stored on the order. Required. |
| `tracking_url` | The URL template (section 4). Required. |
| `logo` | A media-library attachment id, or `null`. Optional. |
| `logo_url` | Read-only. The logo's URL: your upload, else the preset's bundled logo, else `null`. |
| `is_enabled` | Whether the carrier is offered when adding tracking. |

Saving, editing, switching and deleting a carrier save the zone straight away,
as for shipping methods. There is no separate Save button on the card.

---

## 3. Preset carriers

The store ships a catalog of widely used carriers, each with a name, a tracking
URL template and a logo bundled in the plugin (no images are loaded from other
sites):

UPS · FedEx · DHL · USPS · Royal Mail · Canada Post · Australia Post · DPD · Aramex

How presets reach a zone:

- **A zone starts with no carriers**, whether you create it in the zone dialog,
  the store setup creates it, or it existed before this feature.
- **You add a preset from the Add menu.** The menu lists the presets that the
  zone does not have yet. A click copies the preset into the zone, **active**.
- **Presets are copies.** Edit, switch off, or delete them like any carrier.
  Editing changes only that zone's copy.
- **A deleted preset comes back to the menu.** You can add it again at any time.
- Updates to a preset's link in a later release do **not** reach zones that
  already have the preset.
- The settings response carries the catalog as `shipping_carrier_presets`
  (`key`, `name`, `tracking_url`, `logo_url`). It is read-only and is not saved.

The preset logos are simple initials marks in each carrier's colour, drawn for
this plugin. They are not the carriers' official logos. Upload a logo of your own
for any carrier to replace its mark.

The preset links are a starting point. Carriers change their tracking pages, so
check a link with a real tracking number before you rely on it.

---

## 4. Tracking URL templates

A template must:

- start with `http://` or `https://`, and
- contain `{tracking_number}` at least once.

```
https://www.ups.com/track?loc=en_US&tracknum={tracking_number}
```

The dialog and the server both enforce this. A bad template is rejected with a
message on the URL field, including when it arrives through the settings API.

When the link is built, **every** `{tracking_number}` is replaced with the
tracking number, URL-encoded. A number such as `1Z 999&A` becomes
`1Z%20999%26A`, so a number can never break out of the link.

The store keeps the braces in a saved template. WordPress's own URL cleaning
strips `{` and `}`, so templates are cleaned with the placeholder protected.

---

## 5. Adding tracking to an order

**Add tracking** is available on orders that are already **shipped**. In the
dialog:

- **Carrier** lists the enabled carriers of the first enabled zone whose regions
  hold the order's shipping country and state (a zone with no regions covers
  everywhere), followed by **Other**.
- **Tracking number** is required.
- There is **no URL field** for a listed carrier. Once a number is typed, the
  dialog shows the link it will send, with the placeholder replaced. Before that
  it shows the template.
- **Other** shows a required **Carrier name** and a required **Tracking URL**
  template, following the same rules as section 4. Use it for a carrier that is
  not set up in the zone. It is the only choice when no zone covers the address
  or the zone has no enabled carrier.
- Opening the dialog on an order that already has tracking pre-selects the
  listed carrier with the same name. If none matches, it selects **Other** with
  the stored name, and turns the stored link back into a template.

The server builds the link, not the browser. The order keeps the carrier name,
the tracking number and the resolved link as a **snapshot**: editing, disabling
or deleting a carrier later does not change tracking already saved on an order.

---

## 6. The Tracking added email

Adding tracking queues the **Tracking added** email to the order's customer. It
shows the carrier, the tracking number and the clickable link. The template is
under **Settings → Email** like the other customer order emails, with the
shortcodes `{shipping_carrier}`, `{shipping_tracking_number}` and
`{shipping_tracking_url}`.

- It is sent **each time** tracking is added, so correcting a number emails the
  customer the corrected details.
- Tracking can only be added after the order is shipped, so the **Order shipped**
  email, sent when the order is marked shipped, never contains tracking. Tracking
  has its own email for that reason.
- Turn the template off to add tracking without emailing the customer.

See [Transactional Emails](emails.md) for how emails are queued and retried.

---

## 7. API reference

All routes are under `/wp-json/kirki/ecommerce/v1`.

**Carriers of a zone** are part of the shipping settings:
`GET /settings/shipping` and `PUT /settings` with `"key": "shipping"`. The
response adds `logo_url` to every carrier; do not send it back (the server
ignores it). Example: `docs/ecommerce/settings/shipping.yml`.

**Carriers for an order**: `GET /orders/{id}/shipping-carriers` returns the
enabled carriers of the zone that covers the order's shipping address, each with
`id`, `name`, `tracking_url` (the template) and `logo_url`. The list is empty
when no enabled zone covers the address. Example:
`docs/ecommerce/orders/get-shipping-carriers.yml`.

**Add tracking**: `PATCH /orders/{id}/action` with `"action": "add-tracking"`.
Example: `docs/ecommerce/orders/add-tracking.yml`.

| Send | Result |
|---|---|
| `carrier_id` + `tracking_number` | The server finds the enabled carrier in the order's zone and stores its name and the resolved link. A `tracking_url` sent alongside is ignored. An unknown, disabled or other-zone `carrier_id` returns `422` and changes nothing. |
| `carrier` + `tracking_number` + `tracking_url` holding `{tracking_number}` | Ad-hoc template (**Other**). The server resolves it and stores the carrier name and link. |
| `carrier` + `tracking_number` + a plain http(s) `tracking_url` | Stored as sent. This is the earlier behaviour, kept for existing clients. |

A `tracking_url` that is not http(s) returns `422`. `carrier` is required unless
`carrier_id` is sent.

---

## 8. Where this differs from WooCommerce Shipment Tracking

- **Carriers belong to a zone.** WooCommerce's Shipment Tracking keeps one global
  provider list. Here each zone has its own list, and the order dialog offers the
  carriers of the zone that covers the order's address. An address that no zone
  covers can only use **Other**.
- **Presets are copied into a zone when you add them, not shared.** A zone starts
  empty. Editing a preset affects one zone, and later changes to the built-in
  links do not reach zones that already have the preset.
- **Preset logos are not the official logos.** They are generated initials marks.
- **Tracking only after shipping.** The order must already be shipped. There is no
  way to enter tracking while an order is still being processed.
- **The link is stored on the order.** Changing a carrier's template later does
  not rewrite the links on existing orders.
- **Presets cover a short list.** There is no import of a large provider list, and
  no tracking status is fetched from carriers. The store only builds the link the
  customer clicks.
- **One tracking number per order.** Adding tracking again replaces the earlier
  carrier, number and link rather than adding a second shipment.
- **The tracking link reaches the customer by email.** The storefront order page
  does not display the carrier, number or link. The customer order API does
  return them, so a theme can show them.
