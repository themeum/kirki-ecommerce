## Context

Requirements are in `specs/php-docblock-standard/spec.md`; motivation in `proposal.md`. Facts that shape the approach:

- 624 in-scope files (530 under `app/`, 94 under `database/`), roughly 62k lines. No file depends on another file's docblock, so batches are fully independent.
- Docblock text must be true, so each method body is read; descriptions cannot be generated from names.
- Types come from the code and its callers. Callers may live in other batches, so agents may read anywhere but write only inside their own batch.
- `phpcs.xml.dist` (PSR12) and `phpcs-wporg.xml.dist` exist; WPCS is installed under `vendor/wp-coding-standards/wpcs`.
- The frontend is untouched, so the `npm run typecheck && npm test` verification step the repo normally asks for does not apply; the PHP equivalents (token check, `php -l`, phpcs) replace it.

## Goals / Non-Goals

**Goals:**
- Finish quickly by running independent folder batches as parallel sub-agents, coordinated by the main agent.
- Prove mechanically that only comments changed.
- Leave a lint rule behind that keeps new code compliant.

**Non-Goals:**
- Native type hints, renames, refactors, dead-code removal, or fixing bugs found while reading. Anything noticed is reported, not changed.
- Touching frontend code or `vendor/libraries/framework/`.

## Decisions

**Orchestration: main agent delegates, sub-agents write.** The main agent prepares shared tooling, launches every batch at once, collects reports, runs the whole-tree gate, and does the small serial parts (CLAUDE.md, phpcs config). Sub-agents never run git, `composer scope`, or edit outside their batch. Alternative considered: one agent walking all files serially; rejected as slow with no benefit, since batches share no state.

**Batches by folder, balanced by lines (about 2.5-4.5k lines each).** Every file under `app/` and `database/` belongs to exactly one batch; a coverage script confirms this before launch.

| Batch | Scope | Files |
|---|---|---|
| B1 | `app/Http/Controllers/Api` | 35 |
| B2 | `app/Http/Controllers/Site`, `app/Http/Middlewares`, `app/Blocks`, `app/Shortcodes`, `app/Hooks` | 19 |
| B3 | `app/Http/Requests`, first half alphabetically | ~32 |
| B4 | `app/Http/Requests`, second half | ~31 |
| B5 | `app/DTO` | 73 |
| B6 | `app/Constants`, `Contracts`, `Events`, `Listeners`, `Jobs`, `Policies`, `Traits`, `Facades` | 73 |
| B7 | `app/Resources` | 44 |
| B8 | `app/Services`, first half alphabetically | 18 |
| B9 | `app/Services`, second half | 18 |
| B10 | `app/Models`, `Concerns`, `Parsers`, `Wordpress` | 49 |
| B11 | `app/Actions`, `app/Decisions` | 42 |
| B12 | `app/Supports`, `Currency`, `Tax` | 29 |
| B13 | `app/Menu`, `Scheduler`, `Settings`, `Providers`, `Mails`, `app/AppSettings.php`, `KirkiEcommerce.php`, `helpers.php` | 57 |
| B14 | `app/Managers`, `app/Payment` | 10 |
| B15 | `database/migrations` | 66 |
| B16 | `database/seeders` (including `OnBoarding`) | 28 |

Sixteen agents launch in one message. B8/B9 and B3/B4 are split because `Services` and `Requests` are the largest folders.

**Verification tool written once, before launch.** The main agent writes a small PHP script (kept in the session scratchpad, not committed) that, for a list of files and a git ref, tokenizes the old and new versions with `token_get_all`, drops `T_COMMENT`, `T_DOC_COMMENT` and `T_WHITESPACE`, and reports any file whose streams differ. Each sub-agent runs it on its own files; the main agent runs it on everything at the end. Alternative considered: trust review of the diff; rejected because at 600 files a slipped signature edit is easy to miss.

**Sub-agent brief is self-contained.** It includes the docblock rules from the spec, the templates below, its file list, the verification command, and the reporting format. Sub-agents run `php -l` and the token check on each file and fix failures before finishing. They report: files done, files skipped with reason, and any suspicious code noticed (for the user, not fixed).

```php
/**
 * Manages the shopper's cart: lookup, guest merge and item changes.
 *
 * @since 1.0.0
 */
class CartService
{
    /**
     * Resolve the canonical cart for the given identity.
     *
     * Merges any guest cart found via the token into the user's own cart.
     *
     * @since 1.0.0
     *
     * @param int|null    $user_id Authenticated user ID, if any.
     * @param string|null $token   Guest cart token.
     * @return CartModel|null Null when no cart exists.
     * @throws AuthorizationException When the token belongs to another user.
     */
    public function get_cart($user_id = null, $token = null)

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function boot()

    /** @var array<string, PaymentGateway> */
    protected $gateways_registry = [];
}
```

**`@since 1.0.0` on every class-like and callable, including protected methods.** This codebase uses no `private`, so protected members are effectively API for subclasses and internal developers. `@since` on properties adds nothing and is omitted.

**Types: `Type[]` for lists, `array<K,V>` for maps, `Type|null` for nullables, `mixed` when unknown.** The codebase currently mixes `Foo[]` and `array<>`; this picks one reading per shape. No native types are added because that changes runtime behavior (coercion, TypeErrors) and the project targets PHP 7.4.

**Enforcement through PHPCS in `phpcs.xml.dist`.** Comment sniffs run on `app/` and `database/`. Added last, after the tree is compliant, so the rule can be verified to pass with zero errors instead of being tuned against a half-migrated tree.

**CLAUDE.md §2 updated in the same change.** Its Docblocks section currently says `@since` is unused and not to add it; that would contradict the new standard for the next session.

## Risks / Trade-offs

- [Docblocks that only restate names, adding noise] → The brief forbids restating the name and requires reading the body; the main agent spot-reads a sample from each batch report before accepting.
- [A sub-agent edits code by accident] → Per-file token check by the agent, then again tree-wide by the main agent; any mismatch is reverted for that file and redone.
- [Wrong types written confidently] → `mixed` is required over guessing; agents check callers with search for anything non-obvious.
- [Two agents editing the same file] → Coverage script proves batches are disjoint and complete; agents are told to write only inside their batch.
- [Comment sniffs too strict, flagging legitimate existing code] → Enabled only after adoption; individual sniffs are excluded with a stated reason rather than the standard being loosened.
- [Large single PR] → Diff is comment-only and proven so by the token check; reviewers can scan by batch, as commits are grouped by batch.
- [`@since 1.0.0` is a stand-in for real history] → Accepted: nothing has shipped as stable, and alpha tags are not meaningful to wordpress.org readers.

## Migration Plan

No deployment or data steps. Rollback is `git revert` of the PR; no runtime behavior depends on any comment.

## Open Questions

- Which PHPCS sniffs enforce `@since` presence? Stock `Squiz.Commenting.*` sniffs cover summary, `@param`, `@return` and `@var` structure, but whether any stock sniff can require `@since` was not checked. If none can, a minimal local sniff is added in the enforcement task. This does not change the specs or the batch plan.

## Corrections during implementation

- Property docblocks may be single-line (`/** @var Type */`, `/** @inheritDoc */`). The codebase already writes 63 `@inheritDoc` and hundreds of `@var` this way; forcing three lines each would churn every property for no gain.
- Constructors and destructors omit `@return`, matching the PHPCS `Squiz.Commenting.FunctionComment` convention, so `@return void` is not forced onto `__construct`.
- `@throws` also covers exceptions raised via the `throw_if()` / `throw_anyway()` helpers (default class `Exception` unless another is passed). They throw at the call site, so they count as thrown directly; an exception that merely bubbles up from a called method still does not.
- Stock `Squiz.Commenting.*` / `Generic.Commenting.DocComment` sniffs were tried against the finished tree and rejected: about 10,000 violations, nearly all conflicts with the standard itself (they demand native type hints, forbid `@since` on class docblocks, disallow single-line `/** @var */`, and want `@param` grouped before other tags). None can require `@since`. Enforcement is therefore one local sniff, `phpcs/KirkiEcommerce/Sniffs/Commenting/RequiredDocblockSniff.php`, run as `composer phpcs:docblocks` (also a CI step) and enabled in `phpcs.xml.dist`.
- The sniff checks presence of a docblock on every class-like, method, function and property; a summary line; `@since` on callables and class-likes and none on properties; `@param` count against the signature; `@return` (not on constructors/destructors); `@var` on properties; and tag order. `@inheritDoc` docblocks are exempt from summary, `@param`, `@return` and `@var`. `@throws` is deliberately not enforced: whether a method raises an exception itself, or catches it locally, is not decidable from tokens without false positives (`DiscountService::calculate` is one), so it stays a review item.
- `include-pattern type="relative"` did not match in `phpcs.xml.dist` even with `basepath` set; plain `*/app/*` and `*/database/*` patterns do, so those are used.

