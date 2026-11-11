# Release package

How to build the WordPress.org zip, its known gaps, and what to check before you submit it.

## Table of contents

1. [Quick start](#1-quick-start)
2. [What the build does](#2-what-the-build-does)
3. [Known gaps](#3-known-gaps)
4. [Readable source](#4-readable-source)
5. [Output escaping rules](#5-output-escaping-rules)
6. [Pre-submit checklist](#6-pre-submit-checklist)
7. [Release to WordPress.org](#7-release-to-wordpressorg)
8. [Where this differs from a manual release](#8-where-this-differs-from-a-manual-release)

## 1. Quick start

```bash
npm run make:package
```

To set a new version, add `--version`:

```bash
npm run make:package -- --version 1.0.1                 # writes 1.0.1 into the source files, then builds
npm run make:package -- --version 1.0.1 --keep-source   # writes 1.0.1 into the build copy only
```

`--version` writes the version into the three places the plugin declares it: `Version:` in the `kirki-ecommerce.php` header, `define('KIRKI_ECOMMERCE_VERSION', '...')` in `kirki-ecommerce.php`, and `Stable tag:` in `readme.txt`. Without `--keep-source` you get a diff in those two files to commit. With `--keep-source` your source files do not change (the deploy workflow uses this). The version is `x.y.z` or `x.y.z-suffix` (for example `1.1.0-beta.1`), without a `v`. A wrong value, `--keep-source` without `--version`, or an unknown argument stops the command before it builds anything.

The zip is written to `build/kirki-ecommerce-<version>.zip`. It is the WordPress.org package. It has no payment gateway add-ons. Gateways install from the remote catalog (see `docs/payment-gateways.md`).

The build installs the PHP packages from the committed `composer.lock` and does not change it. If you changed `composer.json`, run `composer update` and commit `composer.lock` first: when the lock does not satisfy `composer.json`, the build stops. Afterwards your local `vendor/` has production dependencies only, with no dev tools (PHPUnit, PHPCS). Run `composer install` to get the dev tools back.

## 2. What the build does

1. Builds the admin app (`resources/app`) and the storefront (`resources/site`) into `assets/`.
2. Installs production Composer dependencies and restores the scoped framework layout.
3. Copies an allow-list of folders into `build/kirki-ecommerce/`.
4. Removes hidden files, logs, Markdown files and the translation template. It also removes the preset data source (`resources/data/preconfigured-data/`, which holds the sample product images too): the plugin reads it from S3 (see `docs/preset-data.md`).
5. Switches the plugin to production mode and creates the zip.

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
- Payment webhook replies: core always answers with the JSON envelope and never prints a raw body. A gateway that needs its own exact reply (2Checkout's signed receipt) prints it from its own add-on, which the WordPress.org package does not include.

Check with: `php -d auto_prepend_file=bootstrap/abspath.php vendor/bin/phpcs --standard=phpcs-wporg.xml.dist --ignore-annotations`. This ignores the `phpcs:ignore` comments, like the reviewers do. Exceptions thrown with a translated message are a known exception to this rule (they stay annotated; see `openspec/specs/wp-org-required-standards`).

## 6. Pre-submit checklist

1. Run `npm run make:package`.
2. Run `unzip -l build/kirki-ecommerce-<version>.zip` and look for anything that does not belong. The known gaps in section 3 are expected until they are fixed.
3. Install the zip on a clean site, then run the Plugin Check plugin on it.
4. Test the shop, cart, checkout and admin app on a block theme and on a classic theme.
5. Test the zip on WordPress Playground.
6. Run `composer install` to restore your dev tools.

## 7. Release to WordPress.org

The workflow `.github/workflows/deploy.yml` publishes a release when you push a stable tag.

### Before the first release

A repository admin adds two repository secrets: `SVN_USERNAME` and `SVN_PASSWORD`. They are the login of a WordPress.org account that has commit access to the `kirki-ecommerce` plugin.

### Make a release

1. Set the new version in the source files and commit the diff: `npm run make:package -- --version 1.0.1` (section 1). This step keeps the repository version correct. The release gets the tag version even if you forget it.
2. Merge the change and wait for the `Tests` workflow to pass.
3. Tag the commit and push the tag:

   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

### Which tags deploy

| Tag | Deploys |
|---|---|
| `v1.0.1`, `1.0.1` | Yes |
| `v1.1.0-alpha.1`, `v1.1.0-rc.1` (any `-` suffix) | No. WordPress.org has no pre-release channel. |
| `v1.1`, `release-1.1.0` | No |

### What the workflow does

1. It runs `bin/make-package.sh --version <tag without v> --keep-source` (sections 1 and 2). The package gets the tag version in all three places. The source files do not change, and the workflow commits nothing to the Git repository.
2. It replaces SVN `trunk/` with `build/kirki-ecommerce/` (files that are not in the package are deleted from `trunk/`) and copies `trunk/` to `tags/<version>/`.
3. It attaches `kirki-ecommerce.zip` (a zip of the deployed `trunk/`) to the GitHub Release for the tag. If no release exists, it creates one with generated notes. If you made the release by hand first, its title and notes stay as you wrote them.

Only one deploy runs at a time. A second tag waits for the first deploy to end.

### Run it again

Re-run the failed job in GitHub Actions. If SVN already has `tags/<version>/`, the workflow does not commit again, and it replaces the zip on the GitHub Release. To publish different code, make a new patch version. The workflow does not change a published SVN tag.

## 8. Where this differs from a manual release

- **No tests in the deploy job.** The workflow does not run PHPUnit, PHPCS or the frontend tests. It expects that the tagged commit passed the `Tests` workflow on `main` or `dev`.
- **No WordPress.org assets.** The repository has no `.wordpress-org/` directory, so the banners, icons and screenshots in SVN `assets/` do not change. Update them by hand.
- **No changelog.** The workflow does not write the `== Changelog ==` section of `readme.txt`. Write it before you tag.
- **The repository version can stay old.** The workflow writes the tag version into the package only. If you tag `v1.0.1` on a commit that still says `1.0.0`, WordPress.org gets `1.0.1`, but the repository keeps `1.0.0` until you commit the change (step 1 of "Make a release").
- **No manual checks.** The pre-submit checklist (section 6) does not run. Do steps 2 to 5 on the release candidate before you push the tag.
