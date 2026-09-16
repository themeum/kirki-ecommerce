# unsaved-changes-floating-bar Specification

## Purpose

Defines the shared floating bar that tells a merchant they have unsaved work and gives them the
actions to resolve it, together with the single navigation-guard behaviour that keeps unsaved
work from being lost across every screen that can be edited.

## Requirements

### Requirement: A guarded screen chooses when the bar is visible

A screen that guards unsaved work SHALL present the floating bar in one of two modes, and SHALL
hide it as soon as the screen becomes clean — whether it became clean by being saved, by being
discarded, or by the merchant reversing their own edits.

In **always-while-dirty** mode the bar SHALL appear as soon as the screen has unsaved changes,
without the merchant first attempting to navigate away. A screen SHALL use this mode when it has no
other way to save. The settings panel uses it.

In **on-blocked-navigation** mode the bar SHALL appear only once an attempt to navigate away has
been refused, and SHALL hide again when no navigation is pending. A screen SHALL use this mode when
it already presents Save and Cancel in its page header, so that the bar answers a specific attempt
to leave rather than duplicating a control that is always on screen. The product form and the
variant form use it.

#### Scenario: A screen with no other save control shows the bar on first edit

- **WHEN** the merchant changes any value on a clean settings page
- **THEN** the floating bar becomes visible

#### Scenario: A screen with a header Save shows the bar only when leaving is refused

- **WHEN** the merchant edits the product form and does not attempt to navigate away
- **THEN** the floating bar is not visible
- **AND** the header's Save and Cancel actions remain available

#### Scenario: Attempting to leave a dirty form reveals the bar

- **WHEN** the merchant has unsaved changes on the product form and attempts to navigate away
- **THEN** the navigation does not complete
- **AND** the floating bar becomes visible

#### Scenario: Saving hides the bar

- **WHEN** a save completes successfully
- **THEN** the screen reports no unsaved changes
- **AND** the floating bar is hidden

#### Scenario: Reverting an edit by hand hides the bar

- **WHEN** the merchant edits a field and then restores it to its original value
- **THEN** the screen reports no unsaved changes
- **AND** the floating bar is hidden

#### Scenario: A clean screen shows nothing

- **WHEN** the merchant opens a guarded screen and makes no edits
- **THEN** the floating bar is not visible
- **AND** no navigation is refused

### Requirement: The bar rises from the bottom of the screen

The floating bar SHALL be anchored above the screen's content near the bottom edge, and SHALL
animate into place by rising from below that edge. Leaving SHALL be animated in the same manner
rather than disappearing instantly. The bar SHALL remain clear of the WordPress admin chrome and
SHALL NOT be clipped or scrolled away by the content beneath it.

Horizontally the bar SHALL be centred over the application's own content area, not over the
browser viewport. The WordPress admin menu occupies part of the viewport and SHALL be excluded
from that reckoning, whatever width it currently has — expanded, collapsed to icons, folded
automatically on a narrow screen, hidden entirely, or placed on the opposite side in a
right-to-left locale. The bar SHALL follow the content area as that width changes rather than
staying where it was first placed.

#### Scenario: Appearing is animated

- **WHEN** the floating bar becomes visible
- **THEN** it rises into place from below the bottom edge rather than appearing instantly

#### Scenario: The bar stays put while the page scrolls

- **WHEN** the floating bar is visible and the merchant scrolls the page
- **THEN** the bar stays at the same position on screen

#### Scenario: The bar is centred over the content, not the viewport

- **WHEN** the floating bar is visible while the WordPress admin menu is expanded
- **THEN** it is centred over the content area beside the menu
- **AND** it is not centred over the full browser viewport

#### Scenario: Collapsing the admin menu re-centres the bar

- **WHEN** the merchant collapses or expands the WordPress admin menu while the bar is visible
- **THEN** the bar moves to stay centred over the content area at its new width

#### Scenario: A hidden bar cannot be interacted with

- **WHEN** the floating bar is hidden
- **THEN** it does not receive pointer input and is not announced to assistive technology

### Requirement: Blocked navigation shakes the bar

While a guarded screen has unsaved changes, any attempt to navigate away within the application
SHALL be refused, and the floating bar SHALL shake to draw attention to itself. No confirmation
dialog SHALL be presented. Each further blocked attempt SHALL replay the shake, so a merchant who
tries again is answered again. The shake SHALL NOT play when the bar merely becomes visible.

The plugin's own entries in the WordPress admin menu lead to screens inside the application, so a
click on one SHALL be treated as navigation within the application and refused on the same terms —
even though those entries are rendered by WordPress rather than by the application, and are
therefore invisible to the application's own navigation on their own. The merchant SHALL NOT be
shown the browser's native prompt for these, and the menu SHALL NOT move its highlight to a screen
the merchant was refused entry to.

#### Scenario: Navigating away while dirty is refused

- **WHEN** the merchant has unsaved changes and attempts to navigate away within the application
- **THEN** the navigation does not complete
- **AND** the floating bar shakes
- **AND** no confirmation dialog is presented

#### Scenario: Trying again shakes again

- **WHEN** the floating bar has already shaken and the merchant attempts another blocked navigation
- **THEN** the floating bar shakes again

#### Scenario: Becoming visible does not shake

- **WHEN** the merchant's first edit makes the floating bar visible
- **THEN** the bar rises into place without shaking

#### Scenario: A clean screen navigates freely

- **WHEN** the merchant has no unsaved changes and navigates anywhere in the application
- **THEN** the navigation completes with no interruption

#### Scenario: A save-driven navigation is not blocked

- **WHEN** a save completes and the screen navigates as a result of that save
- **THEN** the navigation completes and the bar does not shake

#### Scenario: A plugin menu item is refused like any other navigation

- **WHEN** the merchant has unsaved changes and clicks one of the plugin's own WordPress admin
  menu entries
- **THEN** the navigation does not complete
- **AND** the floating bar shakes
- **AND** the browser's native unsaved-changes prompt is not shown
- **AND** the WordPress admin menu still highlights the screen the merchant is on

### Requirement: The bar offers Discard and Save

The floating bar SHALL present a Discard action and a Save action. Discard SHALL revert the screen
to its last saved values and leave the merchant on that screen. A navigation that was being blocked
SHALL be abandoned rather than completed, so Discard never moves the merchant somewhere they did
not choose to go a second time. Save SHALL run the guarded screen's own save flow, including its
own validation, and SHALL show an in-progress state until that save settles. The destructive action
SHALL be labelled "Discard" rather than "Cancel", so that it cannot be read as cancelling the
navigation instead of the edits.

#### Scenario: Discard reverts and stays

- **WHEN** a navigation is being blocked and the merchant activates Discard
- **THEN** the screen's values revert to their last saved state
- **AND** the merchant remains on the screen they were editing
- **AND** the originally attempted navigation does not complete

#### Scenario: Retrying the navigation after discarding

- **WHEN** the merchant has discarded their changes and attempts the same navigation again
- **THEN** the navigation completes, because the screen no longer has unsaved changes

#### Scenario: Discard with no navigation pending

- **WHEN** no navigation is being blocked and the merchant activates Discard
- **THEN** the screen's values revert to their last saved state
- **AND** the merchant remains on the screen
- **AND** the floating bar is hidden

#### Scenario: Save runs the screen's own flow

- **WHEN** the merchant activates Save
- **THEN** the guarded screen's save flow runs, including its own validation
- **AND** the Save action shows an in-progress state until the save settles

#### Scenario: A rejected save keeps the bar

- **WHEN** the merchant activates Save and the save fails validation or is rejected by the server
- **THEN** the failure is reported to the merchant
- **AND** the edits remain intact and the floating bar is still visible

#### Scenario: A successful save releases a blocked navigation

- **WHEN** a navigation is being blocked and the merchant saves successfully
- **THEN** the screen reports no unsaved changes
- **AND** the floating bar is hidden

### Requirement: The guarded screen supplies the bar's wording and actions

The floating bar SHALL take its actions from the screen it guards rather than fixing them itself,
so that a screen can label them for its own context — for example "Create" rather than "Save" on a
form that creates a record. It SHALL take its message from the guarded screen as either plain text
or richer content, defaulting to "Unsaved changes" where the screen supplies none. A screen SHALL
be able to adjust the bar's presentation for its own layout without a new variant being added to
the bar.

#### Scenario: A screen labels its own primary action

- **WHEN** the floating bar is shown on a screen that creates a new record
- **THEN** its primary action reads "Create" rather than "Save"

#### Scenario: A screen supplies its own message

- **WHEN** a screen supplies its own message for the floating bar
- **THEN** the bar shows that message in place of the default

#### Scenario: The default message

- **WHEN** a screen supplies no message
- **THEN** the floating bar reads "Unsaved changes"

### Requirement: Leaving the application still uses the browser's own prompt

The floating bar SHALL govern only navigation within the application. Reloading, closing the tab,
and navigating out of the application entirely — to another plugin's screen, or to WordPress' own —
SHALL continue to be guarded by the browser's native unsaved-changes prompt. This applies to the
WordPress admin menu's other entries, but not to the plugin's own entries, which lead back into the
application and are covered by the requirement above.

#### Scenario: Reloading with unsaved changes

- **WHEN** the merchant has unsaved changes and reloads or closes the tab
- **THEN** the browser's native unsaved-changes prompt is shown

#### Scenario: Reloading with no unsaved changes

- **WHEN** the merchant has no unsaved changes and reloads
- **THEN** no prompt is shown

#### Scenario: Leaving for a screen outside the application

- **WHEN** the merchant has unsaved changes and clicks a WordPress admin menu entry that does not
  belong to the plugin
- **THEN** the browser's native unsaved-changes prompt is shown

### Requirement: Unsaved state does not outlive the screen that reported it

Leaving a guarded screen SHALL clear the unsaved state that screen reported, however the merchant
left it. A screen that has been left SHALL NOT continue to cause unsaved-changes warnings
elsewhere in the application.

#### Scenario: An abandoned screen stops warning

- **WHEN** the merchant discards unsaved changes on a guarded screen, leaves it, and then reloads
  from an unrelated page
- **THEN** the browser's native unsaved-changes prompt is not shown

#### Scenario: A saved screen stops warning

- **WHEN** the merchant saves a guarded screen, navigates elsewhere, and then reloads
- **THEN** the browser's native unsaved-changes prompt is not shown
