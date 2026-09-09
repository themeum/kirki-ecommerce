## Why

`app/Supports/ExceptionThrower.php` exists to centralize exception throw sites so the
`WordPress.Security.EscapeOutput.ExceptionNotEscaped` WPCS finding only needs justifying
in one place instead of at every `throw new *Exception(...)` call site. `themeum/framework`
3.1.2 now ships `throw_if()`/`throw_unless()`/`throw_anyway()` global helpers that accept
and forward `...$params` to the exception constructor, which they did not do before (they
previously dropped every constructor argument past the message, which would have silently
turned ~126 API error responses that pass an HTTP status code into 500s). With that fixed
upstream, most `ExceptionThrower::throw(new X(...))` call sites can be replaced by the more
direct `throw_if`/`throw_unless`/`throw_anyway` helpers, reducing indirection without
reintroducing the WPCS finding (`libraries/framework/*` is excluded from `phpcs-wporg.xml.dist`
regardless of which helper is used).

## What Changes

- Replace `ExceptionThrower::throw(new X($msg, ...$args))` call sites with the equivalent
  `throw_if($condition, $msg, X::class, ...$args)`, `throw_unless($condition, $msg, X::class, ...$args)`,
  or `throw_anyway($msg, X::class, ...$args)` call, matching the existing guard shape
  (`if (cond) {...}` → `throw_if`, `if (!cond) {...}` → `throw_unless`, unconditional/fallthrough
  throw → `throw_anyway`).
- Add `use function Kirki\Ecommerce\Framework\throw_if;` (and `throw_unless`/`throw_anyway` as
  needed) to each touched file, following the existing `use function Kirki\Ecommerce\Framework\...;`
  import convention already used for `app()`, `collection()`, etc.
- Remove the now-unused `use Kirki\Ecommerce\App\Supports\ExceptionThrower;` import from every
  file where all call sites were converted.
- Leave the 2 call sites that construct via `ValidationException::with_errors(...)` (a static
  factory, not `new X(...)`) on `ExceptionThrower::throw(...)` unchanged — the new helpers only
  support `new $exception_class(...)` construction, so these are not expressible through them.
- Keep `app/Supports/ExceptionThrower.php` in the codebase (not removed) since it is still used
  by those 2 remaining call sites.

## Capabilities

No spec-level behavior changes: every converted call site throws the same exception class with
the same message and the same constructor arguments (status code included) under the same
condition as before. This is a pure internal refactor of how the exception gets thrown, not what
gets thrown or when. `skip_specs: true` is set in `.openspec.yaml`.

## Impact

- ~218 of 220 `ExceptionThrower::throw(...)` call sites across ~57 files under `app/` (Services,
  Actions, Managers, Payment/Providers, Currency/Providers, Http/Controllers, Supports,
  Decisions, Scheduler, Tax, Constants/Order, Settings, Concerns) convert to `throw_if`/
  `throw_unless`/`throw_anyway`.
- 2 call sites (`app/Services/UserService.php`, `app/Concerns/ValidatesVariantMatrix.php`) keep
  using `ExceptionThrower::throw(ValidationException::with_errors(...))` unchanged.
- `app/Supports/ExceptionThrower.php` stays in place, unmodified, still exercised by those 2 sites.
- No API response shape, HTTP status code, exception message, or i18n string changes — this is
  purely a call-site mechanism swap validated by the existing test suite and phpcs.
- Depends on `themeum/framework` 3.1.2 (already bumped in `composer.lock`); `composer install`
  must regenerate `libraries/framework/` (gitignored, scoped build output) before these helpers
  are available with `...$params` support.
