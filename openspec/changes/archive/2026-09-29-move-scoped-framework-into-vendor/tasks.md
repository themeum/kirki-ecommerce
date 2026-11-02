## 1. Make the scope step idempotent (do this first)

- [x] 1.1 In `scoper.config.php`, add a negative lookbehind to the docblock patcher (line 24) so it does not match `\Framework\` that is already preceded by the prefix. Everything downstream assumes re-scoping is safe.
- [x] Verify: scope the current `vendor/themeum/framework/src` to a throwaway directory, scope that output again to a second throwaway directory, and confirm `grep -rl 'Kirki\\Ecommerce\\Kirki' <second-dir>` returns nothing. Before the fix this returns 27 files. **Result: 0 files (was 27).** Additional finding: a second pass also expands same-namespace short references to FQNs (`Arr::from` -> `\Kirki\Ecommerce\Framework\Supports\Arr::from`) - semantically identical, and a third pass is byte-identical to the second, so scoping converges to a fixed point rather than being byte-idempotent from pass 1. Safe to re-run; recorded in design.md.

## 2. Scope-in-place script

- [x] 2.1 Add a script under `bin/` (invoked by `composer scope` after php-scoper) that performs, in this order: (a) confirm the staged scoper output exists and is non-empty, (b) delete `vendor/themeum/framework/src`, (c) move the staged output into its place. Order matters — never delete before scoping has succeeded (design.md Risks).
- [x] 2.2 In the same script, rewrite the `themeum/framework` entry's `autoload.psr-4` key in `vendor/composer/installed.json` from `Framework\` to `Kirki\Ecommerce\Framework\`, then run `composer dump-autoload`.
- [x] 2.3 In the same script, strip the framework's non-runtime files: remove `tests/`, `docs/`, `example/`, `docker/`, `scripts/`, `stubs/`, `phpcs/`, `Makefile`, `docker-compose.yml`, `phpunit.xml`, `phpstan.neon.dist`, `phpcs.xml.dist`, `composer.lock`, and the framework's own `README.md`/`CLAUDE.md`. Keep `src/`, `LICENSE`, and `composer.json`. **Implemented as an allowlist** (delete everything except those three) rather than the enumerated denylist - strictly covers every listed path and stays correct if upstream adds new tooling files.
- [x] 2.4 In `composer.json`, point `scripts.scope`'s `--output-dir` at a staging path and chain the new script after php-scoper. Delete the `remove-framework-from-vendor` script and its reference — the package is no longer removed.
- [x] Verify: `composer scope` twice in a row leaves `vendor/themeum/framework/src` correctly prefixed both times, with no doubled prefix and no missing files.

## 3. Autoloader and bootstrap

- [x] 3.1 In `composer.json`, point the PSR-4 map `Kirki\Ecommerce\Framework\` (line 6) at `vendor/themeum/framework/src/`. Keep this entry — it is the durable mapping; the `installed.json` rewrite is transient (design.md Decision 2).
- [x] 3.2 In `composer.json`, remove the two `autoload.files` entries for `libraries/framework/...` (lines 13-14). ~~The package's own `files` autoload already loads the scoped `src/helpers.php` and `src/Polyfill/Polyfill.php`.~~ **Premise was wrong.** Composer emits dependency `files` before the root package's, so relying on the package's entry loaded `helpers.php` (and its `defined('ABSPATH') || exit;`) before `bootstrap/abspath.php`, silently exiting every CLI process - PHPUnit printed nothing. Corrected: the root entries are kept but repointed to `vendor/themeum/framework/src/...`, and `bin/scope-framework.php` strips `autoload.files` from the package's installed.json entry. See design.md Decision 2a.
- [x] 3.3 In `scoper.bootstrap.php`, remove the stub-creation loop (lines 7-20) — those files now exist from the moment Composer installs. Keep the `ABSPATH` define and `error_reporting` call, which php-scoper's run still needs.
- [x] Verify: after `composer install`, `grep -n Framework vendor/composer/autoload_psr4.php` shows a `Kirki\Ecommerce\Framework\` entry and **no** bare `Framework\` entry, and `grep -n themeum vendor/composer/autoload_files.php` shows the two scoped helper files.

## 4. Test, lint, and packaging configuration

- [x] 4.1 In `phpunit.xml` (line 17), change the coverage `<include>` directory to `./vendor/themeum/framework/src`.
- [x] 4.2 In `phpcs-wporg.xml.dist`, delete the now-redundant `<exclude-pattern>libraries/framework/*</exclude-pattern>` (line 42) — `*/vendor/*` (line 39) already covers the new location. Leave the unrelated `vendor_prefixed/` line alone.
- [x] 4.3 In `bin/make-package.sh`, remove `"libraries"` from `REQUIRED_PATHS` (line 18). The loop `exit 1`s on a missing required path, so leaving it breaks the build outright.
- [x] 4.4 In `bin/make-package.sh`, delete the `rm -rf "$ROOT_DIR/vendor/themeum"` step and rewrite the comment block above it (lines 80-86) — the package is no longer removed.
- [x] 4.5 In `bin/make-package.sh`, re-apply the `installed.json` autoload rewrite after the final `composer install --no-dev --no-scripts` and before the final `composer dump-autoload --no-dev --optimize`. That install regenerates `installed.json` from the lock and restores the bare `Framework\` map — without this the stale mapping ships (design.md Risks).
- [x] 4.6 In `.gitignore`, remove the `libraries/` entry (line 41). Do not replace it — a leftover directory should be visible in `git status`, not hidden.

## 5. Documentation

- [x] 5.1 Update `README.md` (lines 24, 31, 47, 55) to describe scoping as rewriting the installed package in place at `vendor/themeum/framework/`, and remove `libraries/` from the project-structure listing.
- [x] 5.2 Update `CLAUDE.md` (lines 119-121) so the "do not use as a style reference, do not hand-edit" rule names `vendor/themeum/framework/src/` and describes the current `composer scope` behaviour.

## 6. Clean rebuild and verification

- [x] 6.1 Delete the stale directory: `rm -rf libraries`.
- [x] 6.2 Run `rm -rf vendor/themeum && composer install` and confirm: `vendor/themeum/framework/src/Application.php` declares `namespace Kirki\Ecommerce\Framework;`, the framework's `tests/` and `docker-compose.yml` are gone, `LICENSE` remains, and no root `libraries/` was recreated.
- [x] 6.3 Confirm no double-prefixing anywhere: `grep -rl 'Kirki\\Ecommerce\\Kirki' vendor/themeum` returns nothing.
- [x] 6.4 Confirm `git status` shows no untracked `libraries/`.
- [x] Verify: `grep -rn "libraries/framework" --exclude-dir=vendor --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.claude --exclude-dir=openspec .` returns nothing. **Result: only `.review/main-vs-dev-review.md` still mentions the old path - a historical review record, deliberately left untouched.**

## 7. Test suite and standards

- [x] 7.1 Run `composer test` (or at minimum `composer test:unit`) and confirm results are unchanged from before the move. Do not use browser or dev-server verification — CLAUDE.md §0. **Result: 187 tests, 300 assertions, OK.** Must be run on PHP 7.4 (`.php-version`); the machine default is PHP 8.4, on which PHPUnit 9 produces no output at all.
- [x] 7.2 Run `composer phpcs:wporg` and confirm it passes with no new findings. **Result: no new findings** - identical totals (6 errors, 18 warnings, 12 files) with this branch's config and with HEAD's. Note it does *not* pass: those 6 errors are pre-existing on `dev` and out of scope here.

## 8. Packaging verification against the spec delta

- [x] 8.1 Run `bash bin/make-package.sh` end to end and confirm it exits 0 and produces `build/kirki-ecommerce-<version>.zip`.
- [x] 8.2 Extract the zip and confirm: `vendor/themeum/framework/src/` is present and prefixed; there is no top-level `libraries/`; the framework's `tests/`, `docs/`, `example/`, `docker/`, `Makefile`, `docker-compose.yml`, `phpunit.xml` are absent; `LICENSE` is present.
- [x] 8.3 **Confirm no bare `Framework\` mapping survived the build**: grep the staged `vendor/composer/autoload_psr4.php` and `autoload_static.php` for a bare `Framework\` key. This is the specific thing task 4.5 protects, and script ordering makes it easy to get wrong — check the artifact, not the script.
- [x] 8.4 Confirm the packaged `vendor/composer/autoload_files.php` references only paths that exist inside the package. **Result: 4/4 exist.** Also verified the shipped plugin's `vendor/autoload.php` loads cleanly with ABSPATH *not* predefined - the failure mode found at task 7.1 - and that `bootstrap/abspath.php` still precedes the framework helpers in the shipped file order.

## 9. Relocate the scoped package to `vendor/libraries/framework`

Amendment landed after sections 1-8 were complete: the runtime location moved
from `vendor/themeum/framework` to `vendor/libraries/framework` (design.md
Decision 6).

- [x] 9.1 Add a `--relocate` mode to `bin/scope-framework.php` that moves `vendor/themeum/framework` to `vendor/libraries/framework`, removes `vendor/themeum/` once empty, and rewrites the package's `install-path` in `installed.json`. Idempotent; when both directories exist the target holds a stale scoped copy and is discarded.
- [x] 9.2 Order `scripts.scope` as `--relocate` -> `composer dump-autoload` -> php-scoper -> finish -> `composer dump-autoload`. The relocation must precede anything that loads `vendor/autoload.php`. **Found by running it the other way first**: php-scoper's own bin requires the autoloader, whose dependency `files` entry resolves through the package's `install-path`, so scoping died with `require(vendor/composer/../themeum/framework/src/helpers.php): Failed to open stream`.
- [x] 9.3 Repoint `composer.json` (psr-4 + both `files` entries), `scoper.config.php` finder root, and `phpunit.xml` coverage include at `vendor/libraries/framework/src`.
- [x] 9.4 Update `README.md` and `CLAUDE.md` to name `vendor/libraries/framework/`.
- [x] 9.5 Replace `--autoload-only` with `--restore` in `bin/make-package.sh`. **The first build after the move shipped a complete second, unscoped framework.** Composer tests for an installed package at the path derived from its name, not at the recorded `install-path`, so `composer install --no-dev --no-scripts` re-cloned it at `vendor/themeum/framework`, and the autoload generator registered that directory alongside the scoped one. `--restore` removes the reinstalled copy (guarded on the scoped one being present) and re-applies the metadata.
- [x] Verify: `rm -rf vendor && composer install` completes and leaves no `vendor/themeum`; `Application.php` declares `namespace Kirki\Ecommerce\Framework;`; `autoload_psr4.php` maps `Kirki\Ecommerce\Framework\` to `vendor/libraries/framework/src` and nothing else; `autoload_files.php` orders `bootstrap/abspath.php` before the framework helpers.
- [x] Verify: `composer scope` twice more in a row is a no-op — 0 double-prefixed files, package contents stay `LICENSE composer.json src`.
- [x] Verify: `vendor/autoload.php` loads cleanly on PHP 7.4 with ABSPATH *not* predefined, and `Kirki\Ecommerce\Framework\Application` + `collection()` resolve.
- [x] Verify: unit suite unchanged — **187 tests, 300 assertions, OK**. Integration suite needs the WP test library, which is not installed on this host (unchanged by this work).
- [x] Verify: `composer phpcs:wporg` totals unchanged — **6 errors, 18 warnings, 12 files**, same as the recorded baseline. No new findings.
- [x] Verify: rebuild via `bash bin/make-package.sh` and confirm in the extracted zip — no root `libraries/`, **no `vendor/themeum/`**, package contents exactly `LICENSE composer.json src`, 258 prefixed PHP files, 0 double-prefixed, no bare `Framework\` key in `autoload_psr4.php`/`autoload_static.php`, the psr-4 map holding `vendor/libraries/framework/src` alone, all 4 `autoload_files` paths present, and the packaged `vendor/autoload.php` loading with ABSPATH unset while `Framework\Application` stays unresolvable.
