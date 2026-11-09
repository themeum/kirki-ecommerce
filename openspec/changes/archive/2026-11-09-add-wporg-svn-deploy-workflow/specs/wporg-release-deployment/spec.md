## Purpose

Defines how a pushed Git release tag becomes a WordPress.org plugin release: which tags start a deploy, the version the release carries, what goes to the plugin SVN repository, and the zip attached to the GitHub Release.

## ADDED Requirements

### Requirement: Only stable release tags start a deploy

The system SHALL start a WordPress.org deploy when a tag that matches `v<major>.<minor>.<patch>` or `<major>.<minor>.<patch>` (each part one or more digits) is pushed to the GitHub repository. The system SHALL NOT start a deploy for any other tag, for a branch push, or for a pull request.

#### Scenario: Stable tag with a `v` prefix

- **WHEN** a maintainer pushes the tag `v1.2.0`
- **THEN** the deploy starts and uses the version `1.2.0`

#### Scenario: Stable tag without a prefix

- **WHEN** a maintainer pushes the tag `1.2.0`
- **THEN** the deploy starts and uses the version `1.2.0`

#### Scenario: Pre-release tag

- **WHEN** a maintainer pushes the tag `v1.2.0-alpha.1`, `v1.2.0-beta.2` or `v1.2.0-rc.1`
- **THEN** no deploy starts, and nothing changes in the WordPress.org SVN repository or in GitHub Releases

#### Scenario: Branch push

- **WHEN** a commit is pushed to `main` or `dev` without a tag
- **THEN** no deploy starts

### Requirement: Deployed package carries the tag version

The system SHALL take the release version from the tag name without a leading `v`, and SHALL write it into the deployed package in each place the plugin declares its version: the `Version:` header and the `KIRKI_ECOMMERCE_VERSION` constant in `kirki-ecommerce.php`, and the `Stable tag:` line in `readme.txt`. The system SHALL NOT change those files in the Git repository and SHALL NOT push a commit.

#### Scenario: Source files have an older version

- **WHEN** the tag `v1.2.0` is pushed and the tagged commit has `1.1.0` in all three places
- **THEN** SVN `trunk/` and `tags/1.2.0/` have `1.2.0` in all three places, and the release zip has the same values

#### Scenario: Repository is not changed

- **WHEN** a deploy for `v1.2.0` ends
- **THEN** no commit, branch or tag was pushed to the Git repository by the deploy

### Requirement: Deploy publishes the production package to WordPress.org SVN

The system SHALL build the production package with the project's package command and SHALL publish the contents of the built `kirki-ecommerce/` plugin folder to the `kirki-ecommerce` plugin in the WordPress.org SVN repository: `trunk/` becomes equal to the built folder, and a `tags/<version>/` copy of it is made. The system SHALL authenticate with the `SVN_USERNAME` and `SVN_PASSWORD` repository secrets, and SHALL NOT write those values to the log.

#### Scenario: Successful release

- **WHEN** the tag `v1.2.0` is pushed and the build succeeds
- **THEN** SVN `trunk/` contains exactly the files of the built `kirki-ecommerce/` folder (files removed from the package are removed from `trunk/`), and SVN `tags/1.2.0/` exists with the same contents

#### Scenario: Build fails

- **WHEN** the package command exits with an error
- **THEN** the deploy fails and nothing is committed to SVN or attached to a GitHub Release

#### Scenario: Version already in SVN

- **WHEN** the deploy runs again for a tag whose `tags/<version>/` already exists in SVN
- **THEN** the system makes no SVN commit, and continues to the GitHub Release step

#### Scenario: No WordPress.org assets directory

- **WHEN** the repository has no `.wordpress-org/` directory
- **THEN** the SVN `assets/` directory (banners, icons, screenshots) is not changed

### Requirement: Deployed zip is attached to a GitHub Release

After the SVN step succeeds, the system SHALL attach a zip of the deployed plugin, named `kirki-ecommerce.zip` with the single top-level folder `kirki-ecommerce/`, to the GitHub Release for the pushed tag. When no release exists for the tag, the system SHALL create it with the tag name as its title. When a release exists, the system SHALL replace an existing `kirki-ecommerce.zip` asset on it and SHALL NOT change its title or notes.

#### Scenario: No release exists for the tag

- **WHEN** the tag `v1.2.0` deploys and the repository has no GitHub Release for `v1.2.0`
- **THEN** a GitHub Release `v1.2.0` is created for the tag, and `kirki-ecommerce.zip` is attached to it

#### Scenario: A release was created by hand first

- **WHEN** the tag `v1.2.0` deploys and a maintainer already created a GitHub Release for `v1.2.0` with their own notes
- **THEN** `kirki-ecommerce.zip` is attached to that release and its notes stay as written

#### Scenario: Re-run of the same tag

- **WHEN** the deploy runs again for `v1.2.0` and the release already has `kirki-ecommerce.zip`
- **THEN** the asset is replaced and the release has one `kirki-ecommerce.zip`

### Requirement: Deploys do not run at the same time

The system SHALL run at most one deploy at a time, and SHALL NOT cancel a deploy that has started when a second tag is pushed. The second deploy SHALL wait and then run.

#### Scenario: Two tags pushed close together

- **WHEN** `v1.2.0` is pushed and `v1.2.1` is pushed while the `v1.2.0` deploy runs
- **THEN** the `v1.2.0` deploy runs to its end, and the `v1.2.1` deploy starts after it
