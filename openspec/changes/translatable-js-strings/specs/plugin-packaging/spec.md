## ADDED Requirements

### Requirement: wordpress.org package ships no translation template

The wordpress.org package command (`npm run make:org-package`) SHALL NOT generate a
translation template, and the package SHALL NOT contain
`languages/kirki-ecommerce.pot`, even when a template from an earlier
`npm run make:pot` run exists in the repository.

#### Scenario: Build does not generate a template

- **WHEN** `npm run make:org-package` is run
- **THEN** the build does not run the template generator

#### Scenario: Local template is not shipped

- **WHEN** `languages/kirki-ecommerce.pot` exists in the repository and
  `npm run make:org-package` is run
- **THEN** the resulting zip contains a `languages/` directory without
  `kirki-ecommerce.pot`
