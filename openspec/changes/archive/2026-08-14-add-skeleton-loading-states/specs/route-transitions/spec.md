## Purpose

Governs what the admin SPA shows between a user activating a link and the
destination page rendering, so that navigating to a page presents one loading
treatment — the destination's own placeholders — rather than a spinner followed
by placeholders followed by content.

## ADDED Requirements

### Requirement: A route transition shows no loading indicator of its own

A route SHALL NOT present its own loading indicator while its page code is being
fetched. The only loading treatment a navigation presents SHALL be the
destination page's own placeholder content, shown once that page renders and
begins its data request.

#### Scenario: Navigating to a page whose code is not yet loaded

- **WHEN** a user activates a link to a page whose code has not been fetched yet
- **THEN** nothing is rendered in the content area until that page renders, and
  the page's own placeholder layout is the first loading treatment the user sees

#### Scenario: Navigating to a page whose code is already loaded

- **WHEN** a user activates a link to a page whose code has already been fetched
- **THEN** the page renders immediately with its own placeholder layout, with no
  intervening indicator

#### Scenario: Returning to a page that has cached data

- **WHEN** a user navigates back to a page whose data is already cached
- **THEN** the page renders its real content directly, showing neither an
  indicator nor placeholders
