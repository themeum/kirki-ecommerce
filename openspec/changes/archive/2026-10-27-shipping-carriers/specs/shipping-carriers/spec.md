## Purpose

Defines the carriers a merchant configures for each shipping zone: what a carrier holds, the preset carriers that come with the app, how the merchant manages them on the zone page, and the rules for the tracking-link template.

## ADDED Requirements

### Requirement: Each shipping zone has its own carrier list

A shipping zone SHALL own a list of carriers. A carrier SHALL have a name, a tracking-URL template, an optional logo, and an enabled flag. A carrier MUST NOT have a price. The carrier list of one zone MUST NOT affect another zone.

#### Scenario: Two zones hold different carriers

- **WHEN** the merchant adds UPS to zone A and does not add it to zone B
- **THEN** zone A lists UPS as enabled and zone B does not list UPS

#### Scenario: Active carrier shows no badge

- **WHEN** a carrier is enabled
- **THEN** its row shows no status badge

#### Scenario: Inactive carrier badge

- **WHEN** a carrier is disabled
- **THEN** its row shows an "Inactive" badge

#### Scenario: Badge changes with the switch

- **WHEN** the merchant switches a carrier off or on
- **THEN** the row shows the "Inactive" badge after a switch off and no badge after a switch on

#### Scenario: Carrier has no price

- **WHEN** a carrier row is shown
- **THEN** it shows a logo (or a fallback) and the name, and no price text

### Requirement: Zone page shows a Shipping Carriers card

The shipping zone page SHALL show a "Shipping Carriers" card below the shipping methods card. The card SHALL list the zone's carriers in one stacked list and SHALL offer an Add button that opens the Add menu. When the zone has no carriers, the card SHALL show only its header and the Add button, like the Shipping Methods card, with no empty-state panel and no empty list.

#### Scenario: Zone has carriers

- **WHEN** the merchant opens a zone that has carriers
- **THEN** the carriers are listed in the Shipping Carriers card in one stacked list

#### Scenario: Zone has no carriers

- **WHEN** the merchant opens a zone whose carrier list is empty
- **THEN** the card shows its header and the Add button, and no list and no empty-state message

### Requirement: Add button offers the preset carriers

The Add button SHALL open a dropdown menu. The menu SHALL list every preset carrier of the catalog that the zone does not hold yet, and SHALL end with a "+ Add new" item. A preset the zone already holds MUST NOT be listed. When the merchant picks a preset, the zone SHALL receive that carrier with its preset name, URL template, and logo, and the carrier SHALL be enabled. The pick SHALL persist with the zone.

#### Scenario: Menu lists missing presets

- **WHEN** the merchant opens the Add menu of a zone that holds UPS only
- **THEN** the menu lists every other preset and "+ Add new", and does not list UPS

#### Scenario: Preset picked

- **WHEN** the merchant picks DHL in the Add menu
- **THEN** the zone lists DHL with no badge and the enabled switch on, and DHL is no longer in the menu

#### Scenario: Preset deleted comes back to the menu

- **WHEN** the merchant deletes DHL from the zone and opens the Add menu
- **THEN** DHL is listed in the menu again

#### Scenario: All presets added

- **WHEN** the zone holds every preset carrier
- **THEN** the Add menu shows only "+ Add new"

#### Scenario: Add new chosen

- **WHEN** the merchant picks "+ Add new"
- **THEN** the carrier form popover opens and no carrier is added until the merchant saves it

### Requirement: Carrier row actions appear on hover

Each carrier row SHALL provide edit, delete, and an enable/disable switch. These controls SHALL be hidden until the merchant hovers or focuses the row, and showing them MUST NOT shift the layout of the row or the list.

#### Scenario: Merchant hovers a row

- **WHEN** the merchant hovers or focuses a carrier row
- **THEN** the edit button, delete button, and enable switch appear without moving other content

#### Scenario: Merchant toggles a carrier

- **WHEN** the merchant switches a carrier on or off
- **THEN** the carrier's enabled state changes and persists with the zone

#### Scenario: Merchant deletes a carrier

- **WHEN** the merchant confirms deleting a carrier
- **THEN** the carrier is removed from that zone only

### Requirement: Merchant can add and edit a carrier

The "+ Add new" menu item and the Edit action SHALL open a popover, not a dialog, with a Name field, a URL field, and a Logo upload. The popover from "+ Add new" SHALL anchor to the Add button. The popover from Edit SHALL anchor to the Edit button of the row. Name and URL SHALL be required. Logo SHALL be optional and SHALL advise a 48x48 image. A new carrier SHALL be enabled unless the merchant switches it off. A required field left empty MUST block saving and show its message on the field.

#### Scenario: Required fields empty

- **WHEN** the merchant saves with an empty name or an empty URL
- **THEN** the save is blocked and each empty field shows its required message

#### Scenario: Valid carrier saved

- **WHEN** the merchant saves a carrier with a name and a valid URL template
- **THEN** the popover closes and the carrier appears in the zone's list

#### Scenario: Popover dismissed

- **WHEN** the merchant closes the popover without saving
- **THEN** the zone's carrier list does not change

#### Scenario: Logo omitted

- **WHEN** the merchant saves a carrier without a logo
- **THEN** the carrier is saved and its row shows a fallback mark

### Requirement: Tracking URL template must hold the tracking-number placeholder

A carrier URL SHALL be a template. It MUST start with `http://` or `https://` and MUST contain the placeholder `{tracking_number}` at least once. The same rule MUST be enforced when the setting is saved on the server. A template that breaks the rule MUST be rejected with a message on the URL field.

#### Scenario: Placeholder missing

- **WHEN** the merchant enters `https://www.ups.com/track` as the URL
- **THEN** the save is blocked and the URL field says the placeholder is required

#### Scenario: Scheme not allowed

- **WHEN** the merchant enters `javascript:alert({tracking_number})` as the URL
- **THEN** the save is blocked and the URL field says the URL must start with http:// or https://

#### Scenario: Valid template

- **WHEN** the merchant enters `https://www.ups.com/track?loc=en_US&tracknum={tracking_number}`
- **THEN** the template is accepted and stored with the placeholder intact

#### Scenario: Direct API write with a bad template

- **WHEN** a settings update sends a carrier whose URL lacks the placeholder or uses another scheme
- **THEN** the server rejects the update with a validation error for that carrier's URL

### Requirement: App ships a preset carrier catalog

The app SHALL define a catalog of popular, globally used carriers. Each preset SHALL have a predefined name, tracking-URL template, and logo, and the logo MUST be bundled with the plugin. The catalog SHALL include at least UPS, DHL, FedEx, and USPS.

#### Scenario: Catalog content

- **WHEN** the shipping settings are read
- **THEN** the response carries the catalog, and each preset carrier has a name, a URL template containing `{tracking_number}`, and a logo URL

### Requirement: Zones start with no carriers

A zone SHALL start with an empty carrier list. This holds for a zone created in the zone dialog, a zone created by the store-setup presets, and a zone saved before this feature. The app MUST NOT add preset carriers to a zone unless the merchant picks them in the Add menu.

#### Scenario: New zone created

- **WHEN** the merchant creates a zone
- **THEN** the zone's Shipping Carriers card shows only its header and the Add button

#### Scenario: Existing zone with no carrier data

- **WHEN** the merchant opens a zone saved before this feature
- **THEN** its Shipping Carriers card shows only its header and the Add button

#### Scenario: Zone created by store setup

- **WHEN** the onboarding presets create zones
- **THEN** those zones hold no carriers

### Requirement: Preset carriers are editable like custom carriers

A preset carrier SHALL be editable and deletable. Editing a preset SHALL change only that zone's copy.

#### Scenario: Merchant edits a preset URL

- **WHEN** the merchant changes the URL template of DHL in one zone
- **THEN** that zone's DHL uses the new template and other zones keep the preset template

### Requirement: Badge component has a small size

The `Badge` component SHALL accept a `size` property with the values `default` and `sm`. The `sm` size SHALL be smaller than the default in padding and height; the text size, which is already the smallest in the theme, stays. When `size` is not given, the badge SHALL look as it does today. The Inactive badge of the carrier rows SHALL use the `sm` size.

#### Scenario: Size not given

- **WHEN** a badge is rendered without `size`
- **THEN** it has the default size and the same look as before

#### Scenario: Small size

- **WHEN** a badge is rendered with `size="sm"`
- **THEN** it has smaller padding and height than the default size and exposes `data-size="sm"`

#### Scenario: Carrier row badge size

- **WHEN** a carrier row shows its Inactive badge
- **THEN** the badge uses the `sm` size
