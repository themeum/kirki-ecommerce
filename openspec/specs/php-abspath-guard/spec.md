# php-abspath-guard Specification

## Purpose

Blocks direct HTTP access to the plugin's PHP files, as WordPress.org requires, and keeps that guard in place with a CI check so a new file cannot ship without it.

## Requirements

### Requirement: Direct-access guard in every in-scope PHP file
Every in-scope PHP file SHALL contain a direct-access guard before any executable code. The guard SHALL be `defined('ABSPATH') || exit;`. In-scope files are PHP files under `app/`, `bootstrap/`, `config/`, `database/`, `resources/views/`, `routes/`, and the plugin entry file `kirki-ecommerce.php`, excluding generated `config/*.cache.php` files.

#### Scenario: Guarded file loads inside WordPress
- **WHEN** a plugin PHP file is loaded by WordPress, where `ABSPATH` is defined
- **THEN** the guard evaluates to true and the file continues to run normally

#### Scenario: File requested directly
- **WHEN** a plugin PHP file is requested directly over HTTP, where `ABSPATH` is not defined
- **THEN** the guard calls `exit` and no executable code in the file runs

### Requirement: CI fails when a guard is missing
The WordPress.org standards check (`composer phpcs:wporg`) SHALL report an error for each in-scope PHP file that does not contain the direct-access guard before its first executable statement. The CI step that runs this check SHALL fail when any such error is reported.

#### Scenario: New file without a guard
- **WHEN** a developer adds an in-scope PHP file without the guard and runs `composer phpcs:wporg`
- **THEN** the check reports an error naming that file and exits with a non-zero status

#### Scenario: All files guarded
- **WHEN** every in-scope PHP file contains the guard and `composer phpcs:wporg` runs
- **THEN** the guard sniff reports no errors

### Requirement: Excluded paths are not checked
The guard check SHALL NOT scan `build/`, `vendor/`, `vendor_prefixed/`, `node_modules/`, `payments/`, generated `config/*.cache.php` files, or `bootstrap/abspath.php`. That file defines `ABSPATH` for CLI processes, so a guard that exits when `ABSPATH` is undefined would break it.

#### Scenario: Build output contains unguarded files
- **WHEN** `build/` contains PHP files without the guard and `composer phpcs:wporg` runs
- **THEN** the check reports no errors for those files
