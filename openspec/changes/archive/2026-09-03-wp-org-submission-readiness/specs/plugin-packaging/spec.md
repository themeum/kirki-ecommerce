## ADDED Requirements

### Requirement: Package includes a valid readme.txt

The packaged plugin SHALL contain a `readme.txt` file at its root, with the
WordPress.org-required header fields populated (Contributors, Tags,
Requires at least, Tested up to, Stable tag, Requires PHP, License,
License URI) and a Stable tag matching the `Version:` header in
`kirki-ecommerce.php`.

#### Scenario: readme.txt ships in the package

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains a `readme.txt` file
  with all WordPress.org-required header fields present and a Stable
  tag equal to the plugin's current version

#### Scenario: readme.txt is absent from the source repository build inputs

- **WHEN** `readme.txt` exists at the repository root
- **THEN** the build copies it into the packaged plugin directory the
  same way it copies other required root-level files
