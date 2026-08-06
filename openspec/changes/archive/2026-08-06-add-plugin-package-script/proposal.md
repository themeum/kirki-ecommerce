## Why

There is currently no way to produce a distributable, installable copy of the
`kirki-ecommerce` WordPress plugin. The repo only contains the development
tree (source PHP, uncompiled React/TS admin UI, test suite, tooling configs).
Shipping the plugin today means manually figuring out which files are
runtime-required, building the frontend, installing production dependencies,
and hand-flipping a hardcoded dev-mode flag — an error-prone, undocumented
process. A single `npm run make:package` command should produce a correct,
installable `.zip` every time.

## What Changes

- Add a `bin/make-package.sh` bash script that orchestrates the full package
  build: clean output dir → build frontend → install production PHP/JS deps →
  assemble a staging directory with only runtime files → patch dev-mode flags
  in the staged copy → zip it.
- Add a `scripts.make:package` entry to the root `package.json` (its existing
  `dependencies` are left untouched) that runs the script.
- Frontend build: run inside `resources/app/` (`npm install` if
  `node_modules` is missing, then `npm run build`), which emits directly into
  the top-level `assets/` directory (existing `vite.config.js` behavior).
- PHP dependencies: two-pass `composer install` — a full install first (so
  the existing `composer scope` post-install hook regenerates the gitignored
  `libraries/framework/` directory), then `composer install --no-dev
  --optimize-autoloader` to strip dev-only packages from `vendor/`.
- Assemble a staging directory (`build/kirki-ecommerce/`) containing only
  runtime files: `kirki-ecommerce.php`, `app/`, `bootstrap/`, `config/`
  (schema files only), `database/`, `libraries/`, `payments/`, `routes/`,
  `vendor/`, `assets/`, and the runtime subset of `resources/`
  (`resources/data/`, `resources/images/`, `resources/assets/`) — excluding
  `resources/app/` and `resources/site/` source trees, dotfiles/dot-folders,
  `docker/`, `docs/`, `openspec/`, `tests/`, lockfiles, and other dev-only
  content.
- In the staged copy of `kirki-ecommerce.php` (not the working-tree source),
  rewrite `KIRKI_ECOMMERCE_IS_DEV` to `false` and `KIRKI_ECOMMERCE_MODE` to
  `'production'`, since the unpatched dev flags make the admin UI load JS
  from the Vite dev server (`http://localhost:5173`) and would leave the
  packaged plugin non-functional.
- Produce `build/kirki-ecommerce-<version>.zip` (version read from the
  `Version:` header in `kirki-ecommerce.php`), with `kirki-ecommerce/` as the
  zip's single top-level folder, ready to upload via the WordPress plugin
  installer.
- `build/` is wiped (`rm -rf`) at the start of every run; the staging
  directory is left in place alongside the zip afterward for inspection.

## Capabilities

### New Capabilities
- `plugin-packaging`: building an installable, production-only distributable
  zip of the plugin via a single command.

### Modified Capabilities
(none — no existing spec'd capability changes behavior)

## Impact

- New file: `bin/make-package.sh`.
- Modified file: root `package.json` (adds `scripts.make:package`; no
  dependency changes).
- Build-time only — no runtime application code changes. Touches
  `composer install` state (`vendor/`, `libraries/framework/`) and
  `resources/app` build output (`assets/`) as side effects of running the
  existing build/install tooling, not by editing them directly.
- Output: `build/kirki-ecommerce-<version>.zip` and
  `build/kirki-ecommerce/` (staging dir), both already covered by
  `.gitignore` (`build/`, `*.zip`).
