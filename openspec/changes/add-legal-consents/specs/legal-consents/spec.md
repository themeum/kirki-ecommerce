## Purpose

Lets a merchant define consent statements — terms acceptance, marketing opt-in, or plain legal notices — choose where each one appears in the shopper's journey, and have mandatory ones block the shopper from proceeding until accepted.

## ADDED Requirements

### Requirement: A consent declares its text, its placement, and how it is enforced

A consent SHALL carry a title used only for merchant-facing identification, a message shown to the shopper, one or more display locations drawn from signup, login, and checkout, a consent method, and an enabled flag. A consent SHALL NOT be saveable with zero display locations, an empty title, or an empty message.

The consent method SHALL be one of exactly three values, and SHALL determine what the shopper sees and what is enforced:

- **Mandatory checkbox** — a ticked checkbox is a precondition of the action.
- **Optional checkbox** — a checkbox the shopper may leave unticked with no effect on the action.
- **Display text only** — the message is shown with no control at all.

#### Scenario: Saving a consent with no location selected

- **WHEN** the merchant tries to save a consent with none of signup, login, or checkout selected
- **THEN** the save is rejected with a validation message naming the missing choice
- **AND** no consent is created or modified

#### Scenario: Saving a consent with an unrecognised method or location

- **WHEN** a request stores a consent whose method or location is not one of the defined values
- **THEN** the request is rejected as invalid
- **AND** the stored consent list is left unchanged

### Requirement: Consents are managed from a dedicated Legal settings page

The Legal settings page SHALL list every configured consent, showing each one's title and the locations it displays on. When no consent exists the page SHALL show an empty state rather than an empty container.

Each row SHALL offer editing, deletion, and toggling between enabled and disabled. A disabled consent SHALL remain distinguishable from an enabled one without the merchant hovering, pointing at, or opening it.

Every create, edit, toggle, and delete SHALL be persisted at the moment the merchant performs it. The page SHALL NOT require a separate save step, and SHALL NOT present one.

#### Scenario: Opening Legal with no consents configured

- **WHEN** the merchant opens the Legal settings page and no consents exist
- **THEN** an empty state reading "Consents will be shown here" is displayed

#### Scenario: A disabled consent is identifiable at rest

- **WHEN** the consent list contains both enabled and disabled consents and the merchant is not interacting with any row
- **THEN** each disabled consent is visually distinguished from the enabled ones

#### Scenario: Toggling a consent persists without a save step

- **WHEN** the merchant toggles a consent off
- **THEN** the change is persisted immediately
- **AND** reloading the page shows the consent still disabled

#### Scenario: A failed save does not leave the list lying

- **WHEN** the merchant toggles a consent and the save fails
- **THEN** the row returns to the state it had before the toggle
- **AND** the merchant is told the save failed

#### Scenario: Deleting a consent can be undone

- **WHEN** the merchant deletes a consent and then chooses to undo before the confirmation expires
- **THEN** the consent is still present and unchanged after the undo window closes

### Requirement: Consent messages can link to store pages through tokens

A consent message SHALL support tokens of the form `{page_slug}` that resolve at display time to a link to the published page with the matching slug, using that page's title as the link text. The merchant SHALL be able to insert a token by choosing a page from a list rather than typing the token by hand, and the inserted token SHALL land at the text cursor, or at the end of the message when there is no cursor position.

A token that resolves to no published page SHALL degrade to readable plain text. The raw token SHALL NOT be shown to a shopper, and no empty or broken link SHALL be produced.

Merchant-authored message text SHALL be rendered as text, never as markup: any HTML a merchant types SHALL appear escaped rather than being interpreted.

#### Scenario: Inserting a page token at the cursor

- **WHEN** the merchant places the cursor mid-message and picks "Privacy Policy" from the page list
- **THEN** `{privacy_policy}` is inserted at that position
- **AND** the surrounding text is preserved
- **AND** the cursor is left immediately after the inserted token

#### Scenario: Inserting with no cursor position

- **WHEN** the merchant picks a page without having placed a cursor in the message
- **THEN** the token is appended at the end of the existing message

#### Scenario: Token resolves to a published page

- **WHEN** a shopper is shown a consent whose message contains `{privacy_policy}` and a published page with slug `privacy-policy` exists
- **THEN** the message renders with that page's title as a link to the page

#### Scenario: Token resolves to nothing

- **WHEN** a consent message contains a token for a page that has been deleted, unpublished, or renamed
- **THEN** the shopper sees readable text in place of the token
- **AND** the shopper never sees the literal `{token}` or a link with no destination

#### Scenario: Merchant types markup into a message

- **WHEN** a consent message contains HTML tags typed by the merchant
- **THEN** the shopper sees those tags as literal text
- **AND** no merchant-authored markup is executed or rendered as markup

### Requirement: Enabled consents appear at each location they target

A consent SHALL be shown at a location when it is enabled and lists that location, and SHALL NOT be shown otherwise. Disabling a consent SHALL remove it from every location it targeted.

A mandatory consent SHALL be visually marked as required, so a shopper can tell it apart from an optional one before attempting to proceed.

#### Scenario: Consent appears only where it is targeted

- **WHEN** an enabled consent targets checkout only
- **THEN** it is shown during checkout
- **AND** it is absent from the login and registration forms

#### Scenario: Disabling removes a consent everywhere

- **WHEN** the merchant disables a consent that targeted all three locations
- **THEN** it no longer appears at checkout, login, or registration

#### Scenario: No consents configured for a location

- **WHEN** a shopper reaches a location where no enabled consent targets it
- **THEN** no consent area, heading, or empty container is rendered there

### Requirement: A mandatory consent blocks the action until it is accepted

When a shopper attempts an action at a location carrying an enabled mandatory consent, the action SHALL NOT complete unless that consent has been accepted. This SHALL be enforced on the server, independently of any check performed in the browser, so that a request bypassing the interface is rejected the same way.

When the action is blocked the shopper SHALL be told why, in a message that identifies the unmet consent requirement rather than failing generically.

An optional consent SHALL never block an action, whether ticked or not. A display-text-only consent SHALL never block an action.

#### Scenario: Placing an order with an unticked mandatory consent

- **WHEN** a shopper submits the checkout without ticking an enabled mandatory consent
- **THEN** no order is created
- **AND** the shopper is shown a message explaining that the required terms must be accepted

#### Scenario: A request that bypasses the interface

- **WHEN** an order request omits acceptance of an enabled mandatory checkout consent
- **THEN** the request is rejected regardless of what the browser did or did not validate

#### Scenario: Registering without accepting a mandatory consent

- **WHEN** a visitor submits the registration form without accepting an enabled mandatory signup consent
- **THEN** the account is not created
- **AND** the registration form reports the unmet requirement

#### Scenario: Optional consents never block

- **WHEN** a shopper submits an action leaving every optional consent unticked and every mandatory consent ticked
- **THEN** the action completes normally

#### Scenario: Wrong credentials take precedence over consent

- **WHEN** a visitor submits the login form with an incorrect password and without accepting a mandatory login consent
- **THEN** the failure reported is the incorrect password, not the unmet consent

### Requirement: Consent enforcement applies to shoppers, not to staff

Consent requirements SHALL apply to actions a shopper takes on the storefront. An order created by a merchant through the admin SHALL NOT be blocked by any consent requirement, since the shopper is not present to accept one.

#### Scenario: Merchant creates an order from the admin

- **WHEN** a merchant creates an order in the admin while an enabled mandatory checkout consent exists
- **THEN** the order is created without any consent being required

### Requirement: Consent enforcement does not interfere with non-shopper authentication

Consent checks at the login location SHALL apply only to interactive sign-in through the site's login form. Authentication performed by other means SHALL be left entirely unaffected.

#### Scenario: Programmatic authentication is untouched

- **WHEN** a client authenticates by a means other than submitting the login form, while an enabled mandatory login consent exists
- **THEN** authentication proceeds as though no consent were configured

### Requirement: Accepting a consent is enforced but not recorded

The system SHALL NOT store any record of an individual shopper having accepted a consent. Acceptance SHALL be treated purely as a precondition of the action in progress, and SHALL be discarded once that action completes.

This limitation SHALL be stated in the feature's documentation, so that it is not mistaken for an audit trail.

#### Scenario: No acceptance record after a successful order

- **WHEN** a shopper accepts both a mandatory and an optional consent and completes an order
- **THEN** the order is created
- **AND** no record of either acceptance is associated with the order or the customer

### Requirement: Merchants are warned when a configured location cannot display consents

Where a display location depends on a platform capability that the store has turned off, the Legal settings page SHALL warn the merchant that consents targeting that location will not appear. The consent SHALL still be saveable — the warning SHALL describe the condition rather than block configuration.

#### Scenario: Signup consent configured while registration is disabled

- **WHEN** the merchant enables a consent targeting signup and the store does not allow visitor registration
- **THEN** the Legal settings page warns that the consent will not be displayed until registration is enabled
- **AND** the consent is still saved
