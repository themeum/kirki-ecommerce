## 1. Script scaffold and wiring

- [x] 1.1 Create `bin/make-package.sh` with `#!/usr/bin/env bash`, `set -euo pipefail`, and `cd` to the repo root (resolved relative to the script's own location) so it works regardless of the caller's cwd.
- [x] 1.2 Add `"scripts": { "make:package": "bash bin/make-package.sh" }` to root `package.json`, leaving its existing `dependencies` untouched.
- [x] 1.3 `chmod +x bin/make-package.sh`.
- [x] Verify: `npm run make:package --silent -- --help` is not required, but `bash -n bin/make-package.sh` (syntax check) passes and `npm run make:package` is invokable from repo root.

## 2. Clean output directory

- [x] 2.1 At the start of the script, `rm -rf build/` to clear any previous package output.
- [x] 2.2 `mkdir -p build/kirki-ecommerce` to recreate the empty staging directory.
- [x] Verify: running the script twice in a row does not fail or leave stale files from the first run in the second run's `build/`.

## 3. Frontend build

- [x] 3.1 In the script, `cd resources/app`; if `node_modules/` is absent, run `npm install` before building.
- [x] 3.2 Run `npm run build` in `resources/app` (existing script: `tsc --noEmit && vite build`), which emits into the top-level `assets/` directory per `vite.config.js`.
- [x] 3.3 `cd` back to the repo root after the frontend build step.
- [x] Verify: after this step, `assets/js/kirki-ecommerce.bundle.js`, `assets/js/kirki-ecommerce.vendor.js`, and `assets/css/kirki-ecommerce.bundle.css` exist and are newly modified (touch time updated by the build).

## 4. PHP dependency install

- [x] 4.1 Run `composer install` (full, with dev) so the existing `post-install-cmd` hook triggers `composer scope`, populating `libraries/framework/` and removing `themeum/framework` from `vendor/`.
- [x] 4.2 Run `composer install --no-dev --optimize-autoloader --no-scripts` to strip `require-dev` packages from `vendor/` without re-triggering `composer scope`. (Added `--no-scripts`: see "Correction during implementation" in design.md — the hook's own `--no-dev` detection doesn't work from the inline `@php -r` subprocess, so without `--no-scripts` the second pass still attempted to re-run `composer scope` after `vendor/humbug/php-scoper` was already removed, failing loudly though non-fatally.)
- [x] Verify: after this step, `libraries/framework/helpers.php` exists, and `vendor/phpunit` (or any other `require-dev`-only package directory) does not exist under `vendor/`.

## 5. Assemble staging directory

- [x] 5.1 Copy the explicit list of runtime paths into `build/kirki-ecommerce/`: `kirki-ecommerce.php`, `app/`, `bootstrap/`, `config/`, `database/`, `libraries/`, `payments/`, `routes/`, `vendor/`, `assets/`, `resources/data/`, `resources/images/`, `resources/assets/`.
- [x] 5.2 Skip/no-op gracefully for any path in the list that doesn't exist in the source tree (so the script doesn't hard-fail if an optional directory like `payments/` is absent in some checkout), but do not silently skip any of the required paths (`kirki-ecommerce.php`, `app/`, `bootstrap/`, `vendor/`, `assets/`) — fail loudly if one of those is missing.
- [x] Verify: `build/kirki-ecommerce/` contains exactly the paths listed above (spot-check with `ls`), and does NOT contain `.git`, `.github`, `.claude`, `.cursor`, `.vscode`, `docker/`, `docs/`, `openspec/`, `tests/`, `resources/app/`, `resources/site/`, `composer.lock`, `package-lock.json`, `phpunit.xml`, `scoper.config.php`, `scoper.bootstrap.php`, or `.env`.

## 6. Production-mode patch

- [x] 6.1 In the staged copy `build/kirki-ecommerce/kirki-ecommerce.php` only, use `sed` to replace `define('KIRKI_ECOMMERCE_IS_DEV', true);` with `define('KIRKI_ECOMMERCE_IS_DEV', false);`.
- [x] 6.2 In the same staged file, replace `define('KIRKI_ECOMMERCE_MODE', 'development');` with `define('KIRKI_ECOMMERCE_MODE', 'production');`.
- [x] Verify: `grep` confirms the staged copy has `IS_DEV', false` and `MODE', 'production'`, while `git diff --stat kirki-ecommerce.php` (the working-tree source file) shows no changes.

## 7. Version extraction and zip creation

- [x] 7.1 Extract the plugin version from the `Version:` header comment in `kirki-ecommerce.php` (the working-tree source file) via `grep`/`sed`.
- [x] 7.2 From inside `build/`, run `zip -r kirki-ecommerce-<version>.zip kirki-ecommerce/` so the archive's internal top-level folder is `kirki-ecommerce/`.
- [x] Verify: `unzip -l build/kirki-ecommerce-<version>.zip` lists `kirki-ecommerce/kirki-ecommerce.php` as the only top-level directory's entry point, matching `openspec/changes/add-plugin-package-script/specs/plugin-packaging/spec.md`'s "Zip has a valid plugin folder structure" scenario.

## 8. End-to-end verification

- [x] 8.1 Run `npm run make:package` from a repo state with an existing `build/` directory present (from a prior run) and confirm it's wiped and rebuilt cleanly (per spec: "Package build output is reproducible from a clean state").
- [x] 8.2 Extract the produced zip to a scratch directory and confirm no PHP fatal occurs on `php -l kirki-ecommerce/kirki-ecommerce.php` (lint check) and that `kirki-ecommerce/vendor/autoload.php` exists.
- [x] 8.3 Confirm the working tree is clean of unintended changes after a full run (`git status` shows only the intentionally-committed `bin/make-package.sh` and `package.json` changes — no modification to `kirki-ecommerce.php`, `assets/`, `vendor/`, `libraries/`, or `composer.lock` beyond what's already gitignored).
