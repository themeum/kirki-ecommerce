## Context

The plugin's PHP ruleset is `phpcs-wporg.xml.dist`. CI runs it through `composer phpcs:wporg`. The repo already has one custom sniff, `KirkiEcommerce.Commenting.RequiredDocblock`, under `phpcs/KirkiEcommerce/Sniffs/`, registered by path in `phpcs.xml.dist`. WordPress Coding Standards has no sniff that requires the `ABSPATH` guard.

See proposal.md - Why for motivation.

## Goals / Non-Goals

**Goals:**
- Every in-scope PHP file carries the guard.
- A file added later without the guard fails CI.

**Non-Goals:**
- Auto-fixing the guard with `phpcbf`. The guard is added by a one-time script, then the sniff keeps it in place.
- Checking guards in `build/`, `vendor/`, or `payments/`.
- Changing other WPCS rules.

## Decisions

**Guard form: `defined('ABSPATH') || exit;`.** 161 files already use this form. The main plugin file uses the `if (!defined(...)) { exit; }` block. Choosing one form keeps the sniff simple. The sniff accepts only the one-line form. The main plugin file is changed to match.
- Alternative: accept both forms. Rejected, because two accepted forms add sniff logic for no benefit.

**Guard position: after `namespace`, before any other statement.** PHP requires a `namespace` declaration to be the first statement in a file that uses one. So the guard cannot sit above `namespace`. The sniff checks that the guard appears after the `<?php` tag and any `namespace` line, and before the first class, function, or other executable statement.
- Alternative: place the guard above `namespace` in every file. Rejected, because PHP emits a fatal error for that layout.

**Custom sniff, not a grep script.** A sniff runs in the same `phpcs` pass as the other rules. It reports file and line numbers in the same format, and the CI step already fails on sniff errors. A grep script would need its own CI step.
- Alternative: a Composer script that runs `grep`. Rejected, because it would be a second check that CI and developers run separately.

**Severity: error.** The sniff reports at error severity, so `ignore_warnings_on_exit` does not hide it.

**Migrations and seeders are in scope.** They live under `database/`, which the ruleset already scans. A migration loaded outside WordPress would still need the guard to block direct access.

**Registration.** Add `<rule ref="phpcs/KirkiEcommerce/Sniffs/Security/AbspathGuardSniff.php"/>` to `phpcs-wporg.xml.dist`, with the same `installed_paths`-independent path style that the existing ruleset uses. Confirm the path style when implementing.

## Risks / Trade-offs

- **[Sniff misses a guard placed after code]** → The sniff checks position, not only presence. Unit-test it with a fixture file where the guard is after a `class` declaration.
- **[Large diff across 583 files]** → Each file changes by one line. The one-time script inserts the guard after the namespace line. Review the diff by directory.
- **[Script inserts the guard in the wrong place in a file with a `declare(strict_types=1)` line]** → `declare` must be first. The script skips `declare` and inserts the guard after it.
- **[Generated or cached files get the guard]** → `config/*.cache.php` stays excluded, as today.

## Migration Plan

1. Add the sniff and its ruleset entry. Run `composer phpcs:wporg` and confirm it reports the 583 files.
2. Run the one-time script to insert the guard. Run `composer phpcs:wporg` again and confirm zero guard errors.
3. Run `vendor/bin/phpunit --testsuite Unit` and `npm run typecheck`, as CI does.
4. Rollback: revert the commit. No data or runtime state changes.

## Open Questions

None.

## Implementation Notes

- `bootstrap/abspath.php` is excluded. It defines `ABSPATH` for CLI processes, so the guard would exit before the define runs. Found during implementation; not in the original design.
- Three files used non-canonical forms and were changed by hand, not by the script: `kirki-ecommerce.php` and `bootstrap/app.php` used an `if (!defined(...)) { exit; }` block, and `config/menu.php` used `or exit`.
- `database/seeders/ProductSeeder.php` had no guard and received one like the other files.
- The sniff also accepts `declare` and `use` statements before the guard, so `namespace`, `declare`, and `use` may appear in any order before it.
