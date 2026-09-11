## Context

See proposal.md - Why. The findings driving this change come from running
`wp plugin check` (Plugin Check v2.1.0) against the actual production
build (`bin/make-package.sh` output, dev-mode flags flipped to
production), with `payments/*` and `libraries/framework` excluded from
the scan. ~785 real findings after discarding ~919 `TextDomainMismatch`
false positives caused by testing under a renamed plugin slug.

The existing `plugin-packaging` capability (`openspec/specs/plugin-packaging/spec.md`)
already governs the build pipeline: `bin/make-package.sh` copies an
allowlist of `REQUIRED_PATHS`/`OPTIONAL_PATHS` into `build/kirki-ecommerce/`,
runs `composer install --no-dev`, strips the unscoped `themeum/framework`
package, and patches `KIRKI_ECOMMERCE_MODE` to `production` before
zipping. `readme.txt` is not currently in either path list.

REST routes already centralize `permission_callback` resolution in
`libraries/framework/Route.php`, and `app/`'s database access goes
through the framework's query layer rather than raw `$wpdb` calls — both
out of scope here since they already satisfy the relevant Plugin Check
categories.

## Goals / Non-Goals

**Goals:**
- Fix every ERROR-level Plugin Check finding from the production-build
  scan (readme.txt, escaping, i18n, direct-file-access, WP-version
  compatibility, the global timezone mutation).
- Add automated enforcement (phpcs + CI) scoped to exactly the sniff
  categories that map to Plugin Directory approval, so future PRs can't
  silently reintroduce these.

**Non-Goals:**
- Full `WordPress-Extra`/`WordPress-Docs` WPCS compliance, or any
  WARNING-level Plugin Check finding not called out in the proposal
  (see the deferred appendix below). These are style preferences, not
  approval blockers.
- Touching `payments/*` gateway add-ons or `libraries/framework` — both
  were explicitly excluded from the Plugin Check scan and from this
  change's scope.
- readme.txt marketing copy (Description, FAQ prose, screenshots) —
  content team owns that; this change only needs a structurally valid,
  Plugin-Check-passing file with honest placeholder text.
- Re-litigating the plugin name/trademark question — already confirmed
  clear.

## Decisions

**Correction during implementation: exception-message escaping via
`esc_html__()` was tried, found to be an actual bug, and replaced with
scoped `phpcs:ignore` comments.**

The original plan (see git history of this file) was to wrap the
translated message argument in every flagged `throw` with
`esc_html__()`. That was implemented for the ~202 findings pointing at
the `__()` call, then reverted after tracing how these exceptions are
actually consumed:

- `libraries/framework/ApiExceptionHandler.php` puts
  `$exception->getMessage()` directly into a JSON API response
  (`response()->json(['message' => $exception->getMessage()], ...)`).
  JSON is not an HTML-escaping context — a pre-escaped message turns
  `couldn't` into literal `couldn&#039;t` in the JSON payload, which
  the frontend has no reason to HTML-decode. Real garbled-text bug.
- `libraries/framework/SiteExceptionHandler.php` already calls
  `esc_html($message)` itself at the one point it renders to HTML
  (`wp_die(esc_html($message), ...)`). Pre-escaping upstream
  double-encodes: `&#039;` becomes `&amp;#039;`, visibly broken in the
  browser.

Both handlers are reached via `try`/`catch` in `libraries/framework/Route.php`
around route dispatch — one call-stack frame above where these
exceptions are thrown, which is exactly what `EscapeOutputSniff`'s own
try/catch detection (skip the check if the `throw` is locally wrapped)
is a proxy for, just one frame too shallow to see. The finding is a
genuine false positive for this codebase's actual architecture: the
framework already escapes at exactly the right boundary, and doing it
again upstream breaks both consumers.

This also settles the ~171 non-message findings in the same sniff
category (mostly `Response::NOT_FOUND` and other status/context
arguments, discovered during implementation — see Context) — they were
never meaningfully escapable to begin with (an HTTP status is not
HTML output), and the same root justification applies to them.

**Decision**: use a scoped `// phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- <reason>`
on every flagged line, citing the framework's centralized exception
handling. This was the alternative originally rejected in this doc;
the rejection assumed escaping the message argument was safe and only
worried about suppression-comment volume. Once the fix was shown to be
actively wrong, the choice is no longer between "fix it properly" vs.
"suppress a real issue" — both argument classes in this finding
category are false positives for how this codebase is structured, and
`phpcs:ignore` is the standard, PHPCS-respected mechanism for exactly
this situation (Plugin Check runs on top of PHPCS, so it honors the
same inline suppression comments).

**`array_find()` replaced with a manual equivalent, not a WP version bump.**
`array_find()` requires WordPress 6.8; the plugin declares "Requires at
least: 5.9". Alternative considered: bump the declared minimum to 6.8.
Rejected — that would drop support for every WordPress install between
5.9 and 6.8 for the sake of one convenience call in one template file;
a manual `foreach`/`array_filter` equivalent costs a few lines and
preserves the existing support range.

**Global timezone mutation: scope the need, don't blindly delete the line.**
`date_default_timezone_set('UTC')` in `kirki-ecommerce.php` changes the
PHP process's default timezone for the entire site — every other
plugin, theme, and WordPress core running in that request inherits it.
This needs investigation during implementation into what `bootstrap/app.php`
and the framework actually rely on UTC for (likely: consistent
timestamp storage/comparison in the framework's ORM or scheduler) before
choosing a fix. Candidate approaches, in order of preference:
1. If the dependency is on `date()`/`time()` calls inside the plugin's
   own code, pass an explicit `DateTimeZone('UTC')` at each call site
   instead of relying on the global default.
2. If it's deeper in vendored/framework code that assumes the global
   default is UTC, this may require framework changes — which are out
   of scope for this change (`libraries/framework` excluded) — in which
   case the pragmatic interim fix is to save and restore the site's
   original timezone immediately around the specific operation that
   needs UTC, rather than leaving it globally changed for the whole
   request lifecycle.
**Correction during implementation**: traced it. `libraries/framework/Supports/Somoy.php` (the framework's DateTime wrapper, used as `Somoy::now()`/`::today()`/`::parse()` etc. across 12 files in `app/`) falls back to `\date_default_timezone_get()` whenever a call site doesn't pass an explicit timezone — which is nearly every call site in this codebase. So neither candidate fix applies cleanly: option 1 (explicit `DateTimeZone('UTC')` per call site) would mean touching dozens of call sites across the whole `app/` layer for a single restricted-function finding, a disproportionate and risky sweep; option 2 ("scope it narrowly around the one operation that needs it") doesn't fit either, because there is no single operation — the dependency is the plugin's entire date/time model, and the code that would actually need changing (`Somoy`'s default-timezone fallback) lives in `libraries/framework`, explicitly out of scope for this change.

Given that, this is treated the same way as the Group 2 correction: a justified `phpcs:ignore` on the `date_default_timezone_set('UTC')` line itself, explaining the real dependency and that removing it requires a `libraries/framework` change tracked separately, not a workaround forced into this change's scope.

**Second correction (post-implementation)**: the `phpcs:ignore` above was itself based on an incomplete picture — it assumed the plugin's call was load-bearing. It isn't. WordPress core calls `date_default_timezone_set('UTC')` unconditionally in `wp-settings.php`, before any plugin code executes (`tests/bootstrap.php`'s own integration setup loads `kirki-ecommerce.php` via the `muplugins_loaded` hook, which fires from inside `wp-settings.php` after that line; production and WP-CLI follow the same order). So `Somoy`'s fallback to `date_default_timezone_get()` was always going to resolve to UTC regardless of whether this plugin set it — the call was pure redundancy, not a real dependency. Removed the `date_default_timezone_set('UTC')` call and its `phpcs:ignore` comment from `kirki-ecommerce.php` entirely. Verified via the full test suite (`bash kirki-test all`, 416 tests including Integration against real WordPress) — same 2 pre-existing unrelated failures, nothing new. The spawned follow-up task for a `libraries/framework` fix was withdrawn as unnecessary.

**phpcs ruleset: additive, not a replacement of the existing PSR12 ruleset.**
`phpcs.xml.dist` currently runs PSR12 only. Alternative considered:
replace it with a WordPress-standards ruleset. Rejected — PSR12 is the
project's established style convention (per CLAUDE.md) and unrelated to
Plugin Directory approval; the new required-only WordPress ruleset is
additive tooling for a different concern (approval-blocking issues),
not a style migration. Implementation will add a second ruleset file
(e.g. `phpcs-wporg.xml.dist`) run as its own composer script and CI
step, leaving `phpcs.xml.dist` untouched.

**Sniff scope for the new ruleset**, limited to: `WordPress.Security.*`
(escaping, sanitization, nonces), `WordPress.WP.I18n.*`,
`WordPress.NamingConventions.PrefixAllGlobals`,
`WordPress.DateTime.RestrictedFunctions`,
`WordPress.WP.AlternativeFunctions`, and `PHPCompatibilityWP` pinned to
`7.4-` (matching the plugin's declared `Requires PHP`). Explicitly
excludes `WordPress-Extra` and `WordPress-Docs` — those enforce
docblock completeness, brace style, and other conventions that don't
affect Plugin Directory approval.

## Risks / Trade-offs

- **Mechanical scale of the `phpcs:ignore` annotation pass** (373
  findings across ~53 files, deduplicated to one comment per flagged
  line since a single `throw` often has multiple flagged arguments) →
  mitigated by it being a pure comment-insertion with no logic change;
  still needs a spot-check that no flagged `throw` is actually reached
  via a *local* try/catch that changes the analysis (none found during
  the investigation, but worth a final grep).
- **`array_find()` replacement introduces a behavior-preserving but
  hand-written loop** → mitigated by keeping the replacement minimal
  and colocated with the original call site so the diff is easy to
  review against the native function's documented semantics.
- **New PrefixAllGlobals sniff surfaces the 225 deferred WARNING
  findings as noise in local runs** → mitigated by keeping the new
  ruleset's CI gate scoped to ERROR-severity results only for now, with
  the WARNING-level findings visible but non-blocking (see Open
  Questions).

## Deferred (not implemented in this change)

WARNING-level Plugin Check findings from the production-build scan
that don't block Plugin Directory approval:

- 225 unprefixed local/global variable names
- 19 nonce-verification "recommended" / non-required notices
- 6 enqueued assets missing an explicit cache-busting version
- 11 unslashed/unsanitized/unvalidated superglobal reads (WARNING tier)
- 6 leftover `error_log()` calls
- Domain Path header pointing to a not-yet-existing `/languages` folder
- `composer.json` not shipped alongside `vendor/` in the package
- One `wp_redirect()` that could be `wp_safe_redirect()`
- 2 files with mixed line endings
- 3 hook names not prefixed / built dynamically
- 1 slow-query advisory (`meta_value` ordering)

## Open Questions

- Whether the new WordPress-standards phpcs ruleset's CI step should
  fail on ERROR-severity results only, or also surface (non-blocking)
  the WARNING-severity findings for future cleanup visibility. Doesn't
  change the specs or task breakdown — can be decided during the CI
  wiring task.
