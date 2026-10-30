# Proposal

## Why

The WordPress.org review team returned `kirki-ecommerce-1.0.0.zip` with required changes. Checking the code and a fresh `npm run make:org-package` build confirmed most of the findings. The `phpcs:ignore` comments we added on the flagged output lines did not satisfy the reviewers, so the same lines were reported again. We must fix these before resubmission to avoid another revision round.

## What Changes

- Replace the `phpcs:ignore` comments on dynamic output with real escaping calls: `Template.php` (block header and footer), `WebhookController.php` (acknowledgement body), the inline CSS and config passed to `wp_add_inline_style` and `wp_add_inline_script` in `Root.php`, `EnqueueSiteScripts.php` and `EnqueueAdminScripts.php`.
- Remove developer-only files from the release zip: the 12 framework `.stub` files under `vendor/libraries/framework/src/Console/stubs/` and `vendor/brick/money/psalm.xml`. The build script gets the removal; the zip is checked for the other dev tooling the reviewer named.
- Update `brick/money` from 0.7.0 to 0.7.1. The current `"0.7"` constraint is an exact pin to 0.7.0, so `composer.json` needs a range such as `^0.7.1`.
- Make the readable JavaScript source available with the release: ship `resources/app` and `resources/site` source (without `node_modules`) in the zip, and document the source location and build steps in `readme.txt`.
- Add a post-build check that fails the package build when forbidden files are found in the zip.
- Document the build and release checks (`docs/`), including where the build differs from the reviewer's expectations.

No change to storefront or admin behavior is intended.

## Capabilities

### New Capabilities
- `plugin-distribution-package`: what the WordPress.org release zip must and must not contain (no dev or scaffolding files, current pinned dependencies, readable source and build steps documented), and the automated check that enforces it.

### Modified Capabilities
- `wp-org-required-standards`: add a requirement that dynamic output is escaped by real escaping calls in code, and that `phpcs:ignore` comments do not replace escaping for dynamic values.

## Impact

- PHP: `app/Supports/Template.php`, `app/Payment/WebhookController.php`, `app/Menu/Root.php`, `app/Hooks/Actions/EnqueueSiteScripts.php`, `app/Wordpress/Hooks/Actions/EnqueueAdminScripts.php`, `app/Supports/Assets.php`.
- Build: `bin/make-package.sh`, `composer.json`, `composer.lock`, `readme.txt`.
- Dependencies: `brick/money` 0.7.0 to 0.7.1 (also allows `brick/math` 0.11).
- Tests: money and tax regression tests; new tests for the escaped output paths; a package-content check.
- Risk: block-theme template markup and the payment webhook body can break if escaped too strictly (see design).
