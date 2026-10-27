## MODIFIED Requirements

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

## ADDED Requirements

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
