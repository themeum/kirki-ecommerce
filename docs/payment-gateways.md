# Payment Gateway Catalog

Online payment gateways (Stripe, Mollie, and so on) are separate WordPress
plugins. They are not bundled with the store. **Settings → Payments → Payment
Gateways** lists the gateways a remote server offers, and **Add** downloads,
installs and activates one.

This page explains how the plugins are built and uploaded, what the server
must return, and what the store checks before it installs anything.

- [1. Quick start](#1-quick-start)
- [2. Building the zips](#2-building-the-zips)
- [3. The catalog contract](#3-the-catalog-contract)
- [4. Changing the server](#4-changing-the-server)
- [5. How an install works](#5-how-an-install-works)
- [6. Adding a new gateway](#6-adding-a-new-gateway)
- [7. Where this differs from the WordPress.org plugin installer](#7-where-this-differs-from-the-wordpressorg-plugin-installer)

---

## 1. Quick start

```bash
npm --prefix payment-server install   # first time only
npm run build:payments                # builds payment-server/gateways/<slug>/ for every gateway
npm run serve:payments                # starts the payment server on port 4800
```

The store reads `http://host.docker.internal:4800` by default (the dev
WordPress runs in Docker, where `localhost` is the container itself). With the
test server running, open **Settings → Payments → Payment Gateways** and press **Add**.

For a real server, deploy the `payment-server/` folder with its `build/` folder
(or upload `build/` to any host that serves the contract in section 3) and change
the base URL (section 4).

---

## 2. Building the zips

`npm run build:payments` takes each `payments/kirki-*` folder and writes:

```
payment-server/gateways/kirki-stripe/
  kirki-stripe.zip   installable plugin, one top-level kirki-stripe/ folder
  logo.svg           copied from assets/logo.svg
  meta.json          id, slug, name, description, version, order, sha256
```

- `name`, `description`, `version` and `order` come from the plugin header comment.
- `name` loses a leading "Kirki ", so `Kirki Stripe` shows as `Stripe`. The plugin
  header keeps the full name for the WordPress Plugins screen.
- `order` comes from an optional `Order:` header line (a whole number). WordPress
  ignores this line. A gateway without it has `order: null`.
- `id` is the provider id the plugin registers (`$this->id = '...'`).
- `sha256` is the hash of the zip.
- When a gateway has a `composer.json`, the script copies the gateway to a
  temporary folder and runs `composer install --no-dev` there (`composer update`
  with a warning when there is no `composer.lock`). Your source folder is not
  changed.
- A folder without `<slug>.php` is skipped with a warning. A gateway without
  `assets/logo.svg` stops the build.

The command needs `composer` and `zip` on your path. `payment-server/gateways/` is git-ignored.

---

## 3. The catalog contract

The store sends `GET {base}/payments` and expects a JSON list:

```json
[
  {
    "id": "stripe",
    "name": "Stripe",
    "description": "Stripe payment gateway for Kirki ecommerce.",
    "version": "1.0.0",
    "icon_url": "https://example.com/files/kirki-stripe/logo.svg",
    "download_url": "https://example.com/files/kirki-stripe/kirki-stripe.zip",
    "sha256": "<64 hex characters>"
  }
]
```

The list is sorted by `order`, lowest first. Gateways with the same `order` sort
by name A to Z. Gateways without `order` come last, also A to Z.

The server builds this list from the `meta.json` files, so a new gateway needs
no list edit. `payment-server/` is an Express server that does this on every
request and serves the files from `/files/<slug>/...`. Settings are in
`payment-server/.env.example` (`PORT`, `BASE_URL`, `ICON_BASE_URL`,
`GATEWAYS_DIR`). It also answers `GET /health`.

The store drops any entry whose `id` is not `[a-z0-9_-]`, whose `sha256` is not
64 hex characters, or whose `download_url` is not under the base URL. An
`icon_url` that is not `http(s)` is ignored. The browser loads icons, so they may
use a different host than the base URL. The payment server advertises
`http://localhost:4800` for icons by default (`ICON_BASE_URL`).

---

## 4. Changing the server

The base URL is one constant: `PaymentGatewayCatalog::DEFAULT_BASE_URL` in
`app/Payment/PaymentGatewayCatalog.php`. Change it and the list, the logos and
the downloads all come from the new server. For local work you can instead
define `KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL` in `wp-config.php`.

The list is cached with the framework `Cache` for 15 minutes. After that, the
old list (kept up to 7 days) is shown at once and refreshed after the response.
With no copy and a server that is down, the dialog shows an error with a retry
button.

---

## 5. How an install works

`POST /online-payments/install` takes only the gateway `id`. A `download_url`
sent by the browser is ignored.

1. The store refuses a gateway that is already installed or not in the catalog.
2. It checks that the catalog `download_url` is under the base URL. HTTPS is
   required. Plain HTTP works only for `localhost`, `127.0.0.1`, `host.docker.internal` and `*.test`.
3. It downloads the zip to a temporary file and compares its SHA-256 with the
   catalog value. On a mismatch it deletes the file and stops.
4. It installs and activates the plugin from that same verified file, with the
   framework `Extension::install()`.
5. It confirms the provider is registered and clears the list cache.

The hash comes from the same server as the zip. It catches a damaged or
swapped file. It does not protect against a server that an attacker controls.

### Removing a gateway

`DELETE /online-payments/{id}` deactivates the gateway plugin and deletes its
files. The settings dialog asks for confirmation first. The plugin is found from
the file of the provider class, so only a gateway that lives in its own plugin
folder can be removed. Built-in gateways (PayPal) return 400, and unknown ids
return 404. The saved gateway settings stay in the database, so adding the
gateway again restores them.

---

## 6. Adding a new gateway

1. Create `payments/kirki-<name>/` with `kirki-<name>.php` (plugin header) and
   `assets/logo.svg`.
2. Run `npm run build:payments`. Deploy `payment-server/gateways/` with the server.

The gateway appears in the dialog on the next list refresh.

---

## 7. Where this differs from the WordPress.org plugin installer

- **Own server.** Gateways are not on WordPress.org. The catalog is a plain
  JSON list that you host.
- **No signatures.** Integrity is a SHA-256 hash from the catalog, not a
  signed package.
- **Install only.** There is no update check, no uninstall and no version
  pinning. Reinstalling an installed gateway is refused.
- **No admin-supplied URLs.** Only catalog entries can be installed.
- **No "Coming Soon".** A gateway that is not built and uploaded is not
  listed. PayPal is built into the store, so it is not in the catalog.
- **Base URL is code.** There is no settings screen for the server address.
