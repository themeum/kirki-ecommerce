## Context

See proposal.md - Why. 220 `ExceptionThrower::throw(new X($msg, ...$args))` call sites exist
across ~57 files under `app/`. All but 2 construct via `new $exception_class(...)`; those 2 use
`ValidationException::with_errors(...)`, a static factory. `throw_if`/`throw_unless`/`throw_anyway`
(now in `libraries/framework/helpers.php`, namespace `Kirki\Ecommerce\Framework`, since
`themeum/framework` 3.1.2) construct exceptions as `new $exception_class($message, ...$params)`
internally - they cannot call a static factory method, so the 2 `with_errors()` sites are out of
scope for this change regardless of helper capability.

Every existing call site follows one of three shapes:

```php
if ($condition) {
    ExceptionThrower::throw(new X($msg, ...$args));   // 218 of 220 sites
}
```
or an unconditional/fallthrough throw with no guarding `if` (end of a function after a loop
finds nothing, `default:` arm of a switch, end of a catch block) - 5 sites among the 218
(`OrderStatus::find_by_pair`, `OrderActivityManager`'s `default:` arm, `PayPal::create_order`'s
catch block, `AddonPlugin`, `CurrencyExchangeFactory::resolve`).

## Goals / Non-Goals

**Goals:**
- Convert all 218 eligible call sites to `throw_if`/`throw_anyway`, preserving the exact
  exception class, message, and constructor arguments (including HTTP status codes) that are
  thrown today.
- Keep the diff mechanical and reviewable: one call-site shape maps to exactly one transform
  rule, applied uniformly.

**Non-Goals:**
- Not touching the 2 `ValidationException::with_errors(...)` sites or removing
  `app/Supports/ExceptionThrower.php`.
- Not introducing `throw_unless()` anywhere in this change (see Decisions).
- Not changing any exception message, status code, i18n domain, or condition logic.
- Not adding new exception handling, validation, or error paths beyond what already exists.

## Decisions

**Always convert to `throw_if($condition, ...)` using the existing `if` condition verbatim -
never introduce `throw_unless()`.**
Alternative considered: map `if (!$x) {...}` to `throw_unless($x, ...)` since that reads slightly
more naturally. Rejected: at 218 call sites, deciding case-by-case whether a condition "reads
better" negated invites manual inversion mistakes (e.g. silently flipping `!empty($x)` to
`empty($x)` instead of `$x`) for zero behavioral benefit - `throw_if(!$x, ...)` and
`throw_unless($x, ...)` are runtime-identical. Keeping the condition expression byte-for-byte and
just wrapping it in `throw_if(...)` is the smaller, lower-risk diff and matches the "surgical
changes" project guideline.

**Unconditional/fallthrough throws use `throw_anyway($msg, X::class, ...$args)`.**
These 5 sites have no boolean to gate on (end-of-loop fallthrough, `default:` switch arm,
catch-block rethrow) - `throw_if(true, ...)` would work but `throw_anyway(...)` says what's
happening without a vestigial `true` argument.

**Per-file `use function Kirki\Ecommerce\Framework\throw_if;` (and `throw_anyway` only in the 5
files that need it), replacing the `use Kirki\Ecommerce\App\Supports\ExceptionThrower;` line in
the same position.**
Matches the existing convention already used for `app()`, `collection()`, `message()`, etc.
(`use function Kirki\Ecommerce\Framework\collection;`). Files with a mix of converted sites and a
remaining `with_errors()` site keep both the `ExceptionThrower` import and the new `throw_if`
import.

**Do not attempt to also collapse the 2 `with_errors()` sites into a plain `throw
ValidationException::with_errors(...)` (dropping `ExceptionThrower` there too).**
That's a legitimate follow-up (the static-call pattern doesn't match `throw new *Exception(...)`
either, so WPCS likely wouldn't flag it) but it's a separate, smaller change with its own
verification, and the user was explicit: keep `ExceptionThrower` for those two, don't remove the
class. Out of scope here.

## Risks / Trade-offs

**[Risk] A file gets its call sites converted but the `use function ...\throw_if;` import is
forgotten.** PHP resolves an unqualified `throw_if(...)` call inside a namespaced file by first
checking the current namespace, then falling back only to the *global* namespace - not to
`Kirki\Ecommerce\Framework`. Without the `use function` import this fails at runtime
("Call to undefined function") only when that code path actually executes, not at parse time. →
Mitigation: after conversion, grep every touched file for `throw_if(` / `throw_unless(` /
`throw_anyway(` and confirm a matching `use function Kirki\Ecommerce\Framework\...;` import
exists; run the full PHPUnit suite (`composer test` / the project's test command) and
`composer phpcs:wporg` afterward as a broad-but-partial safety net (it won't exercise every
branch, but catches anything the tests do cover).

**[Risk] Loss of IDE/static-analysis type-narrowing.** `if ($order === null) { throw ...; }`
lets an IDE (and a tool like PHPStan/Psalm) know `$order` is non-null afterward; `throw_if($order
=== null, ...)` is an opaque function call to the same tooling, since throwing-on-condition isn't
a language construct here. → Accepted trade-off, not mitigated: this project has no PHPStan/Psalm
in `composer.json` (only `phpcs`/`phpcompatibility`), so there's no CI check that would regress.
Worth flagging if static analysis is adopted later.

**[Risk] `libraries/framework/` is gitignored, regenerated by `composer scope`.** Anyone building
this change on a machine that hasn't run `composer install` since the `themeum/framework` 3.1.2
bump lands in `composer.lock` will have the *old* `throw_if`/`throw_unless` (no `...$params`
forwarding) locally, and status codes would silently drop to defaults again. → Mitigation: no
code fix possible from this repo; call it out in the PR description so reviewers/CI re-run
`composer install` before testing.

## Migration Plan

1. Convert call sites file-by-file, grouped by directory (`app/Services/`, `app/Actions/`,
   `app/Managers/`, `app/Payment/Providers/`, `app/Currency/Providers/`,
   `app/Http/Controllers/`, `app/Supports/`, `app/Decisions/`, `app/Scheduler/`, `app/Tax/`,
   `app/Constants/Order/`, `app/Settings/`, `app/Concerns/`) so each commit/review chunk is
   small and self-contained.
2. Per file: replace each `ExceptionThrower::throw(new X($msg, ...$args))` inside its guarding
   `if` per the Decisions above, swap the `use` import, leave everything else untouched
   (formatting, adjacent code, comments).
3. After each directory batch: run `composer phpcs:wporg` scoped to the changed files and the
   relevant PHPUnit tests (if any target that service/action).
4. After all batches: full `composer phpcs:wporg` and full test suite run; grep sweep for
   `use Kirki\Ecommerce\App\Supports\ExceptionThrower;` to confirm it only remains in
   `UserService.php` and `ValidatesVariantMatrix.php` (and `ExceptionThrower.php` itself).
5. No feature flag or staged rollout needed - this is a like-for-like internal refactor; rollback
   is a plain `git revert` if `composer phpcs:wporg` or tests catch a mismatch.
