# store-onboarding-gate Specification

## Purpose
Decides when a merchant is sent to the store onboarding wizard. A newly activated store
is set up before the rest of the plugin admin is used. The plugin never takes over
wp-admin pages that belong to WordPress or to other plugins.

## Requirements
### Requirement: Onboarding completion is recorded once

The system SHALL record that onboarding is complete in the WordPress options table when
store setup succeeds. Until that record exists, the store SHALL be treated as not
onboarded. A failed store setup SHALL NOT write the record.

#### Scenario: Fresh install

- **WHEN** the plugin is activated on a site that has never completed onboarding
- **THEN** the store is treated as not onboarded

#### Scenario: Store setup succeeds

- **WHEN** the merchant's store setup request completes successfully
- **THEN** the onboarding completion record is stored
- **AND** later admin requests treat the store as onboarded

#### Scenario: Store setup fails

- **WHEN** the store setup request fails
- **THEN** no completion record is stored and the store is still treated as not onboarded

### Requirement: Activation redirects to onboarding once

When a single plugin is activated interactively from wp-admin by a user who can manage
the store, the next admin page load SHALL redirect to the onboarding wizard. This SHALL
happen only once per activation. The redirect SHALL NOT happen for bulk activation,
network-wide activation, activation outside an admin browser request (such as WP-CLI),
or when onboarding is already complete.

#### Scenario: Single activation from the plugins screen

- **WHEN** an administrator activates the plugin from the Plugins screen on a store that is not onboarded
- **THEN** they are redirected to the onboarding wizard

#### Scenario: Redirect is one-shot

- **WHEN** the administrator has been redirected once and then navigates to the WordPress dashboard
- **THEN** they are not redirected again

#### Scenario: Bulk activation

- **WHEN** the plugin is activated together with other plugins using a bulk action
- **THEN** no redirect occurs

#### Scenario: Command-line activation

- **WHEN** the plugin is activated from WP-CLI
- **THEN** no redirect occurs and no redirect is left pending for a later request

#### Scenario: Re-activation after onboarding

- **WHEN** the plugin is deactivated and re-activated on a store that has completed onboarding
- **THEN** no redirect occurs

### Requirement: Plugin admin routes are gated until onboarding completes

While the store is not onboarded, any route of the plugin's admin app other than the
onboarding wizard SHALL redirect to the onboarding wizard. WordPress admin pages
outside the plugin's admin app SHALL NOT be redirected. The wizard SHALL offer no way
to skip onboarding.

#### Scenario: Visiting a plugin page before onboarding

- **WHEN** a merchant on a store that is not onboarded opens the plugin's Products, Orders, Settings, or any other plugin route
- **THEN** they land on the onboarding wizard

#### Scenario: Visiting other wp-admin pages

- **WHEN** a merchant on a store that is not onboarded opens the WordPress dashboard, Posts, or another plugin's page
- **THEN** that page loads normally

### Requirement: Onboarding is unreachable after completion

Once the store is onboarded, every onboarding wizard URL SHALL redirect to the plugin's
home route.

#### Scenario: Revisiting the wizard

- **WHEN** a merchant on an onboarded store opens the onboarding wizard URL
- **THEN** they are redirected to the plugin's home route

#### Scenario: Refreshing the completion screen

- **WHEN** a merchant refreshes the browser while on the onboarding completion screen after a successful setup
- **THEN** they are redirected to the plugin's home route
