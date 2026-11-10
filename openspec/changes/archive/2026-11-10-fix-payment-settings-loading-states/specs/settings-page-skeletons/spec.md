## ADDED Requirements

### Requirement: The Payments page skeleton mirrors the Payment methods card

While the Payments settings page loads its payment methods for the first time,
the page SHALL show a placeholder that has the same layout as the loaded Payment
methods card: a placeholder for the card heading, a placeholder for the card
description, a placeholder for the "Add" button on the right of the heading, and
a bordered list of 3 placeholder rows. Each placeholder row SHALL have an icon
placeholder, a name placeholder, and a switch placeholder on the right, and SHALL
have the same height as a loaded payment method row. The page header SHALL render
as normal. When the payment methods are already on screen, a background refetch
SHALL NOT replace them with the placeholder.

#### Scenario: Opening the Payments page

- **WHEN** an admin opens the Payments settings page and the payment methods request is in flight for the first time
- **THEN** the page shows the "Payments" header and a card with heading, description and "Add" button placeholders, and a bordered list of 3 placeholder rows

#### Scenario: Payment methods arrive

- **WHEN** the request resolves with 3 payment methods
- **THEN** the real card replaces the placeholder, and the card heading, the "Add" button and the list rows do not move

#### Scenario: Background refetch after a change

- **WHEN** an admin enables, disables, deletes or reorders a payment method and the list refetches
- **THEN** the real list stays on screen and the placeholder does not show
