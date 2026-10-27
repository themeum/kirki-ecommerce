## Purpose

Defines how a person attaches a single media item to a record — browsing the
WordPress library, dropping a file to upload it, and previewing, replacing or
removing what they chose — and what a form stores as a result.

## ADDED Requirements

### Requirement: Media is chosen from the WordPress media library

Choosing media SHALL open the WordPress media library so that the same
attachments, permissions and upload rules apply as everywhere else in the admin.
The selection SHALL be constrained to the media types the surface accepts, and
confirming a selection SHALL yield a complete media reference — its identifier,
URL and generated sizes — not merely a URL.

The library SHALL be opened only when a person asks for it, so that a screen with
several media surfaces does not construct one library session per surface before
anyone interacts.

#### Scenario: Person browses for media

- **WHEN** a person activates the upload control
- **THEN** the WordPress media library opens, restricted to the accepted types

#### Scenario: Person confirms a selection

- **WHEN** a person confirms a selection in the library
- **THEN** the surface receives a complete media reference for the chosen item

#### Scenario: Screen with several media surfaces

- **WHEN** a screen renders more than one media surface and nobody interacts
- **THEN** no library session is created

#### Scenario: Person dismisses the library

- **WHEN** a person closes the library without confirming
- **THEN** the current value is left unchanged

### Requirement: A file dropped onto the surface is uploaded

A media surface SHALL accept a file dragged from the operating system and dropped
onto it, SHALL indicate while a drag is over it that dropping is possible, and
SHALL upload the dropped file to the WordPress media library so that it becomes a
real attachment. Once uploaded, the surface SHALL hold the resulting media
reference exactly as though the item had been chosen from the library.

Dropping onto a surface that already holds an item SHALL replace that item.

#### Scenario: File dragged over the surface

- **WHEN** a person drags a file over the surface
- **THEN** the surface indicates that dropping is possible

#### Scenario: Drag leaves the surface

- **WHEN** the drag leaves the surface or is cancelled
- **THEN** the surface returns to its resting appearance

#### Scenario: File is dropped

- **WHEN** a person drops an accepted file
- **THEN** the file is uploaded to the WordPress media library
- **AND** the surface holds the resulting media reference

#### Scenario: Drop onto a filled surface

- **WHEN** a person drops a file onto a surface that already holds an item
- **THEN** the dropped file replaces the existing item

### Requirement: A dropped file is checked before it is uploaded

A media surface SHALL reject a dropped file whose type it does not accept before
any upload is attempted, and SHALL explain the rejection where the surface's own
validation messages appear rather than in a transient notification elsewhere.

When several files are dropped on a surface that holds one item, the surface
SHALL take the first and ignore the rest rather than failing outright.

The server SHALL remain the final authority on whether an upload is permitted; a
rejection it returns SHALL be reported the same way as a local rejection.

#### Scenario: Unacceptable file type

- **WHEN** a person drops a file of a type the surface does not accept
- **THEN** no upload is attempted
- **AND** the reason is shown with the surface's validation messages

#### Scenario: Several files dropped at once

- **WHEN** a person drops several files onto a single-item surface
- **THEN** the first is used and the others are ignored

#### Scenario: Server rejects the upload

- **WHEN** the server refuses an uploaded file
- **THEN** the reason is shown with the surface's validation messages
- **AND** the previously held value is left unchanged

### Requirement: An upload in progress is visible and exclusive

While an upload is in flight the surface SHALL show that work is happening and
SHALL refuse further drops and further attempts to open the library, so that a
second upload cannot race the first into the same single-item slot.

#### Scenario: Upload in flight

- **WHEN** an upload is in progress
- **THEN** the surface indicates activity

#### Scenario: Second interaction during an upload

- **WHEN** a person drops another file or activates the upload control while an upload is in progress
- **THEN** the interaction is ignored

#### Scenario: Upload settles

- **WHEN** the upload succeeds or fails
- **THEN** the surface becomes interactive again

### Requirement: A chosen item is previewed, replaceable and removable

A surface holding an item SHALL preview it and SHALL offer both replacing the
item and removing it. Removing SHALL clear the surface back to its empty state.

When the held item is a video, the surface SHALL preview the video's poster image
rather than attempting to render the video file as an image.

An empty surface SHALL show what it is for: a prompt to upload, and an indication
that a file may be dropped.

#### Scenario: Item is held

- **WHEN** a surface holds a media item
- **THEN** the item is previewed
- **AND** controls to replace and to remove it are reachable

#### Scenario: Person removes the item

- **WHEN** a person removes the held item
- **THEN** the surface returns to its empty state

#### Scenario: Held item is a video

- **WHEN** the held item is a video carrying a poster image
- **THEN** the poster image is previewed

#### Scenario: Surface is empty

- **WHEN** a surface holds nothing
- **THEN** it shows an upload prompt and indicates that a file may be dropped

### Requirement: A bound media field stores the whole media reference

A media field bound to a form SHALL write the complete media reference into form
state, not merely its identifier, so that the preview survives re-rendering and
remounting without the surrounding screen maintaining a parallel copy of the URL.

Reducing that reference to whatever the API expects SHALL remain the
responsibility of the form's own payload transformation, so that adopting this
field requires no change to a form's schema.

A screen rendering a media field SHALL NOT be required to hold preview state, and
SHALL NOT be offered a way to supply or intercept the preview.

#### Scenario: Person selects media in a bound field

- **WHEN** a person selects media in a bound field
- **THEN** the complete media reference is written to form state

#### Scenario: Form is submitted

- **WHEN** the form is submitted
- **THEN** the payload carries whatever shape that form's transformation produces from the reference

#### Scenario: Field is hydrated from an existing record

- **WHEN** a form is hydrated from a record whose media is a complete reference
- **THEN** the field previews it without the screen supplying a URL

#### Scenario: Field is hydrated from a bare URL

- **WHEN** a form is hydrated from a record whose media is stored as a plain URL
- **THEN** the field previews that URL

### Requirement: A bound media field renders the standard field envelope

A media field SHALL render inside the same shell every other bound field uses —
an optional label, an optional description, and the bound field's validation
errors — and SHALL mark itself invalid for assistive technology when the bound
field is invalid.

Errors arising from selection itself, such as a rejected file type or a failed
upload, SHALL be presented in that same error position alongside the bound
field's own validation errors.

#### Scenario: Bound field fails validation

- **WHEN** validation fails for a media field's bound name
- **THEN** the field is marked invalid for assistive technology
- **AND** the error message is rendered beneath the control

#### Scenario: Upload fails in a bound field

- **WHEN** an upload fails inside a bound media field
- **THEN** the reason appears in the same position as the field's validation errors

### Requirement: Selection is available outside of forms

The media selection surface SHALL be usable by screens that do not bind to a
form, taking its current value and reporting changes directly, so that tables and
inline editors reuse one surface rather than reimplementing selection.

A screen whose media selection must open a differently configured library
session SHALL be able to substitute how the library is opened while keeping the
surface's presentation and its drag-and-drop behaviour.

#### Scenario: Screen without a form

- **WHEN** a screen not backed by a form renders the selection surface
- **THEN** it supplies the current value and receives changes directly

#### Scenario: Screen needs a different library session

- **WHEN** a screen must open a library session configured differently from the default
- **THEN** it substitutes how the library opens
- **AND** the surface's preview, replace, remove and drop behaviour are unchanged
