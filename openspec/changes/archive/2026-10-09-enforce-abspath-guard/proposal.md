## Why

583 in-scope PHP files under `app/`, `database/`, `config/`, `resources/views/`, and the plugin entry file have no `ABSPATH` guard. WordPress.org requires this guard to block direct file access. Nothing in CI checks for it, so the gap can return after each fix.

## What Changes

- Add `defined('ABSPATH') || exit;` to every in-scope PHP file that lacks an `ABSPATH` guard. Files in `database/migrations/` and `database/seeders/` are included.
- Add a custom PHPCS sniff, `KirkiEcommerce.Security.AbspathGuard`, under `phpcs/KirkiEcommerce/Sniffs/`. It reports any in-scope PHP file that does not contain the guard before any executable code.
- Register the sniff in `phpcs-wporg.xml.dist`, so `composer phpcs:wporg` fails in CI when a guard is missing.
- Exclude `build/`, `vendor/`, `vendor_prefixed/`, `node_modules/`, `payments/`, and generated `config/*.cache.php` files, as the existing ruleset does. Also exclude `bootstrap/abspath.php`, which defines `ABSPATH` itself.

## Capabilities

### New Capabilities
- `php-abspath-guard`: Every in-scope PHP file in the plugin carries a direct-access guard, and CI fails when one is missing.

### Modified Capabilities

## Impact

- PHP files: about 583 files in `app/`, `database/`, `config/`, `resources/views/`, and `kirki-ecommerce.php`. Each change adds one line.
- `phpcs/KirkiEcommerce/Sniffs/`: new sniff.
- `phpcs-wporg.xml.dist`: new rule reference.
- CI (`.github/workflows/tests.yml`): no change. The existing `composer phpcs:wporg` step enforces the new sniff.
- No runtime behavior changes. The guard exits only on direct file access.
