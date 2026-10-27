## Why

`themeum/framework` is installed by Composer at `vendor/themeum/framework`,
but the code the plugin actually runs is a *second copy* at `libraries/framework`
— php-scoper reads the installed package, writes prefixed copies to a
root-level directory, and then deletes the original with `rm -rf vendor/themeum`.

That indirection costs a top-level directory, a `.gitignore` entry, a `phpcs`
exclude, an entry in the packaging script's `REQUIRED_PATHS`, and a
`scoper.bootstrap.php` whose only job is to fabricate stub files so Composer's
`files` autoload does not fatal before scoping has run. It also throws away
the package Composer installed, so `vendor/` no longer reflects what
`composer.lock` says is installed.

The package should stay where Composer put it. Only its namespaces need to
change.

## What Changes

- **The installed package is relocated, then rewritten in place.**
  `composer scope` moves `vendor/themeum/framework` to
  `vendor/libraries/framework`, then scopes `src/` in place:
  `Framework\Application` becomes `Kirki\Ecommerce\Framework\Application`
  inside that directory. The root-level `libraries/` directory is deleted and
  never regenerated. The relocation is a directory move plus an `install-path`
  rewrite in `installed.json` — Composer still knows the package as
  `themeum/framework` at the version the lock pins.
- **`rm -rf vendor/themeum` is removed.** The `remove-framework-from-vendor`
  script goes away entirely — the package stays installed.
- **The package's own autoload map and install path are rewritten** — the
  prefix from `Framework\` to `Kirki\Ecommerce\Framework\`, and
  `install-path` to `../libraries/framework`, both in
  `vendor/composer/installed.json` — so
  Composer stops emitting a `Framework\` → scoped-files mapping. Without this
  the plugin would ship an autoload rule that can shadow another plugin's
  genuine `Framework\` classes — the exact collision scoping exists to prevent,
  and the reason the current design deletes `vendor/themeum` at all.
- **The docblock patcher in `scoper.config.php` is made idempotent.** It
  currently re-prefixes `\Framework\` inside an already-scoped
  `\Kirki\Ecommerce\Framework\`, so a second pass corrupts `@var`/`@param`/
  `@return` hints. Harmless when the output was a throwaway directory;
  reachable now that the package is scoped in place. **This is a latent bug
  today, not one this change introduces.**
- **Non-runtime files are stripped from the package after scoping** — tests,
  docs, docker config, and build tooling are removed, keeping `src/`,
  `LICENSE`, and `composer.json`. Today only the scoped `src/` ever reached
  the zip; without stripping, in-place scoping would ship a test suite and a
  `docker-compose.yml` inside a wp.org plugin.
- Autoloader, packaging script, phpunit, phpcs, `.gitignore`, and docs are
  updated to name `vendor/libraries/framework/src`, and `scoper.bootstrap.php`
  loses its now-unnecessary stub-creation logic.

**Not changing**: the Composer package keeps the name `themeum/framework`,
the same repository, and the same version constraint. The scoping prefix stays
`Kirki\Ecommerce`, so no application code under `app/`, `database/`, `config/`,
`routes/`, or `resources/views/` is touched — every `Kirki\Ecommerce\Framework\*`
import resolves exactly as before, from a different directory.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-packaging`: the "Package includes all runtime-required files"
  requirement asserts the built zip contains a populated root-level
  `libraries/` directory. That location becomes `vendor/libraries/framework/src`,
  and the requirement gains coverage for the framework's non-runtime files
  being excluded and for no stale `Framework\` autoload mapping shipping.

## Impact

**Build and tooling configuration** (the whole of the change):

- `composer.json` — `autoload.psr-4`, `autoload.files`, `scripts.scope`,
  removal of `scripts.remove-framework-from-vendor`
- `scoper.config.php` — the docblock patcher regex
- `scoper.bootstrap.php` — stub-creation logic removed
- `bin/` — a new script to perform the staged swap, the `installed.json`
  autoload rewrite, and the strip (too involved for an inline Composer script)
- `bin/make-package.sh` — `REQUIRED_PATHS`, and the ordering around its
  `--no-dev` install, which regenerates `installed.json` and would otherwise
  discard the autoload rewrite
- `phpunit.xml`, `phpcs-wporg.xml.dist`, `.gitignore`, `README.md`, `CLAUDE.md`

**No impact** on application code, the REST API, the React admin UI, the
database schema, or runtime behavior.

**Developer impact**: everyone re-runs `composer install` after pulling, and
deletes the leftover root `libraries/`, which `git status` will surface as
untracked once its `.gitignore` entry is gone.

**Verified before proposing** (see design.md): php-scoper's `--force` deletes
the output directory *before* reading the source, so a naive in-place run
destroys the package, and rewriting `installed.json` does remove the stale
`Framework\` map.

**Corrected during implementation**: the proposal originally assumed the
package's own `files` autoload could supply the scoped helpers. It cannot —
Composer emits dependency `files` entries before the root package's, which
loaded the framework's `defined('ABSPATH') || exit;` guard before
`bootstrap/abspath.php` and silently exited every CLI process. The package's
`files` entry is stripped alongside its `psr-4` prefix, and the root
`composer.json` keeps its own entries, repointed at
`vendor/libraries/framework/src/`. See design.md Decision 2a.

**Also corrected during implementation**: the runtime location changed from
`vendor/themeum/framework` to `vendor/libraries/framework` after the first
implementation landed. See design.md Decision 6 for the relocation mechanism
and why it has to run before anything loads `vendor/autoload.php`.
