# Design

## Context

See proposal.md for the motivation. Current state, counted on the PR 493 branch:

- `Template::get_header()` and `get_footer()` run block theme markup through `wp_kses()`. kses rejects attribute names that do not start with a letter or underscore, so `@click` and `:class` are always dropped. This was confirmed against WordPress's own kses.
- The currency switcher view and `MiniCartService` already use `x-on:` and `x-bind:`. The allow-list in `Template::get_block_markup_allowed_html()` lists the long-form names they use.
- About 280 shorthand attributes remain in 29 view files. They print in page bodies, which are not filtered, so they work today.
- Six component files in `resources/site/ts/components/` show shorthand in header comments. No CSS or TS selector depends on a shorthand attribute name (checked).
- `.claude/rules/php-standards.md` and `docs/release-package.md` carry no general rule on this. The PR already adds a short note to the release package doc.

## Goals / Non-Goals

**Goals:**

- One style for Alpine event and binding attributes everywhere in storefront markup.
- A future header or footer shortcode never loses its attributes to the `@` and `:` limit.
- The style is enforced by a test, not by memory.

**Non-Goals:**

- Changing the kses allow-list design. It stays an explicit list of attribute names, as in PR 493. Allowing every `x-*` name found in the markup is a separate decision.
- Touching `x-data`, `x-show`, `x-text` and other directives that already use the `x-` prefix.
- Any behaviour, markup structure or style change beyond the attribute names.
- The React admin app in `resources/app/`, which does not use Alpine.

## Decisions

**1. Long form everywhere, not "long form only in headers".**
A view cannot know where a store owner will place it, and a shortcode can be dropped into a header at any time. A split rule ("shorthand in pages, long form in shortcodes") needs a judgement per file and fails silently when a page view is later reused in a header. One rule needs no judgement. Alternative considered: keep shorthand in page views and only fix shortcodes. It is a smaller diff, but it leaves two styles and the same trap.

**2. A one-off scripted rewrite, reviewed by diff.**
Apply a perl substitution to `resources/views/**/*.php` and `app/Services/MiniCartService.php`:
`@<name>` to `x-on:<name>` and `:<name>` to `x-bind:<name>`, only where the token starts an attribute (preceded by whitespace and followed by `=`). The script is not committed. The diff is reviewed for false positives (for example a `:` in a PHP ternary or an inline style). Alternative considered: hand edits. They are slower and more error-prone for 280 sites.

**3. Verify by counts, not by eye.**
Before and after counts must match: shorthand goes from 280 to 0 and long-form `x-on:` plus `x-bind:` rises by the same amount. Every changed file passes `php -l`. Alpine treats both forms as the same directive, so no behaviour check beyond that is needed. Visual confirmation is left to the user, since the project forbids browser previews.

**4. Enforce with a PHPUnit unit test that scans files.**
A test under `tests/Unit/` reads the `.php` files in `resources/views/` and `app/`, and fails on a line where a token starting with `@` or `:` is followed by `=` and begins an attribute. The `=` requirement keeps docblock tags such as `@since` out. The failure message names file and line. Alternatives considered: a PHPCS sniff (more setup, and views are only partly covered by the existing rulesets) and an ESLint rule (does not read PHP). A unit test needs no database, so it runs fast and also in CI.

**5. Document the rule where developers read it.**
Add a short "Alpine attributes" rule to `.claude/rules/php-standards.md`, which loads for `app/` and `resources/views/` work, and fold the existing note in `docs/release-package.md` into a general statement. Update the six TS comment examples so a copied example is compliant. `CLAUDE.md` section 2 says the rule files derive from the code, so this follows from the code change.

**6. Delivery.**
Same branch and pull request as the header fix, in its own commit after it, so the bug fix can be reviewed and reverted separately from the mechanical rewrite. The change's planning files are part of that commit.

## Risks / Trade-offs

- [Substitution rewrites something that is not an Alpine attribute] -> The rule only matches a token that starts an attribute and ends in `=`. The full diff is reviewed. `php -l` runs on every file. The before and after counts must agree.
- [A theme overrides a view and keeps shorthand] -> It keeps working on normal pages. In a header on a plugin page it was already filtered before this change. The documentation says to use the long form. No public surface changes.
- [A large diff hides a real change] -> Only attribute names change. The commit is separate from the bug fix. Reviewers can confirm with a count of `x-on:` and `x-bind:` against the removed shorthand.
- [The scan test flags a legitimate `@x=` or `:x=` in PHP] -> The test is limited to attribute position. If a real case appears, narrow the pattern in the test and note it here.
- [Future Alpine directives in headers need allow-list entries] -> Unchanged by this work and noted in `Template`. The allow-list approach is a separate decision.
