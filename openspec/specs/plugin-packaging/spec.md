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

### Requirement: Package contains no developer seeders

The packaged plugin SHALL NOT contain the developer seeders, which are the
demo and test data seeders that developers run from the command line. They
SHALL NOT ship as files and SHALL NOT be registered in the packaged autoload
maps. Code that the plugin runs in production, such as store setup and the
sample data import, SHALL NOT live with the developer seeders, so excluding
them removes no runtime behavior. The developer seeding command SHALL keep
working in a development install.

#### Scenario: No seeder files ship

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains `database/migrations/`
  and does not contain a `database/seeders/` directory

#### Scenario: Developer seeders are absent from the autoload maps

- **WHEN** the produced zip is extracted and its generated autoload maps
  are inspected
- **THEN** no entry maps the developer seeders namespace or any developer
  seeder class

#### Scenario: Store setup works from the package

- **WHEN** a merchant completes the onboarding wizard on a site that runs
  the packaged plugin
- **THEN** store setup succeeds and seeds the category tree, attribute
  presets and settings defaults

#### Scenario: Sample data import works from the package

- **WHEN** a merchant loads sample data on a site that runs the packaged
  plugin
- **THEN** the sample products and their images are imported

#### Scenario: Seeding command on a packaged install

- **WHEN** an administrator runs the plugin's database seeding command on a
  site that runs the packaged plugin
- **THEN** no seeder runs, no data is written, and no fatal error occurs

#### Scenario: Seeding command in development

- **WHEN** a developer runs the plugin's database seeding command in a
  development install
- **THEN** the developer seeders run as before

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

### Requirement: Package contains no preset or sample product data

The packaged plugin SHALL NOT contain the preset and sample product source data,
including the sample product images, because the plugin reads them from the remote
preset location. The plugin SHALL keep working without them: store setup and the
sample data import SHALL read only the remote location.

#### Scenario: Preset source folder is excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain `resources/data/preconfigured-data/` or `resources/data/preconfigured-data.json`

#### Scenario: Other runtime data stays

- **WHEN** the package is built
- **THEN** the resulting plugin directory still contains the other files in `resources/data/`, for example `countries.php` and `currencies.json`

### Requirement: Package command can set the plugin version

The package command SHALL accept `--version <version>`, where `<version>` is `<major>.<minor>.<patch>` (each part one or more digits) with an optional `-<suffix>` of letters, digits, `.` and `-` (for example `1.1.0-beta.1`). With the flag, the command SHALL write the version into each place the plugin declares it: the `Version:` header and the `KIRKI_ECOMMERCE_VERSION` constant in `kirki-ecommerce.php`, and the `Stable tag:` line in `readme.txt`.

- Without `--keep-source`, the command SHALL write the version into the source files and then build, so the package and the working tree have the same version.
- With `--keep-source`, the command SHALL write the version only into the staged `build/kirki-ecommerce/` copy and SHALL NOT change the source files.

In both modes the zip SHALL be named `build/kirki-ecommerce-<version>.zip`. The command SHALL stop with an error, before it builds anything, when the version is not valid, when `--keep-source` is given without `--version`, or when an argument is unknown. The command SHALL stop with an error when it cannot find one of the three values to replace.

#### Scenario: Local version bump

- **WHEN** a developer runs `npm run make:package -- --version 1.0.1` with `1.0.0` in the source files
- **THEN** `kirki-ecommerce.php` (header and constant) and `readme.txt` (`Stable tag:`) contain `1.0.1` in the working tree, the staged copy contains `1.0.1`, and `build/kirki-ecommerce-1.0.1.zip` is created

#### Scenario: Staged-only version for a deploy

- **WHEN** the command runs with `--version 1.0.1 --keep-source` and the source files contain `1.0.0`
- **THEN** the three values in `build/kirki-ecommerce/` contain `1.0.1`, `build/kirki-ecommerce-1.0.1.zip` is created, and `kirki-ecommerce.php` and `readme.txt` in the working tree still contain `1.0.0`

#### Scenario: Invalid version

- **WHEN** the command runs with `--version 1.0` or `--version v1.0.1`
- **THEN** it exits with an error that names the value, and no build step runs

#### Scenario: Keep-source without a version

- **WHEN** the command runs with `--keep-source` only
- **THEN** it exits with an error, and no build step runs

#### Scenario: No flags

- **WHEN** the command runs without arguments
- **THEN** no version value changes, and the zip name uses the `Version:` header, as before

### Requirement: Package installs PHP packages from the committed lock file

The package command SHALL install the PHP packages from the committed `composer.lock` and SHALL NOT resolve them again or change `composer.lock`. When `composer.lock` does not satisfy `composer.json`, the command SHALL stop with an error.

#### Scenario: Lock file is current

- **WHEN** the package is built
- **THEN** the packaged `vendor/` has the package versions recorded in `composer.lock`, and `git diff composer.lock` is empty after the build

#### Scenario: Lock file does not satisfy composer.json

- **WHEN** `composer.json` requires a version that `composer.lock` does not contain
- **THEN** the build stops at the Composer step with an error, and no zip is created
