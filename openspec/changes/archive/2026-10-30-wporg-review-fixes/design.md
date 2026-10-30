# Design

## Context

See proposal.md for the review findings. Facts checked in the code and in a fresh `npm run make:org-package` build:

- The flagged output lines already carry `phpcs:ignore` comments (added 22 Oct) and the reviewers still reported them. Suppression comments are not accepted.
- `bin/make-package.sh` copies an allow-list of paths, then removes files with inline `rm` and `find` commands. There is no `.distignore`. `composer install --no-dev` removes PHPUnit and the other dev packages; `_test-tools` could not be reproduced by this script.
- The 12 `.stub` files are read only by the framework's `make:*` and `queue:*` console commands (`CommandBase::stub_path()`). Nothing in `app/`, `bootstrap/` or `routes/` calls those commands.
- `"brick/money": "0.7"` is an exact pin in Composer, so `composer update` cannot move to 0.7.1.
- `WebhookResult` raw bodies are used only by the 2Checkout and Eway add-ons (XML read receipt for 2Checkout). The wp.org build ships only PayPal, which does not use raw bodies. The code path exists in core, so the reviewer sees it.
- Admin and storefront assets already use `wp_enqueue_*` and `wp_add_inline_*`. The only direct `<style>` output is the email helper.

## Goals / Non-Goals

**Goals:**
- Every flagged output passes through a real escaping call, with no behavior change for valid markup and protocol bodies.
- The zip contains no dev or scaffolding files, and the build enforces that.
- Readable source and build steps are available to reviewers.

**Non-Goals:**
- No change to how scripts and styles are enqueued.
- No change to the framework's console commands themselves; only their stub files are left out of the release.
- No move to `wp dist-archive` or a `.distignore` file.

## Decisions

1. **Escape with real calls, keep the markup working.**
   - Block header and footer in `Template.php`: `wp_kses_post()`. Block markup is post-content-like HTML, so the post allow-list fits. Alternative: a custom allow-list. Rejected: more to maintain. Verified on a block theme and a classic theme.
   - Email style in `HtmlStyle.php`: left as it was (tags stripped, `phpcs:ignore` with reason). Emails have no enqueue system, and `esc_html()` would turn the `>` combinator into `&gt;` and break the rule. See the correction below.
   - Inline CSS for `wp_add_inline_style()`: left unchanged. It comes from developer-written arrays, nothing flagged it, and core already removes a `<style>` wrapper from it.
   - Inline JS config (`Assets::get_kirki_ecommerce_configs()`): build the `window.kirki_ecommerce = ...;` string from `wp_json_encode()` with `JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT`. Alternative: pass data with `wp_localize_script()`. Rejected: it changes how the admin app and the filter `DevHookNames::CONFIG_DATA` read the config.

2. **Webhook body: escape by content type.**
   - `text/plain`: `esc_html()`.
   - XML and other types: `wp_kses()` with an allow-list that the provider's result supplies (new optional argument on `WebhookResult`), so the 2Checkout `<EPAYMENT>` tag survives.
   - Alternative: leave the raw echo and explain it to the reviewer. Rejected: that is what failed. Alternative: move raw emission into the add-ons, which are not submitted to wp.org. Kept as the fallback (see Risks).

3. **Stubs and dev files: more `rm` lines in `make-package.sh`**, next to the existing ones. Alternative: a central `.distignore`. Rejected for now: the script has no such mechanism and the smaller change fits it. Remove `vendor/libraries/framework/src/Console/stubs/` and `vendor/brick/money/psalm.xml`.

4. **Self-checking build.** After the cleanup, `make-package.sh` greps the staged folder for forbidden names (`*.stub`, `phpunit`, `php-parser`, `_test-tools`, `*.map`, `psalm.xml`, `tests` directories) and exits non-zero with the file list. This turns the reviewer's list into a gate instead of a manual `unzip -l`.

5. **Source in the zip.** Copy `resources/app` and `resources/site` into the staged plugin excluding `node_modules`, `dist` and build caches, in the `--org` build. The readme gets a short build section (`npm ci` and `npm run build` in each folder). The public GitHub repository link stays. Alternative: only link the repo. Rejected: the reviewer flagged the link-only state already, and shipping source removes any doubt.

6. **brick/money.** Set the constraint to `^0.7.1`, run `composer update brick/money`, and run the full suite. The release also allows `brick/math` 0.11.

## Risks / Trade-offs

- [`wp_kses_post()` strips markup a block theme needs] → Compare rendered header and footer HTML before and after on a block theme; add a unit test with representative block markup.
- [`wp_kses()` lowercases tag names, and 2Checkout may need `<EPAYMENT>` in upper case] → Check the provider's documentation and run its webhook test. If case matters, use the fallback: add-ons emit their own raw body and core only emits escaped bodies.
- [The reviewer may flag the email `<style>` line again] → Reply that it is email-only and has no enqueue system; the CSS comes from developer arrays and tags are stripped.
- [`make-package.sh` runs `composer update` and rewrites `composer.lock` and the local `vendor/`] → Commit the lock change on purpose; run `composer install` afterwards to restore dev tools. Not changed in this work.
- [Shipping source grows the zip] → Source only, no `node_modules`; size is checked after the build.

## Migration Plan

1. Land the PHP escaping changes and tests.
2. Land the build script, `composer.json` and readme changes.
3. Build with `npm run make:org-package`; the new build check must pass.
4. Install the zip on a clean site (a classic theme and a block theme) and on WordPress Playground; test the shop, checkout, admin app, and a PayPal webhook.
5. Run `composer phpcs:wporg` and the Plugin Check plugin on the zip, then resubmit.

Rollback: all changes are in source control; revert the commit. Nothing is stored or migrated at runtime.

## Open Questions

- Does the reviewer's own scanner flag `wp_json_encode()` output passed to `wp_add_inline_script()`? Answered only by running Plugin Check on the zip; the fix then would be `wp_localize_script()`-style data passing.

## Correction during implementation

- **Webhook tag case.** The design feared `wp_kses()` would lowercase `<EPAYMENT>`. A test shows it keeps the original case, and the 2Checkout receipt is `<sig algo date>` (lower case) or `<EPAYMENT>`. So no fallback to add-on-owned output was needed. The 2Checkout add-on now passes `sig` and `epayment` as its allow-list.
- **Inline config script.** `Assets::get_kirki_ecommerce_configs()` already used `wp_json_encode()` (through `Arr::json_encode()`) with `JSON_HEX_TAG`, and `InlineConfigScriptTest` already covers a `</script>` payload. No change was needed there.
- **Email style.** First changed to `esc_html()` with child combinators printed as descendant selectors, then reverted at the maintainer's request: that changes how nested rich text is styled in email clients, which was not tested. The original line stays, and the reviewer gets an explanation instead.
- **Block markup.** `wp_kses_post()` would strip forms, SVG and the ARIA and `data-*` attributes that the navigation and search blocks use, so `Template` uses `wp_kses()` with a wider allow-list built on the `post` list. Scripts from a Custom HTML block in a header are no longer printed on plugin pages.
- **Exception messages.** Six `throw` sites keep their `ExceptionNotEscaped` annotation (see the existing note about double-escaping). Plugin Check respects the annotation and does not report them.

- **Reverted extras.** The `wp_strip_all_tags()` wrappers on inline CSS and the plugin version on the production admin script enqueues were removed again: nothing in the review or in PHPCS flagged them, and they changed nothing.
