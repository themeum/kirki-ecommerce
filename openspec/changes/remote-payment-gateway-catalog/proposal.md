## Why

The "Available Payment Gateways" dialog lists only one hard-coded provider
(`PaymentProvider` for PayPal) and `install()` always throws "not found". The
earlier download-and-install code was removed for security. Fifteen gateway
plugins exist in `payments/`, but a merchant cannot install any of them.

## What Changes

- Add a root npm script that builds one installable WordPress plugin zip per
  gateway in `payments/` into `gateways/<slug>/`, together with the
  gateway logo and a generated `meta.json` (name, version, description,
  SHA-256 of the zip). It runs `composer install --no-dev` in a staging copy
  when a gateway has a `composer.json`.
- The same build writes one static catalog file, `gateways/payments`, with the
  full gateway list (sorted, with full download and icon URLs). No server code
  builds the list.
- Host the `gateways/` folder in a public S3 bucket. `npm run publish:payments`
  builds and uploads it: zips and logos first, the catalog last.
- Add a local S3 for testing: RustFS in Docker (`docker-compose.payments.yml`),
  with a public-read bucket.
- Remove the Express catalog server (`payment-server/`) and
  `npm run serve:payments`.
- Replace the stub in `OnlinePaymentService`: the WordPress backend fetches the
  catalog from one configurable base URL, caches it briefly, and merges the
  local `is_installed` flag.
- Implement install: `POST /online-payments/install` takes only a gateway id,
  resolves the `download_url` server-side, accepts only URLs under the base
  URL, verifies the SHA-256 checksum, then installs and activates the plugin
  through the framework `Extension` API.
- Update the dialog to show loading, error, and empty states, and to show the
  remote logo.
- Delete `payments/payments.json`; the catalog no longer has a hand-kept list.
- Add `docs/payment-gateways.md`.
- **BREAKING**: gateways that are not built no longer appear as "Coming Soon".
- **BREAKING**: `payment-server/` and `npm run serve:payments` are removed.
  Local testing uses a local S3 (RustFS).

## Capabilities

### New Capabilities
- `payment-gateway-packaging`: build command that turns each gateway folder
  into an installable zip plus logo and metadata.
- `payment-gateway-catalog`: remote catalog contract, backend fetch, install
  with host lock and checksum, and dialog states.

### Modified Capabilities
- `payment-providers`: the "Unavailable providers are listed as coming soon"
  requirement changes, because the list now contains only gateways the remote
  server offers.

## Impact

- `package.json` (root), the `bin/` build and publish scripts,
  `docker-compose.payments.yml`, `payment-server/` (removed),
  `payments/payments.json` (removed), `.gitignore` for `gateways/`.
- Tooling: the AWS CLI is needed to publish.
- `app/Services/OnlinePaymentService.php`, `OnlinePaymentController`,
  `InstallableOnlinePaymentListResource`, a new base-URL constant.
- `resources/app/features/settings/payment/` (dialog, schema, service).
- Runtime dependency: outbound HTTPS from the WordPress site to the catalog
  server. Uses `themeum/framework` `Extension::install()`.
- Docs: `docs/payment-gateways.md`.
