## Purpose

Makes every translatable string in the admin app and the storefront script
reachable by WordPress translation tooling and shown in the site's language at
runtime.

## ADDED Requirements

### Requirement: Shipped JS keeps its translation calls extractable

The production JS files under `assets/js` SHALL contain each translation call
that the build includes from the admin app and storefront source under one of
the function names that `wp i18n make-pot` recognizes (`__`, `_x`, `_n`, `_nx`),
each with its own literal string arguments and the `kirki-ecommerce` text
domain, so that extraction from the shipped files alone finds every JS string
that ships.

#### Scenario: Extraction from the shipped bundles matches the shipped source

- **WHEN** `wp i18n make-pot` is run over the production `assets/js` directory
  with the `kirki-ecommerce` domain
- **THEN** every `kirki-ecommerce` msgid used in source code that the build
  includes is extracted
- **AND** no msgid is extracted that is absent from the source

#### Scenario: Strings in unused code are not extracted

- **WHEN** a call to `__()` is in a module that no build entry imports, or in an
  export that no included code uses
- **THEN** its string is not in the production files and is not extracted

#### Scenario: Conditional string choice stays extractable

- **WHEN** the source chooses between two translated strings with a condition,
  such as `isEdit ? __('Edit', 'kirki-ecommerce') : __('Add', 'kirki-ecommerce')`
- **THEN** both `Edit` and `Add` are extracted from the production files

#### Scenario: A lazy-loaded admin page string is extractable

- **WHEN** a string is used only on an admin page that loads as a separate chunk
- **THEN** that string is extracted from the chunk file that contains the page,
  and its reference names that chunk file

### Requirement: Translator comments survive the production build

A `translators:` comment that directly precedes a translation call in the source
SHALL directly precede the same call in the production JS file, so that
extraction attaches it to the string.

#### Scenario: Placeholder string with a translator comment

- **WHEN** a source call such as `sprintf(/* translators: %s: customer name */ __('Order for %s', 'kirki-ecommerce'), name)`
  is built for production
- **THEN** the msgid extracted from `assets/js` carries the comment
  `translators: %s: customer name`

### Requirement: Admin app shows translated strings

When the site language has translations for the `kirki-ecommerce` text domain,
the admin app SHALL show translated JS strings on every admin page, including
pages that load as separate chunks.

#### Scenario: Entry bundle string is translated

- **WHEN** a JSON translation file exists for the admin entry bundle in the
  site language and a user opens a plugin admin page
- **THEN** strings from the entry bundle are shown translated

#### Scenario: Lazy-loaded page string is translated

- **WHEN** a JSON translation file exists for a page chunk in the site language
  and the user navigates to that page
- **THEN** strings from that chunk are shown translated, without a page reload

#### Scenario: No translations installed

- **WHEN** the site language has no translation files for the plugin
- **THEN** the admin app shows the source English strings and loads without
  errors

### Requirement: Storefront script shows translated strings

When the site language has translations for the `kirki-ecommerce` text domain,
the storefront script SHALL show its translated JS strings.

#### Scenario: Storefront string is translated

- **WHEN** a JSON translation file exists for `assets/js/site.js` in the site
  language and a visitor opens a store page that uses the storefront script
- **THEN** storefront JS strings, such as the quantity limit message, are shown
  translated

### Requirement: Translation template names the shipped scripts

`npm run make:pot` SHALL build `languages/kirki-ecommerce.pot` from the files that
ship, with JS references that name the shipped script files.

#### Scenario: JS references name the shipped script files

- **WHEN** `npm run make:pot` is run after a frontend build
- **THEN** every reference for a JS string names a file under `assets/js` (for
  example `assets/js/site.js`), and no reference names a `.ts` or `.tsx` source
  file

#### Scenario: JSON translations can be built from the template

- **WHEN** a `.po` file translated from the template is passed to
  `wp i18n make-json`
- **THEN** a JSON file is produced for each shipped script that contains
  translated strings, named with the hash of that script's path in the package

#### Scenario: Excluded gateways contribute no strings

- **WHEN** the template is inspected
- **THEN** it contains no reference to a file under `payments/`

#### Scenario: No frontend build

- **WHEN** `npm run make:pot` is run and `assets/.vite/manifest.json` or
  `assets/js/site.js` is missing
- **THEN** it exits with an error that says to run a frontend build first
