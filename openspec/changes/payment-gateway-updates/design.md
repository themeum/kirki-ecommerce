## Context

See proposal.md for the reasons. The current state:

- `PaymentGatewayCatalog` reads `{base}/payments`. It caches the list with
  `Cache::flexible` (15 minutes fresh, 7 days stale) and `normalize()` keeps
  only valid entries.
- `OnlinePaymentService::install()` drops the cache, finds the entry,
  downloads the zip, checks the sha256, and installs it with
  `Extension::install($url, activate: true, overwrite: true)`. It uses a local
  `upgrader_pre_download` filter that is added and removed around that one
  call. `install()` stops when the provider is already registered.
- Hooks are `BaseHook` classes in `app/Wordpress/Hooks/{Actions,Filters}/`,
  registered in `config/hooks.php`. Hook name constants for WordPress are in
  `app/Constants/Hooks/WPHookNames.php`.
- `bin/build-payment-zips.js` deletes `gateways/` and builds all gateways.
  `bin/publish-payment-gateways.js` runs the build, uploads the gateway
  folders without `meta.json`, then uploads the catalog last.
- The zip URL is fixed (`<slug>/<slug>.zip`). A new upload overwrites it.

## Goals / Non-Goals

**Goals:**

- One update path that all entry points use (the dialog, the Plugins page,
  Dashboard > Updates, auto-update), with one integrity check.
- No update code in the gateway plugins.
- Gateway zips on S3 that never change, so that a cached catalog never points
  to a zip with a different hash.

**Non-Goals:**

- A server-side update API. The catalog stays a static file on S3.
- Licence keys or paid gateways.
- Updates for gateways that are installed but not active. They show on the
  Plugins page (WordPress lists them), but the dialog update button needs an
  active provider.
- Deletion of old zips from S3. A cleanup can come later.
- Automatic upload. `publish:payments` stays available, but the maintainer
  uploads manually for now.

## Decisions

### 1. The core plugin injects updates into `update_plugins`

A new `PaymentGatewayUpdates` class (in `app/Payment/`) holds all the update
logic: read the catalog, match each entry to `<slug>/<slug>.php` from
`get_plugins()`, compare versions with `version_compare`, and apply the
requirement gate. The hook classes call it and contain no logic.

The `pre_set_site_transient_update_plugins` filter adds each offered update to
`$transient->response[$basename]`, and adds each matched gateway with no update
to `$transient->no_update[$basename]`. The `no_update` entry makes WordPress
show the auto-update toggle for the gateway.

The filter is authoritative for catalog slugs. It removes any entry for that
basename that came from wp.org. Thus, if someone publishes a plugin with the
same slug on wp.org, stores do not get it.

- Alternative: the `update_plugins_{hostname}` filter with an `Update URI`
  header in each gateway. This is cleaner, but the gateways already in stores
  do not have the header, so we would still need the transient filter for
  them. We can add the header later as extra protection.
- Alternative: an updater library in each gateway. Rejected in exploration:
  50 copies and 50 HTTP requests.

The filter runs only when WordPress saves a new update check (about every 12
hours, or "Check again"). A failure to load the catalog is caught, and the
transient is returned without a change.

### 2. One global pre-download filter does the integrity check

A `VerifyPaymentGatewayPackage` filter on `upgrader_pre_download` is always
registered. When the package URL equals a catalog `download_url`, it uses the
download and hash code that `OnlinePaymentService::download_package()` has now
(moved to `PaymentGatewayUpdates`) and returns the verified temp file path. If
the check fails, it returns a `WP_Error`, so WordPress shows the error and
does not change the installed plugin. For other URLs it returns `$reply`
without a change.

Because of this filter, `install()` and `update()` only call
`Extension::install($download_url)`. The local filter and the explicit
download in `install_package()` are removed, so there is one download and one
check on every path.

The filter reads the cached catalog. Decision 3 makes this safe.

### 3. Zip names include the version

The build writes `<slug>/<slug>-<version>.zip`, and the catalog
`download_url` points to it. An uploaded zip never changes. Thus a store with
a cached catalog always gets the zip that matches its sha256, and the upload
order is only important for new entries. Old zips stay on S3, so a rollback is
a catalog edit. The `meta.json` and `logo.svg` names do not change.

### 4. The requirement gate

The catalog gets `requires_kirki`, `requires_wp` and `requires_php`. The build
reads them from the plugin headers `Requires Kirki eCommerce`, `Requires at least` and
`Requires PHP`. `PaymentGatewayUpdates` compares them with
`KIRKI_ECOMMERCE_VERSION`, `get_bloginfo('version')` and `PHP_VERSION`. The first requirement
that is not met becomes `update_blocked_reason`, for example "Requires Kirki eCommerce
1.1.0". A blocked update is not added to the transient and the update
endpoint refuses it. `requires_wp` and `requires_php` are also put in the
transient entry, so WordPress shows its own compatibility text.

### 5. `plugins_api` reads `meta.json` on demand

A `plugins_api` filter answers `plugin_information` requests for catalog
slugs. It returns an object with the catalog values and `sections`
(`description`, `changelog`). The changelog comes from
`{base}/<slug>/meta.json`. It is cached with `Cache` for the same time as the
catalog. The URL is checked with `RemoteUrl::is_trusted`. The changelog is
Markdown, so it is converted to simple HTML and then passed through
`wp_kses_post`.

- Alternative: put the changelog in the catalog. Rejected: the catalog grows
  with each gateway and each release, and every store downloads it every 15
  minutes.

### 6. Update state in the installable list and a new endpoint

`all_installable_providers()` adds `installed_version`, `update_available` and
`update_blocked_reason` from `PaymentGatewayUpdates`. A new
`OnlinePaymentService::update(string $id)` does these steps: it finds the
registered provider (not found means 404), drops the catalog cache, finds the
entry, checks that an update is offered (409 if not, 400 with the reason if it
is blocked), checks the trusted URL, calls `Extension::install($url, true,
true)`, then runs `Payment::init_registry()` and returns the provider. The
plugin is active before and after, and the settings are in an option, so they
stay. The upgrader clears the `update_plugins` transient, so the Plugins page
does not show an old notice.

The route is `POST /online-payments/update` with `{ id }`, next to `install`.
It is not `/{id}/update`, so that it cannot match the `{id}` routes.

### 7. Frontend

- `OnlinePaymentSchema` gets `installed_version`, `update_available` and
  `update_blocked_reason` as optional fields. The schema stays lenient.
- `services/payment.ts` gets `updateOnlinePayment` and
  `useUpdateOnlinePaymentMutation`. On success it invalidates the same keys as
  install.
- The dialog renders the "Added" badge, then either a secondary "Update"
  button (the same loading pattern as "Add": `isPending` and `variables.id`)
  or the blocked reason as muted text.
- `payment-methods.tsx` also calls `useInstallableOnlinePaymentsQuery`. It
  makes a set of ids with `update_available`, and the row shows an "Update
  available" badge that opens the existing `OnlinePaymentPopup`. A failure of
  this query shows nothing in the list, because the list must work when the
  catalog server is down.

### 8. Incremental build

`build-payment-zips.js`:

1. Read all gateway headers from `payments/` (this is fast; no zip yet).
2. Without `--full`, get `{ICON_BASE_URL}/payments` with `fetch`. The build
   runs on the host, and `BASE_URL` can be a Docker-only host
   (`host.docker.internal`). On a real bucket the two values are the same.
3. For each gateway: build it when there is no live entry for the slug, or
   when the header `Version` differs from the live one. Otherwise keep the
   live `sha256`, `source_sha256` and `download_url`, and take the other
   fields from the header.
4. `source_sha256` is a hash of the sorted relative paths and contents of the
   gateway files, without `vendor`, `node_modules`, `.git` and `.DS_Store`.
   A kept gateway with a different value gives a warning.
5. Stop with a "use --full" message when the fetch fails, or when a kept entry
   has no `slug` or `source_sha256`, or when its `download_url` does not start
   with `BASE_URL`.
6. Write the merged catalog. Print the written folders, the kept and removed
   gateways, and "upload gateways/payments last".

The pure parts (selection, merge, source hash rules, header read) go in
`bin/lib/payment-catalog.js`, so `bin/test/payment-catalog.test.js` can test
them without the network.

`publish-payment-gateways.js` passes `--full` to the build when it gets it.
It no longer excludes `*/meta.json`. It never runs `aws s3 sync --delete`.
Because `gateways/` holds only the written folders, the current recursive
copy already uploads only the changed gateways.

## Risks / Trade-offs

- [The WordPress update check runs about every 12 hours] → A store sees a new
  gateway version on the Plugins page up to 12 hours after the upload. The
  dialog uses the catalog (15 minutes). This is the normal WordPress
  behaviour.
- [A gateway changed without a version bump is not shipped] → The build warns
  with `source_sha256`. The maintainer must bump the version. This is the
  intended rule.
- [A wrong `Requires Kirki eCommerce` value blocks updates] → The value comes from the
  gateway header, and the store shows the reason, so the cause is clear.
- [The first build after this change needs `--full`] → The build stops with a
  clear message if the live entries have no `slug` or `source_sha256`. The
  docs say this.
- [The global pre-download filter runs for every plugin download] → It
  compares the URL with the cached catalog. It does no network request for
  other URLs. If the catalog cannot be loaded, it returns `$reply` without a
  change, but only for URLs that are not under the catalog base URL. For a
  URL under the base URL it returns an error, because it cannot verify it.
- [Old zips accumulate on S3] → They are small. Cleanup is a non-goal.
- [Stores on the old core read the new catalog] → The old `normalize()`
  ignores unknown fields, and the versioned `download_url` is under the same
  base URL, so old stores still install new gateways.

## Migration Plan

1. Merge this change and release the core plugin.
2. Run `npm run build:payments -- --full` with the production `BASE_URL` and
   `ICON_BASE_URL`.
3. Upload all `gateways/<slug>/` folders, then `gateways/payments` last.
4. For later releases, run `npm run build:payments` and upload only the
   printed folders, then the catalog.

Rollback: upload the earlier catalog file. The old versioned zips are still
on S3.

## Corrections during implementation

- **Decision 2 / Decision 6, install path.** The plan was that `install()` and
  `update()` only call `Extension::install($download_url)` and the global
  filter verifies the package. But `Extension::install()` turns the filter's
  `WP_Error` into a plain exception, so the HTTP code is lost (a hash mismatch
  must give 400). Now `install_package()` calls
  `PaymentGatewayUpdates::verified_package()` itself, maps the error code to
  400 (integrity) or 503 (download), and gives the verified local file to
  `Extension::install()`. WordPress uses a local package path directly, and
  the global filter ignores paths that are not under the base URL, so each
  path still downloads the zip only once. The global filter is still the
  check for the Plugins page, Dashboard > Updates and auto-update.
- **Decision 6, names.** `OnlinePaymentService::update()` and
  `OnlinePaymentController::update()` already exist for the settings
  (`PUT /online-payments/{id}`). The new methods are `update_plugin()`.
- **Decision 6, update fields.** `installed_version`, `update_available` and
  `update_blocked_reason` are set only when the provider is registered
  (`is_installed`). A plugin that is installed but not active gets null and
  false, the same as a gateway that is not installed.
- **Task 2.5, test suite.** The `PaymentGatewayUpdates` tests are in the
  integration suite, because the unit bootstrap has no `get_bloginfo()` and
  no `KIRKI_ECOMMERCE_VERSION`.
