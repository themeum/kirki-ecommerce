## Why

`themeum/framework` v3.3.5 adds `FilterHook` and `ActionHook`. CLAUDE.md §2a
says: when the framework wraps a native function, use the framework version.
The plugin code still calls `apply_filters`, `add_filter`, `do_action`, and
`add_action` directly. No check stops new native calls.

## What Changes

- Replace each native hook call in `app/` and `kirki-ecommerce.php` with the
  framework class:
  - `apply_filters()` → `FilterHook::apply()`
  - `add_filter()` → `FilterHook::add()`
  - `do_action()` → `ActionHook::fire()`
  - `add_action()` → `ActionHook::add()`
- Include the core `PAYMENT_PROVIDERS` filter in `app/Payment/PaymentManager.php`.
- Add a phpcs check that fails CI when one of the four native functions is
  called in plugin PHP code.
- Add `FilterHook`/`ActionHook` to the framework-first examples in CLAUDE.md
  §2a and in `.claude/rules/php-standards.md`.
- Hook names, argument lists, argument order, and priorities do not change.

Out of scope:
- Gateway plugins under `payments/` and `gateways/`. They keep `add_filter`.
- `tests/`. Tests keep the native calls, because they act as a third party and
  prove the public hook contract.
- `ProductService::apply_filters()`. It is a local query method, not a
  WordPress hook.
- `docs/seo-and-social-meta.md`. Its `add_filter` example shows third-party
  code, which uses the WordPress function.

## Capabilities

### New Capabilities
- `php-hook-calls`: plugin PHP code registers and fires WordPress hooks
  through the framework hook classes, a lint check enforces this, and the
  public hook contract stays the same.

### Modified Capabilities
None.

## Impact

- Code: about 20 call sites in 16 files under `app/`, plus 2 in
  `kirki-ecommerce.php`.
- Tooling: `phpcs.xml.dist`, a new `composer phpcs:hooks` script, and a new
  step in `.github/workflows/tests.yml`.
- Docs for the agent: `CLAUDE.md`, `.claude/rules/php-standards.md`.
- Dependency: `themeum/framework` ≥ 3.3.5 (already in `composer.lock`).
- Public surfaces: none changed. The wrappers call the WordPress functions
  directly, so third-party callbacks and gateways see the same hooks.
