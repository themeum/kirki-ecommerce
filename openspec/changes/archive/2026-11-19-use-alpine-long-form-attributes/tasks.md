# Tasks

## 1. Enforcement test

- [x] 1.1 Add a PHPUnit unit test in `tests/Unit/` that scans `resources/views/**/*.php` and `app/**/*.php` for an Alpine shorthand attribute (a token that starts an attribute with `@` or `:` and ends in `=`) and fails with the file and line of each hit. Verify it runs and, before the rewrite, fails and lists the 29 files. (Done: it failed on 29 files. Run unit tests with `php -d auto_prepend_file=bootstrap/abspath.php vendor/bin/phpunit --testsuite Unit`; `bin/phpunit` prints nothing without `ABSPATH`.)
- [x] 1.2 Add test cases for the scan itself (a view string with `@click="x"` and `:class="y"` is flagged; `x-on:click`, `x-bind:class` and a docblock `@since 1.0.0` are not). Verify they pass with `npm run test:php:unit`.
- [x] 1.3 Verify the group: run `npm run test:php:unit`, then `npm run typecheck && npm test` from `resources/app/`. (Typecheck passes. One unrelated test fails before and after this change: `features/home/tests/components/first-sale-card.test.tsx`, from the first-sale feature; nothing under `resources/app/` changed.)

## 2. Rewrite the views

- [x] 2.1 Record the baseline: shorthand count (280) and the count of `x-on:` plus `x-bind:` in `resources/views/` and `app/`. Verify the numbers are written in the working notes for the later comparison. (Baseline: 280 by the whitespace-prefixed grep and 32 long-form. The rewrite converted 283: three tokens start a line with no space before them, which the baseline grep missed. All 283 were checked line by line.)
- [x] 2.2 Convert every shorthand attribute in `resources/views/**/*.php` and `app/Services/MiniCartService.php` to the long form, keeping modifiers (`@click.outside` to `x-on:click.outside`, `@kecom:cart-updated.document` to `x-on:kecom:cart-updated.document`). Verify with `git diff`: only attribute names change, and no `:` in a PHP ternary or inline style was touched.
- [x] 2.3 Verify the counts: shorthand is 0, and the `x-on:` plus `x-bind:` count rose by the baseline shorthand count. Verify `php -l` passes on every changed file.
- [x] 2.4 Verify no CSS or TS selector depends on a shorthand attribute name (`grep` in `resources/site/scss` and `resources/site/ts`), and that the 1.1 test now passes.
- [x] 2.5 Verify the group: run `npm run test:php:unit` and the WordPress.org PHPCS check on the changed PHP, then `npm run typecheck && npm test` from `resources/app/`.

## 3. Component examples

- [x] 3.1 Update the usage examples in the header comments of `resources/site/ts/components/` (`popover.ts`, `modal.ts`, `dropdown.ts`, `add-to-cart.ts`, `form.ts`, `state-field.ts`) to the long form. Verify with `grep` that no shorthand attribute remains in those comments, and that no code changed.
- [x] 3.2 Verify the group: run `npm run typecheck && npm test` in `resources/site/`, then `npm run typecheck && npm test` from `resources/app/`.

## 4. Documentation and rules

- [x] 4.1 Add an "Alpine attributes" rule to `.claude/rules/php-standards.md`: long form only in views and PHP markup, with the reason (HTML filtering drops attribute names that start with `@` or `:`) and the pointer to `Template::get_block_markup_allowed_html()` for new attribute names in header or footer shortcodes. Verify the rule reads correctly and matches the test in 1.1.
- [x] 4.2 Make the note in `docs/release-package.md` section 5 a general statement of the same rule. Verify it matches the rule in 4.1 and the allow-list wording in `Template`.
- [x] 4.3 Verify the group: re-read both files for conflicts, then run `npm run typecheck && npm test` from `resources/app/`.

## 5. Final checks

- [x] 5.1 Run the existing block-markup allow-list tests (`tests/Integration/EscapedOutputTest.php`) with `npm run test:php:integration`, or, if the local database is not available, repeat the standalone kses check used for PR 493 against the converted currency switcher and mini cart markup. Verify the Alpine attributes survive and `onclick` and `<script>` are removed. (Done with the standalone kses check: the integration suite needs a database that is not running.)
- [x] 5.2 Run `npm run test:php:unit`, the WordPress.org PHPCS check on all changed PHP, and `npm run typecheck && npm test` from `resources/app/`. Verify all pass. (Unit suite 909 tests, PHPCS and `resources/site` checks pass. `resources/app` typecheck passes and 2338 of 2339 tests pass; the one failure is the unrelated `first-sale-card.test.tsx` noted in 1.3.)
- [x] 5.3 Write the "Backward compatibility" note for the response: no released public surface changed, the rendered DOM is equivalent, theme overrides keep working outside headers and footers.

## Workflow follow-up

- Commit as a separate commit on `fix/header-shortcode-alpine-attributes` (PR 493) after the header fix commit, and push, when the user asks.
- Update the PR 493 description to mention the convention change.
- Archive the change after review.
