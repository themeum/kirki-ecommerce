# Payment Gateway Catalog

Online payment gateways (Stripe, Mollie, and so on) are separate WordPress
plugins. They are not bundled with the store. **Settings → Payments → Payment
Gateways** lists the gateways a remote server offers, and **Add** downloads,
installs and activates one. When the server has a newer version of an
installed gateway, the store shows it on the WordPress Plugins page and in the
Payments settings, and it can update the gateway.

The "server" is a public S3 bucket. It holds the plugin zips, the logos, one
details file for each gateway and one catalog file. No server code runs.

This page explains how the plugins are built and published, what the catalog
file must contain, and what the store checks before it installs or updates
anything.

- [1. Quick start](#1-quick-start)
- [2. Building the zips](#2-building-the-zips)
- [3. The catalog contract](#3-the-catalog-contract)
- [4. Publishing to S3](#4-publishing-to-s3)
- [5. Releasing a gateway update](#5-releasing-a-gateway-update)
- [6. Changing the bucket](#6-changing-the-bucket)
- [7. How an install works](#7-how-an-install-works)
- [8. How an update works](#8-how-an-update-works)
- [9. Adding a new gateway](#9-adding-a-new-gateway)
- [10. Where this differs from WordPress.org plugins](#10-where-this-differs-from-wordpressorg-plugins)

---

## 1. Quick start

You need Docker and the [AWS CLI](https://aws.amazon.com/cli/) on your path.

```bash
npm run s3:up                     # starts a local S3 (RustFS) with the public bucket "kirki-payments"
npm run publish:payments -- --full # builds every gateway and uploads it
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

`npm run build:payments` reads each `payments/kirki-*` folder and writes the
gateways that it builds:

```
gateways/
  payments                   the catalog file (section 3), always written
  kirki-stripe/
    kirki-stripe-1.0.0.zip   installable plugin, one top-level kirki-stripe/ folder
    logo.svg                 copied from assets/logo.svg
    meta.json                catalog values, changelog, sha256, source_sha256
```

### Which gateways are built

Without a flag, the build is **incremental**. It downloads the live catalog
from `{ICON_BASE_URL}/payments` and builds a gateway only when:

- the live catalog has no entry for its slug (a new gateway), or
- its `Version` header is different from the live `version`.

For each other gateway, it keeps the live zip and writes no folder. The kept
entry also keeps the live `id`, `name`, `description` and `requires_*` values,
because they describe the live zip. A header change, such as a new `Requires
Kirki eCommerce` value, ships only with a new `Version`. Only `Order` comes from
the source. The new catalog lists all gateways. At the end, the build prints the folders that
it wrote, the gateways that it kept, the gateways that it removed (a live entry
with no folder in `payments/`), and "upload it last" for the catalog.

The build stops, writes nothing, and tells you to use `--full` when:

- it cannot load the live catalog,
- a live entry has no `slug` or no `source_sha256` (a catalog from before
  incremental builds), or
- a kept `download_url` does not match the current `BASE_URL`.

`npm run build:payments:full` builds every gateway and ignores the live
catalog. Use it for the first release after this feature, after you change
`BASE_URL`, or for a new bucket.

**A change needs a version bump.** The build hashes the source of each gateway
(`source_sha256`, without `vendor/`, `node_modules/`, `.git` and `.DS_Store`).
When a kept gateway has a different source hash from the live one, the build
prints a warning: the code changed but the version did not, so the change is
not shipped. Change its `Version` header and build again.

### Plugin headers

| Header | Catalog field | Notes |
|--------|---------------|-------|
| `Plugin Name` | `name` | Required. A leading "Kirki " is removed, so `Kirki Stripe` shows as `Stripe`. |
| `Version` | `version` | Required. Also part of the zip name, so only letters, digits, `.`, `+` and `-`. |
| `Description` | `description` | |
| `Order` | sort order | Optional whole number. WordPress ignores this line. |
| `Requires Kirki eCommerce` | `requires_kirki` | Optional. Lowest Kirki eCommerce version the gateway needs. |
| `Requires at least` | `requires_wp` | Optional. Lowest WordPress version. |
| `Requires PHP` | `requires_php` | Optional. Lowest PHP version. |

- `id` is the provider id the plugin registers (`$this->id = '...'`).
- `sha256` is the hash of the zip.
- `changelog` in `meta.json` is the text of `CHANGELOG.md` in the gateway
  folder, or empty. The store shows it in the "View details" popup (section 8).
  Use `## <version>` headings and `-` list items.
- When a gateway has a `composer.json`, the script copies the gateway to a
  temporary folder and runs `composer install --no-dev` there (`composer update`
  with a warning when there is no `composer.lock`). Your source folder is not
  changed.
- A folder without `<slug>.php` is skipped with a warning. A gateway without
  `assets/logo.svg` stops the build.

The command needs `composer` and `zip` on your path. `gateways/` is git-ignored.

### URLs

Two environment values set the URLs written into the catalog:

| Value | Used by | Default (local S3) |
|-------|---------|--------------------|
| `BASE_URL` | The store (PHP). Catalog, details and zip downloads. | `http://host.docker.internal:9000/kirki-payments` |
| `ICON_BASE_URL` | The browser (logos), and the build (live catalog). | `http://localhost:9000/kirki-payments` |

On a real bucket both values are the public bucket URL. The build reads the
live catalog from `ICON_BASE_URL`, because `BASE_URL` can be a Docker-only host
that your machine cannot reach.

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
    "slug": "kirki-stripe",
    "name": "Stripe",
    "description": "Stripe payment gateway for Kirki ecommerce.",
    "version": "1.0.0",
    "requires_kirki": "",
    "requires_wp": "",
    "requires_php": "",
    "icon_url": "https://example.com/bucket/kirki-stripe/logo.svg",
    "download_url": "https://example.com/bucket/kirki-stripe/kirki-stripe-1.0.0.zip",
    "sha256": "<64 hex characters>",
    "source_sha256": "<64 hex characters>"
  }
]
```

The build writes this file. The list is sorted by `order`, lowest first.
Gateways with the same `order` sort by name A to Z. Gateways without `order`
come last, also A to Z. A new gateway needs no list edit.

The store drops any entry whose `id` is not `[a-z0-9_-]`, whose `slug` is
missing or not `[a-z0-9-]`, whose `sha256` is not 64 hex characters, or whose
`download_url` is not under the base URL. A `requires_*` value that is not a
version string (such as `1.1` or `7.4.0`) is read as "no requirement". An
`icon_url` that is not `http(s)` is ignored. The browser loads icons, so they
may use a different host than the base URL. `source_sha256` is for the build
only. The store ignores it.

The installed plugin of a gateway must be at `<slug>/<slug>.php`. The store
uses this path to find the installed version.

---

## 4. Publishing to S3

### Manual upload

After `npm run build:payments`, upload what the build printed:

1. Each written `gateways/<slug>/` folder (the zip, `logo.svg` and `meta.json`).
2. `gateways/payments`, **last**, as the object `payments` with
   `Content-Type: application/json`.

Do not delete the older zips in the bucket. Each version has its own zip name,
so a store with an older cached catalog still downloads the zip that matches
its hash, and a rollback is only a catalog upload (section 5).

### With the script

`npm run publish:payments` runs the same build (pass `-- --full` for a full
build), then uploads with the AWS CLI. It does not use the output of an earlier
`npm run build:payments:full`: its own build deletes `gateways/` first. To
publish a full build, run `npm run publish:payments -- --full`.

The script uploads:

1. The folders that the build wrote: zips, logos and `meta.json` files.
2. The `payments` catalog, last, with `Content-Type: application/json` and
   `Cache-Control: max-age=60`.

It never deletes objects.

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

## 5. Releasing a gateway update

1. Change the code in `payments/kirki-<name>/`.
2. Increase its `Version` header, for example `1.0.0` to `1.0.1`.
3. Add a `## 1.0.1` section to its `CHANGELOG.md`.
4. If the new code needs a newer core, set `Requires Kirki eCommerce:` to that version.
5. Run `npm run build:payments` with the production `BASE_URL` and
   `ICON_BASE_URL`. Check that it lists only the gateways you changed and
   prints no "source changed" warning.
6. Upload the printed folders, then `gateways/payments` last (section 4).

**First release with incremental builds:** the live catalog has no `slug` and
no `source_sha256` yet, so the build asks for `--full`. Run
`npm run build:payments:full` once and upload every folder, then the
catalog.

**Rollback:** upload an earlier `payments` file. Its zips are still in the
bucket. Stores that already updated keep the newer version. A store does not
downgrade.

---

## 6. Changing the bucket

The base URL comes from the constant `KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL`. The
plugin file `kirki-ecommerce.php` defines it as the real bucket
(`https://kirki-ecommerce.s3.us-east-1.amazonaws.com/gateways`). Change it there and the
list, the logos, the details and the downloads all come from the new bucket. A
definition in `wp-config.php` wins, because the plugin file defines the constant
only when it is not set yet. The store has no other default.

The list is cached with the framework `Cache` for 15 minutes. After that, the
old list (kept up to 7 days) is shown at once and refreshed after the response.
With no copy and a bucket that is down, the dialog shows an error with a retry
button. The cache key does not include the base URL, so after you change the
base URL, wait for the cache to expire or install a gateway (an install clears it).

For a new bucket, build with `--full` (section 2).

---

## 7. How an install works

`POST /online-payments/install` takes only the gateway `id`. A `download_url`
sent by the browser is ignored.

1. The store refuses a gateway that is already installed or not in the catalog.
2. It checks that the catalog `download_url` is under the base URL. HTTPS is
   required. Plain HTTP works only for `localhost`, `127.0.0.1`, `host.docker.internal` and `*.test`.
3. It downloads the zip to a temporary file and compares its SHA-256 with the
   catalog value. On a mismatch it deletes the file and stops (400).
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

## 8. How an update works

A gateway has an update when its plugin `<slug>/<slug>.php` is installed and
the catalog `version` is greater than the plugin `Version` header.

### Requirements

The store compares `requires_kirki`, `requires_wp` and `requires_php` with the
running kirki-ecommerce, WordPress and PHP versions. When one is not met, the
update is **blocked**: it is not shown on the Plugins page, the endpoint
refuses it, and the dialog shows the reason (for example "This update needs Kirki eCommerce 1.1.0 or newer (you have
1.0.0). Update Kirki eCommerce first, then update this gateway.").

| Requirement | What the admin must do |
|---|---|
| `requires_kirki` | Update Kirki eCommerce, then update the gateway. |
| `requires_wp` | Update WordPress, then update the gateway. |
| `requires_php` | Ask the hosting provider to upgrade PHP, then update the gateway. |

### On the WordPress update screens

The core plugin adds the gateway updates to the WordPress plugin update data
(`pre_set_site_transient_update_plugins`). Thus they show on the Plugins page
and on Dashboard → Updates, and WordPress auto-updates work for them. An
installed gateway with no update is listed as up to date, so the auto-update
toggle shows.

For a catalog plugin, the catalog is the only update source. An update entry
from WordPress.org for the same plugin is removed.

"View version X details" opens a popup with the name, version, requirements,
description and changelog. The changelog comes from `{base}/<slug>/meta.json`
and is cached for 15 minutes. If `meta.json` cannot be loaded, the popup shows
the other values.

### Package check

The core plugin checks every download from the catalog server
(`upgrader_pre_download`). For a URL under the base URL, it downloads the file,
compares the SHA-256 with the catalog, and gives the verified file to
WordPress. A URL that is not in the catalog, a catalog that cannot be loaded,
or a hash mismatch fails the update, and the installed gateway does not
change. Downloads from other servers are not changed.

### In the Payments settings

- In the **Add a payment method** dialog, a gateway with an update shows an
  **Update Available** badge in place of "Added", and a small **Update**
  button. The button calls `POST /online-payments/update` with the gateway
  `id`. While it runs, a spinner replaces the button, and the other **Add** and
  **Update** buttons are disabled.
- When a requirement blocks the update, the row shows the **Update Available**
  badge and an info icon in place of the button. The tooltip of the icon gives
  the reason and what to do (for example "This update needs Kirki eCommerce
  1.1.0 or newer (you have 1.0.0). Update Kirki eCommerce first, then update
  this gateway.").
- Each installed gateway row in the Payments list shows an **Update
  available** badge. The badge opens the dialog.

`POST /online-payments/update` takes only the gateway `id`. A `download_url`
sent by the browser is ignored. It clears the list cache, then:

| Case | Result |
|------|--------|
| Gateway not installed (no registered provider) | 404 |
| No newer version | 409 |
| Update blocked by a requirement | 400 with the reason |
| Hash mismatch | 400 |
| Success | The catalog version is installed, the plugin stays active, the settings stay. |

---

## 9. Adding a new gateway

1. Create `payments/kirki-<name>/` with `kirki-<name>.php` (plugin header) and
   `assets/logo.svg`. Add a `CHANGELOG.md` if you want a changelog in the
   details popup.
2. Run `npm run build:payments`. The new gateway is built because the live
   catalog does not have it. The other gateways are kept.
3. Upload `gateways/kirki-<name>/`, then `gateways/payments` last (section 4).
   Or run `npm run publish:payments` with the values for your bucket.

The gateway appears in the dialog when the store cache refreshes (up to 15
minutes, plus the `max-age=60` of the catalog object).

---

## 10. Where this differs from WordPress.org plugins

- **Own bucket.** Gateways are not on WordPress.org. The catalog is a plain
  JSON object that you host.
- **No server code.** Nothing filters or builds the list at request time. A
  build writes it. A gateway that you do not publish is not listed.
- **No signatures.** Integrity is a SHA-256 hash from the catalog, not a
  signed package.
- **Update checks follow the WordPress schedule.** The Plugins page shows a
  new version only after the next WordPress update check (about every 12
  hours, or "Check again" on Dashboard → Updates). The Payments dialog uses
  the catalog cache (up to 15 minutes).
- **One version per catalog.** The store always offers the catalog version.
  It cannot pin a version, and it cannot downgrade. There is no rollback
  screen; a rollback is a catalog upload (section 5).
- **No `Update URI` header yet.** The gateways do not declare `Update URI`, so
  WordPress still sends them in its WordPress.org update request. The store
  removes any WordPress.org entry for a catalog plugin, so the result is the
  same.
- **Old zips stay.** The build and the publish script never delete objects.
  There is no cleanup of old versions.
- **Inactive gateways.** A gateway plugin that is installed but not active
  shows its update on the Plugins page, but not in the Payments dialog.
- **No admin-supplied URLs.** Only catalog entries can be installed or
  updated.
- **No "Coming Soon".** A gateway that is not built and uploaded is not
  listed. PayPal is built into the store, so it is not in the catalog.
- **Base URL is code.** There is no settings screen for the bucket address.
