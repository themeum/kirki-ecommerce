## Context

- `bin/make-package.sh` (`npm run make:package`) already builds the WordPress.org package. It builds `resources/app` and `resources/site`, installs production Composer packages, restores the scoped framework, and leaves the plugin folder at `build/kirki-ecommerce/` plus `build/kirki-ecommerce-<version>.zip`. It reads the version from the `Version:` header.
- `.github/workflows/tests.yml` shows the CI setup that works today: `ubuntu-latest`, PHP 7.4 through `shivammathur/setup-php@v2` with Composer, Node 20 through `actions/setup-node@v4`, and Subversion installed by `apt-get`. `themeum/framework` is a public repository, so `composer install` works in CI without extra credentials.
- The version is in three places: `kirki-ecommerce.php` header (`Version:`), `define('KIRKI_ECOMMERCE_VERSION', '...')` in the same file, and `readme.txt` (`Stable tag:`).
- Existing tags: `v1.0.0` and `v1.0.0-alpha.1` … `alpha.4`. The repository has no `.wordpress-org/` directory.
- `10up/action-wordpress-plugin-deploy@2.3.0` (latest release, January 2025) reads `SLUG`, `VERSION`, `BUILD_DIR`, `ASSETS_DIR`, `SVN_USERNAME` and `SVN_PASSWORD` from the environment. When `VERSION` is empty, it takes `GITHUB_REF` without `refs/tags/` and without a leading `v`. With `BUILD_DIR`, it does `rsync -rc --delete` of that folder into `trunk/`. When `tags/<version>` already exists in SVN, it skips the commit. With `generate-zip: true`, it zips SVN `trunk/` as `${GITHUB_WORKSPACE}/<slug>.zip` and gives the path in the `zip-path` output. It calls `svn`, which the runner image does not always have.

Requirements are in `specs/wporg-release-deployment/spec.md`.

## Goals / Non-Goals

**Goals:**

- One workflow file, one job, that a maintainer starts by pushing a tag.
- Use the package command as it is, so the CI package and a local package come from the same script.

**Non-Goals:**

- Running the test suite again in the deploy job. `tests.yml` runs on every push to `main` and `dev`, and the tag is put on a commit that already passed.
- Managing `.wordpress-org/` assets (banners, icons, screenshots). This can come in a later change.
- Writing release notes or a changelog. The created release uses GitHub's generated notes.
- A manual "dry run" trigger (`workflow_dispatch`). Not requested.

## Decisions

### D1. Tag filter in `on.push.tags`, not an `if:` in the job

```yaml
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
      - '[0-9]+.[0-9]+.[0-9]+'
```

GitHub filter patterns match the full tag name, `+` means "one or more of the previous character", and `.` is a literal dot. So `v1.2.0-alpha.1` does not match and the workflow does not start at all. An `if:` on the job would show a skipped run for each pre-release tag, which adds noise.

*Alternative:* the `release: published` event. Rejected: the user asked for "on creating a new tag", and with a release event the release must exist first.

### D2. The tag is the version; the package command writes it

The build step passes `--version "${GITHUB_REF_NAME#v}" --keep-source` to `make-package.sh` (D8). The staged package then has the tag version in all three places, whatever the source files contain, so a forgotten version bump cannot reach SVN with a wrong number.

*Alternative (first implementation, superseded):* a guard step that fails when the tag and the three source values differ. Rejected after review: people often forget one of the three places, and the guard only turns that into a failed release that must be fixed and tagged again.

### D3. Build with `bash bin/make-package.sh`, deploy `build/kirki-ecommerce`

The job sets up PHP 7.4 (with Composer) and Node 20 like `tests.yml`, with npm cache for `resources/app/package-lock.json` and `resources/site/package-lock.json`, then runs `bash bin/make-package.sh --version "${GITHUB_REF_NAME#v}" --keep-source`. The action gets `BUILD_DIR: build/kirki-ecommerce` and `SLUG: kirki-ecommerce`. `VERSION` is not set; the action reads it from the tag, the same value that D2 writes into the package. `ASSETS_DIR` is not set; the default `.wordpress-org` does not exist, so the action skips assets.

*Alternative:* let the action export the Git tree with `.distignore`. Rejected: the package needs the frontend build, the scoped framework and the production-mode patch, which only `make-package.sh` does.

### D4. Install Subversion before the deploy step

`sudo apt-get update && sudo apt-get install -y subversion`, the same line as `tests.yml`. The action needs `svn`, and `ubuntu-latest` (24.04) does not include it.

### D5. GitHub Release with `gh`, from the action's `zip-path`

The deploy step has `id: deploy` and `with: generate-zip: true`. The next step uses the `gh` CLI that the runner has, with `GH_TOKEN: ${{ github.token }}`:

```bash
gh release view "$GITHUB_REF_NAME" >/dev/null 2>&1 \
  || gh release create "$GITHUB_REF_NAME" --verify-tag --title "$GITHUB_REF_NAME" --generate-notes
gh release upload "$GITHUB_REF_NAME" "${{ steps.deploy.outputs.zip-path }}" --clobber
```

`--clobber` replaces an asset with the same name on a re-run. A release made by hand keeps its notes because the step only creates when `view` fails. The job has `permissions: contents: write`.

*Alternative:* attach `build/kirki-ecommerce-<version>.zip` from `make-package.sh` and skip `generate-zip`. Both zips have the same files. The action's zip is made from SVN `trunk/` after the commit, so it is exactly what WordPress.org serves; on a re-run where SVN already had the version, it still zips the current `trunk/`. Chosen because the user asked for the deployed build. *Alternative:* `softprops/action-gh-release`. Rejected: one more third-party action with write access, when `gh` does the same in three lines.

### D6. Concurrency group without cancel

```yaml
concurrency:
  group: deploy-wporg
  cancel-in-progress: false
```

A cancelled SVN commit can leave a working copy half done, and two parallel commits to `trunk/` can conflict. GitHub keeps one pending run in the group; this is sufficient for releases.

### D8. Two modes for `make-package.sh --version`

- `--version X` (local): rewrite the three values in the source files with `sed`, then build as usual. The developer gets a diff to review and commit with the release.
- `--version X --keep-source` (deploy): build from the unchanged source, then patch the three values in `build/kirki-ecommerce/` next to the existing production-mode patch. CI never commits back, so a source rewrite there would be thrown away and only make the build harder to follow.

Both modes use one function that runs the three `sed` replacements on a given folder and then checks with `grep` that each value now equals `X`. A missing value stops the build. The version is checked against `^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` before any build step. The zip name uses `X`. Arguments are parsed with a plain `while`/`case` loop; an unknown argument is an error.

*Alternative:* a separate `bin/set-version.sh`. Rejected: the user asked for a flag on the package command.

### D7. Pin actions like `tests.yml`

`actions/checkout@v4`, `actions/setup-node@v4`, `shivammathur/setup-php@v2`, and `10up/action-wordpress-plugin-deploy@2.3.0` (exact release tag, because this step gets the SVN password).

## Risks / Trade-offs

- **`make-package.sh` runs `composer update` when `composer.lock` exists.** In CI this resolves the Composer packages again at release time, so a release can ship a newer `brick/money` (inside the `^0.7` range) than the lock file has. → Out of scope here (Non-Goals: no script change). Flag it to the user as a separate fix (`composer install` in CI), and keep the pre-submit check of `installed.json` in `docs/release-package.md`.
- **SVN credentials in repository secrets.** Any workflow in the repository can read them. → Only `deploy.yml` references them. A GitHub environment with required reviewers is an option the maintainers can add later without a change to the spec.
- **Repository version drifts after a CI release.** With `--keep-source`, a tag `v1.2.0` on a commit that still says `1.1.0` releases `1.2.0`, but the repository keeps `1.1.0`. → Use `npm run make:package -- --version 1.2.0` locally (or edit the three values) and commit before you tag; docs §7 says so. The release itself is always correct.
- **A tag with an old version number.** → The action does not overwrite an existing `tags/<version>/` (it skips the commit), so an old version number cannot replace a published tag.
- **Trunk is replaced on each release.** A file someone added to SVN `trunk/` by hand is deleted by `rsync --delete`. → This is intended: the Git repository is the source of truth.
- **No WordPress.org assets.** The plugin page keeps whatever banners and icons are in SVN now. → A later change can add `.wordpress-org/`.

## Migration Plan

1. A repository admin adds the `SVN_USERNAME` and `SVN_PASSWORD` secrets (a WordPress.org account with commit access to `kirki-ecommerce`).
2. Merge the change to `main`.
3. For the next release, update the three version values, merge, and push the tag (`git tag v1.0.1 && git push origin v1.0.1`).
4. Rollback: delete or disable `deploy.yml` and release by hand as before. A bad release is fixed by a new patch tag; the workflow does not delete SVN tags.

`v1.0.0` already exists, so it does not start the new workflow (a tag push event only fires when the tag is pushed).

## Correction during implementation

- **The `composer update` risk is fixed in this change.** The user asked for the fix after the review. `bin/make-package.sh` now always runs `composer install`, so the package (local and CI) ships the versions in the committed `composer.lock`. A lock that does not satisfy `composer.json` stops the build. The Non-Goal "Changing `bin/make-package.sh`" and the first Risks bullet are no longer true.
- **The manual `brick/money` check is replaced by a constraint.** `composer.json` now requires `brick/money` `^0.7.1` (it was `^0.7`, which accepts the rejected 0.7.0), and the `composer.lock` content hash was refreshed with no version change. The pre-submit checklist step "Check `vendor/composer/installed.json` in the zip" is removed: it could not be done, because the build deletes `installed.json` from the zip.
- **The version guard is replaced by a version flag.** The user found the guard too strict, because people often forget one of the three version places. `make-package.sh` now takes `--version` (D8), `deploy.yml` passes the tag version with `--keep-source`, and the guard step is removed (D2). The `wporg-release-deployment` requirement changed from "stops on mismatch" to "carries the tag version", and `plugin-packaging` gets a delta for the flag and for the lock-only install.
