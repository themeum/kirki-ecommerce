## Why

The "Available Payment Gateways" dialog lists only one hard-coded provider
(`PaymentProvider` for PayPal) and `install()` always throws "not found". The
earlier download-and-install code was removed for security. Fifteen gateway
plugins exist in `payments/`, but a merchant cannot install any of them.

## What Changes

- Add a root npm script that builds one installable WordPress plugin zip per
  gateway in `payments/` into `payment-server/gateways/<slug>/`, together with the
  gateway logo and a generated `meta.json` (name, version, description,
  SHA-256 of the zip). It runs `composer install --no-dev` in a staging copy
  when a gateway has a `composer.json`.
- Add a small dev-only Node server (`payment-server/`) that builds the
  gateway list on the fly from `payment-server/gateways/*/meta.json` and serves the
  zips and logos as static files.
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

- `package.json` (root), new `bin/`-style build script, `payment-server/`,
  `payments/payments.json` (removed), `.gitignore` for `build/`.
- `app/Services/OnlinePaymentService.php`, `OnlinePaymentController`,
  `InstallableOnlinePaymentListResource`, a new base-URL constant.
- `resources/app/features/settings/payment/` (dialog, schema, service).
- Runtime dependency: outbound HTTPS from the WordPress site to the catalog
  server. Uses `themeum/framework` `Extension::install()`.
- Docs: `docs/payment-gateways.md`.
