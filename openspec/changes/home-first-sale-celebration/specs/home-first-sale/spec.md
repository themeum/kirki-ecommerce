## Purpose

Celebrates a store's first order on the Home page: a one-time confetti burst for
each admin and a "You made your first sale!" card that leads the team to fulfil
that order.

## ADDED Requirements

### Requirement: First order

The first order SHALL be the store's oldest order by creation time (ties broken
by the lower id) that is not archived. Orders of any payment status and any
fulfillment status SHALL count, including orders that an admin created and
orders that were imported.

#### Scenario: Oldest non-archived order is chosen
- **WHEN** the store has order A created on day 1 (archived), order B created on day 2 and order C created on day 3
- **THEN** the first order is B

#### Scenario: Unpaid order counts
- **WHEN** the store's only order is unpaid with cash on delivery
- **THEN** that order is the first order

#### Scenario: No first order
- **WHEN** the store has no orders, or every order is archived
- **THEN** there is no first order and the card does not show

#### Scenario: First order is deleted
- **WHEN** the order that the card names is deleted and other non-archived orders exist
- **THEN** the card names the next oldest non-archived order

### Requirement: Card visibility

The first-sale card SHALL show for the current admin when all of these are true:
a first order exists, the store is not marked done, and the current admin has
not closed the card. Stores that already had orders before this version SHALL
follow the same rule. The card SHALL NOT be a section of the Customize home
sheet.

#### Scenario: New first order
- **WHEN** a store gets its first order and an admin opens Home
- **THEN** the card shows

#### Scenario: Existing store after update
- **WHEN** a store that has 200 orders updates to this version and an admin opens Home
- **THEN** the card shows and names the oldest non-archived order

#### Scenario: Admin closed the card
- **WHEN** admin A has closed the card and opens Home again
- **THEN** the card does not show for admin A

#### Scenario: Other admin still sees it
- **WHEN** admin A has closed the card and admin B opens Home
- **THEN** the card shows for admin B

#### Scenario: Store marked done
- **WHEN** any admin has clicked Fulfill order
- **THEN** the card does not show for any admin, including admins who never saw it

### Requirement: Card placement and content

The card SHALL take the full width at the top of the Home page content, above
the setup checklist while setup is not done, and above the first overview
section after setup is done. It SHALL show:

- a blue bag icon in a light-blue squircle, with a red dot badge that pops in
  once when the card appears and again on hover;
- the title "You made your first sale!";
- the text "{customer name} ordered {total} ({order number}). Every store
  starts with one order. This one is yours." The customer name and total are
  bold. The total uses the order's own currency. The order number is shown as
  stored, with the store's order prefix (`#` by default), and is a link to the
  order detail page. An order without a customer name reads "A customer";
- a primary **Fulfill order** button;
- an icon **Close** button with the accessible name "Close".

The card SHALL have the accessible name "Your first sale" and the `status`
role.

#### Scenario: Card in checklist mode
- **WHEN** setup is not complete and the card is visible
- **THEN** the card shows above the setup checklist

#### Scenario: Card in overview mode
- **WHEN** setup is complete and the card is visible
- **THEN** the card shows above the first overview section, even when every section is hidden

#### Scenario: Order number link
- **WHEN** the admin clicks the order number in the card
- **THEN** the order detail page of the first order opens and the card state does not change

### Requirement: Close hides the card for one admin

A click on Close SHALL hide the card at once for the current admin and SHALL
record that this admin closed it. Other admins SHALL NOT be affected.

#### Scenario: Close
- **WHEN** admin A clicks Close
- **THEN** the card disappears for admin A, a close record for admin A is stored, and admin B still sees the card

#### Scenario: Close request fails
- **WHEN** the close request fails
- **THEN** the card stays hidden until the page reloads, and an error toast shows

### Requirement: Fulfill order ends the card for all admins

A click on Fulfill order SHALL mark the store as done, SHALL remove every
admin's close record, and SHALL open the first order's detail page. Changing the
first order's fulfillment status anywhere else SHALL NOT mark the store as done.

#### Scenario: Fulfill order
- **WHEN** admin A clicks Fulfill order while admin B has a close record
- **THEN** the store is marked done, admin B's close record is removed, and the order detail page opens for admin A

#### Scenario: Fulfilled outside the card
- **WHEN** an admin changes the first order to shipped from the order detail page without using the card
- **THEN** the card still shows for admins who have not closed it

#### Scenario: Fulfill request fails
- **WHEN** the fulfill request fails
- **THEN** an error toast shows and the order detail page still opens

### Requirement: One-time confetti celebration

When the card shows for an admin who has not been celebrated, the Home page
SHALL play the confetti celebration once and SHALL record, when it starts, that
this admin was celebrated. The celebration SHALL NOT play when the card does not
show. It SHALL play also when the OS "Reduce motion" setting is on.

#### Scenario: First visit
- **WHEN** admin A opens Home, the card shows, and admin A was not celebrated
- **THEN** the confetti plays and a celebrated record for admin A is stored

#### Scenario: Second visit
- **WHEN** admin A was celebrated and opens Home again while the card still shows
- **THEN** the card shows and the confetti does not play

#### Scenario: Each admin once
- **WHEN** admin A was celebrated and admin B opens Home for the first time while the card shows
- **THEN** the confetti plays for admin B

#### Scenario: Reload during the animation
- **WHEN** admin A reloads Home while the confetti plays
- **THEN** the confetti does not play again

#### Scenario: No card, no confetti
- **WHEN** the store is marked done, or admin A closed the card, or there is no first order
- **THEN** the confetti does not play for admin A

#### Scenario: Reduce motion
- **WHEN** the OS "Reduce motion" setting is on and the celebration is due
- **THEN** the confetti plays

### Requirement: Confetti effect

The confetti SHALL match the design file's effect: a full-screen canvas above
the page that does not take pointer input and is hidden from assistive
technology; about 150 pieces (rectangles, strips and dots in the six design
colors) fired from the two bottom corners, which arc up, then fall with drag,
sway, a terminal speed and a 3D flip; a few aimed pieces that land on the top
edge of the first-sale card and of one other visible card, rest there for some
seconds, then tip off and fall. The physics SHALL run in fixed 60 Hz steps. The
canvas SHALL remove itself when every piece has left the screen, and SHALL stop
and remove itself when the admin leaves Home.

#### Scenario: Animation ends
- **WHEN** every piece has left the screen
- **THEN** the canvas is removed from the page

#### Scenario: Admin leaves Home
- **WHEN** the admin opens another admin app page during the animation
- **THEN** the animation stops and the canvas is removed

#### Scenario: Page stays usable
- **WHEN** the confetti plays
- **THEN** clicks reach the page below the canvas

### Requirement: Access and endpoints

Only users who can manage the store (`manage_options`) SHALL read or change the
first-sale state, through REST endpoints that need a valid REST nonce. The read
endpoint SHALL return whether the card shows for the current user, whether the
celebration is due for the current user, and the first order's data the card
needs. The write endpoints SHALL be safe to call more than once.

#### Scenario: Non-admin
- **WHEN** a user without `manage_options` calls a first-sale endpoint
- **THEN** the request is refused

#### Scenario: Repeated celebrated call
- **WHEN** the celebrated endpoint is called twice for the same admin
- **THEN** the first stored time is kept and the response is a success

#### Scenario: Card not visible
- **WHEN** the current admin closed the card
- **THEN** the read endpoint returns that the card does not show and that the celebration is not due
