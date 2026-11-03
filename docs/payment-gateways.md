# Payment Gateway Catalog

Online payment gateways (Stripe, Mollie, and so on) are separate WordPress
plugins. They are not bundled with the store. **Settings → Payments → Payment
Gateways** lists the gateways a remote server offers, and **Add** downloads,
installs and activates one.

The "server" is a public S3 bucket. It holds the plugin zips, the logos and one
catalog file. No server code runs.

This page explains how the plugins are built and published, what the catalog
file must contain, and what the store checks before it installs anything.

- [1. Quick start](#1-quick-start)
- [2. Building the zips](#2-building-the-zips)
- [3. The catalog contract](#3-the-catalog-contract)
- [4. Publishing to S3](#4-publishing-to-s3)
- [5. Changing the bucket](#5-changing-the-bucket)
- [6. How an install works](#6-how-an-install-works)
- [7. Adding a new gateway](#7-adding-a-new-gateway)
- [8. Where this differs from the WordPress.org plugin installer](#8-where-this-differs-from-the-wordpressorg-plugin-installer)

---

## 1. Quick start

You need Docker and the [AWS CLI](https://aws.amazon.com/cli/) on your path.

```bash
npm run s3:up            # starts a local S3 (RustFS) with the public bucket "kirki-payments"
npm run publish:payments # builds every gateway and uploads it
```

The store reads the real bucket by default. To read the local S3, define
`KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL` in `wp-config.php` as
`http://host.docker.internal:9000/kirki-payments` (the dev WordPress runs in
Docker, where `localhost` is the container itself). Open
**Settings → Payments → Payment Gateways** and press **Add**.

`npm run s3:down` stops the local S3. Its console is at `http://localhost:9001`
(user and password: `minioadmin`). Set `S3_PORT` and `S3_CONSOLE_PORT` to change
the host ports.

---

## 2. Building the zips

`npm run build:payments` takes each `payments/kirki-*` folder and writes:

```
gateways/
  payments                 the catalog file (section 3)
  kirki-stripe/
    kirki-stripe.zip       installable plugin, one top-level kirki-stripe/ folder
    logo.svg               copied from assets/logo.svg
    meta.json              id, slug, name, description, version, order, sha256
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

The command needs `composer` and `zip` on your path. `gateways/` is git-ignored.

Two environment values set the URLs written into the catalog:

| Value | Used by | Default (local S3) |
|-------|---------|--------------------|
| `BASE_URL` | The store (PHP). Catalog and zip downloads. | `http://host.docker.internal:9000/kirki-payments` |
| `ICON_BASE_URL` | The browser. Logos. | `http://localhost:9000/kirki-payments` |

On a real bucket both values are the public bucket URL.

The scripts read these values from the `.env` file in the repo root. Copy the
payment block from `.env.example` (`S3_*`, `AWS_*`, `BASE_URL`, `ICON_BASE_URL`).
A value that you set in the shell wins over the file. Without any value, the
scripts use the local S3 defaults.

---

## 3. The catalog contract

The store sends `GET {base}/payments` and expects a JSON list. On S3 this is an
object with the key `payments` (no file extension) and `Content-Type: application/json`.

```json
[
  {
    "id": "stripe",
    "name": "Stripe",
    "description": "Stripe payment gateway for Kirki ecommerce.",
    "version": "1.0.0",
    "icon_url": "https://example.com/bucket/kirki-stripe/logo.svg",
    "download_url": "https://example.com/bucket/kirki-stripe/kirki-stripe.zip",
    "sha256": "<64 hex characters>"
  }
]
```

The build writes this file. The list is sorted by `order`, lowest first.
Gateways with the same `order` sort by name A to Z. Gateways without `order`
come last, also A to Z. A new gateway needs no list edit.

The store drops any entry whose `id` is not `[a-z0-9_-]`, whose `sha256` is not
64 hex characters, or whose `download_url` is not under the base URL. An
`icon_url` that is not `http(s)` is ignored. The browser loads icons, so they may
use a different host than the base URL.

---

## 4. Publishing to S3

`npm run publish:payments` builds the gateways, then uploads with the AWS CLI:

1. All zips and logos. (`meta.json` files stay local.)
2. The `payments` catalog, last, with `Content-Type: application/json` and
   `Cache-Control: max-age=60`.

The order matters. If the catalog went first, it would list a hash for a zip
that is not uploaded yet, and installs would fail the integrity check.

The command uploads every gateway on each run, because a rebuild can change a
zip hash.

| Value | Meaning | Default |
|-------|---------|---------|
| `S3_ENDPOINT` | S3 endpoint URL. Set it to an empty string for AWS S3. | `http://localhost:9000` (local S3) |
| `S3_BUCKET` | Bucket name. | `kirki-payments` |
| `S3_PREFIX` | Folder inside the bucket, for example `gateways`. `BASE_URL` and `ICON_BASE_URL` must end with the same folder. | empty (bucket root) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Credentials. | `minioadmin` for the local S3 only |

For a real bucket, also set `BASE_URL` and `ICON_BASE_URL`. The command stops if
you point it at another endpoint without them, so it cannot publish a catalog
with local URLs. Put the values in `.env`, or set them for one run:

```bash
S3_ENDPOINT= S3_BUCKET=my-bucket \
BASE_URL=https://my-bucket.s3.amazonaws.com ICON_BASE_URL=https://my-bucket.s3.amazonaws.com \
npm run publish:payments
```

An empty `S3_ENDPOINT` means AWS S3. Do not remove the line from `.env` to get
this: with no value at all, the script uses the local S3.

The bucket must allow public reads (`s3:GetObject` for everyone) and must not
allow public writes. Do not turn on compression that changes zip bytes (some
CDNs do this), because the hash would not match.

---

## 5. Changing the bucket

The base URL comes from the constant `KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL`. The
plugin file `kirki-ecommerce.php` defines it as the real bucket
(`https://kirki-ecommerce.s3.us-east-1.amazonaws.com/gateways`). Change it there and the
list, the logos and the downloads all come from the new bucket. A definition in
`wp-config.php` wins, because the plugin file defines the constant only when it is
not set yet. The store has no other default.

The list is cached with the framework `Cache` for 15 minutes. After that, the
old list (kept up to 7 days) is shown at once and refreshed after the response.
With no copy and a bucket that is down, the dialog shows an error with a retry
button. The cache key does not include the base URL, so after you change the
base URL, wait for the cache to expire or install a gateway (an install clears it).

---

## 6. How an install works

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

The hash comes from the same bucket as the zip. It catches a damaged or
swapped file. It does not protect against someone who can write to the bucket.

### Removing a gateway

`DELETE /online-payments/{id}` deactivates the gateway plugin and deletes its
files. The settings dialog asks for confirmation first. The plugin is found from
the file of the provider class, so only a gateway that lives in its own plugin
folder can be removed. Built-in gateways (PayPal) return 400, and unknown ids
return 404. The saved gateway settings stay in the database, so adding the
gateway again restores them.

---

## 7. Adding a new gateway

1. Create `payments/kirki-<name>/` with `kirki-<name>.php` (plugin header) and
   `assets/logo.svg`.
2. Run `npm run publish:payments` with the values for your bucket (section 4).

That one command builds all gateways, uploads the zips and logos, and uploads
the new catalog last. The gateway appears in the dialog when the store cache
refreshes (up to 15 minutes, plus the `max-age=60` of the catalog object).

---

## 8. Where this differs from the WordPress.org plugin installer

- **Own bucket.** Gateways are not on WordPress.org. The catalog is a plain
  JSON object that you host.
- **No server code.** Nothing filters or builds the list at request time. A
  publish run writes it. A gateway that you do not publish is not listed.
- **No signatures.** Integrity is a SHA-256 hash from the catalog, not a
  signed package.
- **No update check.** The store does not look for newer versions of an
  installed gateway, and it cannot pin a version. Reinstalling an installed
  gateway is refused. You can remove a gateway (section 6).
- **No admin-supplied URLs.** Only catalog entries can be installed.
- **No "Coming Soon".** A gateway that is not built and uploaded is not
  listed. PayPal is built into the store, so it is not in the catalog.
- **Base URL is code.** There is no settings screen for the bucket address.
