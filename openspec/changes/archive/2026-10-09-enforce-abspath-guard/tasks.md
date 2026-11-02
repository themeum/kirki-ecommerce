## 1. Enforcement sniff

- [x] 1.1 Add `phpcs/KirkiEcommerce/Sniffs/Security/AbspathGuardSniff.php` that reports in-scope PHP files with no `defined('ABSPATH') || exit;` guard, or with the guard after executable code. Verify: a fixture file without the guard produces one error.
- [x] 1.2 Add a fixture where the guard follows a `class` declaration. Verify: the sniff reports an error.
- [x] 1.3 Add a fixture with `declare(strict_types=1)`, `namespace`, then the guard. Verify: no error.
- [x] 1.4 Register the sniff in `phpcs-wporg.xml.dist`, with the excluded paths from the spec. Verify: `composer phpcs:wporg` runs and reports the unguarded in-scope files.

## 2. Add the guard to in-scope files

- [x] 2.1 Write a one-time script that inserts `defined('ABSPATH') || exit;` after the `<?php` line, any `declare`, and any `namespace` line. Verify: the script output on one file in `app/` matches the expected position.
- [x] 2.2 Run the script on the in-scope files without the guard (583 files). Verify: `composer phpcs:wporg` reports zero guard errors.
- [x] 2.3 Change the form in `kirki-ecommerce.php` from the `if (!defined(...))` block to the one-line form. Verify: the file still passes `composer phpcs:wporg`.
- [x] 2.4 Review the diff by directory. Verify: each changed file gains one guard line and no other line changes.

## 3. Verification

- [x] 3.1 Run `composer phpcs:wporg` and `composer phpcs:docblocks`. Verify: both pass.
- [x] 3.2 Run `vendor/bin/phpunit --testsuite Unit`. Verify: all tests pass.
- [x] 3.3 Run `npm run typecheck`. Verify: no errors.
- [x] 3.4 Confirm the CI workflow (`.github/workflows/tests.yml`) needs no change. The existing `composer phpcs:wporg` step enforces the new sniff.
