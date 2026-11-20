# Proposal

## Why

Block theme headers and footers that the plugin prints go through `wp_kses()`, and kses drops any attribute name that starts with `@` or `:`. The currency switcher and mini cart already had to move to Alpine's long form (`x-on:`, `x-bind:`) so they work in a header. The other storefront views still use the shorthand (about 280 attributes in 29 files), so the codebase now has two styles, and the next shortcode or block that lands in a header will hit the same bug. One convention removes both problems.

## What Changes

- Rewrite every Alpine shorthand attribute in `resources/views/**` and `app/**` markup to its long form: `@event` becomes `x-on:event`, `:attr` becomes `x-bind:attr`, with modifiers kept (`@click.outside` becomes `x-on:click.outside`).
- Update the usage examples in the `resources/site/ts/components/*.ts` header comments to the same form.
- State the rule in the PHP standards file and in `docs/release-package.md`: storefront markup uses the long form only.
- Add an automated check that fails when shorthand appears in view or PHP markup, so the convention holds.
- No change to behaviour: Alpine treats `@x` and `x-on:x` as the same directive.

## Capabilities

### New Capabilities

- `alpine-attribute-standard`: the long-form-only convention for Alpine attributes in storefront markup, how it is documented, and how it is enforced.

### Modified Capabilities

<!-- None. No existing spec describes storefront view markup. -->

## Impact

- Code: 29 files under `resources/views/` and `app/Services/MiniCartService.php` (attribute names only), six header comments in `resources/site/ts/components/`.
- Docs and rules: `.claude/rules/php-standards.md`, `docs/release-package.md`.
- Tests: one new PHPUnit check under `tests/Unit/`.
- Compatibility: no public hook, route, signature or table changes. The rendered DOM is equivalent. A theme that overrides a view with shorthand keeps working, except inside a header or footer on plugin-rendered pages (the existing behaviour).
- Delivery: lands in the same pull request as the header shortcode fix (PR 493), as a separate commit.
