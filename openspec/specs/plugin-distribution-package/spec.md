# plugin-distribution-package Specification

## Purpose

Defines what the WordPress.org release zip contains and omits, so the Plugin Directory review accepts it without package-content findings, and requires an automated check that enforces it.

## Requirements

### Requirement: Release zip omits development and scaffolding files

The release zip built for WordPress.org SHALL NOT contain code scaffolding templates, test tooling, or other development-only files.

#### Scenario: Framework scaffolding templates

- **WHEN** the WordPress.org release zip is built
- **THEN** it contains no `.stub` files

#### Scenario: Test tooling

- **WHEN** the WordPress.org release zip is built
- **THEN** it contains no PHPUnit, PHP-Parser or `_test-tools` directories, no test directories, and no source maps

#### Scenario: Vendor development configuration

- **WHEN** the WordPress.org release zip is built
- **THEN** it contains no static-analysis configuration files such as `psalm.xml`

### Requirement: Production files remain in the release zip

Removing development files SHALL NOT remove any file the plugin needs at runtime.

#### Scenario: Plugin runs from the built zip

- **WHEN** the built zip is installed on a clean WordPress site
- **THEN** the plugin activates, and the admin app and storefront pages load without missing-file errors

### Requirement: Bundled libraries are at the reviewed versions

The plugin SHALL ship `brick/money` at version 0.7.1 or a later 0.7.x release, and the Composer constraint SHALL allow that range.

#### Scenario: Dependencies resolved for the release

- **WHEN** production dependencies are installed for the release build
- **THEN** the installed `brick/money` version is 0.7.1 or later within 0.7.x

#### Scenario: Money calculations after the upgrade

- **WHEN** the money, tax and currency tests run against the upgraded library
- **THEN** all of them pass without changed expected values

### Requirement: Readable source for compiled assets is available and documented

The release SHALL make the human-readable JavaScript and CSS source for every compiled asset available, and `readme.txt` SHALL state where the source is and how to build it.

#### Scenario: Reviewer looks for source of compiled bundles

- **WHEN** a reviewer opens the release zip or `readme.txt`
- **THEN** the readable source for the admin app and the storefront scripts is in the zip, or the readme links to a public repository that contains it

#### Scenario: Build instructions

- **WHEN** a developer reads the source section of `readme.txt`
- **THEN** it lists the source folders, the install command and the build command for each compiled bundle

### Requirement: Package build verifies its own contents

The WordPress.org package build SHALL fail when the built zip contains a forbidden file.

#### Scenario: Forbidden file present

- **WHEN** the package build finds a `.stub`, PHPUnit, `_test-tools`, source-map or static-analysis configuration file in the staged plugin
- **THEN** the build exits with a non-zero status and names the file

#### Scenario: Clean package

- **WHEN** the staged plugin contains no forbidden file
- **THEN** the build completes and produces the zip
