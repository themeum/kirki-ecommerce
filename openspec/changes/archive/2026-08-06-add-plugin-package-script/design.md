## Context

See proposal.md - Why. Relevant constraints from codebase research:

- `resources/app/vite.config.js` already sets `build.outDir` to the
  top-level `assets/` directory with `emptyOutDir: false` and fixed output
  filenames (`kirki-ecommerce.bundle.js`, `kirki-ecommerce.vendor.js`,
  `kirki-ecommerce.bundle.css`) — the frontend build needs no copy step,
  running `npm run build` inside `resources/app/` is sufficient.
- `composer.json`'s `post-install-cmd`/`post-update-cmd` hooks run
  `composer scope` (php-scoper) automatically, unless `--no-dev` was passed
  on that same invocation. `composer scope` writes `libraries/framework/`
  (gitignored, but autoloaded via `composer.json`'s `autoload.files`) and
  also removes `themeum/framework` from `vendor/` + dumps the autoloader.
- `config/listeners.cache.php` and `config/policies.cache.php` are
  gitignored but unconditionally regenerated on every request by
  `CoreServiceProvider::boot()` — no packaging step needed for them.
- The root `package.json` has no `scripts` key today and unrelated stray
  dependencies; it is otherwise unused by any existing tooling.

## Goals / Non-Goals

**Goals:**
- One command, run from repo root, produces a ready-to-upload zip.
- Build is deterministic: same source state -> same package contents
  (module versions pinned via `composer.lock`/`package-lock.json`, not
  `composer update`).
- Packaging never mutates the developer's working tree (source
  `kirki-ecommerce.php` keeps its dev flags; only the staged copy is
  patched).

**Non-Goals:**
- Not building `readme.txt`, `uninstall.php`, or `languages/*.pot` — none
  exist in the repo today and adding them is out of scope for this change.
- Not adding a CI/release workflow that runs this script automatically —
  this change only adds the local command.
- Not making the script cross-platform beyond macOS/Linux bash (matches
  existing `bin/install-wp-tests.sh` precedent; Windows/WSL users would
  need a bash-capable shell, same as the rest of `bin/`).

## Decisions

### Orchestration: single bash script in `bin/`, invoked via npm script
`bin/make-package.sh` does all the work; root `package.json` gets
`"scripts": { "make:package": "bash bin/make-package.sh" }`. Matches the
existing `bin/*.sh` convention (`install-wp-tests.sh`) and keeps the task in
bash, which is a natural fit for filesystem assembly + `zip` + shelling out
to `composer`/`npm`. Alternative considered: a Node script for portability —
rejected since this repo already runs bash tooling for build-adjacent tasks
and introducing a second scripting convention adds no value here.

### Composer: two-pass `install`, never `update`
1. `composer install` (full, with dev) — this is what triggers the
   `post-install-cmd` hook to run `composer scope`, which populates
   `libraries/framework/` and strips `themeum/framework` from `vendor/`.
2. `composer install --no-dev --optimize-autoloader` — strips the
   remaining `require-dev` packages (PHPUnit, wordpress-stubs, etc.) from
   `vendor/`. The `--no-dev` flag on this second call means `scope` is
   *not* re-triggered, leaving the `libraries/framework/` output from step
   1 in place.

`install` (not `update`) is used both times so the package always reflects
exactly what `composer.lock` pins — reproducible across machines/CI, and
never silently bumps a dependency version as a side effect of packaging.

### Frontend: build in place, install deps only if missing
`resources/app/npm run build` requires `resources/app/node_modules` to
exist (it needs `vite`/`typescript`, both devDependencies — there is no
meaningful "production-only" frontend install since the build itself needs
dev tooling). The script runs `npm install` in `resources/app/` only if
`node_modules` is absent, then always runs `npm run build`. Nothing from
`resources/app/node_modules` or its source files is copied into the
package — only the build's output in the top-level `assets/` directory is.

### Staging directory + explicit include list
The script builds `build/kirki-ecommerce/` by copying an explicit list of
runtime paths (`kirki-ecommerce.php`, `app/`, `bootstrap/`, `config/`,
`database/`, `libraries/`, `payments/`, `routes/`, `vendor/`, `assets/`,
`resources/data/`, `resources/images/`, `resources/assets/`) rather than
copying everything and subtracting an exclude list. An explicit include
list is safer for a plugin distribution: a new top-level dev-only
directory added later to the repo is excluded by default (fails safe),
whereas an exclude-list approach would silently ship it until someone
remembers to add it to the exclusion set.

### Dev-flag patching via `sed` on the staged copy only
After copying `kirki-ecommerce.php` into the staging directory, the script
runs `sed` in place *on the staged copy* to flip:
- `define('KIRKI_ECOMMERCE_IS_DEV', true);` -> `...IS_DEV', false);`
- `define('KIRKI_ECOMMERCE_MODE', 'development');` -> `...MODE', 'production');`

This runs after the copy step and only ever touches
`build/kirki-ecommerce/kirki-ecommerce.php`, never the repository's
working-tree file.

### Version + zip naming
The script extracts the version from the `Version:` header comment in
`kirki-ecommerce.php` (the same value already used for the `Plugin Name`
header WordPress itself reads) via `grep`/`sed`, and names the output
`build/kirki-ecommerce-<version>.zip`. The zip is created by `cd`-ing into
`build/` and running `zip -r kirki-ecommerce-<version>.zip kirki-ecommerce/`
so the archive's internal paths start with `kirki-ecommerce/`, not an
absolute or `build/`-prefixed path.

### Cleanup: wipe `build/` upfront, keep staging after
The script starts with `rm -rf build/` (both `.gitignore`d, so nothing
tracked is lost) so every run starts clean. After zipping, the staging
directory `build/kirki-ecommerce/` is left in place next to the zip so a
developer can inspect exactly what was packaged without extracting the
archive.

## Risks / Trade-offs

- **`zip` CLI availability** → The script assumes a `zip` binary is on
  `PATH` (standard on macOS and most Linux dev environments, same
  assumption as `bin/install-wp-tests.sh` makes for `svn`/`curl`). If
  missing, the script fails loudly with the shell's own "command not
  found" error rather than a custom check — acceptable since it's a local
  dev script, not CI-critical.
- **`composer install` requiring network/VCS access** → `composer.json`
  declares `"preferred-install": {"themeum/framework": "source"}` with a
  git repository source; a fully clean environment without prior
  composer caches or SSH access to that repo could fail. Out of scope to
  solve here — same precondition already exists for any contributor doing
  a fresh `composer install` today.
- **Explicit include list drifting from reality** → If a future runtime
  dependency is added outside the listed paths (e.g. a new top-level
  directory the app reads at runtime), it will be silently excluded from
  the package until someone updates the script. Mitigated by keeping the
  include list colocated and readable at the top of
  `bin/make-package.sh`, and by this being a fail-safe direction (missing
  files surface as broken functionality during testing, not as leaked
  dev files in a shipped zip).

## Correction during implementation

The "Composer: two-pass `install`, never `update`" decision assumed
`composer install --no-dev` would skip re-running `composer scope`, based
on reading `post-install-cmd`'s guard clause
(`!in_array('--no-dev', $_SERVER['argv'])`). Running the real script
showed this is wrong: that guard checks the argv of the tiny inline
`@php -r "..."` subprocess composer spawns for the script, which never
receives composer's own `--no-dev` flag — so the guard's `--no-dev` check
never matches, and `composer scope` is (re-)attempted on every install,
dev or not. On the second pass this now runs after
`vendor/humbug/php-scoper` has already been removed as a dev-only
package in the same operation, so the scope attempt fails with
"Could not open input file: vendor/humbug/php-scoper/bin/php-scoper".

In practice this was non-fatal (composer's own exit code stayed 0, and
`libraries/framework/` was already correctly populated by the first
pass), but it's fragile — a future composer version could treat the
failed script differently and abort the whole install. Fixed by adding
`--no-scripts` to the second `composer install --no-dev` call, so it
never attempts to run `composer scope` in the first place instead of
relying on the (non-functional) `--no-dev` guard inside the hook.

## Migration Plan

No migration — this is a new, additive script with no runtime code
changes. Nothing to roll back beyond deleting the new script and
`package.json` entry.
