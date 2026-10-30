# Proposal

## Why

The WordPress.org review team returned `kirki-ecommerce-1.0.0.zip` with required changes. Checking the code and a fresh `npm run make:org-package` build confirmed most of the findings. The `phpcs:ignore` comments we added on the flagged output lines did not satisfy the reviewers, so the same lines were reported again. We must fix these before resubmission to avoid another revision round.

## What Changes

- Replace the `phpcs:ignore` comments on dynamic output with real escaping calls: `Template.php` (block header and footer), `WebhookController.php` (acknowledgement body), `Icon.php` (SVG icons).
- Update `brick/money` from 0.7.0 to 0.7.1. The current `"0.7"` constraint is an exact pin to 0.7.0, so `composer.json` needs a range such as `^0.7.1`.
- Document where the readable JavaScript source is (the public GitHub repository, with the source folders and build steps) in `readme.txt`. The source is not added to the zip.
- Document the release package steps and known gaps in `docs/release-package.md`.

No change to storefront or admin behavior is intended.

## Capabilities

### New Capabilities

None. This change fixes how existing behavior meets WordPress.org rules; no spec-level behavior changes, so the change sets `skip_specs: true`.

### Modified Capabilities

None.

## Impact

- PHP: `app/Supports/Template.php`, `app/Payment/WebhookController.php`, `app/Supports/Icon.php`.
- Build and docs: `composer.json`, `composer.lock`, `readme.txt`, `docs/release-package.md`.
- Dependencies: `brick/money` 0.7.0 to 0.7.1 (also allows `brick/math` 0.11).
- Tests: money and tax regression tests; new tests for the escaped output paths.
- Risk: block-theme template markup and the payment webhook body can break if escaped too strictly (see design).
