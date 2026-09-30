# plugin-packaging Specification

## Purpose

Defines the behavior of building a production-only, installable WordPress
plugin zip from the development repository via a single command.
## Requirements
### Requirement: Single command produces an installable plugin zip

The system SHALL provide a single command (`npm run make:package`) that,
when run from the repository root, produces a zip archive that can be
uploaded through the WordPress admin "Add New Plugin > Upload Plugin" flow
without further modification.

#### Scenario: Running the command from a clean checkout

- **WHEN** a developer runs `npm run make:package` from the repository root
- **THEN** a file named `build/kirki-ecommerce-<version>.zip` is created,
  where `<version>` is the value of the `Version:` header in
  `kirki-ecommerce.php`

#### Scenario: Zip has a valid plugin folder structure

- **WHEN** the produced zip is extracted
- **THEN** it contains exactly one top-level directory named
  `kirki-ecommerce/`, and `kirki-ecommerce/kirki-ecommerce.php` exists
  inside it

### Requirement: Package build output is reproducible from a clean state

The system SHALL remove any previous build output before producing a new
package, so that stale files from a prior run cannot leak into the new zip.

#### Scenario: Stale build directory from a previous run

- **WHEN** `npm run make:package` is run and a `build/` directory already
  exists from a previous run (containing an old zip and/or staged files)
- **THEN** the existing `build/` directory is removed before the new
  package is assembled

### Requirement: Package excludes development-only files

The packaged plugin SHALL NOT contain source control metadata, editor/AI
tooling configuration, test suites, documentation-only files, or
uncompiled frontend source.

#### Scenario: Dev tooling and source directories are excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain `.git`,
  `.github`, `.claude`, `.cursor`, `.vscode`, `docker/`, `docs/`,
  `openspec/`, `tests/`, `resources/app/` (React/TS source), or
  `resources/site/` (source tree)

#### Scenario: Lockfiles and dev configs are excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain
  `composer.lock`, root or `resources/app` `package-lock.json`,
  `phpunit.xml`, `scoper.config.php`, `scoper.bootstrap.php`, or `.env`

### Requirement: Package includes all runtime-required files

The packaged plugin SHALL contain every file and directory the plugin
needs to run in a production WordPress installation, including files that
are gitignored in the development repository but required at runtime.

#### Scenario: Vendored framework library is included

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a populated
  `vendor/libraries/framework/src/` directory holding the namespace-prefixed
  framework source, even though the whole `vendor/` tree is gitignored in
  the source repository

#### Scenario: Scoped framework is loadable from the packaged location

- **WHEN** the produced zip is extracted and its `vendor/autoload.php` is
  loaded
- **THEN** classes under the `Kirki\Ecommerce\Framework\` namespace
  resolve, and the framework's global helper functions are defined,
  without any file being required from a root-level `libraries/` directory

#### Scenario: No root-level libraries directory ships

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain a top-level
  `libraries/` directory

#### Scenario: Production PHP dependencies are included, dev ones are not

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a `vendor/` directory
  populated with production dependencies only — packages listed under
  `require-dev` in `composer.json` (e.g. PHPUnit) are absent

#### Scenario: Compiled frontend assets are included

- **WHEN** the package is built
- **THEN** the resulting plugin directory's `assets/` directory contains
  the compiled JS and CSS bundle files produced by the frontend build

### Requirement: Package includes a valid readme.txt

The packaged plugin SHALL contain a `readme.txt` file at its root, with the
WordPress.org-required header fields populated (Contributors, Tags,
Requires at least, Tested up to, Stable tag, Requires PHP, License,
License URI) and a Stable tag matching the `Version:` header in
`kirki-ecommerce.php`.

#### Scenario: readme.txt ships in the package

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a `readme.txt` file
  with all WordPress.org-required header fields present and a Stable
  tag equal to the plugin's current version

#### Scenario: readme.txt is absent from the source repository build inputs

- **WHEN** `readme.txt` exists at the repository root
- **THEN** the build copies it into the packaged plugin directory the
  same way it copies other required root-level files

### Requirement: Package ships in production mode

The packaged plugin's entry file SHALL be configured to run in production
mode, independent of the development mode setting in the source repository.

#### Scenario: Dev-mode flags are disabled in the packaged copy

- **WHEN** the package is built
- **THEN** the `kirki-ecommerce.php` file inside the packaged plugin
  directory has its development-mode flag disabled and its mode set to
  production, regardless of the value of those flags in the repository's
  working-tree copy of the file

#### Scenario: Source repository is left untouched

- **WHEN** the package is built
- **THEN** the working-tree copy of `kirki-ecommerce.php` in the
  repository still has its original development-mode flag values after
  the build completes

### Requirement: Packaged framework carries no unprefixed namespace

The packaged plugin SHALL NOT declare or register any autoload mapping for
the framework's original unprefixed `Framework\` namespace, so that the
plugin's autoloader cannot intercept and mis-resolve a `Framework\` class
belonging to another plugin active on the same site.

#### Scenario: No unprefixed autoload mapping is registered

- **WHEN** the produced zip is extracted and its generated autoload maps
  are inspected
- **THEN** no entry maps the bare `Framework\` prefix to any directory

#### Scenario: Framework source declares only prefixed namespaces

- **WHEN** the packaged framework source files are inspected
- **THEN** every namespace declaration is prefixed with
  `Kirki\Ecommerce\`, and none declares a bare `Framework` namespace

#### Scenario: Prefixing is applied exactly once

- **WHEN** the packaged framework source files are inspected, including
  their docblock type annotations
- **THEN** no symbol or annotation carries the prefix more than once —
  a repeated prefix such as `Kirki\Ecommerce\Kirki\Ecommerce\Framework\`
  appears nowhere

### Requirement: Packaged framework excludes its own development files

The packaged copy of the framework dependency SHALL contain only what the
plugin needs at runtime, plus the license file. The framework's own test
suite, documentation, examples, and build/CI tooling SHALL NOT ship.

#### Scenario: Framework dev directories are excluded

- **WHEN** the package is built
- **THEN** the packaged framework directory contains no `tests/`,
  `docs/`, `example/`, `docker/`, `scripts/`, or `stubs/` directory

#### Scenario: Framework build configs are excluded

- **WHEN** the package is built
- **THEN** the packaged framework directory contains no `Makefile`,
  `docker-compose.yml`, `phpunit.xml`, `phpstan.neon.dist`,
  `phpcs.xml.dist`, or `composer.lock`

#### Scenario: License is retained

- **WHEN** the package is built
- **THEN** the packaged framework directory still contains its `LICENSE`
  file

### Requirement: Package ships a search index built from the packaged source

The packaging command SHALL regenerate the settings search index from the current
settings source before the admin frontend is bundled, so that the shipped plugin
can never carry an index describing wording that is not in the interface it ships
with.

#### Scenario: Stale local index at package time

- **WHEN** `npm run make:package` is run while the packaging machine's local search
  index was generated from older settings copy, or is absent entirely
- **THEN** the index is regenerated from the current source before the frontend is
  built
- **AND** the zip contains the regenerated index rather than the stale one

#### Scenario: Regeneration precedes bundling

- **WHEN** the packaging command builds the admin frontend
- **THEN** the search index has already been regenerated, so the bundled index and
  the bundled interface come from the same source

