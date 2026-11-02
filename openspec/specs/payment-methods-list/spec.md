# payment-methods-list Specification

## Purpose

Defines the admin Payment methods list on the Payments settings page: how each row shows a
provider, which actions a row offers and when they are visible, and how an administrator drags
rows to change the provider order.

## Requirements

### Requirement: Each provider is one row in a single stacked list

The Payment methods card SHALL show every registered provider as one row of a single stacked
list, in the order returned by the combined listing. Each row SHALL show the provider's icon and
name at the left.

Rows SHALL keep the standard stacked-list divider between them. A hovered row SHALL show a
highlighted background and SHALL NOT show an extra top or bottom border.

When no provider is registered, the card SHALL show the existing empty state.

#### Scenario: Listing providers

- **WHEN** the Payments settings page loads with three registered providers
- **THEN** the card shows one stacked list with three rows in the returned order
- **AND** a divider line shows between the rows

#### Scenario: Hovering a row

- **WHEN** the pointer moves over a row
- **THEN** that row shows a highlighted background and no extra border
- **AND** the layout of the other rows does not move

### Requirement: Row actions are icon controls revealed on interaction

Each row SHALL offer, at the right, a delete icon button, an edit icon button, and an
enable/disable switch, in that order. The row SHALL NOT offer a "more actions" (three-dots) menu.

The actions SHALL be visible when the row is hovered, when a control in the row has keyboard
focus, and at all times on devices that cannot hover. Otherwise the actions SHALL be hidden
without changing the row's size.

The delete and edit buttons SHALL each have an accessible name that includes the action.

#### Scenario: Actions on hover

- **WHEN** the pointer moves over a row
- **THEN** the delete, edit and switch controls show at the right of that row

#### Scenario: Actions with keyboard focus

- **WHEN** a keyboard user moves focus to a control inside a row
- **THEN** that row's actions show

#### Scenario: Actions on a touch device

- **WHEN** the page renders on a device that cannot hover
- **THEN** every row shows its actions without interaction

#### Scenario: No three-dots menu

- **WHEN** any row renders
- **THEN** it contains no "more actions" dropdown trigger

### Requirement: Row actions keep their existing behaviour

The switch SHALL enable or disable the provider through its per-kind endpoint. The edit button
SHALL open the offline edit dialog for an offline provider and the online settings dialog for an
online provider. The delete button SHALL ask for confirmation and then delete an offline provider.

The delete button SHALL NOT show on the PayPal provider's row. The edit button and the switch
SHALL keep their positions on the PayPal row.

#### Scenario: Deleting an offline provider

- **WHEN** an administrator clicks delete on an offline provider row and confirms
- **THEN** the provider is deleted and its row is removed

#### Scenario: PayPal row

- **WHEN** the PayPal row shows its actions
- **THEN** it shows the edit button and the switch
- **AND** it does not show a delete button

#### Scenario: Toggling a provider

- **WHEN** an administrator turns off the switch on an enabled provider row
- **THEN** the provider is disabled through its per-kind endpoint

### Requirement: A drag handle replaces the icon on interaction

When a row's actions are visible, the row SHALL show a drag handle in place of the provider's
icon, at the same position and size. When the actions are hidden, the row SHALL show the
provider's icon. The drag handle SHALL be a focusable control with an accessible name.

#### Scenario: Handle on hover

- **WHEN** the pointer moves over a row
- **THEN** the provider's icon is replaced by the drag handle
- **AND** the provider name does not move

#### Scenario: Icon when idle

- **WHEN** no pointer, focus or touch-device condition applies to a row
- **THEN** the row shows the provider's icon and no drag handle

### Requirement: Rows are reordered by dragging the handle

An administrator SHALL be able to change the provider order by dragging a row's handle. Only the
handle SHALL start a drag; a click on the handle without movement, or on any other part of the
row, SHALL NOT start one. The drag SHALL move only along the vertical axis and stay within the
list.

A keyboard user SHALL be able to reorder: with focus on the handle, a key press picks up the row,
arrow keys move it, a key press drops it, and Escape cancels.

While a row is dragged, an overlay with rounded corners SHALL follow the pointer and show the
row's handle and name, without action controls. The original row SHALL stay in place at reduced
opacity as the drop placeholder.

#### Scenario: Dragging a row to a new position

- **WHEN** an administrator drags the third row's handle above the first row and drops it
- **THEN** the dragged row becomes the first row
- **AND** the new order shows at once, before the server responds

#### Scenario: Overlay during a drag

- **WHEN** an administrator drags a row
- **THEN** a rounded overlay that shows the row's handle and name follows the pointer
- **AND** the original row stays in place at reduced opacity

#### Scenario: Reordering with the keyboard

- **WHEN** a keyboard user focuses a row's handle, picks the row up, presses the down arrow once,
  and drops it
- **THEN** the row moves one position down

#### Scenario: Cancelling a drag

- **WHEN** an administrator presses Escape during a drag, or drops the row at its original position
- **THEN** the order does not change
- **AND** no save request is sent

#### Scenario: Clicking a row

- **WHEN** an administrator clicks the row name or the handle without moving the pointer
- **THEN** no drag starts

### Requirement: Each drop saves the new order

Each drop that changes the order SHALL send the full new order of provider IDs to the server at
once. On success, no message SHALL show. On failure, the list SHALL return to the order it
had before the drop, and an error message SHALL show.

#### Scenario: Save succeeds

- **WHEN** an administrator drops a row at a new position and the server accepts the order
- **THEN** no success message shows
- **AND** the list keeps the new order after a page reload

#### Scenario: Save fails

- **WHEN** an administrator drops a row at a new position and the server rejects the order
- **THEN** the list returns to the previous order
- **AND** an error message shows
