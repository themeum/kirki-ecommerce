## Why

Payment gateways are WordPress plugins that are not in the wp.org directory.
Thus, when a gateway gets a new version, WordPress does not tell the store,
and the Payments settings dialog shows only "Added". Stores keep old gateway
code. Also, `build:payments` rebuilds all gateway zips each time, and each
rebuild gives a new SHA-256. Thus, when we add one gateway, we must upload all
gateways again. With 17 gateways now and more later, this does not scale.

## What Changes

- The core plugin finds updates for installed gateway plugins. It compares the
  installed plugin version with the catalog `version`.
- The core plugin adds these updates to the WordPress `update_plugins` site
  transient. Thus, they show on the Plugins page and in Dashboard > Updates,
  and WordPress auto-updates work for them.
- The core plugin answers `plugins_api` for gateway plugins. The "View details"
  popup shows the name, version, requirements, description and changelog.
- One global `upgrader_pre_download` filter checks the SHA-256 of each catalog
  gateway package on all paths: the dialog, the Plugins page and auto-update.
  A package that fails the check is not installed.
- The catalog gets new fields: `slug`, `requires_kirki`, `requires_wp`,
  `requires_php`. When the store does not meet a requirement, the store does
  not offer the update and shows the reason.
- New endpoint `POST /online-payments/update` updates one installed gateway
  from the catalog. The installable list returns `installed_version`,
  `update_available` and `update_blocked_reason`.
- The available-gateways dialog shows a secondary "Update" button next to the
  "Added" badge. Each installed gateway row in the Payments list shows an
  "Update available" badge that opens the dialog.
- **BREAKING (maintainer workflow)**: `build:payments` becomes incremental. It
  reads the live catalog, builds only new gateways and gateways with a changed
  `Version` header, and keeps the live entries for the others. `gateways/`
  then holds only the changed folders and the merged catalog. A `--full` flag
  rebuilds all gateways. The build warns when the source of a gateway changed
  but its version did not.
- The build reads a `CHANGELOG.md` from each gateway into `meta.json`.
  `publish:payments` uploads `meta.json` too, and still uploads the catalog
  last. The maintainer can upload manually from the printed list or use
  `publish:payments`.

## Capabilities

### New Capabilities

- `payment-gateway-updates`: Finding gateway updates, the requirement gate,
  the WordPress update integration (`update_plugins`, `plugins_api`), the
  global package check, the update endpoint, and the update UI in Payments
  settings.

### Modified Capabilities

- `payment-gateway-catalog`: The catalog entry gets `slug` and `requires_*`
  fields. The installable list returns the update state of each gateway.
  "Downloads are restricted and verified" now applies to updates too.
- `payment-gateway-packaging`: The build becomes incremental and driven by the
  version, reads the new plugin headers and `CHANGELOG.md`, and prints the
  upload list. The publish command uploads `meta.json`.

Note: these two capabilities are defined in the change
`remote-payment-gateway-catalog`, which is complete but not archived. Archive
that change before you archive this one, so that the main specs exist for
these deltas.

## Impact

- Backend: `app/Payment/PaymentGatewayCatalog.php` (new fields, meta.json
  read), new `app/Payment/PaymentGatewayUpdates.php`, `OnlinePaymentService`
  (`update()`, update state in the installable list), new hooks in
  `app/Wordpress/Hooks/Filters/` registered in `config/hooks.php`,
  `OnlinePaymentController` and `routes/api.php`.
- Frontend: `features/settings/payment/schemas/catalog/payment.ts`,
  `services/payment.ts`, `components/dialogs/online-payment-dialog.tsx`,
  `components/list/payment-methods.tsx`.
- Build tools: `bin/build-payment-zips.js`, `bin/lib/payment-catalog.js`,
  `bin/publish-payment-gateways.js`, `bin/test/payment-catalog.test.js`.
- Gateway plugins: three gateways go to `1.0.1` (done before this change).
  Each gateway can get `Requires Kirki eCommerce:` and a `CHANGELOG.md`.
- Docs: `docs/payment-gateways.md`.
- Release: the first build after this change must use `--full`, because the
  live catalog has no `slug` or `requires_*` fields yet.
- No new dependencies. Requests: the catalog request that already exists, plus
  one `meta.json` request when an admin opens "View details".
