## Purpose

The merchant dashboard's landing page. It greets a merchant after onboarding,
links to the live storefront, hosts the store setup checklist and showcases
storefront templates.

## ADDED Requirements

### Requirement: Home is the dashboard root route

The admin SPA SHALL render the Home page at `#/` instead of redirecting to the
products list. Home SHALL sit behind the onboarding gate like every other plugin
route, so a store that has not finished onboarding is still sent to the wizard.

#### Scenario: Landing on the dashboard root

- **WHEN** a merchant who has completed onboarding opens `#/`
- **THEN** the Home page is rendered and the URL stays `#/`

#### Scenario: Onboarding not completed

- **WHEN** a merchant who has not completed onboarding opens `#/`
- **THEN** they are redirected to the onboarding wizard

#### Scenario: Leaving the wizard

- **WHEN** a merchant finishes onboarding and chooses "Go to dashboard"
- **THEN** the Home page is shown

### Requirement: Home submenu opens the Home page

The plugin's "Home" admin submenu SHALL be visible and SHALL open `#/`.

#### Scenario: Clicking Home in wp-admin

- **WHEN** a merchant clicks "Home" under the eCommerce admin menu
- **THEN** the Home page is shown

### Requirement: Home page header

The Home page SHALL show the heading "Let's get you started" and a "View Live
Site" link. The link SHALL open the site's front-end URL in a new browser tab.

#### Scenario: Viewing the live site

- **WHEN** the merchant clicks "View Live Site"
- **THEN** the site's front-end home URL opens in a new tab and the dashboard stays open

### Requirement: Home page shows the setup checklist

The Home page SHALL render the store setup checklist directly below the header.
It SHALL show a loading placeholder while the checklist state is being fetched,
and an error message if fetching it fails.

#### Scenario: Checklist is loading

- **WHEN** the Home page is opened and the checklist state has not arrived yet
- **THEN** a skeleton placeholder is shown in the checklist's place

#### Scenario: Checklist fails to load

- **WHEN** fetching the checklist state fails
- **THEN** an error message is shown in the checklist's place and the rest of the page still renders

### Requirement: Static template gallery

Below the checklist, the Home page SHALL show a gallery of exactly three
storefront template cards. Each card SHALL show a preview image, the template
name, its author line (e.g. "By Kirki") and a "Coming soon" badge at its
top-right corner. Card data SHALL come from a list bundled with the admin app. No
network request is made to build it. The cards SHALL NOT be clickable.

#### Scenario: Gallery renders

- **WHEN** the Home page is shown
- **THEN** three template cards with an image, name, author and a "Coming soon" badge appear below the checklist

#### Scenario: Clicking a template

- **WHEN** the merchant clicks a template card
- **THEN** nothing happens
