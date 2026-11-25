## Purpose

Makes plugin PHP code register and fire WordPress hooks through the framework hook classes, with a CI check against native calls, and keeps the public hook contract unchanged for third parties.

## ADDED Requirements

### Requirement: Plugin code uses the framework hook classes
Plugin PHP code in scope SHALL NOT call `apply_filters`, `add_filter`, `do_action`, or `add_action` directly. It SHALL use `FilterHook::apply`, `FilterHook::add`, `ActionHook::fire`, and `ActionHook::add` from `themeum/framework`. In-scope files are PHP files under `app/`, `bootstrap/`, `config/`, `database/`, `resources/views/`, `routes/`, and the plugin entry file `kirki-ecommerce.php`.

#### Scenario: Plugin fires a filter
- **WHEN** plugin code needs to filter a value
- **THEN** it calls `FilterHook::apply` with the same hook name and arguments that it gave to `apply_filters` before

#### Scenario: Method named like a hook function
- **WHEN** a class declares or calls its own method named `apply_filters` (for example `$this->apply_filters(...)`)
- **THEN** that method is not a hook call and is not changed or reported

### Requirement: Public hook contract is unchanged
Each hook that the plugin fires SHALL keep its name, its argument list, its argument order, and its return handling. Each callback that the plugin registers SHALL keep its hook name, priority, and accepted-argument count. A callback added with the native `add_filter` or `add_action` by a third party (a gateway plugin, a theme, or a test) SHALL run as before.

#### Scenario: Gateway adds a payment provider
- **WHEN** a gateway plugin calls `add_filter` on the payment providers hook and the plugin builds its provider registry
- **THEN** the gateway's provider is in the registry, as before this change

#### Scenario: Third party listens to an action
- **WHEN** a third party calls `add_action` on the order-placed hook and an order is placed
- **THEN** its callback runs with the same arguments as before this change

### Requirement: CI fails on a native hook call
The hook-call check (`composer phpcs:hooks`) SHALL report an error for each direct call to `apply_filters`, `add_filter`, `do_action`, or `add_action` in an in-scope file. The error SHALL name the framework replacement. The CI step that runs this check SHALL fail when any such error is reported.

#### Scenario: New native call
- **WHEN** a developer adds `add_filter(...)` to a file under `app/` and runs `composer phpcs:hooks`
- **THEN** the check reports an error that names `FilterHook::add` and exits with a non-zero status

#### Scenario: All calls converted
- **WHEN** no in-scope file calls the four native functions and `composer phpcs:hooks` runs
- **THEN** the check reports no errors

### Requirement: Excluded paths are not checked
The hook-call check SHALL NOT scan `payments/`, `gateways/`, `tests/`, `vendor/`, `vendor_prefixed/`, `node_modules/`, or `build/`.

#### Scenario: Gateway plugin uses native calls
- **WHEN** a gateway plugin under `payments/` calls `add_filter` and `composer phpcs:hooks` runs
- **THEN** the check reports no error for that file
