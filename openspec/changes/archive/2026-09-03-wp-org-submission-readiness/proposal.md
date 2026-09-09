## Why

The plugin needs to be submitted to the WordPress.org Plugin Directory, and a Plugin Check scan of the actual production build (via `bin/make-package.sh`, with `payments/*` and `libraries/framework` excluded from scope) surfaced concrete blockers: no `readme.txt` exists at all, ~500 ERROR-level findings from Plugin Check's required rule set (escaping, i18n, direct-file-access guards, WP-version compatibility), and no automated tooling to keep future code passing those same required checks. Fixing only what actually blocks Plugin Directory approval — not general WPCS style preferences — is the explicit goal; nice-to-have findings (variable-naming conventions, asset cache-busting versions, etc.) are deliberately deferred.

## What Changes

- Add `readme.txt` to the plugin root with the WP.org-required header block (Contributors, Tags, Requires at least, Tested up to, Stable tag, Requires PHP, License, License URI) and placeholder body sections (Short Description, Description, Installation, FAQ, Changelog) — structurally valid and Plugin-Check-passing, content to be finalized later by the content team.
- Include `readme.txt` in the packaged plugin zip (`bin/make-package.sh` currently has no allowlist entry for it).
- Fix ~373 call sites in `app/Services/*`, `app/Managers/*`, `app/Actions/*`, `app/Payment/Providers/*` where a translated string is passed directly into a thrown exception without `esc_html__()`.
- Add missing `// translators:` comments above placeholder-bearing translation calls (~52 sites).
- Replace unsafe printing functions with safe WordPress equivalents (~33 sites).
- Fix genuine unescaped template output in `resources/views/*` (~25 sites).
- Add the `defined('ABSPATH') || exit;` guard to template/view files missing it (~10 sites).
- Convert unordered `sprintf()` placeholders to numbered form (3 sites).
- Replace `date()` with `gmdate()` (3 sites).
- Replace native PHP filesystem/URL functions (`unlink`, `readfile`, `rmdir`, `parse_url`) with their WordPress API equivalents (5 sites).
- Fix `array_find()` usage in `resources/views/site/account/order-details.php` (requires WP 6.8, plugin declares "Requires at least: 5.9") — replace with a manually written equivalent rather than raising the minimum WP version.
- Resolve the global `date_default_timezone_set('UTC')` call in `kirki-ecommerce.php` mutating site-wide PHP runtime state — design.md covers the options.
- Add an explicit version parameter to the one enqueued asset missing it entirely.
- Add `wp-coding-standards/wpcs` and `PHPCompatibilityWP` as composer dev dependencies, with a new phpcs ruleset scoped only to the sniff categories that map to Plugin Directory approval requirements (security escaping/sanitization/nonces, i18n, global-scope naming, restricted date functions, WP API alternatives, PHP 7.4 compatibility) — explicitly not the full `WordPress-Extra`/`WordPress-Docs` stylistic sets.
- Wire the new ruleset into `.github/workflows/tests.yml` as a blocking CI check.

**Deliberately out of scope**: WARNING-level Plugin Check findings that don't block approval (unprefixed local/global variable names — 225 occurrences, nonce-verification "recommended" notices, missing asset cache-busting versions, leftover `error_log()` calls, `wp_redirect` vs `wp_safe_redirect`, mixed line endings, non-prefixed dynamic hook names, a slow-query advisory, and shipping `composer.json` alongside `vendor/`). These are listed in design.md as a deferred appendix, not implemented here. `payments/*` gateway add-ons and `libraries/framework` are also out of scope — excluded from the Plugin Check scan and from this change.

## Capabilities

### New Capabilities
- `wp-org-required-standards`: defines what "required for WordPress.org Plugin Directory approval" means for this codebase (as opposed to general WordPress coding-standard style preferences), and requires automated tooling (phpcs + CI) that enforces exactly that required subset going forward.

### Modified Capabilities
- `plugin-packaging`: the packaged plugin zip must include a valid `readme.txt` — currently `bin/make-package.sh`'s allowlist has no entry for it, so even after the file exists at the repo root it would not ship in the package without this change.

## Impact

- **New file**: `readme.txt` (plugin root).
- **Packaging**: `bin/make-package.sh` (add `readme.txt` to `REQUIRED_PATHS`).
- **Application code**: `app/Services/*`, `app/Managers/*`, `app/Actions/*`, `app/Payment/Providers/*`, `resources/views/site/**`, `kirki-ecommerce.php` — escaping, i18n, ABSPATH guards, date-function, and compatibility fixes across roughly 20 files.
- **Tooling**: `composer.json` (new dev dependencies), a new phpcs ruleset file, `.github/workflows/tests.yml` (new CI step).
- **No database schema, API contract, or frontend (`resources/app/`) changes.**
