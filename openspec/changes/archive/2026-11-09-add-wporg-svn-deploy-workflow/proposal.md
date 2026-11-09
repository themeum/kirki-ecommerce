## Why

The WordPress.org release is manual today: a developer runs `npm run make:package` on their own machine and commits the result to the plugin SVN repository. This is slow, depends on the local environment (local `vendor/`, local Node and PHP versions), and can publish an SVN tag whose code does not match the tag name. The plugin now has a stable `v1.0.0` tag and is distributed through the WordPress.org directory, so each release needs one repeatable path from a Git tag to SVN.

## What Changes

- Add a GitHub Actions workflow `.github/workflows/deploy.yml` that runs when a stable release tag is pushed (`v1.2.3` or `1.2.3`).
- Pre-release tags (any tag with a `-` suffix, such as `v1.1.0-alpha.1` or `v1.1.0-rc.1`) do not start the workflow.
- `bin/make-package.sh` gets a `--version <x.y.z>` flag that writes the version into all three places it is used: the `Version:` header in `kirki-ecommerce.php`, the `KIRKI_ECOMMERCE_VERSION` constant, and `Stable tag:` in `readme.txt`. By default it rewrites the source files (local use, you commit the diff). With `--keep-source` it writes only the staged `build/kirki-ecommerce/` copy (deploy use).
- The workflow passes the tag version (without the leading `v`) with `--keep-source`, so the released package always has the tag's version, and the workflow never commits to the Git repository.
- The workflow builds the package with the existing `bin/make-package.sh` and deploys `build/kirki-ecommerce/` to `https://plugins.svn.wordpress.org/kirki-ecommerce/` with `10up/action-wordpress-plugin-deploy@2.3.0`. The SVN credentials come from the `SVN_USERNAME` and `SVN_PASSWORD` repository secrets.
- After the deploy, the workflow attaches the deployed zip (`kirki-ecommerce.zip`, made by the action's `generate-zip` option) to a GitHub Release for the tag. It creates the release when it does not exist.
- Update `docs/release-package.md` with a section that tells how to make a release with the workflow.

## Capabilities

### New Capabilities

- `wporg-release-deployment`: the release pipeline from a pushed Git tag to the WordPress.org SVN repository and a GitHub Release — which tags trigger it, the version it releases, what it deploys, and the release asset.

### Modified Capabilities

- `plugin-packaging`: the package command gets a `--version` flag (source or staged-only), and installs the PHP packages from the committed `composer.lock` only.

## Impact

- New file: `.github/workflows/deploy.yml`.
- Changed file: `docs/release-package.md` (new release section; the pre-submit checklist stays valid for manual checks).
- New repository secrets: `SVN_USERNAME`, `SVN_PASSWORD` (a WordPress.org account with commit access to `kirki-ecommerce`). A repository admin must add them before the first tag deploys.
- External systems: WordPress.org plugin SVN (trunk is replaced and a `tags/<version>` copy is made on each release) and GitHub Releases.
- Changed files: `bin/make-package.sh` (version flag, `composer install` only), `composer.json` and `composer.lock` (`brick/money` `^0.7.1`).
- No change to plugin PHP or TypeScript code. No `.wordpress-org/` assets directory exists, so the action does not change the SVN `assets/` directory (banners, icons, screenshots).
