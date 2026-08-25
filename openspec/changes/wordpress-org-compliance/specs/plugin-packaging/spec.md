## MODIFIED Requirements

### Requirement: Package excludes development-only files

The packaged plugin SHALL NOT contain source control metadata, editor/AI
tooling configuration, test suites, documentation-only files, hidden
files, or the build tooling for the frontend.

Uncompiled frontend source is no longer excluded. The WordPress.org
guidelines require that compiled or minified files ship with the human
readable source they were built from, so the source tree is a required
part of the package rather than a development-only artifact — see the
"Package includes the source of compiled files" requirement below.

#### Scenario: Dev tooling directories are excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain `.git`,
  `.github`, `.claude`, `.cursor`, `.vscode`, `docker/`, `docs/`,
  `openspec/`, or `tests/`

#### Scenario: Lockfiles and dev configs are excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain
  `composer.lock`, root or `resources/app` `package-lock.json`,
  `phpunit.xml`, `scoper.config.php`, `scoper.bootstrap.php`, or `.env`

#### Scenario: Frontend build tooling is excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains no `node_modules`
  directory at any depth, and does not contain `payments/gulpfile.js` or
  `payments/package.json`

#### Scenario: Hidden files are excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains no dotfiles at any
  depth, including the `.gitignore` files currently carried inside
  `payments/` and `payments/kirki-stripe/`

## ADDED Requirements

### Requirement: Package includes the source of compiled files

Every compiled or minified file the package ships SHALL be accompanied by
the human readable source it was produced from, so that a reviewer can
read what the shipped bundle was built from without retrieving anything
from outside the package.

#### Scenario: Compiled admin bundle ships with its source

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains the `resources/app`
  source tree that produced `assets/js/kirki-ecommerce.bundle-*.js` and
  `assets/js/kirki-ecommerce.vendor-*.js`

#### Scenario: Compiled site bundle ships with its source

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains the `resources/site`
  source tree that produced `assets/js/site.js`

### Requirement: Package contains exactly one plugin

The package SHALL declare exactly one plugin. A file carrying a plugin
header inside a distributed plugin cannot be activated by WordPress and
makes the submission malformed, so no secondary plugin may be nested
inside it.

#### Scenario: Only the entry file declares a plugin header

- **WHEN** the package is built
- **THEN** the only file in the resulting plugin directory containing a
  `Plugin Name:` header is `kirki-ecommerce.php`

#### Scenario: Payment gateways are not bundled

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains no `payments/`
  directory, and the plugin does not read any path inside one at runtime

### Requirement: Package carries the directory's required metadata files

The package SHALL contain the metadata files the WordPress.org directory
requires of every submission.

#### Scenario: Readme is present and parseable

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a `readme.txt` whose
  `Stable tag`, `Requires at least`, `Requires PHP`, and `License` agree
  with the corresponding headers in `kirki-ecommerce.php`

#### Scenario: License text is present

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a `LICENSE` file
  carrying the full text of the license named in the plugin header

#### Scenario: Bundled dependencies are attributable

- **WHEN** the package ships a `vendor/` directory
- **THEN** the `composer.json` describing it ships alongside it
