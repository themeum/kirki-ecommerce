# Release package

How to build the WordPress.org zip, its known gaps, and what to check before you submit it.

## Table of contents

1. [Quick start](#1-quick-start)
2. [What the build does](#2-what-the-build-does)
3. [Known gaps](#3-known-gaps)
4. [Readable source](#4-readable-source)
5. [Output escaping rules](#5-output-escaping-rules)
6. [Pre-submit checklist](#6-pre-submit-checklist)

## 1. Quick start

```bash
npm run make:org-package
```

The zip is written to `build/kirki-ecommerce-<version>.zip`. Use `npm run make:package` for the full package that includes the payment gateway add-ons. Only the `--org` build is for WordPress.org.

The build runs `composer update` and installs production dependencies only. Afterwards your local `vendor/` has no dev tools (PHPUnit, PHPCS) and `composer.lock` may have changed. Run `composer install` to get the dev tools back, and review the `composer.lock` diff before you commit.

## 2. What the build does

1. Builds the admin app (`resources/app`) and the storefront (`resources/site`) into `assets/`.
2. Installs production Composer dependencies and restores the scoped framework layout.
3. Copies an allow-list of folders into `build/kirki-ecommerce/`.
4. For the `--org` build: writes a `payments.json` with PayPal only.
5. Removes hidden files, logs, Markdown files and the translation template.
6. Switches the plugin to production mode and creates the zip.

To keep a file out of the zip, add a removal line to `bin/make-package.sh` next to the existing ones. There is no `.distignore` file.

## 3. Known gaps

- The 12 framework `.stub` files under `vendor/libraries/framework/src/Console/stubs/` still ship. They are templates for the framework's `make:*` console commands; the plugin never reads them at runtime. The WordPress.org review flagged them, and removing them is planned.
- `vendor/brick/money/psalm.xml` still ships.
- The build does not check the package for forbidden files. Look at `unzip -l` yourself (section 6).

## 4. Readable source

WordPress.org requires the readable source of every compiled file. The zip does not include it. `readme.txt` points to the public GitHub repository, names the two source folders (`resources/app/` and `resources/site/`), and lists the commands to build them. Keep that section correct when the build changes.

The repository must stay public, and its default branch must contain both folders.

## 5. Output escaping rules

The WordPress.org reviewers do not accept `phpcs:ignore` comments as a replacement for escaping. Dynamic output must pass through an escaping call:

- Text and attributes: `esc_html()`, `esc_attr()`, `esc_url()`.
- Block theme header and footer markup (`Template::get_header()`, `Template::get_footer()`): `wp_kses()` with the allow-list from `Template::get_block_markup_allowed_html()`. Add a tag or attribute there when a theme needs it.
- SVG icons (`Icon::render()`): `wp_kses()` with the icon allow-list. Add a tag there when a new icon uses one.
- Email `<style>` block (`HtmlStyle::print_email_style_block()`): this is the one place that prints a `<style>` tag directly. Emails have no enqueue system, so it keeps a `phpcs:ignore` with its reason. It strips every tag from the CSS first, and the CSS comes only from developer-written arrays. Escaping it would turn the `>` child combinator into `&gt;` and break the rule.
- Payment webhook replies: plain text is escaped. For other types, the provider passes the tags it needs to `WebhookResult` as a `wp_kses()` allow-list.

Check with: `php -d auto_prepend_file=bootstrap/abspath.php vendor/bin/phpcs --standard=phpcs-wporg.xml.dist --ignore-annotations`. This ignores the `phpcs:ignore` comments, like the reviewers do. Exceptions thrown with a translated message are a known exception to this rule (they stay annotated; see `openspec/specs/wp-org-required-standards`).

## 6. Pre-submit checklist

1. Run `npm run make:org-package`.
2. Run `unzip -l build/kirki-ecommerce-<version>.zip` and look for anything that does not belong. The known gaps in section 3 are expected until they are fixed.
3. Check `vendor/composer/installed.json` in the zip: `brick/money` is 0.7.1 or later.
4. Install the zip on a clean site, then run the Plugin Check plugin on it.
5. Test the shop, cart, checkout and admin app on a block theme and on a classic theme.
6. Test the zip on WordPress Playground.
7. Run `composer install` to restore your dev tools.
