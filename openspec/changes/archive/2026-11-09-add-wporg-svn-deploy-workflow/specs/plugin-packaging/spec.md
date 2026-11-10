## ADDED Requirements

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
