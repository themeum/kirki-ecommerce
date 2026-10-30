# Tasks

## 1. Output escaping

- [x] 1.1 Replace the `phpcs:ignore` on the block header and footer in `app/Supports/Template.php` with `wp_kses_post()`; add a unit test with representative block markup and verify the test passes and the markup is unchanged
- [x] 1.2 Inline CSS in `Root.php`, `EnqueueSiteScripts.php` and `EnqueueAdminScripts.php` — left unchanged on purpose: nothing flagged it and core already removes a `<style>` wrapper
- [x] 1.3 Build the `window.kirki_ecommerce` config in `app/Supports/Assets.php` from `wp_json_encode()` with the tag-safe flags; verify a unit test shows `</script>` and quotes in a config value cannot end the script — already safe: `Arr::json_encode()` is `wp_json_encode()` and `InlineConfigScriptTest` covers a `</script>` payload; no change needed
- [x] 1.4 Email style block in `app/Supports/HtmlStyle.php` — left unchanged on purpose: escaping would break the `>` combinator; it keeps `wp_strip_all_tags()` and its `phpcs:ignore` reason
- [x] 1.5 Add content-type-aware escaping to the webhook acknowledgement in `app/Payment/WebhookController.php`, with an optional tag allow-list on `app/Payment/WebhookResult.php`; verify tests for a plain-text body and an XML body (`<EPAYMENT>` kept) pass
- [x] 1.6 Confirm the 2Checkout read-receipt format and tag case against the provider documentation; if case matters, apply the fallback in design.md and note it in the design under "Correction during implementation" — 2Checkout sends `<sig algo date>` or legacy `<EPAYMENT>`; `wp_kses()` keeps both exactly (tested), so no fallback was needed
- [x] 1.7 Grep `app/` for remaining `OutputNotEscaped` suppression comments on dynamic values and verify none remain except documented protocol responses
- [x] 1.8 Verify the group: run `composer phpcs:wporg`, `composer test`, and `npm run typecheck && npm test` from `resources/app/`

## 2. Dependency update

- [x] 2.1 Change `brick/money` to `^0.7.1` in `composer.json`, run `composer update brick/money`, and verify `composer.lock` shows 0.7.1 and no unrelated package changed
- [x] 2.2 Run the money, tax and currency tests and verify they pass without changed expected values
- [x] 2.3 Verify the group: run `composer test` and `npm run typecheck && npm test` from `resources/app/`

## 3. Package contents and source

- [ ] 3.1 Remove the framework console stubs and vendor `psalm.xml` from the package — deferred, not part of this PR
- [ ] 3.2 Confirm no runtime path reads the stubs and that the plugin works from the built zip — deferred with 3.1; install checks are also in 4.3
- [ ] 3.3 Add the post-build forbidden-file check — deferred with 3.1
- [x] 3.4 Source is not copied into the `--org` package — kept out on purpose; the readme points to the public repository (see task 3.5)
- [x] 3.5 Update `readme.txt` with the source folders and build commands for each bundle; verify the repository link opens without login and the default branch contains those folders
- [x] 3.6 Add `docs/release-package.md` describing the package build, its known gaps and the pre-submit checklist
- [x] 3.7 Verify the group: run `npm run make:org-package` and `npm run typecheck && npm test` from `resources/app/`

## 4. Final release check

- [x] 4.1 Run `unzip -l` on the built zip and verify no `phpunit`, `php-parser`, `_test-tools`, `.map` or test files, no frontend source, and that `brick/money` is 0.7.1 in `vendor/composer/installed.json` (the 12 `.stub` files remain until 3.1)
- [x] 4.2 Run `composer phpcs:wporg` and the Plugin Check plugin on the built zip and verify there are no escaping, enqueue or file findings; resolve the design.md open question with the result
- [ ] 4.3 Install the zip on a clean site with a classic theme and a block theme, and on WordPress Playground; verify the shop, cart, checkout, admin app, a PayPal webhook, and an order email — not done yet: needs a person to look (no browser use in this project). Covered so far by Plugin Check on the zip (0 errors), PHP lint of all 1115 files, and the integration tests
- [x] 4.4 Run `composer install` to restore the dev vendor folder and review the `composer.lock` diff before committing

## Workflow follow-up

- Archive the change after the zip is accepted by WordPress.org.
