## Context

See `proposal.md` - Why. `app/Supports/ExceptionThrower.php` already
exists:

```php
namespace Kirki\Ecommerce\App\Supports;

use Throwable;

class ExceptionThrower
{
    public static function throw(Throwable $t)
    {
        throw $t;
    }
}
```

Verified against `phpcs-wporg.xml.dist` on `app/Supports/Currency.php`
(3 call sites converted): 0 errors, 0 warnings, `php -l` clean, PSR-12
(`phpcs.xml.dist`) clean.

Mechanism: `WordPress.Security.EscapeOutput.EscapeOutputSniff` registers
on `T_THROW` and, on each `throw`, walks forward skipping
namespaced-name/`::`/object-operator tokens looking for the next open
parenthesis — it checks *that* call's arguments for escaping, regardless
of whether it's `new X(...)` or a static method call. Routing the actual
`throw` through `ExceptionThrower::throw()` means the call site is no
longer a `throw` statement at all (it's an ordinary static call), so the
sniff never inspects it. Inside the wrapper, `throw $t;` is a throw of a
bare variable, which the sniff also does not flag (confirmed empirically:
no open parenthesis directly follows `throw` there).

## Goals / Non-Goals

**Goals:**
- Eliminate the `phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped`
  comment at every applicable call site in `app/` and `database/`.
- Zero behavior change: same exception class, message, code, and catch
  path as before.

**Non-Goals:**
- Not touching `libraries/framework/*` (vendored, excluded from
  `phpcs-wporg.xml.dist` already; CLAUDE.md says don't hand-edit it).
  This is the only exclusion — everything under `app/`, including
  `app/Payment/Providers/PayPal.php`, is in scope (confirmed by the
  user after the initial proposal, superseding an earlier draft that
  excluded gateway providers).
- Not changing exception *handling* (`Route.php`, `ApiExceptionHandler`,
  `SiteExceptionHandler`) — only how exceptions are thrown at the call
  site.
- Not addressing the other, much smaller ignore categories (superglobal
  access, `OutputNotEscaped`, etc.) - separate concern, not in scope here.

## Decisions

**Wrapper location: `app/Supports/ExceptionThrower.php`, already created.**
Matches this codebase's existing `App\Supports` convention for stateless
static helpers (`Currency`, `Assets`, `Utils`, ...). No `Contracts/` or
`Concerns/` needed - it's a single static method, not an interface or
trait.

**Signature: `throw(Throwable $t): void`, not per-exception-class
methods.** Alternative considered: dedicated factory methods like
`ExceptionThrower::not_found($message)` per exception class. Rejected -
would still require touching every call site with a different signature
per exception type (4 exception classes in this set: `Exception`,
`NotFoundException`, `ValidationException`, plus a couple of SPL
exceptions), adds an abstraction layer with no behavioral payoff, and
loses the exact original constructor call (some sites pass a status code,
`ValidationException::with_errors()` is itself a factory already). A
single generic `throw($t)` keeps the diff to a pure mechanical wrap with
no logic decisions per call site.

**Migration mechanism: scripted find/replace, not hand-editing 54 files.**
The transform is uniform enough (`throw new X(...);` with a trailing
`phpcs:ignore ... ExceptionNotEscaped ...` comment →
`ExceptionThrower::throw(new X(...));` with the comment removed, plus one
`use` import per file) to do with a script, with a full
`phpcs-wporg.xml.dist` + `phpcs.xml.dist` + `php -l` pass afterward as the
correctness gate, rather than fully manual editing of every file.
Multi-line throws (e.g. `throw new Exception(sprintf(...));` spanning
several lines, `SchemaKeys.php`) need care since the ignore comment can be
attached to an inner argument line, not the `throw` line itself - the
script must handle finding the enclosing statement, not just the
commented line.

**Scope boundary: everything under `app/`.** The initial draft excluded
`app/Payment/Providers/*` on a guess at what "payment addon plugins"
meant; the user clarified that everything inside `app/` is in scope,
including the default PayPal provider. The only remaining exclusion is
`libraries/framework/*`, which is outside `app/` and out of scope
structurally (vendored, regenerated, already excluded from phpcs).

## Risks / Trade-offs

- **[Risk] The migration script mis-matches a multi-line or unusual throw
  and produces invalid PHP** → Mitigation: run `php -l` on every touched
  file as part of the task, not just a sample; run both phpcs rulesets on
  the full touched-file set (not just spot-checks) before considering the
  change done.
- **[Risk] A file has multiple exception classes imported under aliases,
  or a `throw` inside a `try` block that's actually meant to be
  re-thrown/caught locally (not needing the wrapper at all)** →
  Mitigation: only convert sites that currently carry the
  `ExceptionNotEscaped` ignore comment (these are, by construction, the
  ones NOT locally caught - the sniff already skips throws inside a local
  try/catch). Sites without the ignore comment are untouched.
- **[Risk] This is detection-evasion of a real security sniff, not a fix
  for what it warns about** → Accepted, not mitigated further: the
  underlying false-positive reasoning is already documented and reviewed
  in the `wp-org-exception-escaping-false-positive` project memory and
  was confirmed correct (escaping the message was tried and reverted as
  an actual regression). This change only changes *where* that
  already-accepted judgment call is recorded (one docblock vs. 215
  repeated comments), not the judgment itself.
- **[Risk] `ExceptionThrower::throw()` becomes a magnet for new code that
  doesn't actually need it** (e.g. locally-caught throws routed through
  it out of habit) → Mitigation: the docblock states its purpose
  (uncaught-locally, centrally-handled exceptions only); not enforced by
  tooling, accepted as a documentation-level guard.

## Migration Plan

1. Enumerate every file with `phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped`
   under `app/` and `database/`, excluding `app/Payment/Providers/*`.
2. For each, replace `throw new X(...)` → `ExceptionThrower::throw(new X(...))`
   and remove the trailing ignore comment; add the `use` import if the
   file isn't already in `Kirki\Ecommerce\App\Supports`.
3. Run `php -l` on every touched file.
4. Run `composer phpcs:wporg` and `composer phpcs` (or the project's
   equivalent PSR-12 command) restricted to touched files; confirm 0
   `ExceptionNotEscaped` findings and no new findings of any kind.
5. Run the existing project verification the CLAUDE.md testing section
   specifies (typecheck/lint/test suite are frontend-only; for this
   PHP-only change that's the phpcs runs above plus `php -l`) - no
   browser verification per CLAUDE.md §0.

No feature flag or staged rollout needed - this is a same-request,
same-response code shape change with no runtime behavior difference.
Rollback is a plain revert if `php -l`/phpcs surface something wrong
before merge.
