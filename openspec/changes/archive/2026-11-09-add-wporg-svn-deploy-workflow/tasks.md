## 1. Deploy workflow

- [x] 1.1 Create `.github/workflows/deploy.yml` named `Deploy to WordPress.org`, triggered by `push.tags` with the two patterns `v[0-9]+.[0-9]+.[0-9]+` and `[0-9]+.[0-9]+.[0-9]+` (design D1), with `concurrency: { group: deploy-wporg, cancel-in-progress: false }` (D6) and one `deploy` job on `ubuntu-latest` with `permissions: contents: write`
- [x] 1.2 (Superseded by group 4: the guard step is removed.) Add the steps checkout (`actions/checkout@v4`), then the version guard (D2): compare `${GITHUB_REF_NAME#v}` with the `Version:` header, the `KIRKI_ECOMMERCE_VERSION` constant and `readme.txt` `Stable tag:`; print one `::error::` per mismatch or missing value with its found value, and exit 1 after all three checks
- [x] 1.3 Add PHP 7.4 setup (`shivammathur/setup-php@v2`, `coverage: none`, `tools: composer`), Node 20 setup (`actions/setup-node@v4`, npm cache for `resources/app/package-lock.json` and `resources/site/package-lock.json`), and the build step `bash bin/make-package.sh` (D3)
- [x] 1.4 Add the Subversion install step (D4), then the deploy step `id: deploy`, `uses: 10up/action-wordpress-plugin-deploy@2.3.0`, `with: generate-zip: true`, env `SVN_USERNAME`/`SVN_PASSWORD` from secrets, `SLUG: kirki-ecommerce`, `BUILD_DIR: build/kirki-ecommerce` (D3, D7)
- [x] 1.5 Add the GitHub Release step with `gh` and `GH_TOKEN: ${{ github.token }}`: create the release only when `gh release view` fails, then `gh release upload ... --clobber` the `steps.deploy.outputs.zip-path` file (D5)
- [x] 1.6 Verify: run `actionlint .github/workflows/deploy.yml` (or `npx --yes actionlint` / the `rhysd/actionlint` Docker image when it is not installed) and fix all findings
- [x] 1.7 (Superseded by 4.6.) Verify the version guard locally: copy its shell to a scratch script, and run it with `GITHUB_REF_NAME=v1.0.0` (expect pass) and `GITHUB_REF_NAME=v9.9.9` (expect three named errors and exit 1)
- [x] 1.8 Verify the tag patterns: confirm with a small check (for example a Node script with `minimatch`-style reasoning, or by reading the GitHub filter pattern rules) that `v1.2.0` and `1.2.0` match and `v1.2.0-alpha.1`, `v1.2`, `release-1.2.0` do not
- [x] 1.9 Run `npm run typecheck && npm test` from `resources/app/` (project rule; expected to be unchanged because no TypeScript changed)

## 2. Documentation

- [x] 2.1 Add a numbered section to `docs/release-package.md` (and its table of contents) named "Release to WordPress.org": the required secrets, the three version values to update, the tag command, which tags deploy and which do not, what the workflow publishes (SVN trunk, `tags/<version>`, GitHub Release zip), what happens on a re-run, and that `.wordpress-org/` assets are not managed yet
- [x] 2.2 In the same doc, add a short "Where this differs from a manual release" note: no test run in the deploy job, no assets, no changelog, and the `composer update` behaviour of the package script in CI (design Risks)
- [x] 2.3 Run `npm run typecheck && npm test` from `resources/app/` (project rule)

## 3. Hand-off

- [x] 3.1 Tell the user to add the `SVN_USERNAME` and `SVN_PASSWORD` repository secrets before the first release tag, and that the first real run is the only end-to-end test (CLAUDE.md: no browser or live verification here)
- [x] 3.2 Tell the user about the `composer update` risk in `bin/make-package.sh` as a separate follow-up, not part of this change

## 4. Version flag

- [x] 4.1 In `bin/make-package.sh`, parse `--version <v>` and `--keep-source` with a `while`/`case` loop before any build step; exit with an error on an unknown argument, on `--keep-source` without `--version`, and on a version that does not match `^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` (design D8)
- [x] 4.2 Add one function that rewrites the `Version:` header, the `KIRKI_ECOMMERCE_VERSION` constant and `readme.txt` `Stable tag:` in a given folder with `sed -i.bak` (BSD and GNU safe), removes the `.bak` files, and checks with `grep` that each value equals the version; a value that is not found stops the build
- [x] 4.3 Without `--keep-source`, call it on the repository root before the build; with `--keep-source`, call it on `build/kirki-ecommerce/` next to the production-mode patch; use the flag version for the zip name, and keep the header read when no flag is given
- [x] 4.4 In `.github/workflows/deploy.yml`, remove the guard step and change the build step to `bash bin/make-package.sh --version "${GITHUB_REF_NAME#v}" --keep-source` (D2, D3)
- [x] 4.5 Update `docs/release-package.md`: §1 documents the two flag forms, §7 replaces the "set the version in three places" step with `npm run make:package -- --version X` (then commit) and replaces "the workflow compares the tag" with "the workflow writes the tag version into the package", and §8 notes the repository version drift
- [x] 4.6 Verify: `bash -n bin/make-package.sh`; `actionlint .github/workflows/deploy.yml`; run the argument checks (bad version, `--keep-source` alone, unknown argument) and confirm each exits before a build step; run the version function on a scratch copy of `kirki-ecommerce.php` and `readme.txt` and confirm all three values change and the source copies stay unchanged in the staged mode; run `npm run typecheck && npm test` from `resources/app/`
