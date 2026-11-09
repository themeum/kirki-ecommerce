## Context

- `OnlinePaymentService::all_installable_providers()` returns one local
  provider; `install()` throws a not-found error (both marked `@todo`).
- Routes exist: `GET /online-payments/installable` and
  `POST /online-payments/install` (`routes/api.php`, `OnlinePaymentController`).
- Gateways are standalone plugins in `payments/kirki-*`, each with a plugin
  header and `assets/logo.svg`. Some have `composer.json`.
- `payments/gulpfile.js` is a local-dev copier and stays unchanged.
- The framework offers `Extension::install($url, $activate, $overwrite)` which
  uses `Plugin_Upgrader`.
- See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- One place to change the server (a base-URL constant).
- A new gateway needs only a build and an upload.
- Install cannot be pointed at an arbitrary URL.

**Non-Goals:**
- Zip signing (checksum only, by decision).
- A catalog server. The catalog is a static object in an S3 bucket.
- Updating or removing installed gateways.
- A settings screen for the base URL.

## Decisions

1. **Build outputs a folder per gateway** (`zip` + `logo.svg` + `meta.json`)
   in `gateways/` at the repo root (git-ignored). Nothing opens a zip. Alternatives: upload unzipped plugins
   (more files, header parsing on server); unzip on request (slow, complex).
2. **Build script at `bin/build-payment-zips.js`, run by root script
   `npm run build:payments`.** It copies each gateway to a temp staging
   folder (excluding `vendor`, `node_modules`, dotfiles, `composer.lock` is
   kept), runs `composer install --no-dev -o --no-interaction` when
   `composer.json` exists, then zips with the `archiver` dev dependency. The
   source folder stays clean. `composer install` (not `update`) is used so the
   lock file decides versions; the script fails if there is no lock file and
   runs `composer update` only then, with a warning.
3. **Gateway id** is the folder name without the `kirki-` prefix. The id
   MUST equal the id the plugin registers as its provider. Gateways where
   this differs (for example `twocheckout` vs the old `2checkout`) are
   checked during implementation and fixed in the folder name or in one
   explicit override map in the script.
4. **Backend proxy.** A new `PaymentGatewayCatalog` class (in `app/Payment/`)
   holds the base-URL constant, fetches `{base}/payments` with
   `wp_remote_get`, validates the shape, and caches it in a transient (about
   15 minutes). `OnlinePaymentService` calls it. The browser never calls the
   remote server.
5. **Install flow:** find the entry by id in the catalog, verify the host
   lock, download with `download_url()` to a temp file, compare `hash_file`
   with `sha256`, then hand the verified file to `Extension::install()` and
   clear the cache. Because `Extension::install()` takes a URL, the verified
   local file is passed through a one-time `upgrader_pre_download` filter that
   returns the temp path, so the file that was hashed is the file that is
   installed (no second download).
6. **Response shape:** `InstallableOnlinePaymentListResource` keeps `id`,
   `name`, `icon`, `is_installed`, and adds `description` and `version`.
   `is_available` is removed from the resource; the UI drops its
   "Coming Soon" branch.
7. **Static catalog on S3.** The build writes `gateways/payments` (no file
   extension) as a JSON list: sorted by `order`, then name; with full
   `download_url` and `icon_url`. The S3 object key is `payments`, so the
   store keeps requesting `{base}/payments`. The object has
   `Content-Type: application/json` and a short `Cache-Control`. The build
   reads two env values: `BASE_URL` (list and zips, used by PHP) and
   `ICON_BASE_URL` (logos, used by the browser). In production both are the
   bucket URL. The bucket is public-read. Host lock in PHP allows `http` only
   for `localhost`/`127.0.0.1`/`host.docker.internal`/`*.test`.
8. **Publish script** `bin/publish-payment-gateways.js`, run by
   `npm run publish:payments`. It builds, then uploads with the AWS CLI:
   zips and logos first, the `payments` catalog last. Env values set the
   bucket and endpoint (`S3_BUCKET`, `S3_ENDPOINT`, and the AWS credentials),
   so the same command targets the local S3 or real S3. It uploads every gateway on
   each run, because a rebuild can change a zip hash.
9. **Local S3** is RustFS in Docker (`docker-compose.payments.yml`, API on port
   9000, console on 9001) with a public-read bucket `kirki-payments`. PHP in
   Docker reaches it at `host.docker.internal:9000`; the browser at
   `localhost:9000`.
10. **Default base URL** stays `http://host.docker.internal:9000/kirki-payments`
    (local S3) until the maintainer has the real bucket URL, then one
    constant changes. The `wp-config` constant still overrides it. No settings
    UI.

## Risks / Trade-offs

- [Checksum comes from the same server] → Does not stop a hijacked server;
  signing can be added later as an extra `signature` field.
- [Catalog outage hides all gateways] → Stale transient copy is served when a
  refresh fails; the dialog shows an error with retry otherwise.
- [Wrong id mapping] → Install succeeds but the provider does not register.
  Mitigation: a build-time check that the id matches the provider id in the
  plugin source, and an install-time check that the provider exists after
  activation.
- [Large zips on shared hosts] → Download uses a temp file, not memory; the
  request may be slow, so the Add button shows a pending state.
- [Removing "Coming Soon"] → Product loses a teaser; accepted by decision.
- [Catalog uploaded before its zips] → Installs fail the hash check until the
  zips arrive. The publish script always uploads the catalog last.
- [CDN changes zip bytes] → The hash would not match. Do not enable on-the-fly
  compression for zips.

## Migration Plan

1. Run `npm run s3:up` for a local test, or set the S3 env values for the real
   bucket. Run `npm run publish:payments`.
2. Change the base URL constant when moving from the local S3 to the real bucket.
3. Rollback: revert the constant; no data migration is needed.

## Open Questions

- Final production base URL (set later by the maintainer).

## Corrections during implementation

- Most gateways have no `composer.lock` (it is git-ignored), so the build runs
  `composer update` with a warning in that case instead of failing.
- The build uses the system `zip` command, so no `archiver` dependency was added.
- The gateway `id` is read from `$this->id = '...'` in the plugin source, so no
  folder renames were needed (`twocheckout`, `paymongo` match).
- A folder with no `<slug>.php` (`kirki-paddle`) is skipped with a warning
  instead of stopping the whole build.
- The catalog is fetched with `wp_remote_get` and the zip is streamed with
  `wp_remote_get(['stream' => true])`, because `download_url()` rejects
  `localhost` hosts.
- Added `description`/`version` to the installable resource; the icon field is
  `icon` (from the catalog `icon_url`).
- (Superseded by decisions 7 to 10: the Express dev server was removed.) The
  dev server used Express on port 4800 because port 4000 was already used.
- The dev WordPress runs in Docker, where `localhost` is the container. The
  default base URL therefore uses `host.docker.internal` (port 9000 for
  the local S3), and the local-host allow list for plain HTTP includes
  `host.docker.internal`. The original `localhost:4000` default made the
  installable endpoint return 503.
- Icons are loaded by the browser, not by PHP, so `icon_url` is only required to
  be `http(s)`; it may use a different host than the base URL (the dev server
  advertises `ICON_BASE_URL`, `http://localhost:9000/kirki-payments` locally).
  Download URLs keep the host lock.
- (Superseded by decisions 7 to 10: `payment-server/` and
  `npm run serve:payments` are removed.)
- The planned MinIO image no longer pulls (Docker Hub and `quay.io` deny it), so
  the local S3 is RustFS (`rustfs/rustfs`). The bucket setup runs with the
  `amazon/aws-cli` image, so no extra tool is needed. The bucket layout is
  `{bucket}/payments` and `{bucket}/<slug>/{<slug>.zip,logo.svg}`, without a
  `/files/` segment.
- The catalog cache key does not include the base URL. After a base URL change,
  an old cached list shows until it expires or an install clears it. This is
  documented and was not changed.
