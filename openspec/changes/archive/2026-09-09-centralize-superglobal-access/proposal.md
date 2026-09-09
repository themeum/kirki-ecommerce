## Why

`app/`, `database/`, and the site view templates read `$_GET`/`$_POST`/`$_SERVER`/`$_COOKIE` directly in 17 places, each hand-rolling its own `wp_unslash()`/sanitize call (or, in a few cases, skipping it). The framework this plugin is built on just added `Kirki\Ecommerce\Framework\Http\Superglobals` (vendored via `composer scope` from the sibling `themeum/framework` repo) specifically as the one place that reads superglobals, with unslashing and `Sanitizer`-based sanitization applied uniformly. That framework change's own risk log flags exactly this gap as a known follow-up: a consuming plugin like this one can still write raw `$_GET`/`$_POST` unaware the accessor exists. This change closes that gap for kirki-ecommerce's own code.

## What Changes

- Replace all direct `$_GET`, `$_POST`, `$_SERVER`, `$_COOKIE` reads in `app/`, `database/`, and `resources/views/site/*.php` with either `Superglobals` or `Request`/`request()` — whichever is correct for that call site (see design.md Decision 0):
  - `Request`/`request()` (already used elsewhere in this project, e.g. `CartService.php`) for single-key reads in code that only ever runs inside a dispatched site/REST request — `Template.php`'s `category_ids`/`attribute_value_ids` filter reads, and the `shop/single.php`/`shop/parts/empty.php` view templates.
  - `Superglobals::query()`/`::post()`/`::server()`/`::cookie()` everywhere else: whole-array reads where "exactly `$_GET`, nothing merged" matters (pagination URL rebuilding, `shop.php`'s filter-presence check), the nonce check in `Utils.php` (method-scoped by design — `Request`'s merged attributes would loosen it), and any code with no guaranteed request lifecycle (`Assets.php`, `PageIdentifier.php`, `Scheduler.php`'s async worker, `MoneyManager.php`).
- Single-key, scalar-valued `Superglobals` reads move to the single-key form, e.g. `Superglobals::server('REQUEST_URI', '', Sanitizer::TEXT)`, replacing manual `wp_unslash()` + `Sanitizer::apply_rule()`/`sanitize_text_field()` pairs.
- The two array-valued reads (`category_ids`, `attribute_value_ids` in `Template.php`) move to `request()->array()`, which merges `$_GET` into `Request`'s attributes without `Superglobals`'s scalar-only restriction on single-key reads.
- `resources/views/site/shop/parts/empty.php`'s 7 currently-unsanitized `$_GET[...]` reads (used only in `empty()`/`!==` filter-presence checks) gain `sanitize_text_field()` via `request()->text()` — a small, accepted behavior widening on malformed input (see design.md Risks).
- Document the convention in this project's `CLAUDE.md` PHP section, mirroring how the framework's own follow-up note recommended it.
- `payments/kirki-*` gateway packages are explicitly out of scope (separate addon plugins, not covered by this project's CLAUDE.md PHP-standards section).
- `tests/` are explicitly out of scope — they mutate `$_SERVER`/`$_COOKIE` directly to fake request state for test fixtures, which neither `Superglobals` nor `Request` (both read-only) can or should replace.
- No new automated enforcement (e.g. a phpcs sniff banning raw superglobal access) — this is a one-time cleanup relying on code review to catch regressions, matching the framework repo's own choice.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None. This is an internal-consistency refactor of how existing behavior reads its inputs, not a change to any spec-level requirement — the request/response contract of every affected code path (nonce verification, shop filters, admin page/currency detection, async worker auth) stays the same. See `.openspec.yaml`'s `skip_specs: true`.

## Impact

- **Affected files** (17 call sites): `app/Supports/Utils.php`, `app/Supports/Template.php`, `app/Supports/Assets.php`, `app/Hooks/Filters/PageIdentifier.php`, `app/Scheduler/Scheduler.php`, `app/Managers/MoneyManager.php`, `resources/views/site/shop.php`, `resources/views/site/shop/single.php`, `resources/views/site/shop/parts/empty.php`.
- **Docs**: `CLAUDE.md` (PHP Coding Standards section gains a superglobals-access rule).
- **No API/behavior change** for any existing capability, aside from the accepted `empty.php` sanitization-before-comparison widening noted above.
- **Dependency**: relies on the already-vendored `libraries/framework/Http/Superglobals.php` (confirmed in sync with its upstream source) — no `composer scope` re-run needed.
